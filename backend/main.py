#!/usr/bin/env python3
"""
Astrophotography Camera Backend
FastAPI + Picamera2 integration for Raspberry Pi HQ Camera
"""

import asyncio
import json
import logging
import os
import shutil
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Union
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

try:
    from picamera2 import Picamera2
    from picamera2.encoders import H264Encoder, MJPEGEncoder
    from picamera2.outputs import FileOutput
    import libcamera
    CAMERA_AVAILABLE = True
except ImportError:
    CAMERA_AVAILABLE = False
    print("WARNING: Picamera2 not available - running in mock mode")

from services.camera_service import CameraService
from services.file_service import FileService
from services.telemetry_service import TelemetryService
from models.api_models import *
from utils.config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
camera_service: Optional[CameraService] = None
file_service: FileService = None
telemetry_service: TelemetryService = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    global camera_service, file_service, telemetry_service
    
    # Initialize services
    config = Config()
    file_service = FileService(config.data_path)
    telemetry_service = TelemetryService()
    
    if CAMERA_AVAILABLE:
        try:
            camera_service = CameraService(config)
            await camera_service.initialize()
            logger.info("Camera service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            camera_service = None
    else:
        logger.warning("Running without camera hardware")
    
    # Start telemetry
    await telemetry_service.start()
    
    yield
    
    # Cleanup
    if camera_service:
        await camera_service.cleanup()
    await telemetry_service.stop()

# Create FastAPI app
app = FastAPI(
    title="Astrophotography Camera API",
    description="Raspberry Pi HQ Camera control for astrophotography",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "camera_available": camera_service is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/preview.mjpeg")
async def preview_stream():
    """MJPEG preview stream"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    return StreamingResponse(
        camera_service.get_preview_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/api/capture", response_model=CaptureResponse)
async def capture_still(request: CaptureRequest, background_tasks: BackgroundTasks):
    """Capture still image(s)"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        result = await camera_service.capture_still(request)
        return result
    except Exception as e:
        logger.error(f"Capture failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sequence", response_model=SequenceResponse)
async def start_sequence(request: SequenceRequest, background_tasks: BackgroundTasks):
    """Start capture sequence"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        sequence_id = str(uuid.uuid4())
        background_tasks.add_task(camera_service.run_sequence, sequence_id, request)
        
        return SequenceResponse(
            id=sequence_id,
            started_at=datetime.now(timezone.utc).isoformat(),
            eta=None  # Calculate based on frames and interval
        )
    except Exception as e:
        logger.error(f"Sequence start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sequence/{sequence_id}/status")
async def get_sequence_status(sequence_id: str):
    """Get sequence progress"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    status = camera_service.get_sequence_status(sequence_id)
    if not status:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    return status

@app.post("/api/video/start", response_model=VideoResponse)
async def start_video(request: VideoRequest):
    """Start video recording"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        result = await camera_service.start_video(request)
        return result
    except Exception as e:
        logger.error(f"Video start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/stop")
async def stop_video():
    """Stop video recording"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        await camera_service.stop_video()
        return {"status": "stopped"}
    except Exception as e:
        logger.error(f"Video stop failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rawburst/start", response_model=RawBurstResponse)
async def start_raw_burst(request: RawBurstRequest, background_tasks: BackgroundTasks):
    """Start RAW burst capture"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        burst_id = str(uuid.uuid4())
        background_tasks.add_task(camera_service.run_raw_burst, burst_id, request)
        
        return RawBurstResponse(
            id=burst_id,
            folder=f"/data/sessions/{request.folder}/rawburst"
        )
    except Exception as e:
        logger.error(f"RAW burst start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rawburst/stop")
async def stop_raw_burst():
    """Stop RAW burst capture"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        await camera_service.stop_raw_burst()
        return {"status": "stopped"}
    except Exception as e:
        logger.error(f"RAW burst stop failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/focus", response_model=FocusResponse)
async def measure_focus(request: FocusRequest):
    """Measure focus metric"""
    if not camera_service:
        raise HTTPException(status_code=503, detail="Camera not available")
    
    try:
        metric = await camera_service.measure_focus(request.roi)
        return FocusResponse(metric=metric, roi=request.roi)
    except Exception as e:
        logger.error(f"Focus measurement failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def list_sessions():
    """List capture sessions"""
    try:
        sessions = file_service.list_sessions()
        return sessions
    except Exception as e:
        logger.error(f"Session listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files")
async def list_files(
    path: str = Query(...),
    type: str = Query("all"),
    order: str = Query("desc"),
    limit: Optional[int] = Query(None)
):
    """List files in directory"""
    try:
        files = file_service.list_files(path, type, order, limit)
        return files
    except Exception as e:
        logger.error(f"File listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/thumb")
async def get_thumbnail(path: str = Query(...), w: int = Query(300), h: int = Query(300)):
    """Get file thumbnail"""
    try:
        thumb_path = file_service.get_thumbnail(path, w, h)
        if not thumb_path.exists():
            raise HTTPException(status_code=404, detail="Thumbnail not found")
        
        return FileResponse(thumb_path, media_type="image/jpeg")
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/stream")
async def stream_file(path: str = Query(...)):
    """Stream large file with range support"""
    try:
        file_path = Path(path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
    except Exception as e:
        logger.error(f"File streaming failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/download")
async def download_file(path: str = Query(...)):
    """Download single file"""
    try:
        file_path = Path(path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            file_path,
            filename=file_path.name,
            headers={"Content-Disposition": f"attachment; filename={file_path.name}"}
        )
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/zip")
async def download_session_zip(session_id: str, background_tasks: BackgroundTasks):
    """Download session as ZIP"""
    try:
        zip_path = await file_service.create_session_zip(session_id)
        if not zip_path.exists():
            raise HTTPException(status_code=404, detail="Session not found")
        
        return FileResponse(
            zip_path,
            filename=f"{session_id}.zip",
            headers={"Content-Disposition": f"attachment; filename={session_id}.zip"}
        )
    except Exception as e:
        logger.error(f"ZIP creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    """WebSocket for telemetry data"""
    await websocket.accept()
    
    try:
        while True:
            telemetry_data = await telemetry_service.get_telemetry()
            await websocket.send_json(telemetry_data)
            await asyncio.sleep(1)  # Send every second
    except Exception as e:
        logger.error(f"Telemetry websocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
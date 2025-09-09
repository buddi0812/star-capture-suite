"""
Camera service for Picamera2 integration
"""

import asyncio
import json
import logging
import time
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, AsyncGenerator
from io import BytesIO
import cv2

try:
    from picamera2 import Picamera2
    from picamera2.encoders import H264Encoder, MJPEGEncoder
    from picamera2.outputs import FileOutput
    import libcamera
    CAMERA_AVAILABLE = True
except ImportError:
    CAMERA_AVAILABLE = False

from models.api_models import *
from utils.config import Config

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, config: Config):
        self.config = config
        self.picam2: Optional[Picamera2] = None
        self.preview_active = False
        self.recording_active = False
        self.sequence_active = {}
        self.raw_burst_active = {}
        
    async def initialize(self):
        """Initialize camera"""
        if not CAMERA_AVAILABLE:
            raise RuntimeError("Picamera2 not available")
            
        try:
            self.picam2 = Picamera2()
            
            # Configure preview
            preview_config = self.picam2.create_preview_configuration(
                main={"size": (640, 480), "format": "RGB888"},
                controls={"FrameRate": 10}
            )
            self.picam2.configure(preview_config)
            self.picam2.start()
            
            logger.info("Camera initialized successfully")
            
        except Exception as e:
            logger.error(f"Camera initialization failed: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup camera resources"""
        if self.picam2:
            try:
                self.picam2.stop()
                self.picam2.close()
            except Exception as e:
                logger.error(f"Camera cleanup error: {e}")
    
    async def get_preview_stream(self) -> AsyncGenerator[bytes, None]:
        """Generate MJPEG preview stream"""
        if not self.picam2:
            raise RuntimeError("Camera not initialized")
        
        self.preview_active = True
        
        try:
            while self.preview_active:
                # Capture frame
                frame = self.picam2.capture_array()
                
                # Convert to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = buffer.tobytes()
                
                # Yield as multipart frame
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                await asyncio.sleep(0.1)  # ~10 FPS
                
        except Exception as e:
            logger.error(f"Preview stream error: {e}")
        finally:
            self.preview_active = False
    
    async def capture_still(self, request: CaptureRequest) -> CaptureResponse:
        """Capture still image"""
        if not self.picam2:
            raise RuntimeError("Camera not initialized")
        
        start_time = time.time()
        
        # Create session folder
        session_folder = self._create_session_folder()
        
        # Configure for high-res still
        still_config = self.picam2.create_still_configuration(
            main={"size": (4056, 3040), "format": "RGB888"},
            raw={"size": (4056, 3040)} if "dng" in request.format else None,
            controls={
                "ExposureTime": request.shutter_us,
                "AnalogueGain": request.gain,
                "AwbEnable": False if request.awb else True,
                "Noise": libcamera.controls.NoiseReductionModeEnum.Off,
            }
        )
        
        if request.awb:
            still_config["controls"]["ColourGains"] = [request.awb["r"], request.awb["b"]]
        
        self.picam2.switch_mode_and_capture_file(still_config, str(session_folder / "test.jpg"))
        
        # Generate response paths
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"IMG_{timestamp}"
        
        paths = {}
        if "jpeg" in request.format:
            paths["path_jpeg"] = str(session_folder / f"{base_name}.jpg")
        if "dng" in request.format:
            paths["path_dng"] = str(session_folder / f"{base_name}.dng")
        
        # Mock EXIF data
        exif = {
            "ExposureTime": request.shutter_us / 1_000_000,
            "ISO": request.gain,
            "DateTime": datetime.now().isoformat(),
            "Camera": "Raspberry Pi HQ Camera",
            "Lens": request.notes.get("lens", "Unknown") if request.notes else "Unknown"
        }
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        return CaptureResponse(
            path_jpeg=paths.get("path_jpeg"),
            path_dng=paths.get("path_dng"),
            exif=exif,
            elapsed_ms=elapsed_ms
        )
    
    async def run_sequence(self, sequence_id: str, request: SequenceRequest):
        """Run capture sequence in background"""
        self.sequence_active[sequence_id] = {
            "done": 0,
            "total": request.frames,
            "state": "running",
            "last_path": None
        }
        
        try:
            session_folder = self._create_session_folder(request.folder)
            type_folder = session_folder / request.type
            type_folder.mkdir(exist_ok=True)
            
            for i in range(request.frames):
                if sequence_id not in self.sequence_active:
                    break  # Sequence was stopped
                
                # Simulate capture
                await asyncio.sleep(request.shutter_us / 1_000_000)  # Exposure time
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
                filename = f"{request.type}_{i+1:04d}_{timestamp}.jpg"
                filepath = type_folder / filename
                
                # Mock file creation
                filepath.touch()
                
                self.sequence_active[sequence_id]["done"] = i + 1
                self.sequence_active[sequence_id]["last_path"] = str(filepath)
                
                if i < request.frames - 1:
                    await asyncio.sleep(request.interval_ms / 1000)
            
            self.sequence_active[sequence_id]["state"] = "done"
            
        except Exception as e:
            logger.error(f"Sequence {sequence_id} failed: {e}")
            self.sequence_active[sequence_id]["state"] = "error"
    
    def get_sequence_status(self, sequence_id: str) -> Optional[SequenceStatus]:
        """Get sequence status"""
        if sequence_id not in self.sequence_active:
            return None
        
        status = self.sequence_active[sequence_id]
        return SequenceStatus(**status)
    
    async def start_video(self, request: VideoRequest) -> VideoResponse:
        """Start video recording"""
        if not self.picam2:
            raise RuntimeError("Camera not initialized")
        
        session_folder = self._create_session_folder()
        video_folder = session_folder / "video"
        video_folder.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        video_path = video_folder / f"video_{timestamp}.{request.codec}"
        
        # Configure video
        video_config = self.picam2.create_video_configuration(
            main={"size": (request.width, request.height), "format": "RGB888"},
            controls={"FrameRate": request.fps}
        )
        
        # For now, just create a mock file
        video_path.touch()
        self.recording_active = True
        
        return VideoResponse(
            id=str(hash(str(video_path))),
            current_path=str(video_path)
        )
    
    async def stop_video(self):
        """Stop video recording"""
        self.recording_active = False
    
    async def run_raw_burst(self, burst_id: str, request: RawBurstRequest):
        """Run RAW burst capture"""
        self.raw_burst_active[burst_id] = True
        
        try:
            session_folder = self._create_session_folder(request.folder)
            burst_folder = session_folder / "rawburst"
            burst_folder.mkdir(exist_ok=True)
            
            frame_count = 0
            interval = 1.0 / request.fps
            
            while (burst_id in self.raw_burst_active and 
                   (request.limit_frames is None or frame_count < request.limit_frames)):
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
                dng_path = burst_folder / f"raw_{frame_count:06d}_{timestamp}.dng"
                
                # Mock DNG creation
                dng_path.touch()
                
                frame_count += 1
                await asyncio.sleep(interval)
            
        except Exception as e:
            logger.error(f"RAW burst {burst_id} failed: {e}")
        finally:
            if burst_id in self.raw_burst_active:
                del self.raw_burst_active[burst_id]
    
    async def stop_raw_burst(self):
        """Stop all RAW burst captures"""
        self.raw_burst_active.clear()
    
    async def measure_focus(self, roi: List[int]) -> float:
        """Measure focus metric using Laplacian variance"""
        if not self.picam2:
            raise RuntimeError("Camera not initialized")
        
        try:
            # Capture frame
            frame = self.picam2.capture_array()
            
            # Extract ROI
            x, y, w, h = roi
            roi_frame = frame[y:y+h, x:x+w]
            
            # Convert to grayscale
            gray = cv2.cvtColor(roi_frame, cv2.COLOR_RGB2GRAY)
            
            # Calculate Laplacian variance
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            focus_metric = laplacian.var()
            
            return float(focus_metric)
            
        except Exception as e:
            logger.error(f"Focus measurement failed: {e}")
            return 0.0
    
    def _create_session_folder(self, folder_name: Optional[str] = None) -> Path:
        """Create session folder"""
        if folder_name is None:
            folder_name = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        session_path = self.config.data_path / "sessions" / folder_name
        session_path.mkdir(parents=True, exist_ok=True)
        
        return session_path
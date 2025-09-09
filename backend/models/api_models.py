"""
API request/response models for the astrophotography camera
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# Request Models

class CaptureRequest(BaseModel):
    mode: str = Field(default="M", description="M or Bulb")
    format: str = Field(default="jpeg+dng", description="jpeg, dng, or jpeg+dng")
    resolution: str = Field(default="4056x3040", description="Image resolution")
    shutter_us: int = Field(description="Shutter speed in microseconds")
    gain: float = Field(description="ISO/Gain value")
    awb: Optional[Dict[str, float]] = Field(default=None, description="Manual white balance R,B gains")
    denoise: str = Field(default="off", description="off, cdn, or auto")
    notes: Optional[Dict[str, str]] = Field(default=None, description="Lens/target notes")

class SequenceRequest(BaseModel):
    type: str = Field(description="subs, darks, bias, or flats")
    frames: int = Field(description="Number of frames to capture")
    shutter_us: int = Field(description="Shutter speed in microseconds")
    interval_ms: int = Field(default=1000, description="Interval between frames")
    gain: float = Field(description="ISO/Gain value")
    awb: Optional[Dict[str, float]] = Field(default=None, description="Manual white balance")
    bracket: Optional[Dict[str, Union[float, int]]] = Field(default=None, description="Bracketing settings")
    folder: str = Field(description="Session folder name")

class VideoRequest(BaseModel):
    codec: str = Field(default="h264", description="h264, mjpeg, or yuv420")
    width: int = Field(default=1920)
    height: int = Field(default=1080)
    fps: int = Field(default=30)
    bitrate: Optional[str] = Field(default="25M", description="Bitrate like 25M")
    log_flat: bool = Field(default=False, description="Apply LOG-flat tone mapping")
    segment_ms: Optional[int] = Field(default=None, description="Segment duration in ms")

class RawBurstRequest(BaseModel):
    fps: float = Field(description="Target frames per second")
    limit_frames: Optional[int] = Field(default=None, description="Max frames to capture")
    folder: str = Field(description="Session folder name")

class FocusRequest(BaseModel):
    roi: List[int] = Field(description="Region of interest [x, y, w, h]")

# Response Models

class CaptureResponse(BaseModel):
    path_jpeg: Optional[str] = None
    path_dng: Optional[str] = None
    exif: Dict[str, Any] = {}
    elapsed_ms: int

class SequenceResponse(BaseModel):
    id: str
    started_at: str
    eta: Optional[str] = None

class VideoResponse(BaseModel):
    id: str
    current_path: str

class RawBurstResponse(BaseModel):
    id: str
    folder: str

class FocusResponse(BaseModel):
    metric: float
    roi: List[int]

class SequenceStatus(BaseModel):
    done: int
    total: int
    last_path: Optional[str] = None
    state: str  # running, done, error

class FileInfo(BaseModel):
    path: str
    type: str  # jpeg, dng, tiff, h264, mjpeg, yuv, zip
    size: int
    ts: str
    meta: Dict[str, Any] = {}

class SessionInfo(BaseModel):
    id: str
    path: str
    created_at: str
    file_count: int
    total_size: int
    types: List[str]
    has_quicklook: bool = False
    zip_available: bool = False

class TelemetryData(BaseModel):
    timestamp: str
    cpu_temp: Optional[float] = None
    cpu_usage: float
    memory_usage: float
    disk_free_gb: float
    disk_usage_percent: float
    voltage: Optional[float] = None
    sequence_progress: Optional[Dict[str, Any]] = None
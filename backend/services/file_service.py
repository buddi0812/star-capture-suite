"""
File management service for the astrophotography camera
"""

import asyncio
import json
import logging
import mimetypes
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image, ImageDraw

from models.api_models import FileInfo, SessionInfo

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, data_path: Path):
        self.data_path = Path(data_path)
        self.sessions_path = self.data_path / "sessions"
        self.thumbs_path = self.data_path / ".thumbs"
        
        # Create directories
        self.sessions_path.mkdir(parents=True, exist_ok=True)
        self.thumbs_path.mkdir(parents=True, exist_ok=True)
    
    def list_sessions(self) -> List[SessionInfo]:
        """List all capture sessions"""
        sessions = []
        
        for session_dir in self.sessions_path.iterdir():
            if not session_dir.is_dir():
                continue
            
            try:
                # Count files and calculate size
                file_count = 0
                total_size = 0
                file_types = set()
                
                for file_path in session_dir.rglob("*"):
                    if file_path.is_file() and not file_path.name.startswith('.'):
                        file_count += 1
                        total_size += file_path.stat().st_size
                        
                        # Determine file type
                        suffix = file_path.suffix.lower()
                        if suffix in ['.jpg', '.jpeg']:
                            file_types.add('jpeg')
                        elif suffix == '.dng':
                            file_types.add('dng')
                        elif suffix in ['.tif', '.tiff']:
                            file_types.add('tiff')
                        elif suffix in ['.h264', '.mp4']:
                            file_types.add('h264')
                        elif suffix == '.mjpeg':
                            file_types.add('mjpeg')
                        elif suffix == '.yuv':
                            file_types.add('yuv')
                
                # Check for quicklook and ZIP
                has_quicklook = (session_dir / "quicklook.tiff").exists()
                zip_path = self.data_path / "zips" / f"{session_dir.name}.zip"
                zip_available = zip_path.exists()
                
                sessions.append(SessionInfo(
                    id=session_dir.name,
                    path=str(session_dir),
                    created_at=datetime.fromtimestamp(session_dir.stat().st_mtime).isoformat(),
                    file_count=file_count,
                    total_size=total_size,
                    types=list(file_types),
                    has_quicklook=has_quicklook,
                    zip_available=zip_available
                ))
                
            except Exception as e:
                logger.error(f"Error processing session {session_dir.name}: {e}")
                continue
        
        # Sort by creation time (newest first)
        sessions.sort(key=lambda x: x.created_at, reverse=True)
        return sessions
    
    def list_files(self, path: str, file_type: str = "all", 
                   order: str = "desc", limit: Optional[int] = None) -> List[FileInfo]:
        """List files in directory"""
        target_path = Path(path)
        if not target_path.exists() or not target_path.is_dir():
            return []
        
        files = []
        
        for file_path in target_path.rglob("*"):
            if not file_path.is_file() or file_path.name.startswith('.'):
                continue
            
            try:
                # Determine file type
                suffix = file_path.suffix.lower()
                if suffix in ['.jpg', '.jpeg']:
                    ftype = 'jpeg'
                elif suffix == '.dng':
                    ftype = 'dng'
                elif suffix in ['.tif', '.tiff']:
                    ftype = 'tiff'
                elif suffix in ['.h264', '.mp4']:
                    ftype = 'h264'
                elif suffix == '.mjpeg':
                    ftype = 'mjpeg'
                elif suffix == '.yuv':
                    ftype = 'yuv'
                elif suffix == '.zip':
                    ftype = 'zip'
                else:
                    ftype = 'unknown'
                
                # Filter by type
                if file_type != "all" and ftype != file_type:
                    continue
                
                # Get file stats
                stat = file_path.stat()
                
                # Try to load metadata
                metadata = {}
                meta_path = file_path.with_suffix('.json')
                if meta_path.exists():
                    try:
                        with open(meta_path) as f:
                            metadata = json.load(f)
                    except Exception:
                        pass
                
                files.append(FileInfo(
                    path=str(file_path),
                    type=ftype,
                    size=stat.st_size,
                    ts=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    meta=metadata
                ))
                
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
                continue
        
        # Sort files
        reverse = order == "desc"
        files.sort(key=lambda x: x.ts, reverse=reverse)
        
        # Apply limit
        if limit:
            files = files[:limit]
        
        return files
    
    def get_thumbnail(self, file_path: str, width: int = 300, height: int = 300) -> Path:
        """Generate or retrieve thumbnail"""
        source_path = Path(file_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {file_path}")
        
        # Create thumbnail path
        thumb_name = f"{source_path.stem}_{width}x{height}.jpg"
        thumb_path = self.thumbs_path / thumb_name
        
        # Check if thumbnail exists and is newer than source
        if (thumb_path.exists() and 
            thumb_path.stat().st_mtime > source_path.stat().st_mtime):
            return thumb_path
        
        try:
            # Generate thumbnail based on file type
            suffix = source_path.suffix.lower()
            
            if suffix in ['.jpg', '.jpeg', '.tif', '.tiff']:
                # Image thumbnail
                with Image.open(source_path) as img:
                    img.thumbnail((width, height), Image.Resampling.LANCZOS)
                    img.save(thumb_path, "JPEG", quality=85)
            
            elif suffix == '.dng':
                # DNG thumbnail - try to extract embedded preview
                try:
                    # For now, create a placeholder
                    self._create_placeholder_thumb(thumb_path, width, height, "DNG")
                except Exception:
                    self._create_placeholder_thumb(thumb_path, width, height, "DNG")
            
            elif suffix in ['.h264', '.mp4', '.mjpeg']:
                # Video thumbnail - create placeholder for now
                self._create_placeholder_thumb(thumb_path, width, height, "VIDEO")
            
            else:
                # Unknown file type
                self._create_placeholder_thumb(thumb_path, width, height, "FILE")
            
        except Exception as e:
            logger.error(f"Thumbnail generation failed for {file_path}: {e}")
            self._create_placeholder_thumb(thumb_path, width, height, "ERROR")
        
        return thumb_path
    
    def _create_placeholder_thumb(self, thumb_path: Path, width: int, height: int, text: str):
        """Create placeholder thumbnail"""
        img = Image.new('RGB', (width, height), color='#2a2a2a')
        draw = ImageDraw.Draw(img)
        
        # Try to get text size for centering
        try:
            bbox = draw.textbbox((0, 0), text)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (width - text_width) // 2
            y = (height - text_height) // 2
        except Exception:
            x, y = width // 4, height // 2
        
        draw.text((x, y), text, fill='#888888')
        img.save(thumb_path, "JPEG", quality=85)
    
    async def create_session_zip(self, session_id: str) -> Path:
        """Create ZIP archive for session"""
        session_path = self.sessions_path / session_id
        if not session_path.exists():
            raise FileNotFoundError(f"Session not found: {session_id}")
        
        # Create zips directory
        zips_path = self.data_path / "zips"
        zips_path.mkdir(exist_ok=True)
        
        zip_path = zips_path / f"{session_id}.zip"
        
        # Check if ZIP exists and is newer than session
        if (zip_path.exists() and 
            zip_path.stat().st_mtime > session_path.stat().st_mtime):
            return zip_path
        
        # Create ZIP file
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in session_path.rglob("*"):
                    if file_path.is_file() and not file_path.name.startswith('.'):
                        arcname = file_path.relative_to(session_path)
                        zipf.write(file_path, arcname)
            
            logger.info(f"Created ZIP archive: {zip_path}")
            return zip_path
            
        except Exception as e:
            logger.error(f"ZIP creation failed for {session_id}: {e}")
            if zip_path.exists():
                zip_path.unlink()  # Remove partial ZIP
            raise
"""
Telemetry service for system monitoring
"""

import asyncio
import logging
import psutil
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from models.api_models import TelemetryData

logger = logging.getLogger(__name__)

class TelemetryService:
    def __init__(self):
        self.running = False
        self.telemetry_data = {}
    
    async def start(self):
        """Start telemetry collection"""
        self.running = True
        logger.info("Telemetry service started")
    
    async def stop(self):
        """Stop telemetry collection"""
        self.running = False
        logger.info("Telemetry service stopped")
    
    async def get_telemetry(self) -> TelemetryData:
        """Get current telemetry data"""
        try:
            # CPU information
            cpu_usage = psutil.cpu_percent(interval=0.1)
            
            # Memory information
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Disk information
            disk = shutil.disk_usage("/")
            disk_free_gb = disk.free / (1024**3)
            disk_usage_percent = (disk.used / disk.total) * 100
            
            # Try to get CPU temperature (Raspberry Pi specific)
            cpu_temp = self._get_cpu_temperature()
            
            # Try to get voltage (if available)
            voltage = self._get_voltage()
            
            return TelemetryData(
                timestamp=datetime.now(timezone.utc).isoformat(),
                cpu_temp=cpu_temp,
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                disk_free_gb=disk_free_gb,
                disk_usage_percent=disk_usage_percent,
                voltage=voltage,
                sequence_progress=None  # Will be populated by camera service
            )
            
        except Exception as e:
            logger.error(f"Telemetry collection failed: {e}")
            # Return minimal telemetry data
            return TelemetryData(
                timestamp=datetime.now(timezone.utc).isoformat(),
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_free_gb=0.0,
                disk_usage_percent=0.0
            )
    
    def _get_cpu_temperature(self) -> Optional[float]:
        """Get CPU temperature (Raspberry Pi)"""
        try:
            # Try Raspberry Pi thermal zone
            temp_path = Path("/sys/class/thermal/thermal_zone0/temp")
            if temp_path.exists():
                temp_str = temp_path.read_text().strip()
                temp_celsius = int(temp_str) / 1000.0
                return temp_celsius
        except Exception:
            pass
        
        try:
            # Try psutil sensors
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries:
                            return entries[0].current
        except Exception:
            pass
        
        return None
    
    def _get_voltage(self) -> Optional[float]:
        """Get system voltage (if available)"""
        try:
            # Try to read from vcgencmd (Raspberry Pi)
            import subprocess
            result = subprocess.run(
                ["vcgencmd", "measure_volts", "core"],
                capture_output=True,
                text=True,
                timeout=1
            )
            if result.returncode == 0:
                # Parse output like "volt=1.2000V"
                output = result.stdout.strip()
                if "volt=" in output:
                    voltage_str = output.split("volt=")[1].rstrip("V")
                    return float(voltage_str)
        except Exception:
            pass
        
        return None
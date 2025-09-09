"""
Configuration management
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any

class Config:
    def __init__(self, config_path: str = "/etc/astrocam/config.yaml"):
        self.config_path = Path(config_path)
        self.config_data = self._load_config()
        
        # Set default paths
        self.data_path = Path(self.config_data.get("data_path", "/data"))
        self.log_level = self.config_data.get("log_level", "INFO")
        
        # Camera defaults
        self.camera_defaults = self.config_data.get("camera", {})
        
        # Network settings
        self.network = self.config_data.get("network", {})
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if not self.config_path.exists():
            return self._get_default_config()
        
        try:
            with open(self.config_path) as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            print(f"Error loading config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "data_path": "/data",
            "log_level": "INFO",
            "camera": {
                "default_gain": 1.0,
                "default_shutter_us": 1000000,  # 1 second
                "max_exposure_us": 600000000,   # 10 minutes
                "preview_fps": 10,
                "preview_quality": 80
            },
            "network": {
                "host": "0.0.0.0",
                "port": 8000,
                "cors_origins": ["*"]
            },
            "storage": {
                "min_free_gb": 1.0,
                "auto_cleanup": False,
                "cleanup_days": 30
            }
        }
    
    def save_config(self):
        """Save current configuration to file"""
        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_path, 'w') as f:
                yaml.dump(self.config_data, f, default_flow_style=False)
        except Exception as e:
            print(f"Error saving config: {e}")
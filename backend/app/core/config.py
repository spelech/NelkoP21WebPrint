import os
from pydantic_settings import BaseSettings

VERSION_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "VERSION")
if not os.path.exists(VERSION_FILE):
    VERSION_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "VERSION")

default_version = "1.1.4"
if os.path.exists(VERSION_FILE):
    try:
        with open(VERSION_FILE, "r") as f:
            default_version = f.read().strip()
    except Exception:
        pass

class Settings(BaseSettings):
    APP_NAME: str = "Nelko P21 Web Print"
    VERSION: str = default_version
    DPI: int = 203  # 8 dots per mm
    DEFAULT_LABEL_WIDTH_MM: float = 14.0
    DEFAULT_LABEL_HEIGHT_MM: float = 40.0
    DEFAULT_GAP_MM: float = 5.0
    DEFAULT_DENSITY: int = 3
    DEFAULT_SPEED: float = 2.0
    
    # Printer Driver Defaults
    DEFAULT_DRIVER_TYPE: str = os.getenv("PRINTER_DRIVER", "tcp")  # 'tcp', 'spp', or 'mock'
    PRINTER_BT_MAC: str = os.getenv("PRINTER_BT_MAC", "")
    PRINTER_TCP_HOST: str = os.getenv("PRINTER_TCP_HOST", "127.0.0.1")
    PRINTER_TCP_PORT: int = int(os.getenv("PRINTER_TCP_PORT", "9100"))
    
    CHUNK_SIZE: int = 244  # Max RFCOMM chunk size for P21
    CHUNK_DELAY_MS: int = 10
    
    # Presets
    PRESETS: list = [
        {"name": "14x40mm White Gap", "width": 14, "height": 40, "gap": 5, "type": 0},
        {"name": "12x40mm White Gap", "width": 12, "height": 40, "gap": 5, "type": 0},
        {"name": "12x30mm White Gap", "width": 12, "height": 30, "gap": 5, "type": 0},
        {"name": "12x22mm White Gap", "width": 12, "height": 22, "gap": 5, "type": 0},
        {"name": "15x50mm Cable Label", "width": 15, "height": 50, "gap": 5, "type": 4},
        {"name": "12mm Continuous Roll", "width": 12, "height": 50, "gap": 0, "type": 1},
    ]

settings = Settings()

import os
import json
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

CONFIG_DIR = os.getenv("CONFIG_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "data"))
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, "config.json")

def load_saved_config() -> dict:
    """Load persisted configuration dictionary from config.json if present."""
    if os.path.exists(CONFIG_FILE_PATH):
        try:
            with open(CONFIG_FILE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_config_file(data: dict) -> None:
    """Save configuration dictionary to config.json atomically/formatted."""
    os.makedirs(os.path.dirname(CONFIG_FILE_PATH), exist_ok=True)
    with open(CONFIG_FILE_PATH, "w") as f:
        json.dump(data, f, indent=2)

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
        {"name": "14x40mm Standard Gap", "width": 14, "height": 40, "gap": 5, "type": 0},
        {"name": "12x40mm White Gap", "width": 12, "height": 40, "gap": 5, "type": 0},
        {"name": "20x30mm Small", "width": 20, "height": 30, "gap": 5, "type": 0},
        {"name": "15x30mm Micro", "width": 15, "height": 30, "gap": 5, "type": 0},
        {"name": "12x30mm Compact", "width": 12, "height": 30, "gap": 5, "type": 0},
        {"name": "30x30mm Square", "width": 30, "height": 30, "gap": 5, "type": 0},
        {"name": "12x22mm Mini", "width": 12, "height": 22, "gap": 5, "type": 0},
        {"name": "15x50mm Cable Flag Wrap", "width": 15, "height": 50, "gap": 5, "type": 4},
        {"name": "12mm Continuous Roll", "width": 12, "height": 50, "gap": 0, "type": 1},
    ]

    def __init__(self, **values):
        super().__init__(**values)
        saved = load_saved_config()
        if saved:
            if "driver_type" in saved:
                self.DEFAULT_DRIVER_TYPE = saved["driver_type"]
            elif "DEFAULT_DRIVER_TYPE" in saved:
                self.DEFAULT_DRIVER_TYPE = saved["DEFAULT_DRIVER_TYPE"]
                
            if "tcp_host" in saved:
                self.PRINTER_TCP_HOST = saved["tcp_host"]
            elif "PRINTER_TCP_HOST" in saved:
                self.PRINTER_TCP_HOST = saved["PRINTER_TCP_HOST"]
                
            if "tcp_port" in saved:
                try:
                    self.PRINTER_TCP_PORT = int(saved["tcp_port"])
                except (ValueError, TypeError):
                    pass
            elif "PRINTER_TCP_PORT" in saved:
                try:
                    self.PRINTER_TCP_PORT = int(saved["PRINTER_TCP_PORT"])
                except (ValueError, TypeError):
                    pass
                
            if "bt_mac" in saved:
                self.PRINTER_BT_MAC = saved["bt_mac"]
            elif "PRINTER_BT_MAC" in saved:
                self.PRINTER_BT_MAC = saved["PRINTER_BT_MAC"]

settings = Settings()

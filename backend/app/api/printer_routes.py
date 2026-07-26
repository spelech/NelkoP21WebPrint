from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings
from app.api.print_routes import get_driver

router = APIRouter(prefix="/api/printer", tags=["Printer Configuration"])

class PrinterConfigModel(BaseModel):
    driver_type: str  # 'tcp', 'spp', 'mock'
    tcp_host: str = "127.0.0.1"
    tcp_port: int = 9100
    bt_mac: str = ""

@router.get("/status")
def get_printer_status():
    """Query current printer status and connection configuration."""
    driver = get_driver()
    status_info = driver.get_status()
    return {
        "config": {
            "driver_type": settings.DEFAULT_DRIVER_TYPE,
            "tcp_host": settings.PRINTER_TCP_HOST,
            "tcp_port": settings.PRINTER_TCP_PORT,
            "bt_mac": settings.PRINTER_BT_MAC
        },
        "driver_status": status_info
    }

@router.post("/config")
def update_printer_config(cfg: PrinterConfigModel):
    """Update runtime printer driver connection settings."""
    settings.DEFAULT_DRIVER_TYPE = cfg.driver_type
    settings.PRINTER_TCP_HOST = cfg.tcp_host
    settings.PRINTER_TCP_PORT = cfg.tcp_port
    settings.PRINTER_BT_MAC = cfg.bt_mac
    return {"status": "updated", "config": cfg}

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings, save_config_file
from app.api.print_routes import get_driver
from app.drivers.tcp_driver import TCPPrinterDriver
from app.drivers.spp_driver import SPPPrinterDriver, MockPrinterDriver

router = APIRouter(prefix="/api/printer", tags=["Printer Configuration"])

class PrinterConfigModel(BaseModel):
    driver_type: str  # 'tcp', 'spp', 'mock'
    tcp_host: str = "127.0.0.1"
    tcp_port: int = 9100
    bt_mac: str = ""

@router.get("/status")
def get_printer_status():
    """Query current printer status, connection configuration, and reachability probe."""
    driver = get_driver()
    status_info = driver.get_status()
    probe_info = driver.probe_connection()
    return {
        "version": settings.VERSION,
        "config": {
            "driver_type": settings.DEFAULT_DRIVER_TYPE,
            "tcp_host": settings.PRINTER_TCP_HOST,
            "tcp_port": settings.PRINTER_TCP_PORT,
            "bt_mac": settings.PRINTER_BT_MAC
        },
        "driver_status": status_info,
        "probe": probe_info
    }

@router.post("/probe")
def probe_printer_connection(cfg: Optional[PrinterConfigModel] = None):
    """Explicitly probe printer reachability for current or candidate settings."""
    if cfg:
        if cfg.driver_type == "spp":
            driver = SPPPrinterDriver(mac_address=cfg.bt_mac)
        elif cfg.driver_type == "mock":
            driver = MockPrinterDriver()
        else:
            driver = TCPPrinterDriver(host=cfg.tcp_host, port=cfg.tcp_port)
    else:
        driver = get_driver()
    return driver.probe_connection()

@router.post("/config")
def update_printer_config(cfg: PrinterConfigModel):
    """Update runtime printer driver connection settings."""
    settings.DEFAULT_DRIVER_TYPE = cfg.driver_type
    settings.PRINTER_TCP_HOST = cfg.tcp_host
    settings.PRINTER_TCP_PORT = cfg.tcp_port
    settings.PRINTER_BT_MAC = cfg.bt_mac
    save_config_file(cfg.model_dump() if hasattr(cfg, "model_dump") else cfg.dict())
    return {"status": "updated", "config": cfg}

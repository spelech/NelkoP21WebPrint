import socket
import time
import logging
from typing import Dict, Any
from app.drivers.base_driver import BasePrinterDriver

logger = logging.getLogger(__name__)

class TCPPrinterDriver(BasePrinterDriver):
    """
    Printer driver connecting over TCP socket to an ESP32 bridge 
    (e.g., LabelPrinter-esp) or ESPHome Bluetooth proxy.
    """

    def __init__(self, host: str, port: int = 9100, timeout: float = 5.0, chunk_size: int = 244):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.chunk_size = chunk_size
        self.sock: socket.socket | None = None
        self.connected = False

    def connect(self) -> bool:
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(self.timeout)
            self.sock.connect((self.host, self.port))
            self.connected = True
            logger.info(f"Connected to TCP printer bridge at {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to TCP printer bridge {self.host}:{self.port} - {e}")
            self.connected = False
            return False

    def disconnect(self) -> None:
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
        self.connected = False
        logger.info("Disconnected from TCP printer bridge")

    def send_bytes(self, data: bytes) -> bool:
        if not self.connected or not self.sock:
            if not self.connect():
                return False

        try:
            # Chunk transmission for P21 buffer safety
            total_len = len(data)
            sent = 0
            while sent < total_len:
                chunk = data[sent:sent + self.chunk_size]
                self.sock.sendall(chunk)
                sent += len(chunk)
                time.sleep(0.005)  # 5ms throttle
            logger.info(f"Successfully sent {total_len} bytes to {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Error sending data to TCP printer bridge: {e}")
            self.connected = False
            return False

    def get_status(self) -> Dict[str, Any]:
        if not self.connected:
            return {"connected": False, "status": "disconnected", "host": self.host, "port": self.port}
        return {"connected": True, "status": "ready", "host": self.host, "port": self.port}

    def probe_connection(self) -> Dict[str, Any]:
        """
        Perform a non-destructive TCP reachability probe to the bridge socket.
        """
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2.0)
            res = sock.connect_ex((self.host, self.port))
            if res == 0:
                return {
                    "bridge_reachable": True,
                    "host": self.host,
                    "port": self.port,
                    "status": "Bridge online and reachable"
                }
            else:
                return {
                    "bridge_reachable": False,
                    "host": self.host,
                    "port": self.port,
                    "error": f"Bridge unreachable (code {res})"
                }
        except Exception as e:
            return {
                "bridge_reachable": False,
                "host": self.host,
                "port": self.port,
                "error": f"Bridge probe failed: {e}"
            }
        finally:
            if sock:
                try:
                    sock.close()
                except Exception:
                    pass

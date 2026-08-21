import socket
import time
import logging
from typing import Dict, Any
from app.drivers.base_driver import BasePrinterDriver

logger = logging.getLogger(__name__)

# Standard Bluetooth SPP RFCOMM UUID
SPP_UUID = "00001101-0000-1000-8000-00805f9b34fb"

class SPPPrinterDriver(BasePrinterDriver):
    """
    Direct Bluetooth SPP (Serial Port Profile / RFCOMM) printer driver.
    Utilizes PyBluez or Python native Bluetooth sockets (AF_BLUETOOTH).
    """

    def __init__(self, mac_address: str, channel: int = 1, timeout: float = 10.0, chunk_size: int = 244):
        self.mac_address = mac_address
        self.channel = channel
        self.timeout = timeout
        self.chunk_size = chunk_size
        self.sock: socket.socket | None = None
        self.connected = False

    def connect(self) -> bool:
        if not self.mac_address:
            logger.warning("No Bluetooth MAC address provided")
            return False

        try:
            # Check for native Linux AF_BLUETOOTH support
            if hasattr(socket, "AF_BLUETOOTH") and hasattr(socket, "BTPROTO_RFCOMM"):
                self.sock = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM)
                self.sock.settimeout(self.timeout)
                self.sock.connect((self.mac_address, self.channel))
                self.connected = True
                logger.info(f"Connected via native AF_BLUETOOTH to {self.mac_address}:{self.channel}")
                return True
            else:
                # Try PyBluez PyBluez bluetooth.BluetoothSocket
                import bluetooth
                self.sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
                self.sock.settimeout(self.timeout)
                self.sock.connect((self.mac_address, self.channel))
                self.connected = True
                logger.info(f"Connected via PyBluez to {self.mac_address}:{self.channel}")
                return True
        except Exception as e:
            logger.error(f"Failed to connect via Bluetooth SPP to {self.mac_address} - {e}")
            self.connected = False
            return False

    def disconnect(self) -> None:
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
        self.connected = False
        logger.info("Disconnected from Bluetooth SPP printer")

    def send_bytes(self, data: bytes) -> bool:
        if not self.connected or not self.sock:
            if not self.connect():
                return False

        try:
            total_len = len(data)
            sent = 0
            while sent < total_len:
                chunk = data[sent:sent + self.chunk_size]
                self.sock.send(chunk)
                sent += len(chunk)
                time.sleep(0.01)  # 10ms delay between 244-byte chunks
            logger.info(f"Successfully streamed {total_len} bytes over SPP to {self.mac_address}")
            return True
        except Exception as e:
            logger.error(f"Error streaming data over SPP socket: {e}")
            self.connected = False
            return False

    def get_status(self) -> Dict[str, Any]:
        if not self.connected:
            return {"connected": False, "status": "disconnected", "mac": self.mac_address}
        return {"connected": True, "status": "ready", "mac": self.mac_address}

    def probe_connection(self) -> Dict[str, Any]:
        return {
            "bridge_reachable": False,
            "status": "SPP direct Bluetooth bridge probing not supported over TCP"
        }


class MockPrinterDriver(BasePrinterDriver):
    """Mock Driver for testing without a physical printer."""

    def __init__(self):
        self.connected = True
        self.received_bytes = bytearray()

    def connect(self) -> bool:
        self.connected = True
        return True

    def disconnect(self) -> None:
        self.connected = False

    def send_bytes(self, data: bytes) -> bool:
        self.received_bytes.extend(data)
        logger.info(f"[MOCK PRINTER] Simulated receiving {len(data)} bytes (Total: {len(self.received_bytes)} B)")
        return True

    def get_status(self) -> Dict[str, Any]:
        return {"connected": True, "status": "mock_ready", "received_bytes": len(self.received_bytes)}

    def probe_connection(self) -> Dict[str, Any]:
        return {
            "bridge_reachable": True,
            "status": "Mock printer driver active"
        }

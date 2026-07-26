from abc import ABC, abstractmethod
from typing import Dict, Any

class BasePrinterDriver(ABC):
    """Abstract Base Class for Printer Connection Drivers."""

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to the printer."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Close connection to the printer."""
        pass

    @abstractmethod
    def send_bytes(self, data: bytes) -> bool:
        """Send raw bytes/chunks to the printer."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Query printer status."""
        pass

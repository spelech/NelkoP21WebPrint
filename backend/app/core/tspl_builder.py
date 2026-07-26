from typing import Optional
from app.core.rasterizer import pack_bitmap_to_tspl_bytes, mm_to_dots
from PIL import Image

class TSPLStreamBuilder:
    """Builder for generating TSPL / TSPL2 command streams for Nelko P21."""
    
    def __init__(self, width_mm: float = 14.0, height_mm: float = 40.0, gap_mm: float = 5.0):
        self.width_mm = width_mm
        self.height_mm = height_mm
        self.gap_mm = gap_mm
        self.density = 3
        self.speed = 2.0
        self.direction = 0
        self.copies = 1
        self.commands: list[str] = []
        self.raw_data_blocks: list[bytes] = []

    def set_density(self, density: int) -> "TSPLStreamBuilder":
        self.density = max(0, min(15, density))
        return self

    def set_direction(self, direction: int) -> "TSPLStreamBuilder":
        self.direction = 1 if direction else 0
        return self

    def set_copies(self, copies: int) -> "TSPLStreamBuilder":
        self.copies = max(1, copies)
        return self

    def build_from_image(self, mono_image: Image.Image) -> bytes:
        """
        Takes a 1-bit monochrome PIL Image and generates a complete TSPL byte stream.
        """
        raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(mono_image)
        
        header = f"SIZE {self.width_mm:.1f} mm, {self.height_mm:.1f} mm\r\n"
        if self.gap_mm > 0:
            header += f"GAP {self.gap_mm:.1f} mm, 0 mm\r\n"
        else:
            header += "GAP 0 mm, 0 mm\r\n"
            
        header += f"DIRECTION {self.direction}\r\n"
        header += f"DENSITY {self.density}\r\n"
        header += "CLS\r\n"
        header += f"BITMAP 0,0,{width_bytes},{height_dots},0,"
        
        footer = f"\r\nPRINT {self.copies},1\r\n"
        
        return header.encode("ascii") + raw_bytes + footer.encode("ascii")

    @staticmethod
    def build_status_query() -> bytes:
        """Query real-time status (~TS)."""
        return b"~TS\r\n"

    @staticmethod
    def build_battery_query() -> bytes:
        """Query battery status (~BS)."""
        return b"~BS\r\n"

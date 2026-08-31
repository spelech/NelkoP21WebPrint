import math
from PIL import Image

def mm_to_dots(mm: float, dpi: int = 203) -> int:
    """Convert millimeters to printer dots/pixels based on DPI (203 DPI = 8 dots/mm)."""
    return int(round((mm * dpi) / 25.4))

def get_padded_dimensions(width_dots: int, height_dots: int) -> tuple[int, int]:
    """
    Pad width to nearest byte boundary (multiple of 8 bits) for TSPL alignment.
    Returns (padded_width_dots, width_bytes).
    """
    width_bytes = math.ceil(width_dots / 8.0)
    padded_width_dots = width_bytes * 8
    return padded_width_dots, width_bytes

def dither_image(image: Image.Image, method: str = "threshold") -> Image.Image:
    """
    Convert RGB/Grayscale image into 1-bit monochrome image (mode '1': 0 = black pixel, 255 = white paper).
    Supports 'threshold', 'floyd-steinberg', and 'bayer16' ordered dithering.
    """
    gray = image.convert("L")
    
    if method == "floyd-steinberg":
        # Floyd-Steinberg error diffusion
        mono = gray.convert("1", dither=Image.Dither.FLOYDSTEINBERG)
    elif method == "bayer16":
        # Bayer ordered matrix dithering
        mono = gray.convert("1", dither=Image.Dither.ORDERED)
    else:
        # Standard thresholding (at 128 luminance)
        threshold = 128
        mono = gray.point(lambda p: 255 if p > threshold else 0, mode="1")
        
    return mono

def pack_bitmap_to_tspl_bytes(image: Image.Image, auto_rotate_landscape: bool = True) -> tuple[bytes, int, int]:
    """
    Packs a 1-bit PIL Image into MSB-first binary byte array for TSPL BITMAP command.
    If image is landscape (width > height) and auto_rotate_landscape is True,
    it automatically rotates the image 90 degrees clockwise to align with the
    physical 14mm (112px) printhead.
    
    Bit Mapping on Nelko P21 TSPL BITMAP:
    - 0 bit = thermal pin fires (BLACK pixel)
    - 1 bit = thermal pin off (WHITE paper)
    
    Returns:
    - raw_bytes: Packed binary byte string
    - width_bytes: Width in bytes (padded to byte boundary)
    - height_dots: Height in dots/lines
    """
    if auto_rotate_landscape and image.width > image.height:
        # Rotate 90 degrees clockwise so landscape design fits narrow 14mm printhead
        image = image.rotate(-90, expand=True)

    mono = image if image.mode == "1" else dither_image(image, method="threshold")
    w, h = mono.size
    padded_w, width_bytes = get_padded_dimensions(w, h)
    
    pixels = mono.load()
    raw_bytes = bytearray(width_bytes * h)
    
    idx = 0
    for y in range(h):
        for x_byte in range(width_bytes):
            byte_val = 0
            for bit in range(8):
                x = x_byte * 8 + bit
                # In PIL mode '1': 0 = Black pixel, 255 (or > 0) = White pixel
                # In TSPL BITMAP on Nelko P21: 0 bit = Black (thermal pin fires), 1 bit = White paper
                if x < w:
                    if pixels[x, y] > 0:  # White pixel -> set bit to 1 (thermal head off)
                        byte_val |= (1 << (7 - bit))
                    # else: Black pixel -> leave bit as 0 (thermal head fires)
                else:
                    # Padded area beyond original image width is white paper
                    byte_val |= (1 << (7 - bit))
            raw_bytes[idx] = byte_val
            idx += 1
            
    return bytes(raw_bytes), width_bytes, h

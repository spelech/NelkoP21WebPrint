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
    Convert RGB/Grayscale image into 1-bit monochrome image (1 = black pixel, 0 = white paper).
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
    
    Bit Mapping:
    - 1 bit = thermal element fires (BLACK pixel)
    - 0 bit = thermal element off (WHITE paper)
    
    Returns:
    - raw_bytes: Packed binary byte string
    - width_bytes: Width in bytes (padded to byte boundary)
    - height_dots: Height in dots/lines
    """
    if auto_rotate_landscape and image.width > image.height:
        # Rotate 90 degrees clockwise so landscape design fits narrow 14mm printhead
        image = image.rotate(-90, expand=True)

    mono = dither_image(image, method="threshold")
    w, h = mono.size
    padded_w, width_bytes = get_padded_dimensions(w, h)
    
    # Create padded image if width is not byte-aligned
    if w != padded_w:
        padded_img = Image.new("1", (padded_w, h), 1)  # 1 = white in PIL
        padded_img.paste(mono, (0, 0))
        mono = padded_img
        
    pixels = mono.load()
    raw_bytes = bytearray(width_bytes * h)
    
    idx = 0
    for y in range(h):
        for x_byte in range(width_bytes):
            byte_val = 0
            for bit in range(8):
                x = x_byte * 8 + bit
                # In PIL "1" mode: 0 = Black, 1 = White
                # In TSPL BITMAP: 1 = Black (fire thermal pin), 0 = White
                if pixels[x, y] == 0:
                    byte_val |= (1 << (7 - bit))  # Set bit (MSB-first)
            raw_bytes[idx] = byte_val
            idx += 1
            
    return bytes(raw_bytes), width_bytes, h

import math
from PIL import Image, ImageDraw, ImageOps

BAYER_16x16 = [
    [  0, 128,  32, 160,   8, 136,  40, 168,   2, 130,  34, 162,  10, 138,  42, 170],
    [192,  64, 224,  96, 200,  72, 232, 104, 194,  66, 226,  98, 202,  74, 234, 106],
    [ 48, 176,  16, 144,  56, 184,  24, 152,  50, 178,  18, 146,  58, 186,  26, 154],
    [240, 112, 208,  80, 248, 120, 216,  88, 242, 114, 210,  82, 250, 122, 202,  90],
    [ 12, 140,  44, 172,   4, 132,  36, 164,  14, 142,  46, 174,   6, 134,  38, 166],
    [204,  76, 236, 108, 196,  68, 228, 100, 206,  78, 238, 110, 198,  70, 230, 102],
    [ 60, 188,  28, 156,  52, 180,  20, 148,  62, 190,  30, 158,  54, 182,  22, 150],
    [252, 124, 220,  92, 244, 116, 212,  84, 254, 126, 222,  94, 246, 118, 214,  86],
    [  3, 131,  35, 163,  11, 139,  43, 171,   1, 129,  33, 161,   9, 137,  41, 169],
    [195,  67, 227,  99, 203,  75, 235, 107, 193,  65, 225,  97, 201,  73, 233, 105],
    [ 51, 179,  19, 147,  59, 187,  27, 155,  49, 177,  17, 145,  57, 185,  25, 153],
    [243, 115, 211,  83, 251, 123, 219,  91, 241, 113, 209,  81, 249, 121, 217,  89],
    [ 15, 143,  47, 175,   7, 135,  39, 167,  13, 141,  45, 173,   5, 133,  37, 165],
    [207,  79, 239, 111, 199,  71, 231, 103, 205,  77, 237, 109, 197,  69, 229, 101],
    [ 63, 191,  31, 159,  55, 183,  23, 151,  61, 189,  29, 157,  53, 181,  21, 149],
    [254, 127, 223,  95, 255, 119, 221,  87, 253, 125, 221,  93, 245, 117, 213,  85]
]

def mm_to_dots(mm: float, dpi: int = 203) -> int:
    """Convert millimeters to dots at given DPI (203 DPI = ~8 dots/mm)."""
    return int(round(mm * (dpi / 25.4)))

def get_padded_dimensions(width_dots: int, height_dots: int):
    """
    Ensure width in dots is a multiple of 8 for TSPL bitmap byte alignment.
    Returns (padded_width_dots, width_bytes).
    """
    width_bytes = math.ceil(width_dots / 8)
    padded_width_dots = width_bytes * 8
    return padded_width_dots, width_bytes

def dither_image(image: Image.Image, method: str = "threshold", threshold: int = 128) -> Image.Image:
    """
    Convert an RGBA/RGB PIL Image to 1-bit Monochrome (L mode 0-255).
    0 = Black, 255 = White.
    """
    # Convert to Grayscale
    gray = image.convert("L")
    w, h = gray.size
    
    if method == "floyd-steinberg":
        # PIL built-in Floyd-Steinberg dithering
        mono = gray.convert("1", dither=Image.FLOYDSTEINBERG).convert("L")
        return mono
    elif method == "bayer16":
        mono = Image.new("L", (w, h))
        gray_pixels = gray.load()
        mono_pixels = mono.load()
        for y in range(h):
            for x in range(w):
                lum = gray_pixels[x, y]
                bayer_val = BAYER_16x16[y % 16][x % 16]
                mono_pixels[x, y] = 0 if lum < bayer_val else 255
        return mono
    else:  # Default thresholding
        mono = Image.new("L", (w, h))
        gray_pixels = gray.load()
        mono_pixels = mono.load()
        for y in range(h):
            for x in range(w):
                mono_pixels[x, y] = 0 if gray_pixels[x, y] < threshold else 255
        return mono

def pack_bitmap_to_tspl_bytes(mono_image: Image.Image) -> tuple[bytes, int, int]:
    """
    Packs a 1-bit monochrome image (0=Black, 255=White) into TSPL 1-bit MSB-first byte array.
    In TSPL bitmap data:
      Bit 1 = Thermal element fires (Black)
      Bit 0 = White background
    Returns (raw_bytes, width_bytes, height_dots).
    """
    w, h = mono_image.size
    padded_w, width_bytes = get_padded_dimensions(w, h)
    
    # Resize canvas with white background if padding needed
    if padded_w != w:
        padded_img = Image.new("L", (padded_w, h), 255)
        padded_img.paste(mono_image, (0, 0))
        mono_image = padded_img
        
    pixels = mono_image.load()
    buffer = bytearray(width_bytes * h)
    idx = 0
    
    for y in range(h):
        for x_byte in range(width_bytes):
            byte_val = 0
            for bit in range(8):
                x_pixel = (x_byte * 8) + bit
                if x_pixel < padded_w:
                    pixel_lum = pixels[x_pixel, y]
                    if pixel_lum < 128:  # Black pixel -> set bit
                        byte_val |= (1 << (7 - bit))
            buffer[idx] = byte_val
            idx += 1
            
    return bytes(buffer), width_bytes, h

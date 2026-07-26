from PIL import Image
from app.core.rasterizer import mm_to_dots, get_padded_dimensions, dither_image, pack_bitmap_to_tspl_bytes

def test_mm_to_dots():
    assert mm_to_dots(14.0, 203) == 112
    assert mm_to_dots(40.0, 203) == 320

def test_get_padded_dimensions():
    padded_w, width_bytes = get_padded_dimensions(112, 320)
    assert padded_w == 112
    assert width_bytes == 14

def test_pack_bitmap_to_tspl_bytes():
    # 14mm x 40mm = 112 x 320 px
    img = Image.new("L", (112, 320), 0)  # All black
    raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img)
    assert width_bytes == 14
    assert height_dots == 320
    assert len(raw_bytes) == 14 * 320
    # All black means all bits 1 (0xFF)
    assert raw_bytes[0] == 0xFF

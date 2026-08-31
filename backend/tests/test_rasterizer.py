from PIL import Image, ImageDraw
from app.core.rasterizer import mm_to_dots, get_padded_dimensions, dither_image, pack_bitmap_to_tspl_bytes

def test_mm_to_dots():
    assert mm_to_dots(14.0, 203) == 112
    assert mm_to_dots(40.0, 203) == 320

def test_get_padded_dimensions():
    padded_w, width_bytes = get_padded_dimensions(112, 320)
    assert padded_w == 112
    assert width_bytes == 14

def test_pack_bitmap_to_tspl_bytes_all_black():
    # 14mm x 40mm = 112 x 320 px (All black)
    img = Image.new("L", (112, 320), 0)
    raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img)
    assert width_bytes == 14
    assert height_dots == 320
    assert len(raw_bytes) == 14 * 320
    # All black means all bits 0 (0x00, thermal pins fire)
    assert raw_bytes[0] == 0x00
    assert set(raw_bytes) == {0x00}

def test_pack_bitmap_to_tspl_bytes_all_white():
    # 14mm x 40mm = 112 x 320 px (All white paper)
    img = Image.new("L", (112, 320), 255)
    raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img)
    assert width_bytes == 14
    assert height_dots == 320
    assert len(raw_bytes) == 14 * 320
    # All white means all bits 1 (0xFF, thermal pins off)
    assert raw_bytes[0] == 0xFF
    assert set(raw_bytes) == {0xFF}

def test_pack_bitmap_to_tspl_bytes_landscape_white_with_black_rect():
    # 40mm x 14mm = 320 x 112 px (Landscape canvas)
    img = Image.new("L", (320, 112), 255)
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 50, 50], fill=0) # Black square
    raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img, auto_rotate_landscape=True)
    assert width_bytes == 14
    assert height_dots == 320
    # Majority of bytes should be white paper (0xFF)
    white_bytes = raw_bytes.count(0xFF)
    assert white_bytes > len(raw_bytes) * 0.90

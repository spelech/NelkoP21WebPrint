from PIL import Image
from app.core.tspl_builder import TSPLStreamBuilder

def test_tspl_builder():
    builder = TSPLStreamBuilder(width_mm=14.0, height_mm=40.0, gap_mm=5.0)
    img = Image.new("L", (112, 320), 255)  # All white portrait
    payload = builder.build_from_image(img)
    
    assert b"SIZE 14.0 mm, 40.0 mm\r\n" in payload
    assert b"GAP 5.0 mm, 0 mm\r\n" in payload
    assert b"CLS\r\n" in payload
    assert b"BITMAP 0,0,14,320,0," in payload
    assert b"\r\nPRINT 1,1\r\n" in payload

def test_tspl_builder_landscape():
    builder = TSPLStreamBuilder(width_mm=40.0, height_mm=14.0, gap_mm=5.0)
    img = Image.new("L", (320, 112), 255)  # Landscape image (auto-rotates to 112x320)
    payload = builder.build_from_image(img)
    
    # Header SIZE must be swapped to match the rotated physical 14mm head width
    assert b"SIZE 14.0 mm, 40.0 mm\r\n" in payload
    assert b"GAP 5.0 mm, 0 mm\r\n" in payload
    assert b"CLS\r\n" in payload
    assert b"BITMAP 0,0,14,320,0," in payload
    assert b"\r\nPRINT 1,1\r\n" in payload

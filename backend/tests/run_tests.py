import unittest
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from PIL import Image
from app.core.rasterizer import mm_to_dots, get_padded_dimensions, pack_bitmap_to_tspl_bytes
from app.core.tspl_builder import TSPLStreamBuilder

class TestRasterizer(unittest.TestCase):
    def test_mm_to_dots(self):
        self.assertEqual(mm_to_dots(14.0, 203), 112)
        self.assertEqual(mm_to_dots(40.0, 203), 320)

    def test_get_padded_dimensions(self):
        padded_w, width_bytes = get_padded_dimensions(112, 320)
        self.assertEqual(padded_w, 112)
        self.assertEqual(width_bytes, 14)

    def test_pack_bitmap_to_tspl_bytes(self):
        img = Image.new("L", (112, 320), 0)  # All black
        raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img)
        self.assertEqual(width_bytes, 14)
        self.assertEqual(height_dots, 320)
        self.assertEqual(len(raw_bytes), 14 * 320)
        self.assertEqual(raw_bytes[0], 0xFF)

class TestTSPLBuilder(unittest.TestCase):
    def test_tspl_builder(self):
        builder = TSPLStreamBuilder(width_mm=14.0, height_mm=40.0, gap_mm=5.0)
        img = Image.new("L", (112, 320), 255)  # All white
        payload = builder.build_from_image(img)
        
        self.assertIn(b"SIZE 14.0 mm, 40.0 mm\r\n", payload)
        self.assertIn(b"GAP 5.0 mm, 0 mm\r\n", payload)
        self.assertIn(b"CLS\r\n", payload)
        self.assertIn(b"BITMAP 0,0,14,320,0,", payload)
        self.assertIn(b"\r\nPRINT 1,1\r\n", payload)

if __name__ == "__main__":
    unittest.main()

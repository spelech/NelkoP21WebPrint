import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Enforce mock mode for unit tests
os.environ["DEFAULT_DRIVER_TYPE"] = "mock"


from PIL import Image
from app.core.rasterizer import mm_to_dots, get_padded_dimensions, pack_bitmap_to_tspl_bytes, dither_image
from app.core.tspl_builder import TSPLStreamBuilder
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

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
        raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(img, auto_rotate_landscape=False)
        self.assertEqual(width_bytes, 14)
        self.assertEqual(height_dots, 320)
        self.assertEqual(len(raw_bytes), 14 * 320)
        self.assertEqual(raw_bytes[0], 0x00)  # 0x00 = All black (thermal pins fire)

    def test_auto_rotate_landscape(self):
        # Landscape image 320x112 should rotate to 112x320 for 14mm printhead
        landscape_img = Image.new("L", (320, 112), 0)
        raw_bytes, width_bytes, height_dots = pack_bitmap_to_tspl_bytes(landscape_img, auto_rotate_landscape=True)
        self.assertEqual(width_bytes, 14)  # 112 dots / 8 = 14 bytes
        self.assertEqual(height_dots, 320)

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

class TestAPIRoutes(unittest.TestCase):
    def test_get_printer_status(self):
        response = client.get("/api/printer/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("config", data)

    def test_get_presets(self):
        response = client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        presets = response.json()
        self.assertTrue(len(presets) > 0)

    def test_post_preview(self):
        payload = {
            "text": "TEST LABEL",
            "subtitle": "SERVER TEST",
            "barcode": "123456",
            "width_mm": 40.0,
            "height_mm": 14.0,
            "gap_mm": 5.0,
            "dither_method": "threshold"
        }
        response = client.post("/api/preview", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/png")

    def test_post_print_text(self):
        payload = {
            "text": "HA DIRECT TEXT",
            "font_family": "monospace",
            "bold": True,
            "align": "center",
            "width_mm": 40.0,
            "height_mm": 14.0,
            "gap_mm": 5.0,
            "copies": 1
        }
        response = client.post("/api/print/text", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("bytes_sent", data)

class TestTemplatesAndBatch(unittest.TestCase):
    def test_list_templates(self):
        response = client.get("/api/templates")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        # Verify default stock templates exist
        stock_ids = [t["id"] for t in data]
        self.assertIn("asset_tag", stock_ids)
        self.assertIn("cable_flag", stock_ids)
        self.assertIn("box_label", stock_ids)

    def test_get_template(self):
        response = client.get("/api/templates/asset_tag")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Asset Tag (Standard)")
        self.assertTrue(len(data["elements"]) > 0)

    def test_post_preview_template(self):
        payload = {
            "template_id": "asset_tag",
            "variables": {
                "name": "TEST DEVICE",
                "url": "https://test.wileyriley.com"
            }
        }
        response = client.post("/api/preview/template", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/png")

    def test_post_print_template(self):
        payload = {
            "template_id": "box_label",
            "variables": {
                "title": "KITCHEN BOX",
                "subtitle": "UTENSILS"
            },
            "copies": 1
        }
        # In mock mode, this will succeed with 200
        response = client.post("/api/print/template", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")

    def test_post_print_batch(self):
        payload = {
            "template_id": "asset_tag",
            "jobs": [
                { "variables": { "name": "DEV-01", "url": "http://1" }, "copies": 1 },
                { "variables": { "name": "DEV-02", "url": "http://2" }, "copies": 2 }
            ]
        }
        response = client.post("/api/print/batch", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["batch_size"], 2)
        self.assertEqual(data["total_copies"], 3)

if __name__ == "__main__":
    unittest.main()


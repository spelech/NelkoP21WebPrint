import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

class TestAPIRoutes(unittest.TestCase):
    def test_get_printer_status(self):
        response = client.get("/api/printer/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("config", data)
        self.assertIn("driver_status", data)

    def setUp(self):
        from app.core.config import settings
        self.orig_driver = settings.DEFAULT_DRIVER_TYPE
        settings.DEFAULT_DRIVER_TYPE = "mock"

    def tearDown(self):
        from app.core.config import settings
        settings.DEFAULT_DRIVER_TYPE = self.orig_driver

    def test_get_presets(self):
        response = client.get("/api/presets")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        presets = data.get("presets", data) if isinstance(data, dict) else data
        self.assertTrue(len(presets) > 0)
        self.assertIn("width", presets[0])
        self.assertIn("height", presets[0])

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
        self.assertTrue(len(response.content) > 0)

    def test_update_printer_config(self):
        payload = {
            "driver_type": "mock",
            "tcp_host": "127.0.0.1",
            "tcp_port": 9100,
            "bt_mac": ""
        }
        response = client.post("/api/printer/config", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "updated")

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

if __name__ == "__main__":
    unittest.main()

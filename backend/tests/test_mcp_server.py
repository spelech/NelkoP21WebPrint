import os
import sys
import json
import asyncio
import unittest
from unittest.mock import patch, MagicMock

# Enforce mock mode for tests
os.environ["DEFAULT_DRIVER_TYPE"] = "mock"

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.mcp.server import (
    mcp,
    check_printer_status,
    list_presets,
    list_templates,
    print_simple_label,
    print_template_label,
    print_custom_label,
    print_batch,
    preview_label,
    printer_specs_resource,
    presets_resource,
    templates_resource,
    label_designer_prompt,
    generate_ascii_wireframe,
)
from app.drivers.spp_driver import MockPrinterDriver
from app.main import app


class TestMCPServer(unittest.TestCase):
    def setUp(self):
        os.environ["DEFAULT_DRIVER_TYPE"] = "mock"

    def test_check_printer_status_online(self):
        with patch("app.mcp.server.get_driver") as mock_get_driver:
            mock_driver = MagicMock()
            mock_driver.probe_connection.return_value = {
                "bridge_reachable": True,
                "host": "10.0.0.10",
                "port": 9100,
                "status": "Bridge online and reachable"
            }
            mock_get_driver.return_value = mock_driver

            res = check_printer_status()
            self.assertIn("✅ **Printer Bridge Online**", res)
            self.assertIn("10.0.0.10:9100", res)
            self.assertIn("Ready to accept print jobs", res)

    def test_check_printer_status_offline(self):
        with patch("app.mcp.server.get_driver") as mock_get_driver:
            mock_driver = MagicMock()
            mock_driver.probe_connection.return_value = {
                "bridge_reachable": False,
                "host": "10.0.0.10",
                "port": 9100,
                "error": "Connection refused"
            }
            mock_get_driver.return_value = mock_driver

            res = check_printer_status()
            self.assertIn("❌ **Bridge Offline**", res)
            self.assertIn("10.0.0.10:9100", res)
            self.assertIn("Check ESP32 power, WiFi, or IP configuration", res)

    def test_list_presets(self):
        res = list_presets()
        self.assertIn("Available Label Presets", res)
        self.assertIn("14x40mm Standard Gap", res)
        self.assertIn("112 × 320 dots", res)
        self.assertIn("Gap: 5mm", res)

    def test_list_templates(self):
        res = list_templates()
        self.assertIn("Available Label Templates", res)
        self.assertIn("asset_tag", res)
        self.assertIn("box_label", res)
        self.assertIn("cable_flag", res)

    def test_print_simple_label(self):
        res = print_simple_label(
            title="MCP TEST LABEL",
            subtitle="SUBTITLE",
            barcode_value="123456",
            width_mm=40.0,
            height_mm=14.0,
            copies=2,
            density=3
        )
        self.assertIn("Successfully sent print job", res)
        self.assertIn("MCP TEST LABEL", res)
        self.assertIn("2 copies", res)

    def test_print_template_label(self):
        vars_json = json.dumps({"title": "STORAGE BOX #1", "subtitle": "TOOLS"})
        res = print_template_label(template_id="box_label", variables_json=vars_json, copies=1)
        self.assertIn("Successfully printed template 'box_label'", res)
        self.assertIn("STORAGE BOX #1", res)

    def test_print_template_label_invalid_json(self):
        res = print_template_label(template_id="box_label", variables_json="{bad json")
        self.assertIn("Error: Invalid variables JSON", res)

    def test_print_custom_label(self):
        elements = [
            {"type": "text", "content": "CUSTOM TEST", "x": 50, "y": 30, "fontSize": 14},
            {"type": "line", "x": 50, "y": 50, "width": 80, "height": 2},
            {"type": "qr", "content": "https://wileyriley.com", "x": 50, "y": 75, "size": 30}
        ]
        res = print_custom_label(
            elements_json=json.dumps(elements),
            width_mm=40.0,
            height_mm=14.0,
            copies=1
        )
        self.assertIn("Successfully printed custom label", res)
        self.assertIn("3 elements", res)

    def test_print_custom_label_invalid_json(self):
        res = print_custom_label(elements_json="not valid json")
        self.assertIn("Error: Invalid elements JSON", res)

    def test_print_batch_with_auto_barcode(self):
        items = ["Chicken Breast", "Ground Beef", "Pork Chops"]
        res = print_batch(
            items_json=json.dumps(items),
            auto_barcode_prefix="CHK",
            copies_per_item=2
        )
        self.assertIn("Successfully printed batch of 3 labels", res)
        self.assertIn("6 total copies", res)

    def test_print_batch_with_template(self):
        items = [
            {"name": "SERVER-01", "url": "https://s1.lan"},
            {"name": "SERVER-02", "url": "https://s2.lan"}
        ]
        res = print_batch(
            items_json=json.dumps(items),
            template_id="asset_tag",
            copies_per_item=1
        )
        self.assertIn("Successfully printed batch of 2 labels", res)
        self.assertIn("2 total copies", res)

    def test_print_batch_empty(self):
        res = print_batch(items_json="[]")
        self.assertIn("Batch is empty", res)

    def test_preview_label_simple(self):
        res = preview_label(
            title="PREVIEW TEST",
            subtitle="SUBTITLE",
            barcode_value="PREV123",
            width_mm=40.0,
            height_mm=14.0
        )
        self.assertIn("### Label Preview (40.0mm × 14.0mm)", res)
        self.assertIn("```", res)
        self.assertIn("data:image/png;base64,", res)

    def test_preview_label_template(self):
        vars_json = json.dumps({"title": "BOX 42", "subtitle": "HARDWARE"})
        res = preview_label(
            template_id="box_label",
            variables_json=vars_json
        )
        self.assertIn("### Label Preview", res)
        self.assertIn("data:image/png;base64,", res)

    def test_preview_label_custom_elements(self):
        elements = [
            {"type": "text", "content": "PREVIEW ELEMENT", "x": 50, "y": 50, "fontSize": 12}
        ]
        res = preview_label(
            elements_json=json.dumps(elements),
            width_mm=40.0,
            height_mm=14.0
        )
        self.assertIn("### Label Preview", res)
        self.assertIn("data:image/png;base64,", res)

    def test_resources_direct(self):
        specs_json = printer_specs_resource()
        specs = json.loads(specs_json)
        self.assertEqual(specs["dpi"], 203)
        self.assertEqual(specs["dots_per_mm"], 8)
        self.assertEqual(specs["printhead_width_dots"], 112)

        presets_json = presets_resource()
        presets = json.loads(presets_json)
        self.assertTrue(len(presets) > 0)
        self.assertEqual(presets[0]["width_dots"], 112)

        templates_json = templates_resource()
        templates = json.loads(templates_json)
        self.assertTrue(len(templates) > 0)
        template_ids = [t["id"] for t in templates]
        self.assertIn("asset_tag", template_ids)

    def test_prompt_direct(self):
        prompt_text = label_designer_prompt(label_type="cable_flag", details="Rack 1 power cables")
        self.assertIn("expert thermal label designer", prompt_text)
        self.assertIn("cable_flag", prompt_text)
        self.assertIn("Rack 1 power cables", prompt_text)
        self.assertIn("203 DPI", prompt_text)

    def test_fastmcp_async_calls(self):
        async def run_async_tests():
            # Test async tool call
            tool_res = await mcp.call_tool("check_printer_status", {})
            self.assertFalse(tool_res.is_error)

            # Test async resource reads
            res_specs = await mcp.read_resource("nelko://specs/printer")
            self.assertTrue(len(res_specs.contents) > 0)
            specs_data = json.loads(res_specs.contents[0].content)
            self.assertEqual(specs_data["dpi"], 203)

            res_presets = await mcp.read_resource("nelko://presets")
            self.assertTrue(len(res_presets.contents) > 0)

            res_templates = await mcp.read_resource("nelko://templates")
            self.assertTrue(len(res_templates.contents) > 0)

            # Test async prompt rendering
            prompt_res = await mcp.render_prompt("label_designer", arguments={"label_type": "box_label"})
            self.assertTrue(len(prompt_res.messages) > 0)
            self.assertIn("box_label", prompt_res.messages[0].content.text)

        asyncio.run(run_async_tests())

    def test_fastapi_mcp_mounts(self):
        # Verify mounts exist in FastAPI app
        mount_paths = [route.path for route in app.routes if hasattr(route, "path")]
        self.assertIn("/sse", mount_paths)
        self.assertIn("/mcp", mount_paths)


if __name__ == "__main__":
    unittest.main()

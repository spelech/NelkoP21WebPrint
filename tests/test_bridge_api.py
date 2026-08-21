import os
import sys
import json
import time
import socket
import urllib.request
import urllib.parse
import urllib.error
import unittest

ESP32_HOST = os.environ.get("ESP32_HOST", "10.0.0.205")
if len(sys.argv) > 1 and not sys.argv[1].startswith("-") and not sys.argv[1].endswith(".py"):
    ESP32_HOST = sys.argv.pop(1)

ESP32_PORT = int(os.environ.get("ESP32_PORT", "80"))
ESP32_TCP_PRINT_PORT = int(os.environ.get("ESP32_TCP_PRINT_PORT", "9100"))

def get_base_url():
    return f"http://{ESP32_HOST}:{ESP32_PORT}"

def http_get(path, timeout=8):
    url = f"{get_base_url()}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.status, response.read().decode('utf-8')

def http_post(path, data=None, json_data=None, timeout=8):
    url = f"{get_base_url()}{path}"
    if json_data is not None:
        payload = json.dumps(json_data).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    elif data is not None:
        payload = urllib.parse.urlencode(data).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    else:
        req = urllib.request.Request(url, data=b'')
    
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

class TestESP32BridgeAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            status_code, body = http_get("/api/status", timeout=5)
            assert status_code == 200
        except Exception as e:
            raise unittest.SkipTest(f"ESP32 Bridge at {get_base_url()} is unreachable: {e}")

    def test_01_status_endpoint(self):
        """Verify /api/status returns valid JSON with connection, mac, and version info."""
        status_code, body = http_get("/api/status")
        self.assertEqual(status_code, 200)
        data = json.loads(body)
        self.assertIn("connected", data)
        self.assertIn("mac", data)
        self.assertIn("version", data)
        self.assertIn("ip", data)
        self.assertIsInstance(data["connected"], bool)
        self.assertTrue(len(data["version"]) > 0)

    def test_02_printer_status_alias(self):
        """Verify /api/printer/status alias returns identical structure for web clients."""
        status_code, body = http_get("/api/printer/status")
        self.assertEqual(status_code, 200)
        data = json.loads(body)
        self.assertIn("connected", data)
        self.assertIn("mac", data)

    def test_03_mac_address_validation_and_saving(self):
        """Test MAC address validation logic (rejects malformed strings, accepts valid MACs)."""
        # 1. Reject invalid MAC strings
        status_code, body = http_post("/api/bt/save", data={"mac": "INVALID_MAC"})
        self.assertEqual(status_code, 400)
        self.assertIn("error", json.loads(body))

        status_code, body = http_post("/api/bt/save", data={"mac": "00:11:22:33:44"})
        self.assertEqual(status_code, 400)

        # 2. Accept and save valid MAC address
        valid_mac = "14:B2:CB:21:6B:20"
        status_code, body = http_post("/api/bt/save", data={"mac": valid_mac})
        self.assertEqual(status_code, 200)
        data = json.loads(body)
        self.assertEqual(data.get("status"), "ok")

        time.sleep(1.0)

        # 3. Confirm MAC is reflected in /api/status
        _, status_body = http_get("/api/status")
        status_data = json.loads(status_body)
        self.assertEqual(status_data["mac"].upper(), valid_mac.upper())

    def test_04_template_nvs_lifecycle(self):
        """Test template layout save, persistence, load, and reset in Flash NVS."""
        sample_template = {
            "name": "Integration Test Asset Tag",
            "version": "1.0",
            "preset": {"width": 40, "height": 14, "gap": 5},
            "elements": [
                {"id": "t1", "type": "text", "content": "{{title}}", "x": 10, "y": 8, "fontSize": 14},
                {"id": "b1", "type": "barcode", "content": "{{sku}}", "x": 10, "y": 28, "height": 18}
            ]
        }

        # 1. Save template to ESP32 Flash
        status_code, body = http_post("/api/template/save", json_data=sample_template)
        self.assertEqual(status_code, 200)
        save_resp = json.loads(body)
        self.assertEqual(save_resp.get("status"), "ok")

        # 2. Retrieve template from ESP32 Flash
        status_code, body = http_get("/api/template/load")
        self.assertEqual(status_code, 200)
        loaded_template = json.loads(body)
        self.assertEqual(loaded_template.get("name"), sample_template["name"])
        self.assertEqual(len(loaded_template.get("elements", [])), 2)

        # 3. Reset template back to stock
        status_code, body = http_post("/api/template/reset")
        self.assertEqual(status_code, 200)
        reset_resp = json.loads(body)
        self.assertEqual(reset_resp.get("status"), "ok")

    def test_05_tcp_print_port_throughput(self):
        """Test raw TSPL TCP socket transmission on port 9100."""
        # Minimal valid TSPL stream with 14mm header
        tspl_stream = (
            b"SIZE 14.0 mm, 40.0 mm\r\n"
            b"GAP 5.0 mm, 0 mm\r\n"
            b"DIRECTION 0\r\n"
            b"DENSITY 3\r\n"
            b"CLS\r\n"
            b"BITMAP 0,0,14,2,0,\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff"
            b"\r\nPRINT 1,1\r\n"
        )

        sock = socket.create_connection((ESP32_HOST, ESP32_TCP_PRINT_PORT), timeout=5)
        chunk_size = 64
        for i in range(0, len(tspl_stream), chunk_size):
            chunk = tspl_stream[i:i + chunk_size]
            sock.sendall(chunk)
            time.sleep(0.01)
        
        sock.close()
        time.sleep(0.5)

        status_code, body = http_get("/api/status")
        self.assertEqual(status_code, 200)

    def test_06_print_api_direct(self):
        """Test on-chip TSPL generation and print dispatch via POST /api/print."""
        status_code, body = http_post("/api/print", json_data={
            "main_text": "ESP32 TEST",
            "subtitle": "INTEGRATION SUITE",
            "barcode_data": "987654"
        })
        self.assertEqual(status_code, 200)
        resp = json.loads(body)
        self.assertIn(resp.get("status"), ["ok", "success"])

if __name__ == "__main__":
    print(f"=== Running ESP32 Bridge Test Suite against {get_base_url()} (TCP Print Port: {ESP32_TCP_PRINT_PORT}) ===")
    unittest.main()

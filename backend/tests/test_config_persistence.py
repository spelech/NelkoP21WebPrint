import sys
import os
import json
import tempfile
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.core.config import Settings, load_saved_config, save_config_file
from app.main import app

client = TestClient(app)

def test_save_and_load_config():
    with tempfile.TemporaryDirectory() as tmpdir:
        cfg_path = os.path.join(tmpdir, "config.json")
        test_data = {
            "driver_type": "tcp",
            "tcp_host": "10.0.0.205",
            "tcp_port": 9100,
            "bt_mac": ""
        }
        with patch("app.core.config.CONFIG_FILE_PATH", cfg_path):
            save_config_file(test_data)
            assert os.path.exists(cfg_path)
            loaded = load_saved_config()
            assert loaded["driver_type"] == "tcp"
            assert loaded["tcp_host"] == "10.0.0.205"
            assert loaded["tcp_port"] == 9100
            assert loaded["bt_mac"] == ""

def test_load_saved_config_nonexistent():
    with tempfile.TemporaryDirectory() as tmpdir:
        cfg_path = os.path.join(tmpdir, "nonexistent_config.json")
        with patch("app.core.config.CONFIG_FILE_PATH", cfg_path):
            loaded = load_saved_config()
            assert loaded == {}

def test_load_saved_config_corrupted_json():
    with tempfile.TemporaryDirectory() as tmpdir:
        cfg_path = os.path.join(tmpdir, "corrupt_config.json")
        with open(cfg_path, "w") as f:
            f.write("{invalid-json-content")
        with patch("app.core.config.CONFIG_FILE_PATH", cfg_path):
            loaded = load_saved_config()
            assert loaded == {}

def test_settings_initialization_with_saved_config():
    with tempfile.TemporaryDirectory() as tmpdir:
        cfg_path = os.path.join(tmpdir, "config.json")
        test_data = {
            "driver_type": "spp",
            "tcp_host": "192.168.1.50",
            "tcp_port": 9200,
            "bt_mac": "00:11:22:33:44:55"
        }
        with patch("app.core.config.CONFIG_FILE_PATH", cfg_path):
            save_config_file(test_data)
            new_settings = Settings()
            assert new_settings.DEFAULT_DRIVER_TYPE == "spp"
            assert new_settings.PRINTER_TCP_HOST == "192.168.1.50"
            assert new_settings.PRINTER_TCP_PORT == 9200
            assert new_settings.PRINTER_BT_MAC == "00:11:22:33:44:55"

def test_api_update_printer_config_persists():
    with tempfile.TemporaryDirectory() as tmpdir:
        cfg_path = os.path.join(tmpdir, "config.json")
        with patch("app.core.config.CONFIG_FILE_PATH", cfg_path), \
             patch("app.api.printer_routes.CONFIG_FILE_PATH", cfg_path, create=True):
            payload = {
                "driver_type": "mock",
                "tcp_host": "10.0.0.222",
                "tcp_port": 9105,
                "bt_mac": "AA:BB:CC:DD:EE:FF"
            }
            response = client.post("/api/printer/config", json=payload)
            assert response.status_code == 200
            assert os.path.exists(cfg_path)
            with open(cfg_path, "r") as f:
                saved = json.load(f)
            assert saved["driver_type"] == "mock"
            assert saved["tcp_host"] == "10.0.0.222"
            assert saved["tcp_port"] == 9105
            assert saved["bt_mac"] == "AA:BB:CC:DD:EE:FF"

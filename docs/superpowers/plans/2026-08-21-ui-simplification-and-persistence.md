# Nelko P21 WebPrint: UI Simplification & Settings Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Nelko WebPrint UI to restrict desktop clients to the Server Bridge (ESP32/TCP) while allowing mobile clients to use Direct Web Bluetooth or Server Bridge, and persist settings both on the server (`/app/data/config.json`) and in the browser (`localStorage`).

**Architecture:** 
1. The Python FastAPI backend checks for `/app/data/config.json` on startup to override environment defaults, and persists runtime configuration updates to this JSON file.
2. The React frontend detects mobile vs desktop clients: desktop is fixed to Server Bridge mode with direct Bluetooth UI elements hidden; mobile defaults to Direct Bluetooth with toggle support. All client preferences (`useBrowserBt`, `density`, `copies`, `invertColors`) are persisted in `localStorage`.
3. Docker compose attaches a persistent volume mount `/containers/productivity/nelkop21webprint/data:/app/data` and updates environment defaults.

**Tech Stack:** Python 3.11, FastAPI, Pydantic, React 18, TypeScript, TailwindCSS, Docker Compose.

## Global Constraints
- Target persistent config path: `/app/data/config.json`.
- Default TCP Host: `10.0.0.205`, Port: `9100`.
- Mobile detection pattern: touch device check and `/Mobi|Android|iPhone|iPad|iPod/i` user-agent test.
- All frontend changes must pass TypeScript validation (`tsc --noEmit`).
- All backend tests must pass (`pytest backend/tests`).

---

### Task 1: Backend Settings File Persistence

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/api/printer_routes.py`
- Test: `backend/tests/test_config_persistence.py`

**Interfaces:**
- Consumes: `Settings` object, `PrinterConfigModel`
- Produces: `save_config_file(config_data: dict) -> None`, `load_saved_config() -> dict`

- [ ] **Step 1: Write the failing test for config file loading and saving**

```python
# backend/tests/test_config_persistence.py
import os
import json
import tempfile
from unittest.mock import patch
from app.core.config import Settings, load_saved_config, save_config_file

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_config_persistence.py -v`
Expected: FAIL with "cannot import name 'load_saved_config'"

- [ ] **Step 3: Implement config loading and saving in backend**

Update `backend/app/core/config.py`:
- Add `CONFIG_DIR = os.getenv("CONFIG_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "data"))`
- Add `CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, "config.json")`
- Implement `load_saved_config()` to load JSON if file exists.
- Implement `save_config_file(data: dict)` to write formatted JSON.
- On `Settings` initialization, apply any values found in `load_saved_config()`.

Update `backend/app/api/printer_routes.py`:
- In `update_printer_config(cfg)`, call `save_config_file(cfg.dict())` after updating `settings`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_config_persistence.py -v`
Expected: PASS

---

### Task 2: Update Docker Compose Volume & Environment

**Files:**
- Modify: `/containers/productivity/docker-compose.yaml:453-480`

- [ ] **Step 1: Update `productivity/docker-compose.yaml`**
- Set default environment `PRINTER_DRIVER=tcp`, `PRINTER_TCP_HOST=10.0.0.205`, `PRINTER_TCP_PORT=9100`.
- Add volume mount:
  ```yaml
    volumes:
      - /containers/productivity/nelkop21webprint/data:/app/data
  ```
- Validate compose file with `docker compose config --quiet`.

---

### Task 3: Client LocalStorage & Mobile vs Desktop Mode Detection in Frontend

**Files:**
- Modify: `frontend/src/hooks/usePrinterBridge.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Modals/SettingsModal.tsx`
- Modify: `frontend/src/components/Modals/WizardModal.tsx`

- [ ] **Step 1: Implement mobile detection and localStorage hook logic in `usePrinterBridge.ts`**
- Add helper `isMobileClient()`: checks `navigator.userAgent` for mobile identifiers or `window.matchMedia('(pointer: coarse)').matches`.
- Initialize `isMobile` state.
- If not mobile (`isMobile === false`): force `useBrowserBt = false` (Server Bridge only).
- If mobile (`isMobile === true`): initialize `useBrowserBt` from `localStorage.getItem('nelko_use_browser_bt') ?? 'true'` (`boolean`).
- Initialize and persist `density` (`nelko_print_density`), `copies` (`nelko_print_copies`), `invertColors` (`nelko_invert_colors`).
- When `setUseBrowserBt`, `setDensity`, `setCopies`, `setInvertColors` are called, persist them to `localStorage`.

- [ ] **Step 2: Update `Header.tsx` and `SettingsModal.tsx`**
- In `Header.tsx`:
  - On desktop (`isMobile === false`): Hide Web Bluetooth connect / toggle button. Display Server Bridge status badge (`Server Bridge: 10.0.0.205:9100`).
  - On mobile (`isMobile === true`): Display toggle between Direct BT and Server Bridge.
- In `SettingsModal.tsx`:
  - Simplify options: highlight TCP Network Bridge.
  - On desktop, default driver view directly to TCP bridge settings.

- [ ] **Step 3: Run TypeScript compiler validation**

Run: `cd /containers/nelkop21webprint/frontend && npm run build`
Expected: Build succeeds with 0 TypeScript errors.

---

### Task 4: Rebuild Image, Deploy & Verify

**Files:**
- Target: `ghcr.io/spelech/nelkop21webprint:latest`
- Container: `nelko-p21-print`

- [ ] **Step 1: Build new Docker image**
Run: `docker build -t ghcr.io/spelech/nelkop21webprint:latest /containers/nelkop21webprint`

- [ ] **Step 2: Recreate container**
Run: `docker compose -f /containers/productivity/docker-compose.yaml up -d --force-recreate nelko-p21-print`

- [ ] **Step 3: Test persistence across restarts**
- Update config via API: `curl -X POST http://127.0.0.1:8410/api/printer/config -H "Content-Type: application/json" -d '{"driver_type":"tcp","tcp_host":"10.0.0.205","tcp_port":9100,"bt_mac":""}'`
- Check file exists at `/containers/productivity/nelkop21webprint/data/config.json`.
- Restart container: `docker compose -f /containers/productivity/docker-compose.yaml restart nelko-p21-print`.
- Query `GET /api/printer/status` and verify `driver_type` remains `tcp` and `tcp_host` remains `10.0.0.205`.

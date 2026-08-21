# Nelko P21 WebPrint: UI Simplification & Settings Persistence Spec

## 1. Context & Problem Statement
Currently, the Nelko P21 WebPrint setup exhibits the following pain points:
1. Docker Compose defaults to `PRINTER_DRIVER=mock` in `/containers/productivity/docker-compose.yaml`.
2. The FastAPI backend does not persist printer configuration updates (`/api/printer/config`) to disk, losing changes whenever containers restart.
3. The React frontend does not persist client settings (`useBrowserBt`, `density`, `copies`, `invertColors`, etc.) in `localStorage`.
4. Desktop users are shown Web Bluetooth connect options and complex driver dropdowns, even though desktop browser Bluetooth to thermal printers is unreliable or unnecessary when an ESP32 TCP bridge exists on the local network.

## 2. Requirements & Goals

### 2.1 Frontend UI Simplification & Client Storage
- **Device Separation**:
  - **Desktop Clients**: Fixed to Server Bridge mode (`useBrowserBt = false`). Hide direct Bluetooth connect buttons, wizard tabs for browser BT, and mock/spp options from primary desktop view. Display clear server bridge connection/status badge.
  - **Mobile Clients**: Allow toggle between Direct Web Bluetooth (`useBrowserBt = true`, default) and Server Bridge (`useBrowserBt = false`).
- **Client-Side Persistence (`localStorage`)**:
  - `nelko_use_browser_bt`: boolean (default `true` on mobile, `false` on desktop).
  - `nelko_print_density`: number (1-5, default 3).
  - `nelko_print_copies`: number (1-99, default 1).
  - `nelko_invert_colors`: boolean (default false).

### 2.2 Backend File Persistence & Volume Mount
- **Persistent JSON Config**: Backend saves/loads driver config (`driver_type`, `tcp_host`, `tcp_port`, `bt_mac`) from `/app/data/config.json`.
- **Volume Mount**: `/containers/productivity/nelkop21webprint/data:/app/data` added to `productivity/docker-compose.yaml`.
- **Compose Defaults**: Default `PRINTER_DRIVER` set to `tcp`, `PRINTER_TCP_HOST` to `10.0.0.205`, `PRINTER_TCP_PORT` to `9100`.

## 3. Architecture & Data Flow

### 3.1 Backend (`app/core/config.py` & `app/api/printer_routes.py`)
- On startup, `Settings` loads environment variables, then checks if `/app/data/config.json` exists. If present, it overrides settings with saved JSON values.
- When `POST /api/printer/config` is called, it updates the in-memory settings and saves the JSON file to `/app/data/config.json`.

### 3.2 Frontend (`hooks/usePrinterBridge.ts`, `components/Header.tsx`, `components/Modals/SettingsModal.tsx`)
- Detect mobile device (`/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)` or touch capability + narrow viewport).
- If Desktop: `isMobile = false`, `useBrowserBt = false`.
- If Mobile: `isMobile = true`, `useBrowserBt` read from `localStorage.getItem('nelko_use_browser_bt')` (defaults to `true`).
- Sync all user setting changes (`density`, `copies`, `invertColors`, `useBrowserBt`) to `localStorage`.

## 4. Testing & Verification
- Unit test for config persistence in backend (`tests/test_config_persistence.py`).
- Frontend build validation (`npm run build` / TypeScript checks).
- Empirical verification of `/api/printer/status`, `/api/printer/config`, and container restart behavior.

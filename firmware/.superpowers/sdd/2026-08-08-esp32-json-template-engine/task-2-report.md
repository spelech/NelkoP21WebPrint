# Task 2 Report: ESP32 NVS Storage & Web Server Template API Endpoints

## Summary of Implementation
- Updated [`web_server.h`](file:///Z:/repos/esp32-LabelPrinter/web_server.h):
  - Declared NVS template helper functions:
    - `String getStoredTemplateJSON()`
    - `bool saveStoredTemplateJSON(const String& json)`
    - `void clearStoredTemplateJSON()`
- Updated [`web_server.cpp`](file:///Z:/repos/esp32-LabelPrinter/web_server.cpp):
  - Included `<Preferences.h>`.
  - Implemented NVS helper functions (`getStoredTemplateJSON`, `saveStoredTemplateJSON`, `clearStoredTemplateJSON`) using ESP32 `Preferences` under namespace `"label-tpl"`, key `"layout"`.
  - Created web server API route handlers:
    - `handleTemplateSaveApi`: handles `POST /api/template/save`, parses JSON body, saves layout to NVS storage, and returns `{"status":"ok"}`.
    - `handleTemplateLoadApi`: handles `GET /api/template/load`, retrieves stored layout string from NVS storage, and returns it (or `{}` if unconfigured) as `application/json`.
    - `handleTemplateResetApi`: handles `POST /api/template/reset`, removes `"layout"` key from `"label-tpl"` NVS namespace, and returns `{"status":"ok"}`.
  - Updated `handlePrintApi` (`POST /api/print`):
    - Fetches saved JSON layout via `getStoredTemplateJSON()`.
    - If layout string exists (`storedJson.length() > 0`), invokes `generateTSPLFromJSON(storedJson, req)`.
    - Otherwise, falls back to legacy static template rendering via `generateTSPLStream(req)`.
    - Sends TSPL byte payload directly to connected Bluetooth printer via `SerialBT.write()`.
  - Registered `/api/template/save`, `/api/template/load`, and `/api/template/reset` in `initWebServer()`.

## Files Modified
- [`web_server.h`](file:///Z:/repos/esp32-LabelPrinter/web_server.h)
- [`web_server.cpp`](file:///Z:/repos/esp32-LabelPrinter/web_server.cpp)

## Verification
- Staged and committed changes (`feat: add template storage endpoints and dynamic template printing`).
- Verified code structure and API endpoint registrations.

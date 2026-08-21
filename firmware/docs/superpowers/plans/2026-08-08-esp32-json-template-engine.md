# ESP32 Dynamic JSON Template Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable ESP32 firmware to load, save, and dynamically render label layout JSON specifications exported from `NelkoP21WebPrint` into TSPL printer binary streams.

**Architecture:** 
1. `tspl_generator.cpp` uses `ArduinoJson` to dynamically parse layout JSON files containing text, barcode, line, rectangle, and QR elements, rendering them onto a 1-bit memory bitmap with 90° clockwise rotation.
2. `web_server.cpp` adds `/api/template/save`, `/api/template/load`, and `/api/template/reset` endpoints using ESP32 NVS `Preferences` storage, and adds a Template Upload UI dropzone.
3. `NelkoP21WebPrint` frontend adds a "Push Layout to ESP32 Bridge" button to post the canvas JSON directly to the ESP32 bridge.

**Tech Stack:** C++ / Arduino ESP32, ArduinoJson, Preferences NVS, React, Vite, Tailwind CSS.

## Global Constraints
- React lint/typecheck rules: `npm run lint` and `npx tsc --noEmit` must pass cleanly in `NelkoP21WebPrint/frontend`.
- ESP32 printhead: Physical width = 14mm (112 dots), logical rotation = 90° clockwise.
- Backward compatibility: Fallback to default legacy layout if no custom template JSON is stored.

---

### Task 1: ESP32 C++ JSON Template Parser & Rasterizer Engine

**Files:**
- Modify: `Z:/repos/esp32-LabelPrinter/tspl_generator.h:1-27`
- Modify: `Z:/repos/esp32-LabelPrinter/tspl_generator.cpp:216-330`

**Interfaces:**
- Consumes: JSON string exported from `NelkoP21WebPrint` and optional `SimpleLabelRequest` dynamic values.
- Produces: `generateTSPLFromJSON(const String& jsonStr, const SimpleLabelRequest& req)` returning TSPL binary String stream.

- [ ] **Step 1: Update `tspl_generator.h` declaration**

```cpp
#ifndef TSPL_GENERATOR_H
#define TSPL_GENERATOR_H

#include <Arduino.h>
#include <ArduinoJson.h>

struct SimpleLabelRequest {
    float widthMm = 40.0;
    float heightMm = 14.0;
    float gapMm = 2.0;
    int density = 3;
    int copies = 1;
    String mainText = "";
    String subtitle = "";
    String barcodeData = "";
    String qrData = "";
    int borderThickness = 0;
    int xOffset = 0;
    int yOffset = 0;
    int fontScaleMain = 2;
    int fontScaleSub = 1;
    int barcodeHeight = 24;
};

String generateTSPLStream(const SimpleLabelRequest& req);
String generateTSPLFromJSON(const String& jsonStr, const SimpleLabelRequest& req);

#endif
```

- [ ] **Step 2: Implement `generateTSPLFromJSON` in `tspl_generator.cpp`**

Implement `generateTSPLFromJSON` to parse `preset.width`, `preset.height`, `preset.gap`, and loop over `elements`:
- For `type == "text"`: Map percentage `x`, `y` to dots, calculate font scale from `fontSize` (<=16 -> 1x, <=28 -> 2x, >28 -> 3x), replace dynamic placeholders `{{mainText}}` or `{{subtitle}}` with `req` data or use static text.
- For `type == "barcode"`: Calculate module width and barcode height, render Code128 pattern at percentage `x`, `y`.
- For `type == "line"`: Draw horizontal or vertical line rectangle at `x`, `y`.
- For `type == "rectangle"`: Draw border outline box at `x`, `y`.
- Perform 90° clockwise memory rotation to 14mm physical printhead layout, construct TSPL header and binary bitmap output.

- [ ] **Step 3: Commit C++ JSON Generator Engine**

```bash
git add tspl_generator.h tspl_generator.cpp
git commit -m "feat: implement C++ JSON label layout template parser and rasterizer"
```

---

### Task 2: ESP32 NVS Storage & Web Server Template API Endpoints

**Files:**
- Modify: `Z:/repos/esp32-LabelPrinter/web_server.h:1-20`
- Modify: `Z:/repos/esp32-LabelPrinter/web_server.cpp:300-546`

**Interfaces:**
- Consumes: `generateTSPLFromJSON` from Task 1, `Preferences` library.
- Produces: API endpoints `/api/template/save`, `/api/template/load`, `/api/template/reset`, updated `/api/print`.

- [ ] **Step 1: Add NVS helper functions in `web_server.cpp`**

```cpp
String getStoredTemplateJSON() {
    Preferences prefs;
    prefs.begin("label-tpl", true);
    String json = prefs.getString("layout", "");
    prefs.end();
    return json;
}

bool saveStoredTemplateJSON(const String& json) {
    Preferences prefs;
    prefs.begin("label-tpl", false);
    size_t written = prefs.putString("layout", json);
    prefs.end();
    return written > 0;
}

void clearStoredTemplateJSON() {
    Preferences prefs;
    prefs.begin("label-tpl", false);
    prefs.remove("layout");
    prefs.end();
}
```

- [ ] **Step 2: Register Web Server Endpoints in `initWebServer()`**

- Add `POST /api/template/save`: reads JSON body, calls `saveStoredTemplateJSON`, returns `{"status":"ok"}`.
- Add `GET /api/template/load`: returns stored JSON string or `{}`.
- Add `POST /api/template/reset`: calls `clearStoredTemplateJSON`, returns `{"status":"ok"}`.
- Modify `POST /api/print`: check `getStoredTemplateJSON()`; if valid, render print using `generateTSPLFromJSON(storedJson, req)`, else fallback to `generateTSPLStream(req)`.

- [ ] **Step 3: Commit Web Server API Endpoints**

```bash
git add web_server.h web_server.cpp
git commit -m "feat: add template storage endpoints and dynamic template printing"
```

---

### Task 3: Embedded Web UI Template Management Dropzone

**Files:**
- Modify: `Z:/repos/esp32-LabelPrinter/web_server.cpp:140-240`

- [ ] **Step 1: Add Template Management Card in `APP_HTML`**

Add HTML & JavaScript section to `APP_HTML` under Standalone Designer tab:
- File input for uploading `.json` files.
- Buttons for "Upload JSON Template", "Download Active Template", and "Reset Layout to Default".
- Fetch `/api/template/load` on page load to populate layout status indicator.

- [ ] **Step 2: Commit Embedded UI Changes**

```bash
git add web_server.cpp
git commit -m "feat: add template management UI dropzone to ESP32 web portal"
```

---

### Task 4: NelkoP21WebPrint "Push Layout to ESP32" Feature

**Files:**
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/LayoutPresets.jsx:1-100`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/App.jsx:1500-1535`

**Interfaces:**
- Consumes: ESP32 `/api/template/save` endpoint.
- Produces: UI button to post canvas layout JSON to ESP32.

- [ ] **Step 1: Add Push to ESP32 Button in `LayoutPresets.jsx`**

Add "Push to ESP32 Bridge" button alongside Export/Import JSON layout buttons. Prompt for ESP32 IP address (default `192.168.4.1` or `nelko-bridge.local`), then send `POST http://<ip>/api/template/save` with current `JSON.stringify({ preset: selectedPreset, elements })`.

- [ ] **Step 2: Run Linting and Typechecking**

Run: `npm run lint` and `npx tsc --noEmit` inside `Z:/repos/NelkoP21WebPrint/frontend`.
Expected: 0 errors.

- [ ] **Step 3: Commit NelkoP21WebPrint Frontend Changes**

```bash
git add frontend/src/components/LayoutPresets.jsx frontend/src/App.jsx
git commit -m "feat: add Push Layout to ESP32 Bridge feature to Web Print App"
```

---

## Verification Plan

### Automated Verification
- Run `npm run lint` in `Z:/repos/NelkoP21WebPrint/frontend`
- Run `npx tsc --noEmit` in `Z:/repos/NelkoP21WebPrint/frontend`

### Manual Verification
1. Export JSON layout from `NelkoP21WebPrint`.
2. Upload JSON to ESP32 web interface or push using the new "Push to ESP32 Bridge" button.
3. Verify `/api/template/load` returns saved template.
4. Issue `/api/print` request and verify generated TSPL stream accurately positions all text, barcodes, lines, and rectangles.

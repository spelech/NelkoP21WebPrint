# Task 3 Implementation Report: Embedded Web UI Template Management Dropzone

## Overview
Added the "Custom JSON Template Management" card to the Standalone Designer tab (`#tab-designer`) in `web_server.cpp` within `APP_HTML`, including dynamic template status indicators and file management helper functions.

## Implementation Details
1. **HTML Elements in `#tab-designer`:**
   - Card title: `Custom JSON Template Management`
   - Status badge: `#tpl-status-badge` showing "Custom JSON Template" vs "Default Built-in Layout".
   - File input: `<input type="file" id="tpl-file-input" accept=".json" style="display:none;" onchange="uploadSelectedTemplate(event)">`
   - Upload button: `<button class="btn-secondary" onclick="document.getElementById('tpl-file-input').click()">Upload Nelko JSON Template File</button>`
   - Export button: `<button class="btn-secondary" onclick="downloadActiveTemplate()">Export Active ESP32 Template</button>`
   - Reset button: `<button class="btn-secondary" style="border-color:#ef444466; color:#ef4444;" onclick="resetTemplate()">Reset to Default Layout</button>`

2. **JavaScript Helper Functions (`<script>` in `APP_HTML`):**
   - `checkTemplateStatus()`: Fetches `GET /api/template/load`, parses JSON response, and updates `#tpl-status-badge` text and styling depending on whether custom JSON is present.
   - `uploadSelectedTemplate(event)`: Uses `FileReader` to read selected `.json` file content, sends `POST /api/template/save`, notifies user via `showToast()`, and updates template status badge.
   - `downloadActiveTemplate()`: Fetches active template from `/api/template/load`, creates downloadable blob link for `esp32-label-template.json`.
   - `resetTemplate()`: Prompts for user confirmation, issues `POST /api/template/reset`, notifies user, and updates badge status back to "Default Built-in Layout".
   - Auto-executes `checkTemplateStatus()` on page load and `DOMContentLoaded`.

## Verification
- Verified HTML structure and element IDs match specifications.
- Verified JavaScript helper functions integrate with `/api/template/load`, `/api/template/save`, and `/api/template/reset`.

# 08 - Home Assistant Integration Guide

> **Integration Reference** for configuring Home Assistant `rest_command` integrations to print thermal labels directly via the Nelko P21 WebPrint REST API.

---

## 📌 Overview

The **Nelko P21 WebPrint** backend exposes high-performance REST API endpoints for printing thermal labels over HTTP. This enables Home Assistant to trigger physical thermal label printing from automations, dashboards, NFC scans, or scripts.

### Supported Integration Endpoints

| Endpoint | Method | Purpose | Typical Use Case |
| :--- | :--- | :--- | :--- |
| `/api/print/text` | `POST` | Direct plain text label printing | Quick notification tags, sensor readings, grocery items |
| `/api/print/template` | `POST` | JSON template label printing with variable substitution | Asset tags, storage box labels, cable flag wraps |
| `/api/print/batch` | `POST` | Sequential batch printing from a template | Printing multiple asset labels or inventory items in one job |

---

## ⚙️ Base Configuration in Home Assistant (`configuration.yaml`)

Add `rest_command:` definitions to your Home Assistant `configuration.yaml` file (or a separate `rest_commands.yaml` file).

Replace `10.0.0.10:8026` with your Nelko P21 WebPrint host IP and port (or internal Docker container network hostname e.g. `http://nelkop21webprint:8000`).

```yaml
# Home Assistant configuration.yaml

rest_command:
  # -------------------------------------------------------------------
  # 1. Direct Plain Text Printing
  # -------------------------------------------------------------------
  nelko_print_text:
    url: "http://10.0.0.10:8026/api/print/text"
    method: post
    headers:
      Content-Type: "application/json"
    payload: >-
      {
        "text": "{{ text }}",
        "font_family": "{{ font_family | default('sans-serif') }}",
        "font_size": {{ font_size | default(0) }},
        "bold": {{ bold | default(false) | tojson }},
        "align": "{{ align | default('center') }}",
        "width_mm": {{ width_mm | default(40.0) }},
        "height_mm": {{ height_mm | default(14.0) }},
        "gap_mm": {{ gap_mm | default(5.0) }},
        "copies": {{ copies | default(1) }},
        "density": {{ density | default(3) }},
        "dither_method": "{{ dither_method | default('threshold') }}"
      }

  # -------------------------------------------------------------------
  # 2. Template-Based Label Printing
  # -------------------------------------------------------------------
  nelko_print_template:
    url: "http://10.0.0.10:8026/api/print/template"
    method: post
    headers:
      Content-Type: "application/json"
    payload: >-
      {
        "template_id": "{{ template_id }}",
        "variables": {{ variables | default({}) | tojson }},
        "copies": {{ copies | default(1) }},
        "density": {{ density | default(3) }},
        "dither_method": "{{ dither_method | default('threshold') }}"
      }
```

---

## 📄 Payload Parameters Reference

### 1. Direct Text Endpoint (`/api/print/text`)

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `text` | string | **(Required)** | The text string to render on the label. Supports multi-line text (`\n`). |
| `font_family` | string | `"sans-serif"` | Font family: `"sans-serif"` or `"monospace"`. |
| `font_size` | integer | `null` | Font size in points/dots. If omitted or `0`, automatically scaled to fit label height. |
| `bold` | boolean | `false` | Set to `true` to render text in bold weight. |
| `align` | string | `"center"` | Horizontal text alignment: `"left"`, `"center"`, or `"right"`. |
| `width_mm` | float | `40.0` | Physical label width in millimeters. |
| `height_mm` | float | `14.0` | Physical label height in millimeters. |
| `gap_mm` | float | `5.0` | Gap between label stickers in millimeters. |
| `copies` | integer | `1` | Number of identical label copies to print. |
| `density` | integer | `3` | Print head darkness level (1 to 5). |
| `dither_method` | string | `"threshold"` | Dithering mode: `"threshold"`, `"floyd-steinberg"`, or `"bayer16"`. |

### 2. Template Endpoint (`/api/print/template`)

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `template_id` | string | **(Required)** | ID of the template stored in `backend/app/data/templates/` (e.g. `"asset_tag"`, `"box_label"`, `"cable_flag"`). |
| `variables` | object | `{}` | Key-value pairs for string substitution matching `{{variable_name}}` elements in template. |
| `copies` | integer | `1` | Number of copies to print. |
| `density` | integer | `3` | Print darkness level (1-5). |
| `dither_method` | string | `"threshold"` | Dithering mode (`"threshold"`, `"floyd-steinberg"`, `"bayer16"`). |

---

## 🤖 Home Assistant Automation & Script Examples

### Example A: Call Service / Action for Direct Text Printing

In Home Assistant Developer Tools -> Services (or in automations/scripts):

```yaml
service: rest_command.nelko_print_text
data:
  text: "STORAGE BOX #42"
  font_family: "monospace"
  bold: true
  align: "center"
  width_mm: 40.0
  height_mm: 14.0
  copies: 1
```

### Example B: Call Service / Action for Template Label Printing

Print a pre-designed asset tag template:

```yaml
service: rest_command.nelko_print_template
data:
  template_id: "asset_tag"
  variables:
    name: "3D PRINTER MAIN"
    url: "https://octoprint.local"
  copies: 2
```

### Example C: Home Assistant Automation (NFC Tag Scan Trigger)

Automatically print a label whenever an NFC tag is scanned:

```yaml
alias: "NFC Tag: Print Inventory Label"
trigger:
  - platform: event
    event_type: tag_scanned
    event_data:
      tag_id: "3a82f1b4-2900-4b2e"
action:
  - service: rest_command.nelko_print_template
    data:
      template_id: "box_label"
      variables:
        title: "GARAGE TOOLBOX"
        subtitle: "{{ now().strftime('%Y-%m-%d %H:%M') }}"
      copies: 1
```

---

## 🧪 Testing & Validation via cURL

You can test both REST endpoints from the command line before configuring Home Assistant:

### Test Direct Text Endpoint

```bash
curl -X POST "http://10.0.0.10:8026/api/print/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "HA TEST PRINT",
    "font_family": "monospace",
    "bold": true,
    "align": "center",
    "width_mm": 40.0,
    "height_mm": 14.0,
    "copies": 1
  }'
```

### Test Template Endpoint

```bash
curl -X POST "http://10.0.0.10:8026/api/print/template" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "asset_tag",
    "variables": {
      "name": "TEST DEVICE",
      "url": "https://wileyriley.com"
    },
    "copies": 1
  }'
```

---

## 🛠 Troubleshooting

1. **HTTP 500 Transmission Error**:
   Ensure the printer Bluetooth / TCP connection is established and the server driver configuration is correctly pointed to your physical printer MAC address or IP bridge.

2. **Template Not Found (HTTP 404)**:
   Verify the `template_id` matches a valid `.json` file in `backend/app/data/templates/` (without the `.json` extension).

3. **Malformed JSON Payload**:
   In Home Assistant Jinja2 templates, always pipe booleans through `| tojson` (`{{ bold | default(false) | tojson }}`) to output valid JSON `true`/`false` rather than Python `True`/`False`.

# Nelko P21 Web Print Suite

An open-source, containerized application suite for the **Nelko P21** thermal label printer (and compatible TSPL printers). Includes a **React Visual Label Designer**, **FastAPI REST API**, **FastMCP AI Server**, and multi-backend printer connection drivers.

---

## ✨ Features

* **🎨 React Visual Label Designer**: Design labels in browser with presets ($14 \times 40\text{mm}$, $12 \times 30\text{mm}$, $12 \times 40\text{mm}$, etc.), text, barcodes, QR codes, and 1-bit thermal print previews.
* **🚀 FastAPI REST API**: Programmatically format and print labels from external scripts, webhooks, or automation workflows.
* **🤖 FastMCP AI Tools**: Native Model Context Protocol server enabling AI assistants (Claude, Antigravity, LLMs) to print labels via simple natural language tool calls.
* **🔌 Flexible Connection Drivers**:
  * **Direct Bluetooth SPP**: Direct RFCOMM socket connection over host Bluetooth stack (`PyBluez` / Linux `/dev/rfcomm0`).
  * **TCP / Network Bridge**: Connect to ESP32 bridges (e.g. `agiledivider/LabelPrinter-esp`) or ESPHome BT proxies over TCP socket.
* **🐳 Dockerized**: Single command deployment via Docker or Docker Compose.
* **📚 Reverse Engineering Source of Truth**: Includes complete protocol, TSPL specifications, and raster math docs in [`docs/`](./docs).

---

## 🚀 Quick Start with Docker

```bash
# Clone the repository
git clone git@github.com:spelech/NelkoP21WebPrint.git
cd NelkoP21WebPrint

# Start using Docker Compose
docker-compose up -d --build
```

Access the suite in your browser at **`http://localhost:8000`**.

---

## 📡 REST API Overview

Interactive Swagger documentation is available at **`http://localhost:8000/docs`**.

### Key Endpoints

#### 1. Print Text & Barcode Label
`POST /api/print`
```json
{
  "text": "ASSET-9921",
  "subtitle": "Server Rack B",
  "barcode": "ASSET-9921",
  "width_mm": 14,
  "height_mm": 40,
  "gap_mm": 5,
  "density": 3,
  "copies": 1
}
```

#### 2. Get Live 1-Bit Thermal Preview
`POST /api/preview`  
Returns a dithered 1-bit monochrome PNG image simulating the exact thermal printhead output.

#### 3. Update Printer Driver Settings
`POST /api/printer/config`
```json
{
  "driver_type": "tcp",
  "tcp_host": "192.168.1.50",
  "tcp_port": 9100
}
```

---

## 🤖 MCP (Model Context Protocol) Server for AI

The suite includes an embedded FastMCP server (`backend/app/mcp/server.py`).

### Exposed AI Tools:
1. `print_simple_label(text, subtitle, barcode, width_mm, height_mm, copies)`
2. `get_printer_status()`
3. `list_label_presets()`

To connect FastMCP to Claude Desktop or Antigravity CLI:
```json
{
  "mcpServers": {
    "nelko-printer": {
      "command": "docker",
      "args": ["exec", "-i", "nelko-p21-print", "python", "-m", "app.mcp.server"]
    }
  }
}
```

---

## 📂 Project Structure

```text
NelkoP21WebPrint/
├── docs/                       # Exhaustive reverse-engineering documentation
│   ├── README.md
│   ├── 01_HARDWARE_AND_BLUETOOTH.md
│   ├── 02_TSPL_PROTOCOL_SPEC.md
│   ├── 03_RASTERIZATION_AND_IMAGE_PROCESSING.md
│   ├── 04_DEVICE_MATRIX_AND_CONFIG.md
│   └── 05_PAPER_PRESETS_AND_RFID.md
├── backend/                    # Python FastAPI & FastMCP Server
│   ├── app/
│   │   ├── api/                # REST endpoints
│   │   ├── core/               # TSPL builder & 1-bit rasterizer
│   │   ├── drivers/            # Bluetooth SPP & TCP Network drivers
│   │   └── mcp/                # FastMCP AI tools
│   └── requirements.txt
├── frontend/                   # React Visual Label Studio
│   ├── src/
│   │   ├── App.jsx             # Label Editor UI
│   │   └── main.jsx
│   └── vite.config.js
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Docker service definition
└── README.md
```

---

## 📜 License & Credits

* Reverse-engineered from the Nelko Android Application.
* Open-source project built for the home lab, maker, and AI automation community.

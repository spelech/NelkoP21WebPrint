# 07. System Architecture & Component Design

This document details the high-level system architecture, data flow, component hierarchy, driver abstractions, and integration boundaries of **NelkoP21WebPrint**.

---

## 🏗 High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        Mobile["📱 Mobile / Tablet Browser (Direct Web BT / Serial)"]
        Desktop["💻 Desktop Browser (React Web Designer)"]
        AI["🤖 AI Assistant / LLM (FastMCP Client)"]
        API_Client["⚡ Third-Party Script / Webhook (REST API)"]
    end

    subgraph System ["NelkoP21WebPrint Container / Suite"]
        subgraph Frontend ["React 18 Visual Studio (Vite)"]
            Canvas["Canvas Editor (203 DPI)"]
            JS_Rasterizer["Client TSPL Generator (JS)"]
            Browser_BT["Web Serial / Web Bluetooth Driver"]
        end

        subgraph Backend ["Python 3.11 FastAPI Backend"]
            REST["FastAPI REST Endpoints (/api/print, /api/preview)"]
            MCP["FastMCP Tool Server"]
            Py_Rasterizer["Pillow 1-Bit Rasterizer & Dither Engine"]
            TSPL_Gen["Python TSPL Stream Builder"]
            Driver_Pool["Printer Driver Pool Manager"]
        end

        subgraph Drivers ["Driver Abstraction Layer"]
            SPP_Driver["Direct Bluetooth SPP Driver (RFCOMM)"]
            TCP_Driver["TCP Network Bridge Driver (Socket :9100)"]
            Mock_Driver["Mock Testing Driver"]
        end
    end

    subgraph Hardware ["Printer Target Layer"]
        ESP32["🔌 ESP32 SPP-to-WiFi Bridge Node(s)"]
        Printer["🖨 Nelko P21 Thermal Printer (203 DPI TSPL)"]
    end

    Mobile -- "Direct Local BT" --> Printer
    Desktop -- "HTTP / WebSocket" --> REST
    AI -- "Stdio / SSE" --> MCP
    API_Client -- "JSON Payload" --> REST

    REST --> Py_Rasterizer
    MCP --> Py_Rasterizer
    Py_Rasterizer --> TSPL_Gen
    TSPL_Gen --> Driver_Pool

    Driver_Pool --> SPP_Driver
    Driver_Pool --> TCP_Driver
    
    SPP_Driver -- "Bluetooth SPP (244B Chunks)" --> Printer
    TCP_Driver -- "Wi-Fi TCP (9100)" --> ESP32
    ESP32 -- "Bluetooth SPP (RFCOMM)" --> Printer
```

---

## 🧩 Component Specifications

### 1. Frontend Layer (`frontend/src/`)
- **React 18 + Vite**: Fast SPA serving the visual studio.
- **`App.jsx`**: Layout orchestration, preset selection, element state management, modal controllers.
- **`utils/tsplGenerator.js`**: Pure JavaScript implementation of 203 DPI canvas rasterization, 1-bit MSB byte packing, and TSPL framing.
- **`utils/webBluetoothDriver.js`**: Manages Web Serial (`navigator.serial`) and Web Bluetooth (`navigator.bluetooth`) connections, handling 244-byte chunk streaming directly out of the client browser.

### 2. Backend API Layer (`backend/app/`)
- **FastAPI Core (`main.py`)**: Asynchronous REST framework serving API routes and mounting compiled static frontend assets.
- **`core/rasterizer.py`**: Converts PIL Image objects into 1-bit monochrome byte arrays supporting Floyd-Steinberg error diffusion and $16 \times 16$ Bayer matrix ordered dithering.
- **`core/tspl_builder.py`**: Generates exact ASCII + binary TSPL streams (`SIZE`, `GAP`, `SPEED`, `DENSITY`, `DIRECTION`, `CLS`, `BITMAP`, `PRINT`).

### 3. FastMCP AI Tools (`backend/app/mcp/server.py`)
Provides native Model Context Protocol tools for AI agents (Claude Desktop, Antigravity, LLM agents):
- `print_simple_label`: Renders and prints text + barcode/QR labels.
- `get_printer_status`: Checks connection state and driver configuration.
- `list_label_presets`: Returns available label physical dimensions.

### 4. Connection Drivers (`backend/app/drivers/`)
- **`spp_driver.py`**: Communicates directly over Linux `AF_BLUETOOTH` / PyBluez sockets to RFCOMM Channel 1 (`00001101-0000-1000-8000-00805F9B34FB`).
- **`tcp_driver.py`**: Connects to raw TCP sockets (port 9100) for ESP32 bridges or ESPHome proxy nodes.
- **`base_driver.py`**: Abstract base class enforcing `connect()`, `disconnect()`, `send_bytes()`, and `get_status()`.

---

## 🖼 UI Mockups & Architecture Visuals

### 1. Visual Designer Studio
![Web Designer Studio](./images/web_designer_studio.jpg)

### 2. 1-Bit Thermal Print Preview Modal
![Thermal Preview Modal](./images/thermal_preview_modal.jpg)

### 3. Connection Settings Modal
![Connection Settings Modal](./images/connection_settings_modal.jpg)

# ESP32 Nelko P21 Wireless Label Server & Print Bridge `v1.0.0`

[![Build Status](https://github.com/spelech/esp32-LabelPrinter/actions/workflows/build.yml/badge.svg)](https://github.com/spelech/esp32-LabelPrinter/actions/workflows/build.yml)
![Target](https://img.shields.io/badge/Hardware-ESP32--WROOM--32-indigo)
![Bluetooth](https://img.shields.io/badge/Bluetooth-Classic_SPP_RFCOMM-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-emerald)

An autonomous, zero-server wireless print bridge and embedded label designer hosted on an **ESP32-WROOM-32** board. It relays TSPL printing streams over **Bluetooth Classic (SPP/RFCOMM)** to a **Nelko P21** thermal label printer.

---

## Architecture & System Overview

```mermaid
graph TD
    classDef client fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef esp32 fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc;
    classDef hardware fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#38bdf8;

    ClientMobile["Mobile / Tablet Browser"]:::client
    ClientServer["Home Server / Home Assistant"]:::client

    subgraph ESP32["ESP32 Microcontroller (nelko-bridge.local)"]
        WifiMgr["Wi-Fi Manager & Captive Portal<br/>(SoftAP / NVS Preferences)"]:::esp32
        Auth["24h Session PIN Auth<br/>(Cookie: nelko_session)"]:::esp32
        WebUI["Embedded Label Designer UI<br/>(Port 80 PROGMEM)"]:::esp32
        TSPLEngine["Native TSPL Generator<br/>(Text, Barcode, QR, Box)"]:::esp32
        TCPRelay["TCP Port 9100 Listener"]:::esp32
        SSELog["Live Log Server<br/>(Port 8080 SSE)"]:::esp32
    end

    Printer["Nelko P21 Thermal Printer"]:::hardware

    ClientMobile -->|"HTTP / Captive Portal"| WifiMgr
    ClientMobile -->|"PIN Authenticate"| Auth
    Auth -->|"Load UI"| WebUI
    WebUI -->|"POST /api/print"| TSPLEngine
    ClientServer -->|"Raw TSPL Stream"| TCPRelay

    TSPLEngine -->|"RFCOMM SPP"| Printer
    TCPRelay -->|"RFCOMM SPP"| Printer
    WebUI -->|"Read Debug Logs"| SSELog
```

---

## Key Features

1. **Standalone Embedded Label Designer:** Host a complete HTML5/JS label creator directly inside the ESP32's flash memory. Design labels with text, barcodes, QR codes, and custom borders with **zero internet or home server required**.
2. **Strict Captive Portal & Hotspot (`Nelko-Bridge-AP`):** Automatically creates a Wi-Fi hotspot (`192.168.4.1`) if home Wi-Fi is unavailable or unconfigured. A built-in DNS server captures all domain requests (`* -> 192.168.4.1`) to pop open the portal immediately on iOS and Android devices.
3. **24-Hour PIN Session Authentication:** Security-enabled portal access requiring a PIN passcode (default `1234`). Upon authentication, an HTTP cookie (`nelko_session`) is issued, valid for **24 hours**.
4. **On-Device Native TSPL Generator:** Converts simple JSON label parameters directly into 1-bit monochrome TSPL byte streams natively on the ESP32 CPU.
5. **Multi-Client TCP Relay (Port 9100):** Acts as a standard JetDirect print server on TCP Port `9100`, allowing Home Assistant, cURL, or server stacks to stream raw TSPL print jobs over Wi-Fi.
6. **Live SSE Log Console (Port 8080):** Streams real-time diagnostic output directly to web browsers using Server-Sent Events (SSE).

---

## Connection & Captive Portal Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Mobile Phone / Tablet
    participant DNS as DNSServer (Port 53)
    participant Web as WebServer (Port 80)
    participant Auth as Session Manager
    participant BT as Bluetooth Serial (SPP)
    participant Printer as Nelko P21

    User->>DNS: Connect to 'Nelko-Bridge-AP' (DNS Request *)
    DNS-->>User: Resolve to 192.168.4.1 (Captive Portal)
    User->>Web: GET / (Check Cookie)
    Web-->>User: 302 Redirect to /login
    User->>Web: POST /api/auth/login (PIN: 1234)
    Web->>Auth: Validate PIN & Generate Token
    Auth-->>User: 200 OK + Set-Cookie: nelko_session=<token>
    User->>Web: GET / (With Session Cookie)
    Web-->>User: 200 OK (Render Standalone Label Designer)
    User->>Web: POST /api/print (JSON Layout)
    Web->>BT: Generate TSPL & Write Bytes
    BT->>Printer: Stream RFCOMM SPP Packets
    Printer-->>User: Thermal Print Executed
```

---

## TSPL Data Flow Chart

```mermaid
flowchart LR
    A["JSON Label Request<br/>{main_text, barcode_data}"] --> B{"Source"}
    B -->|"HTTP POST /api/print"| C["tspl_generator.cpp"]
    B -->|"TCP Port 9100"| D["Raw Buffer Forwarder"]
    C -->|"Construct TSPL Commands"| E["SerialBT.write()"]
    D -->|"Stream Bytes Directly"| E
    E -->|"Bluetooth SPP RFCOMM"| F["Nelko P21 Printer"]
```

---

## Status LED Indicator Reference

| LED Pattern | System State | Description |
| :--- | :--- | :--- |
| **Fast Flash (100ms)** | SoftAP Hotspot Active | Device is broadcasting `Nelko-Bridge-AP`. Connect phone to configure Wi-Fi. |
| **Slow Flash (500ms)** | Wi-Fi Station Active | Connected to home Wi-Fi; searching/pairing Bluetooth printer. |
| **Solid ON** | System Fully Ready | Wi-Fi (or SoftAP) AND Bluetooth printer are connected & operational. |

---

## Configuration & Credentials

Sensitivity parameters (SSID, Wi-Fi password, Bluetooth MAC address, default PIN) can be configured by creating a private `config_local.h` file (ignored by Git) in the project directory:

```cpp
#ifndef CONFIG_LOCAL_H
#define CONFIG_LOCAL_H

// Local Private Credentials Override
#define WIFI_SSID "YourHomeWiFi"
#define WIFI_PASS "YourWiFiPassword"
#define PRINTER_MAC {0x00, 0x11, 0x22, 0x33, 0x44, 0x55} // Nelko P21 Bluetooth MAC
#define DEFAULT_PORTAL_PIN "1234"

#endif
```

---

## REST API Reference

### 1. Authenticate Session
- **Endpoint:** `POST /api/auth/login`
- **Body (`application/x-www-form-urlencoded`):** `pin=1234`
- **Response:** `200 OK` + `Set-Cookie: nelko_session=<token>; Max-Age=86400; Path=/`

### 2. Scan Local Wi-Fi Networks
- **Endpoint:** `GET /api/wifi/scan`
- **Headers:** `Cookie: nelko_session=<token>`
- **Response:** `[{"ssid":"HomeWiFi","rssi":-62,"encryption":"WPA2"}]`

### 3. Save Wi-Fi Credentials
- **Endpoint:** `POST /api/wifi/save`
- **Body:** `ssid=HomeWiFi&pass=SecretPass`
- **Response:** Saves parameters to NVS memory and reboots device.

### 4. Direct HTTP Print
- **Endpoint:** `POST /api/print`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "width_mm": 14.0,
    "height_mm": 40.0,
    "main_text": "PRICE: $4.99",
    "subtitle": "ITEM #1042",
    "barcode_data": "1042598",
    "border_thickness": 2
  }
  ```
- **Response:** `{"status":"success"}`

---

## Compiling & Flashing

### Option A: Using GitHub Actions (Precompiled Binary)
1. Every commit to `main` / `master` triggers the [Build Workflow](.github/workflows/build.yml).
2. Download the compiled firmware `.bin` artifact from GitHub Actions.
3. Flash directly using [ESP Web Tools](https://web.esphome.io/) or `esptool.py`.

### Option B: Using Arduino IDE
1. Install **Arduino IDE 2.0+**.
2. Go to *Tools -> Board -> Board Manager* and install **esp32** by Espressif Systems.
3. Select **ESP32 Dev Module** as board target.
4. Select *Tools -> Partition Scheme -> Huge APP (3MB No OTA / 1MB SPIFFS)* (required to fit Bluetooth Classic + Wi-Fi + WebServer).
5. Open `esp32-LabelPrinter.ino` and click **Upload**.

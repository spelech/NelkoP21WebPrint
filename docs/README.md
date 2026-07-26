# Nelko P21 Printer Reverse Engineering & Technical Specification

> **Source of Truth** for custom software, web apps, REST APIs, and MCP servers interacting with Nelko P21 thermal printers.
> Extracted from decompiled Nelko Android application (`com.nelko.printer`).

---

## 📌 Executive Summary

The **Nelko P21** is a portable 203 DPI monochrome thermal label printer. While the official mobile app requires cloud communication and presents a clunky interface, the physical printer communicates locally over standard **Bluetooth Classic SPP (Serial Port Profile / RFCOMM)** and uses the industry-standard **TSPL / TSPL2** command dialect for page setup and bitmap rendering.

### Key Hardware & Protocol Highlights

| Feature | Specification |
| :--- | :--- |
| **Connection Type** | Bluetooth Classic SPP (RFCOMM) |
| **Service UUID** | `00001101-0000-1000-8000-00805F9B34FB` (Standard Serial Port) |
| **RFCOMM Channel** | Channel 1 |
| **Command Dialect** | TSPL / TSPL2 (`command: 0` in device registry) |
| **Print Resolution** | 203 DPI ($8\text{ dots/mm}$) |
| **Max Print Width** | $12\text{ mm}$–$14\text{ mm}$ ($96$–$112$ printable dots horizontally) |
| **Label Length Range** | $10\text{ mm}$ to $75\text{ mm}$ continuous or die-cut gap labels |
| **Default Preset** | $14\text{ mm} \times 40\text{ mm}$ label with $5\text{ mm}$ gap |
| **Data Compression** | Disabled (`isCompression: 0`), raw 1-bit monochrome raster data |
| **Payload Chunking** | Max chunk size $244$–$247$ bytes per RFCOMM packet |
| **Printer Feedback** | `0xAA` (-86 signed) ACK on packet reception; ASCII/Hex status responses |

---

## 🗂 Documentation Sitemap

1. [01_HARDWARE_AND_BLUETOOTH.md](file:///C:/Users/Alias/Downloads/nelko.apk_Decompiler.com/reverse_engineering/01_HARDWARE_AND_BLUETOOTH.md)  
   *Bluetooth RFCOMM socket connection, UUIDs, socket configuration, MTU/chunking logic, status polling, and ACK parsing.*

2. [02_TSPL_PROTOCOL_SPEC.md](file:///C:/Users/Alias/Downloads/nelko.apk_Decompiler.com/reverse_engineering/02_TSPL_PROTOCOL_SPEC.md)  
   *Full specification of TSPL/TSPL2 commands used by Nelko P21 (`SIZE`, `GAP`, `SPEED`, `DENSITY`, `DIRECTION`, `CLS`, `BITMAP`, `PRINT`, `SOUND`, `~TS`, etc.).*

3. [03_RASTERIZATION_AND_IMAGE_PROCESSING.md](file:///C:/Users/Alias/Downloads/nelko.apk_Decompiler.com/reverse_engineering/03_RASTERIZATION_AND_IMAGE_PROCESSING.md)  
   *Algorithms for converting graphics to 203 DPI 1-bit monochrome data, bit-packing, bit-inversion rules, row-stride padding, and dithering algorithms.*

4. [04_DEVICE_MATRIX_AND_CONFIG.md](file:///C:/Users/Alias/Downloads/nelko.apk_Decompiler.com/reverse_engineering/04_DEVICE_MATRIX_AND_CONFIG.md)  
   *Comparative matrix of 28 Nelko printer models extracted from internal app configurations (`cloud_config_nelko.json`).*

5. [05_PAPER_PRESETS_AND_RFID.md](file:///C:/Users/Alias/Downloads/nelko.apk_Decompiler.com/reverse_engineering/05_PAPER_PRESETS_AND_RFID.md)  
   *Paper types (Gap, Continuous, Black Mark), preset label sizes, paper code format, RFID tag serial translation, and margin offsets.*

---

## ⚙ Quick Start Code Flow

```text
[ Client Application / Web App / API ]
                 │
                 ▼
[ 1. Render Graphic (Canvas / HTML / PIL) @ 203 DPI ]
                 │
                 ▼
[ 2. Convert to 1-Bit Inverted Monochrome Array (1 = Black, 0 = White) ]
                 │
                 ▼
[ 3. Construct TSPL Payload String + Binary BITMAP Command ]
       - SIZE 14 mm, 40 mm
       - GAP 5 mm, 0 mm
       - CLS
       - BITMAP 0,0,12,320,0,<bytes>
       - PRINT 1,1
                 │
                 ▼
[ 4. Chunk Stream into 244-Byte Payloads & Send via SPP RFCOMM Socket ]
                 │
                 ▼
[ Nelko P21 Thermal Printer (Prints Label) ]
```

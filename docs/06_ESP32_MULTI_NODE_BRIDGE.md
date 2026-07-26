# 06. ESP32 Multi-Node Bridge Architecture & Implementation Guide

This guide details how to set up a multi-floor, multi-node ESP32 Bluetooth Classic (SPP) to Wi-Fi bridge network for the **Nelko P21** thermal printer.

---

## 📌 Hardware Compatibility & Microcontroller Selection

> ⚠️ **CRITICAL HARDWARE SELECTION**:
> - **Standard ESP32 (ESP32-D0WDQ6 / ESP-WROOM-32)**: **REQUIRED** ✅  
>   Contains Dual-Mode Bluetooth (Bluetooth Classic BR/EDR SPP + BLE).
> - **ESP32-S2 / ESP32-S3**: ❌ **NO BLUETOOTH CLASSIC** (Wi-Fi only or BLE-only). Do NOT use for SPP printing.
> - **ESP32-C3 / ESP32-C6**: ❌ **BLE ONLY** (No Bluetooth Classic SPP support).

---

## 🏗 Multi-Floor Network Architecture

Because Bluetooth Classic Class 2 radios have an effective indoor range of $\approx 15$ to $30\text{ feet}$ through walls and floors, a single basement host or single bridge node will lose signal across a 3-story house.

```text
[ Basement Server / Docker ] ──(Wi-Fi Network)──┐
                                                ├──> [ Node 1: 1st Floor ESP32 ] ──(BT SPP)──┐
                                                ├──> [ Node 2: 2nd Floor ESP32 ] ──(BT SPP)──┼──> [ Nelko P21 Printer ]
                                                └──> [ Node 3: 3rd Floor ESP32 ] ──(BT SPP)──┘
```

---

## ⚙ Implementation Steps

### 1. Firmware Flashing (`LabelPrinter-esp` or Custom SPP Bridge)

For each standard ESP32 dev board:

1. Clone or download [agiledivider/LabelPrinter-esp](https://github.com/agiledivider/LabelPrinter-esp).
2. Configure `Wi-Fi SSID`, `Wi-Fi Password`, and target printer Bluetooth MAC address (e.g., `DC:0D:30:XX:XX:XX`).
3. Flash the firmware via PlatformIO or Arduino IDE to each ESP32 board.
4. Assign static IP addresses (or DHCP reservations) on your Wi-Fi router for each node:
   - Node 1 (1st Floor): `192.168.1.51:9100`
   - Node 2 (2nd Floor): `192.168.1.52:9100`
   - Node 3 (3rd Floor): `192.168.1.53:9100`

### 2. Multi-Bridge Auto-Discovery & Failover (`NelkoP21WebPrint`)

The backend driver pool tests each node IP in sequence:

```python
# Multi-node bridge pool configuration
PRINTER_NODES = [
    {"name": "1st Floor", "host": "192.168.1.51", "port": 9100},
    {"name": "2nd Floor", "host": "192.168.1.52", "port": 9100},
    {"name": "3rd Floor", "host": "192.168.1.53", "port": 9100},
]
```

When a print request is received:
1. The backend pings/connects to Node 1. If Node 1 establishes an SPP link with the P21, the job streams immediately.
2. If Node 1 times out (printer out of range), it fails over to Node 2, then Node 3.

---

## ⚡ Power Considerations

* **Wall Outlet Power**: Plug each ESP32 dev board into any USB phone charger or wall outlet in central hallways or living areas.
* **Printer Charge Port**: The Nelko P21's Type-C USB port is an **input charging port only** (5V power receiver), so it cannot supply 5V out to power an attached ESP32 module. The P21 runs internal battery power, while ESP32 nodes run on wall power.

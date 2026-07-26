# 01. Hardware & Bluetooth Protocol Specification

This document details the low-level Bluetooth connection parameters, framing rules, packet chunking, and bi-directional communication protocol for the **Nelko P21** thermal printer.

---

## 1. Bluetooth Connection Profile

The Nelko P21 uses standard **Bluetooth Classic SPP (Serial Port Profile)** over **RFCOMM**. While the device may advertise over BLE for device discovery in newer mobile OS environments, actual printing and binary command transmission occur exclusively over the SPP socket.

| Parameter | Value |
| :--- | :--- |
| **Protocol** | Bluetooth Classic (BR/EDR) SPP / RFCOMM |
| **Service UUID** | `00001101-0000-1000-8000-00805F9B34FB` (Standard SPP UUID) |
| **RFCOMM Channel** | `1` |
| **Broadcast Name Prefix** | `P21`, `P21-`, `Nelko-P21` |
| **Pin Code / Pairing** | None required (Just Works) or `0000` / `1234` if prompted |

---

## 2. Packet MTU & Transmission Chunking

Thermal printers have limited buffer size on their embedded microcontrollers. Streaming large un-chunked byte arrays can lead to buffer overflows or lost print commands.

### App Constant Definitions (`CacheConstant.java`)
```java
public static int P21_MTU = 247;
public static int P21_packLength = 247 - 3; // 244 bytes net payload
```

### Transmission Rules
1. **Chunk Size**: Split total byte stream into chunks of **244 bytes**.
2. **Chunk Delay**: Introduce a tiny delay ($5\text{ ms}$ to $20\text{ ms}$) between sending successive chunks if flow control is not managed via ACKs.
3. **Socket Buffer**: Flush output stream after each chunk.

---

## 3. Bi-Directional Protocol & Responses

The printer communicates back to the host system over the open RFCOMM socket.

### A. Acknowledgment (ACK)
* **Byte Value**: `0xAA` (Decimal `170`, or `-86` in signed 8-bit byte representation).
* **Meaning**: Sent by the printer upon successful reception and parsing of command buffers or print jobs.

### B. Status Packet Headers (`OoO08o.java`)

When requesting status or during error states, responses start with specific header bytes:

| Header Byte / String | Meaning | Response Length |
| :--- | :--- | :--- |
| `0xAA` (`170` / `-86`) | Print ACK / Success | 1 Byte |
| `0xFD 0x00 0x00 0x00` | Real-time Status / Progress Header | 5 Bytes |
| `0xFF` (`255` / `-1`) | Error Status Header | 5 Bytes |
| `CONFIG\r\n` | Configuration Report Response | 19 Bytes |
| `BATTERY\r\n` | Battery State Response | 12 Bytes |
| `PRINTEDCOUNT ` | Total Printed Pages Response | Variable |

---

## 4. Printer Error Status Mapping

Extracted from `PrinterInfo.java` & `PrinterErrorType`:

| Error Code (Hex / Dec) | State Description | Action Required |
| :--- | :--- | :--- |
| `0x00` (`0`) | Normal / Ready | Ready to accept print jobs |
| `0x01` (`1`) | Cover Open (`status_open`) | Close top lid |
| `0x02` (`2`) | Paper Feed Active (`status_feed`) | Wait for paper feed to complete |
| `0x03` (`3`) | Paper Error (`status_paper_error`) | Check paper alignment |
| `0x04` (`4`) | Out of Paper (`status_out_of_paper`) | Reload paper roll |
| `0x10` (`16`) | Pause State (`status_pause`) | Resume printing |
| `0x20` (`32`) | Printer Busy (`status_busy`) | Wait for current job |
| `0x30` (`48`) | Low Battery (`status_printer_low_battery`) | Connect charger |
| `0x80` (`128`) | Printhead Overheated (`status_overheated`) | Allow printhead to cool down |

---

## 5. Status Polling Commands

To check printer status programmatically:

1. **Query Status (`~TS`)**:
   - Send: `~TS\r\n` (ASCII)
   - Response: 1-byte or 5-byte status response containing error flags.
2. **Query Battery Level (`~BS`)**:
   - Send: `~BS\r\n` (ASCII)
   - Response: Returns `BATTERY <level>\r\n`.

# 05. Paper Presets, Paper Types & RFID Encoding

This document details paper formats, paper detection types, RFID tag parsing rules, and printable area margin offsets used by the **Nelko P21**.

---

## 1. Paper Detection Types (`PaperType.java`)

| Paper Type ID | Name | Detection Sensor | TSPL Gap Setting |
| :--- | :--- | :--- | :--- |
| **`0`** | **Die-Cut Gap Paper** | Transmissive / Gap Sensor | `GAP 5 mm, 0 mm\r\n` |
| **`1`** | **Continuous Paper Roll** | None (Distance measured by motor) | `GAP 0 mm, 0 mm\r\n` |
| **`2`** | **Black Mark Paper** | Reflective / Black Mark Sensor | `BLINE 2 mm, 0 mm\r\n` |
| **`3`** | **Transparent Gap Paper** | Special Optical Sensor | `GAP 5 mm, 0 mm\r\n` |
| **`4`** | **Cable / Flag Label** | Transmissive / Gap Sensor | `GAP 5 mm, 0 mm\r\n` |

---

## 2. Standard Nelko P21 Label Presets

The P21 printer head supports a physical paper slot width up to $15\text{ mm}$, with maximum active printable width of $12\text{ mm}$ ($96\text{ dots}$).

### Common Label Presets Table

| Label Preset Name | Width (mm) | Height (mm) | Gap (mm) | Dots (W x H) | Width Bytes | Total Raster Bytes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **14x40mm White Gap** | 14 mm | 40 mm | 5 mm | $112 \times 320\text{ px}$ | $14\text{ B}$ | $4,480\text{ bytes}$ |
| **12x40mm White Gap** | 12 mm | 40 mm | 5 mm | $96 \times 320\text{ px}$ | $12\text{ B}$ | $3,840\text{ bytes}$ |
| **12x30mm White Gap** | 12 mm | 30 mm | 5 mm | $96 \times 240\text{ px}$ | $12\text{ B}$ | $2,880\text{ bytes}$ |
| **12x22mm White Gap** | 12 mm | 22 mm | 5 mm | $96 \times 176\text{ px}$ | $12\text{ B}$ | $2,112\text{ bytes}$ |
| **15x50mm Cable Label** | 15 mm | 50 mm | 5 mm | $120 \times 400\text{ px}$ | $15\text{ B}$ | $6,000\text{ bytes}$ |

---

## 3. RFID Tag & Serial Number Parsing (`PrinterInfo.java`)

Nelko label rolls include an RFID tag embedded inside the paper spool or a 2D barcode on the packaging. When the printer reads the RFID tag, it sends a 32-character hexadecimal string over Bluetooth.

### Decoding Algorithm

```java
public static String convertSerialNumberToPaperCode(String hexSerial) {
    // 32-character RFID hex string -> strip 4 hex chars from start and end
    if (hexSerial != null && hexSerial.length() == 32) {
        return hexSerial.substring(4, hexSerial.length() - 4); // Returns 24-char Paper Code
    }
    return hexSerial;
}
```

*Example*:
- **Raw RFID Hex String**: `A1F0011203000301121215280F0EFF90` (32 characters)
- **Extracted `paperCode`**: `011203000301121215280F0E` (24 characters)

---

## 4. Margin Offsets & Safe Printable Area

Due to mechanical edge margins, the active printable width on $14\text{ mm}$ paper is centered:

* **Physical Paper Width**: $14.0\text{ mm}$
* **Max Thermal Print Width**: $12.0\text{ mm}$ ($96$ to $112$ pixels)
* **Left / Right Margins**: $1.0\text{ mm}$ unprinted border on each side ($8\text{ dots}$)
* **Top / Bottom Margins**: $0.5\text{ mm}$ unprinted margin ($4\text{ dots}$)

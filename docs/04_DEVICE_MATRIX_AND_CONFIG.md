# 04. Nelko Device Model Registry & Specification Matrix

Extracted directly from `cloud_config_nelko.json` within the decompiled Nelko application assets.

---

## 1. Complete Device Matrix (28 Models)

| Device Model | Command Code | Primary Command Protocol | DPI | Max Width (mm) | QuickLZ Compression | Supported Paper Types | Default Template (W x H mm) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P21** | **`0`** | **TSPL** | **203** | **12 mm** | **0 (No)** | Gap (`0`) | **14 x 40 mm** (Gap 5mm) |
| **P22** | `0` | TSPL | 203 | 12 mm | 0 (No) | Gap (`0`), Cont (`1`), Mark (`2`) | 14 x 40 mm |
| **P24** | `0` | TSPL | 203 | 12 mm | 0 (No) | Gap (`0`) | 14 x 40 mm |
| **P31S** | `0` | TSPL | 203 | 12 mm | 0 (No) | Gap (`0`), Cont (`1`) | 14 x 40 mm |
| **PM220** | `0` | TSPL | 203 | 48 mm | 1 (Yes) | Gap (`0`), Mark (`2`) | 40 x 30 mm |
| **PM220S** | `0` | TSPL | 203 | 48 mm | 1 (Yes) | Gap (`0`), Mark (`2`) | 40 x 30 mm |
| **PL80E** | `0` | TSPL | 203 | 104 mm | 1 (Yes) | Gap (`0`) | 100 x 150 mm |
| **PM230** | `1` | CPCL | 203 | 48 mm | 0 (No) | Continuous (`1`) | 40 x 30 mm |
| **PM290** | `1` | CPCL | 203 | 48 mm | 0 (No) | Continuous (`1`) | 40 x 30 mm |
| **PM290C** | `1` | CPCL | 203 | 48 mm | 0 (No) | Continuous (`1`) | 40 x 30 mm |
| **D90E** | `2` | YZY ESC | 203 | 208 mm | 0 (No) | Fold, Continuous | A4 standard |
| **PL70e-BT**| `3` | PL70 ESC | 203 | 104 mm | 1 (Yes) | Gap (`0`) | 100 x 150 mm |
| **D810** | `4` | AY ESC | 203 | 208 mm | 0 (No) | Continuous, Fold | A4 standard |
| **D830** | `4` | AY ESC | 203 | 208 mm | 0 (No) | Continuous, Fold | A4 standard |
| **D820** | `5` | AY ESC | 203 | 208 mm | 0 (No) | Continuous, Fold | A4 standard |
| **D12** | `5` | AY ESC | 203 | 12 mm | 0 (No) | Gap (`0`), Cont (`1`) | 14 x 40 mm |
| **A10a** | `5` | AY ESC | 203 | 208 mm | 0 (No) | Continuous | A4 standard |
| **pocket** | `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PP01** | `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PP02** | `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PP02-BASE**| `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PP02MINI**| `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PP03** | `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PS03** | `6` | POCKET Protocol | 600 | 44 mm | 0 (No) | Custom | 40 x 30 mm |
| **PM240** | `7` | Custom | 203 | 48 mm | 0 (No) | Gap, Mark | 40 x 30 mm |
| **PM260** | `8` | Custom | 203 | 48 mm | 0 (No) | Gap, Mark | 40 x 30 mm |
| **PL50E** | `9` | Custom | 203 | 106 mm | 0 (No) | Gap | 100 x 150 mm |
| **Y42BT** | `9` | Custom | 203 | 106 mm | 0 (No) | Gap | 100 x 150 mm |

---

## 2. Command Code Mapping Summary

* **Command Code `0` (TSPL)**: TSPL2 engine used by standard Nelko label printers (**P21**, P22, P24, P31S, PM220, PL80E).
* **Command Code `1` (CPCL)**: CPCL engine used by line receipt/label printers (PM230, PM290).
* **Command Code `2` / `3` / `4` / `5` (ESC Variations)**: Specialized ESC/POS protocols for document/A4 thermal printers (D810, D820, D830, D90E, D12, A10a).
* **Command Code `6` (POCKET Protocol)**: Specialized high-DPI (600 DPI) pocket photo printers.

---

## 3. Nelko P21 Raw JSON Configuration

```json
{
  "id": 6,
  "deviceName": "P21",
  "command": 0,
  "dpi": 203,
  "maxWidth": 12,
  "paperType": "0",
  "paperMinLength": 10,
  "paperMaxLength": 75,
  "defaultPaperType": 0,
  "defaultTemplateWidth": 40,
  "defaultTemplateHeight": 14,
  "defaultGap": 5,
  "defaultRotation": 0,
  "isCompression": 0,
  "densityModel": 0,
  "canEnergy": 1,
  "energyShow": 1,
  "canSet": 1,
  "canUpgrade": 1,
  "upgradeFirmwareVersion": "4.2.2",
  "paperCode": "011203000301121215280F0E",
  "printingHeightList": [
    { "labelHeight": 40, "printHeight": 35.5 },
    { "labelHeight": 30, "printHeight": 25 }
  ]
}
```

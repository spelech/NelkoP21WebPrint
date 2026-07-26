# 02. TSPL Command Protocol Specification

The **Nelko P21** uses the **TSPL / TSPL2** (Thermal Printer Programming Language) command protocol. All layout parameters, page sizes, print darkness, and image data are defined using human-readable ASCII commands combined with binary raster blocks.

---

## 1. Command Format Rules

1. **Line Endings**: Every ASCII command line MUST end with `\r\n` (CRLF / `0x0D 0x0A`).
2. **Case Sensitivity**: Command headers are UPPERCASE (`SIZE`, `GAP`, `CLS`, `BITMAP`, `PRINT`).
3. **Delimiter**: Arguments are separated by commas `,` or spaces.

---

## 2. Command Reference

### `SIZE` - Define Label Page Size
Sets the dimensions of the printable label page.

```text
SIZE <width> mm, <height> mm\r\n
```

* `<width>`: Label width in millimeters (e.g., `14` or `12`).
* `<height>`: Label length in millimeters (e.g., `40` or `30`).

*Example*:
```text
SIZE 14 mm, 40 mm\r\n
```

---

### `GAP` - Define Label Gap
Defines the distance between continuous die-cut gap labels.

```text
GAP <m> mm, <n> mm\r\n
```

* `<m>`: Gap length in millimeters (default `5` mm for Nelko P21 gap paper).
* `<n>`: Gap offset in millimeters (usually `0`).
* For **continuous paper** rolls without gaps, set `GAP 0 mm, 0 mm\r\n` or `GAP 0,0\r\n`.

*Example*:
```text
GAP 5 mm, 0 mm\r\n
```

---

### `DIRECTION` - Print Orientation
Controls the feed direction and image rotation ($0^\circ$ vs $180^\circ$).

```text
DIRECTION <n>\r\n
```

* `<n>`: `0` (Normal top-to-bottom feed) or `1` (Rotated $180^\circ$).

---

### `DENSITY` - Print Darkness
Adjusts the heat intensity of the thermal printhead.

```text
DENSITY <n>\r\n
```

* `<n>`: Integer from `0` (Lightest) to `15` (Darkest). Default setting is `3` or `5`.

---

### `SPEED` - Print Speed
Sets the motor paper feed speed.

```text
SPEED <n>\r\n
```

* `<n>`: Speed level (e.g. `1.5`, `2.0`, `3.0`, `4.0` inches/sec).

---

### `CLS` - Clear Image Buffer
Clears all previous bitmap/text data from the printer's internal RAM page buffer before building a new label. **MUST** be executed before writing `BITMAP` data.

```text
CLS\r\n
```

---

### `BITMAP` - Render Raster Graphic
Streams a raw 1-bit monochrome raster image directly into the printer buffer at position `(x, y)`.

```text
BITMAP <x>,<y>,<width_bytes>,<height_dots>,<mode>,<raw_binary_bytes>
```

#### Parameters:
| Argument | Type | Description |
| :--- | :--- | :--- |
| `<x>` | Integer | Horizontal starting coordinate in dots (usually `0`). |
| `<y>` | Integer | Vertical starting coordinate in dots (usually `0`). |
| `<width_bytes>` | Integer | Image width in bytes ($\text{width\_dots} / 8$). For 96-dot width: $96/8 = 12\text{ bytes}$. |
| `<height_dots>` | Integer | Image height in dots ($\text{height\_mm} \times 8$). For 40mm length: $40 \times 8 = 320\text{ dots}$. |
| `<mode>` | Integer | `0` = OVERWRITE mode, `1` = OR mode, `2` = XOR mode. (Use `0`). |
| `<raw_binary_bytes>` | Bytes | Raw binary bitmap payload. Total length **MUST** equal $\text{width\_bytes} \times \text{height\_dots}$. |

> ⚠️ **CRITICAL BINARY TIMING**:  
> Unlike text commands, there is NO `\r\n` after `<mode>,`. The raw binary data bytes follow **immediately** after the comma after `<mode>`.

#### ASCII Header + Binary Payload Example:
```text
ASCII:  BITMAP 0,0,12,320,0,
BINARY: [3840 bytes of packed 1-bit raster data]
```

---

### `PRINT` - Execute Print Job
Triggers the physical thermal head and stepper motor to print the current buffer.

```text
PRINT <m>[,<n>]\r\n
```

* `<m>`: Number of label sets to print (usually `1`).
* `<n>`: Number of copies per set (usually `1`).

*Example*:
```text
PRINT 1,1\r\n
```

---

### `SOUND` - Beeper Control
Triggers the internal printer buzzer (if equipped).

```text
SOUND <level>,<duration_ms>\r\n
```

*Example*:
```text
SOUND 1,100\r\n
```

---

## 3. Complete TSPL Print Job Stream Example

Below is the complete byte sequence to print a standard $14\text{ mm} \times 40\text{ mm}$ label on the Nelko P21:

```text
SIZE 14 mm, 40 mm\r\n
GAP 5 mm, 0 mm\r\n
DIRECTION 0\r\n
DENSITY 3\r\n
CLS\r\n
BITMAP 0,0,12,320,0,[3840 BINARY BYTES]
PRINT 1,1\r\n
```

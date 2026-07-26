# 03. Rasterization & Image Processing Specification

Thermal printers are 1-bit monochrome binary devices: a thermal element either fires (heats up to turn thermal paper black) or stays cold (leaves paper white). This document details how graphics, text, and images are converted into the exact 1-bit binary raster format required by the **Nelko P21**.

---

## 1. Resolution & Dimension Mathematics

| Metric | Calculation / Value |
| :--- | :--- |
| **Print Head Resolution** | $203\text{ DPI} = 8\text{ dots per mm}$ |
| **Dot Size** | $0.125\text{ mm} \times 0.125\text{ mm}$ per dot |
| **Horizontal Alignment** | Image width MUST be padded to a multiple of $8\text{ dots}$ ($1\text{ byte}$) |
| **Bytes Per Line** | $\text{width\_bytes} = \lceil \text{width\_dots} / 8 \rceil$ |
| **Total Image Bytes** | $\text{total\_bytes} = \text{width\_bytes} \times \text{height\_dots}$ |

### Common Label Size Pixel Dimensions

| Label Size (W x H) | Printable Dots (W x H) | Width Bytes | Total Raster Bytes |
| :--- | :--- | :--- | :--- |
| **14mm x 40mm** | $112\text{ px} \times 320\text{ px}$ | $14\text{ bytes}$ | $4,480\text{ bytes}$ |
| **12mm x 40mm** | $96\text{ px} \times 320\text{ px}$ | $12\text{ bytes}$ | $3,840\text{ bytes}$ |
| **12mm x 30mm** | $96\text{ px} \times 240\text{ px}$ | $12\text{ bytes}$ | $2,880\text{ bytes}$ |
| **12mm x 22mm** | $96\text{ px} \times 176\text{ px}$ | $12\text{ bytes}$ | $2,112\text{ bytes}$ |

---

## 2. Bit-Packing & Inversion Rules

In TSPL raster format:
- **Bit Value `1`**: Thermal printhead element **fires** (Black pixel).
- **Bit Value `0`**: Thermal printhead element **remains off** (White paper background).

### Byte Structure (MSB First)

Each byte represents 8 horizontal consecutive pixels in a row:

```text
Byte Bit Position:  [ Bit 7 | Bit 6 | Bit 5 | Bit 4 | Bit 3 | Bit 2 | Bit 1 | Bit 0 ]
Pixel Column:       [   x+0 |   x+1 |   x+2 |   x+3 |   x+4 |   x+5 |   x+6 |   x+7 ]
Bit Weight:         [  128  |   64  |   32  |   16  |    8  |    4  |    2  |    1  ]
```

### Pixel-to-Byte Conversion Logic (`O8oO888.java`)

```java
int widthBytes = widthDots / 8;
byte[] rasterBuffer = new byte[widthBytes * heightDots];
int bufferIndex = 0;

for (int y = 0; y < heightDots; y++) {
    for (int xByte = 0; xByte < widthBytes; xByte++) {
        int byteVal = 0;
        for (int bit = 0; bit < 8; bit++) {
            int xPixel = (xByte * 8) + bit;
            int pixelColor = bitmap.getPixel(xPixel, y);
            
            // Check if pixel is black (thermal mark)
            boolean isBlack = isBlackPixel(pixelColor);
            
            if (isBlack) {
                byteVal |= (1 << (7 - bit)); // Set bit MSB to LSB
            }
        }
        rasterBuffer[bufferIndex++] = (byte) byteVal;
    }
}
```

---

## 3. Image Binarization & Dithering Algorithms

To convert full-color RGB or grayscale images into crisp 1-bit black/white images, three algorithms are implemented in the Nelko SDK (`O8oO888.java`):

### A. Threshold Binarization (Best for Text & Line Art)
Grayscale luminance $Y = 0.299R + 0.587G + 0.114B$.
If $Y < \text{Threshold}$ (default $128$), pixel = **Black (1)**, else **White (0)**.

### B. Floyd-Steinberg Error Diffusion (Best for Photos & Gradients)
Distributes quantization error to neighboring pixels:

```text
        Pixel    7/16
 3/16   5/16     1/16
```

### C. Bayer Matrix Ordered Dithering ($8 \times 8$ & $16 \times 16$)
Extracted from `O8oO888.f12006` ($16 \times 16$ Bayer Matrix):

```java
public static int[][] BAYER_16x16 = {
    {0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170},
    {192, 64, 224, 96, 200, 72, 232, 104, 194, 66, 226, 98, 202, 74, 234, 106},
    {48, 176, 16, 144, 56, 184, 24, 152, 50, 178, 18, 146, 58, 186, 26, 154},
    {240, 112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82, 250, 122, 202, 90},
    ...
};
```
If luminance $Y(x,y) < \text{BAYER\_16x16}[x \bmod 16][y \bmod 16]$, set bit to **1 (Black)**.

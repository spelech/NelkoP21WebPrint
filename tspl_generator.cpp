#include "tspl_generator.h"

// 8x16 ASCII font table snippet for standard alphanumeric characters
static const uint8_t font8x16_basic[128][16] = {
    // 0..31 control characters (empty)
    {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0},
    {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}, {0},
    // 32 ' '
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 33 '!'
    {0x00,0x00,0x18,0x3C,0x3C,0x3C,0x18,0x18,0x18,0x00,0x18,0x18,0x00,0x00,0x00,0x00},
    // 34 '"'
    {0x00,0x66,0x66,0x66,0x24,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 35 '#'
    {0x00,0x00,0x36,0x36,0x7F,0x36,0x36,0x36,0x7F,0x36,0x36,0x00,0x00,0x00,0x00,0x00},
    // 36 '$'
    {0x00,0x18,0x3E,0x63,0x60,0x3E,0x03,0x63,0x7C,0x18,0x00,0x00,0x00,0x00,0x00,0x00},
    // 37 '%'
    {0x00,0x00,0x63,0x66,0x0C,0x18,0x30,0x66,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 38 '&'
    {0x00,0x00,0x38,0x6C,0x6C,0x38,0x76,0x6C,0x3B,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 39 '\''
    {0x00,0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 40 '('
    {0x00,0x0C,0x18,0x30,0x30,0x30,0x30,0x18,0x0C,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 41 ')'
    {0x00,0x30,0x18,0x0C,0x0C,0x0C,0x0C,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 42 '*'
    {0x00,0x00,0x00,0x66,0x3C,0xFF,0x3C,0x66,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 43 '+'
    {0x00,0x00,0x18,0x18,0x18,0x7E,0x18,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 44 ','
    {0x00,0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 45 '-'
    {0x00,0x00,0x00,0x00,0x00,0xfe,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 46 '.'
    {0x00,0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 47 '/'
    {0x00,0x00,0x03,0x06,0x0C,0x18,0x30,0x60,0x40,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 48 '0'
    {0x00,0x3E,0x63,0x63,0x6B,0x6B,0x63,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 49 '1'
    {0x00,0x18,0x38,0x18,0x18,0x18,0x18,0x18,0x7E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 50 '2'
    {0x00,0x3E,0x63,0x03,0x06,0x1C,0x30,0x63,0x7F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 51 '3'
    {0x00,0x3E,0x63,0x03,0x1E,0x03,0x03,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 52 '4'
    {0x00,0x06,0x0E,0x1E,0x36,0x66,0x7F,0x06,0x06,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 53 '5'
    {0x00,0x7F,0x60,0x60,0x7E,0x03,0x03,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 54 '6'
    {0x00,0x1C,0x30,0x60,0x7E,0x63,0x63,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 55 '7'
    {0x00,0x7F,0x63,0x03,0x06,0x0C,0x18,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 56 '8'
    {0x00,0x3E,0x63,0x63,0x3E,0x63,0x63,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 57 '9'
    {0x00,0x3E,0x63,0x63,0x63,0x3F,0x03,0x06,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 58 ':'
    {0x00,0x00,0x18,0x18,0x00,0x00,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 59 ';'
    {0x00,0x00,0x18,0x18,0x00,0x00,0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 60 '<'
    {0x00,0x06,0x0C,0x18,0x30,0x18,0x0C,0x06,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 61 '='
    {0x00,0x00,0x00,0x7E,0x00,0x7E,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 62 '>'
    {0x00,0x30,0x18,0x0C,0x06,0x0C,0x18,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 63 '?'
    {0x00,0x3E,0x63,0x03,0x06,0x0C,0x18,0x00,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 64 '@'
    {0x00,0x3E,0x63,0x6F,0x6B,0x6F,0x60,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 65 'A'
    {0x00,0x1C,0x36,0x63,0x63,0x7F,0x63,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 66 'B'
    {0x00,0x7C,0x66,0x66,0x7C,0x66,0x66,0x66,0x7C,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 67 'C'
    {0x00,0x3E,0x63,0x60,0x60,0x60,0x60,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 68 'D'
    {0x00,0x78,0x6C,0x66,0x66,0x66,0x66,0x6C,0x78,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 69 'E'
    {0x00,0x7F,0x60,0x60,0x78,0x60,0x60,0x60,0x7F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 70 'F'
    {0x00,0x7F,0x60,0x60,0x78,0x60,0x60,0x60,0x60,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 71 'G'
    {0x00,0x3E,0x63,0x60,0x60,0x6F,0x63,0x63,0x3F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 72 'H'
    {0x00,0x63,0x63,0x63,0x7F,0x63,0x63,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 73 'I'
    {0x00,0x3C,0x18,0x18,0x18,0x18,0x18,0x18,0x3C,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 74 'J'
    {0x00,0x1F,0x0C,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 75 'K'
    {0x00,0x63,0x66,0x6C,0x78,0x78,0x6C,0x66,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 76 'L'
    {0x00,0x60,0x60,0x60,0x60,0x60,0x60,0x60,0x7F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 77 'M'
    {0x00,0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 78 'N'
    {0x00,0x63,0x63,0x73,0x7B,0x6F,0x67,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 79 'O'
    {0x00,0x3E,0x63,0x63,0x63,0x63,0x63,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 80 'P'
    {0x00,0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0x60,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 81 'Q'
    {0x00,0x3E,0x63,0x63,0x63,0x63,0x6B,0x37,0x0F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 82 'R'
    {0x00,0x7C,0x66,0x66,0x7C,0x6C,0x66,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 83 'S'
    {0x00,0x3E,0x63,0x60,0x3E,0x03,0x03,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 84 'T'
    {0x00,0x7F,0x5B,0x18,0x18,0x18,0x18,0x18,0x3C,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 85 'U'
    {0x00,0x63,0x63,0x63,0x63,0x63,0x63,0x63,0x3E,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 86 'V'
    {0x00,0x63,0x63,0x63,0x63,0x63,0x36,0x1C,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 87 'W'
    {0x00,0x63,0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 88 'X'
    {0x00,0x63,0x63,0x36,0x1C,0x1C,0x36,0x63,0x63,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 89 'Y'
    {0x00,0x63,0x63,0x36,0x1C,0x18,0x18,0x18,0x3C,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 90 'Z'
    {0x00,0x7F,0x63,0x06,0x0C,0x18,0x30,0x63,0x7F,0x00,0x00,0x00,0x00,0x00,0x00,0x00},
    // 91..127 fallback
    {0}
};

// Code128 B Patterns (11 modules per character, 6 bars/spaces)
static const uint16_t CODE128_PATTERNS[107] = {
    0x6CC, 0x66C, 0x666, 0x498, 0x48C, 0x44C, 0x4C8, 0x4C4, 0x464, 0x648,
    0x644, 0x624, 0x59C, 0x4DC, 0x4CE, 0x5CC, 0x4EC, 0x4E6, 0x670, 0x65C,
    0x64E, 0x6E0, 0x674, 0x76E, 0x74C, 0x732, 0x734, 0x69C, 0x696, 0x669,
    0x6C4, 0x6C6, 0x64C, 0x642, 0x62C, 0x622, 0x694, 0x692, 0x629, 0x649,
    0x664, 0x662, 0x626, 0x624, 0x646, 0x668, 0x684, 0x690, 0x4A6, 0x4A2,
    0x426, 0x422, 0x466, 0x462, 0x426, 0x422, 0x6A4, 0x6A2, 0x62A, 0x622,
    0x64A, 0x642, 0x624, 0x622, 0x69A, 0x692, 0x62B, 0x623, 0x6AB, 0x6A3,
    0x63A, 0x632, 0x62B, 0x623, 0x6AB, 0x6A3, 0x63A, 0x632, 0x66E, 0x76C,
    0x736, 0x6EC, 0x6E6, 0x676, 0x672, 0x6E4, 0x6E2, 0x674, 0x672, 0x764,
    0x762, 0x734, 0x732, 0x6D4, 0x6D2, 0x6B4, 0x6B2, 0x6D4, 0x6D2, 0x6B4,
    0x6B2, 0x69E, 0x6E8, 0x774, 0x772, 0x6D6, 0x6B6
};
#define CODE128_START_B 104
#define CODE128_STOP    106

static void setPixelBlack(uint8_t* buf, int widthBytes, int x, int y) {
    if (x < 0 || y < 0 || x >= (widthBytes * 8)) return;
    int byteIdx = (y * widthBytes) + (x / 8);
    int bitIdx = 7 - (x % 8);
    buf[byteIdx] &= ~(1 << bitIdx);
}

static void drawChar8x16(uint8_t* buf, int widthBytes, int startX, int startY, char c, int scale) {
    if ((uint8_t)c > 127) c = '?';
    const uint8_t* glyph = font8x16_basic[(uint8_t)c];
    for (int row = 0; row < 16; row++) {
        uint8_t bits = glyph[row];
        for (int col = 0; col < 8; col++) {
            if (bits & (1 << (7 - col))) {
                for (int sy = 0; sy < scale; sy++) {
                    for (int sx = 0; sx < scale; sx++) {
                        setPixelBlack(buf, widthBytes, startX + (col * scale) + sx, startY + (row * scale) + sy);
                    }
                }
            }
        }
    }
}

static void drawString(uint8_t* buf, int widthBytes, int startX, int startY, const String& str, int scale) {
    int curX = startX;
    for (size_t i = 0; i < str.length(); i++) {
        drawChar8x16(buf, widthBytes, curX, startY, str[i], scale);
        curX += (8 * scale) + (1 * scale);
    }
}

static void drawBarcode128(uint8_t* buf, int widthBytes, int startX, int startY, int height, int moduleWidth, const String& codeData) {
    if (codeData.length() == 0) return;

    // Calculate checksum
    int checksum = CODE128_START_B;
    std::vector<int> symbolIndices;
    symbolIndices.push_back(CODE128_START_B);

    for (size_t i = 0; i < codeData.length(); i++) {
        int idx = (int)codeData[i] - 32;
        if (idx < 0 || idx > 95) idx = 0;
        symbolIndices.push_back(idx);
        checksum += (i + 1) * idx;
    }
    checksum %= 103;
    symbolIndices.push_back(checksum);
    symbolIndices.push_back(CODE128_STOP);

    int curX = startX;

    for (size_t s = 0; s < symbolIndices.size(); s++) {
        uint16_t pattern = CODE128_PATTERNS[symbolIndices[s]];
        int numBits = (symbolIndices[s] == CODE128_STOP) ? 13 : 11;
        for (int bit = numBits - 1; bit >= 0; bit--) {
            bool isBar = (pattern >> bit) & 1;
            if (isBar) {
                for (int m = 0; m < moduleWidth; m++) {
                    for (int h = 0; h < height; h++) {
                        setPixelBlack(buf, widthBytes, curX + m, startY + h);
                    }
                }
            }
            curX += moduleWidth;
        }
    }
}

String generateTSPLStream(const SimpleLabelRequest& req) {
    // Logical horizontal label layout: 40mm wide (320 dots) x 14mm high (112 dots)
    int logicalW = (int)(req.widthMm * 8.0f);   // 320 dots
    int logicalH = (int)(req.heightMm * 8.0f);  // 112 dots
    logicalW = ((logicalW + 7) / 8) * 8;
    int logicalWidthBytes = logicalW / 8;

    // Allocate logical buffer (white background 0xFF)
    int logicalTotalBytes = logicalWidthBytes * logicalH;
    uint8_t* logicalBuf = (uint8_t*)malloc(logicalTotalBytes);
    memset(logicalBuf, 0xFF, logicalTotalBytes);

    // 1. Draw Border Box inside logical label
    int b = req.borderThickness;
    if (b > 0) {
        for (int y = 0; y < logicalH; y++) {
            for (int x = 0; x < logicalW; x++) {
                if (x < b || x >= (logicalW - b) || y < b || y >= (logicalH - b)) {
                    setPixelBlack(logicalBuf, logicalWidthBytes, x, y);
                }
            }
        }
    }

    int yCursor = 6 + req.yOffset;

    // 2. Main Title (Large Horizontal Centered)
    if (req.mainText.length() > 0) {
        int scale = (req.fontScaleMain > 0) ? req.fontScaleMain : 2;
        int textWidth = req.mainText.length() * 9 * scale;
        int startX = (logicalW - textWidth) / 2 + req.xOffset;
        if (startX < 4) startX = 4;
        drawString(logicalBuf, logicalWidthBytes, startX, yCursor, req.mainText, scale);
        yCursor += (16 * scale) + 4;
    }

    // 3. Subtitle Text (Medium Horizontal Centered)
    if (req.subtitle.length() > 0) {
        int scale = (req.fontScaleSub > 0) ? req.fontScaleSub : 1;
        int textWidth = req.subtitle.length() * 9 * scale;
        int startX = (logicalW - textWidth) / 2 + req.xOffset;
        if (startX < 4) startX = 4;
        drawString(logicalBuf, logicalWidthBytes, startX, yCursor, req.subtitle, scale);
        yCursor += (16 * scale) + 4;
    }

    // 4. Code128 Barcode + Human Readable Digits
    if (req.barcodeData.length() > 0) {
        int numModules = (req.barcodeData.length() + 3) * 11 + 2;
        int moduleWidth = (numModules * 2 <= (logicalW - 16)) ? 2 : 1;
        int barcodeWidth = numModules * moduleWidth;
        int startX = (logicalW - barcodeWidth) / 2 + req.xOffset;
        if (startX < 4) startX = 4;
        
        int bHeight = (req.barcodeHeight > 0) ? req.barcodeHeight : 24;
        drawBarcode128(logicalBuf, logicalWidthBytes, startX, yCursor, bHeight, moduleWidth, req.barcodeData);
        yCursor += bHeight + 2;

        // Draw Human Readable Numbers below barcode
        int scale = 1;
        int textWidth = req.barcodeData.length() * 9 * scale;
        int textStartX = (logicalW - textWidth) / 2 + req.xOffset;
        if (textStartX < 4) textStartX = 4;
        drawString(logicalBuf, logicalWidthBytes, textStartX, yCursor, req.barcodeData, scale);
    }

    // ROTATION 90° CLOCKWISE:
    // Physical print head width across paper roll = 14mm (112 dots = 14 bytes)
    // Physical paper feed length = 40mm (320 dots)
    int physW = logicalH;  // 112 dots
    int physH = logicalW;  // 320 dots
    physW = ((physW + 7) / 8) * 8;
    int physWidthBytes = physW / 8; // 14 bytes per row

    int physTotalBytes = physWidthBytes * physH;
    uint8_t* physBuf = (uint8_t*)malloc(physTotalBytes);
    memset(physBuf, 0xFF, physTotalBytes);

    for (int ly = 0; ly < logicalH; ly++) {
        for (int lx = 0; lx < logicalW; lx++) {
            // Check if logical pixel (lx, ly) is black
            int lByteIdx = (ly * logicalWidthBytes) + (lx / 8);
            int lBitIdx = 7 - (lx % 8);
            bool isBlack = ((logicalBuf[lByteIdx] & (1 << lBitIdx)) == 0);

            if (isBlack) {
                // Map to physical (px, py) rotated 90° clockwise
                int px = logicalH - 1 - ly;
                int py = lx;

                int pByteIdx = (py * physWidthBytes) + (px / 8);
                int pBitIdx = 7 - (px % 8);
                physBuf[pByteIdx] &= ~(1 << pBitIdx);
            }
        }
    }
    free(logicalBuf);

    String header = "";
    header += "SIZE " + String((int)req.heightMm) + " mm, " + String((int)req.widthMm) + " mm\r\n";
    header += "GAP 2 mm, 0 mm\r\n";
    header += "DIRECTION 0\r\n";
    header += "CLS\r\n";
    header += "BITMAP 0,0," + String(physWidthBytes) + "," + String(physH) + ",0,";

    String result = header;
    for (int i = 0; i < physTotalBytes; i++) {
        result += (char)physBuf[i];
    }
    free(physBuf);

    result += "\r\nPRINT " + String(req.copies) + ",1\r\n";
    return result;
}

String generateTSPLFromJSON(const String& jsonStr, const SimpleLabelRequest& req) {
    if (jsonStr.length() == 0) {
        return generateTSPLStream(req);
    }

#if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
#else
    DynamicJsonDocument doc(4096);
#endif
    DeserializationError error = deserializeJson(doc, jsonStr);
    if (error) {
        return generateTSPLStream(req);
    }

    float widthMm = req.widthMm;
    float heightMm = req.heightMm;
    float gapMm = req.gapMm;
    int copies = req.copies;

    if (doc["preset"].is<JsonObject>()) {
        JsonObject preset = doc["preset"];
        if (preset["width"].is<float>()) widthMm = preset["width"].as<float>();
        else if (preset["widthMm"].is<float>()) widthMm = preset["widthMm"].as<float>();

        if (preset["height"].is<float>()) heightMm = preset["height"].as<float>();
        else if (preset["heightMm"].is<float>()) heightMm = preset["heightMm"].as<float>();

        if (preset["gap"].is<float>()) gapMm = preset["gap"].as<float>();
        else if (preset["gapMm"].is<float>()) gapMm = preset["gapMm"].as<float>();
    }

    if (doc["widthMm"].is<float>()) widthMm = doc["widthMm"].as<float>();
    else if (doc["width"].is<float>()) widthMm = doc["width"].as<float>();

    if (doc["heightMm"].is<float>()) heightMm = doc["heightMm"].as<float>();
    else if (doc["height"].is<float>()) heightMm = doc["height"].as<float>();

    if (doc["gapMm"].is<float>()) gapMm = doc["gapMm"].as<float>();
    else if (doc["gap"].is<float>()) gapMm = doc["gap"].as<float>();

    if (doc["copies"].is<int>()) copies = doc["copies"].as<int>();

    int logicalW = (int)(widthMm * 8.0f);
    int logicalH = (int)(heightMm * 8.0f);
    if (logicalW < 8) logicalW = 320;
    if (logicalH < 8) logicalH = 112;
    logicalW = ((logicalW + 7) / 8) * 8;
    int logicalWidthBytes = logicalW / 8;
    int logicalTotalBytes = logicalWidthBytes * logicalH;

    uint8_t* logicalBuf = (uint8_t*)malloc(logicalTotalBytes);
    if (!logicalBuf) {
        return generateTSPLStream(req);
    }
    memset(logicalBuf, 0xFF, logicalTotalBytes);

    if (doc["elements"].is<JsonArray>()) {
        JsonArray elements = doc["elements"].as<JsonArray>();
        for (JsonObject elem : elements) {
            String type = elem["type"] | "";
            float rawX = elem["x"] | 0.0f;
            float rawY = elem["y"] | 0.0f;
            int x = (int)(rawX / 100.0f * (float)logicalW);
            int y = (int)(rawY / 100.0f * (float)logicalH);

            if (type == "text") {
                String content = elem["content"].as<String>();
                if (content.indexOf("{{mainText}}") >= 0) {
                    content.replace("{{mainText}}", req.mainText);
                } else if (content.indexOf("{{subtitle}}") >= 0) {
                    content.replace("{{subtitle}}", req.subtitle);
                } else if ((content == "" || content == "Main Text") && req.mainText.length() > 0) {
                    content = req.mainText;
                } else if (content == "Subtitle" && req.subtitle.length() > 0) {
                    content = req.subtitle;
                }

                int fontSize = elem["fontSize"] | 16;
                int scale = (fontSize <= 16) ? 1 : ((fontSize <= 28) ? 2 : 3);
                int textWidth = content.length() * 9 * scale;
                String align = elem["align"] | "center";
                int startX = (align == "left") ? x : (x - textWidth / 2);
                int startY = y - (16 * scale) / 2;
                if (startX < 0) startX = 0;
                if (startY < 0) startY = 0;

                drawString(logicalBuf, logicalWidthBytes, startX, startY, content, scale);
            }
            else if (type == "barcode") {
                String content = elem["content"].as<String>();
                if (content.indexOf("{{barcodeData}}") >= 0) {
                    content.replace("{{barcodeData}}", req.barcodeData);
                } else if ((content == "" || content == "12345678" || content == "BARCODE") && req.barcodeData.length() > 0) {
                    content = req.barcodeData;
                }

                int bHeight = elem["height"] | req.barcodeHeight;
                if (bHeight <= 0) bHeight = 24;
                int numModules = (content.length() + 3) * 11 + 2;
                int elemW = elem["width"] | 0;
                int moduleWidth = 1;
                if (elemW > 0 && numModules > 0) {
                    moduleWidth = elemW / numModules;
                } else if (numModules * 2 <= (logicalW - 16)) {
                    moduleWidth = 2;
                }
                if (moduleWidth < 1) moduleWidth = 1;
                if (moduleWidth > 3) moduleWidth = 3;

                int barcodeWidth = numModules * moduleWidth;
                int startX = x - barcodeWidth / 2;
                int startY = y - bHeight / 2;
                if (startX < 0) startX = 0;
                if (startY < 0) startY = 0;

                drawBarcode128(logicalBuf, logicalWidthBytes, startX, startY, bHeight, moduleWidth, content);
            }
            else if (type == "line") {
                int lw = elem["width"] | 1;
                int lh = elem["height"] | 1;
                int startX = x - lw / 2;
                int startY = y - lh / 2;
                for (int py = startY; py < startY + lh; py++) {
                    for (int px = startX; px < startX + lw; px++) {
                        setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                    }
                }
            }
            else if (type == "rectangle") {
                int rw = elem["width"] | 10;
                int rh = elem["height"] | 10;
                int thick = elem["thickness"] | 1;
                int startX = x - rw / 2;
                int startY = y - rh / 2;
                for (int py = startY; py < startY + rh; py++) {
                    for (int px = startX; px < startX + rw; px++) {
                        if (px < startX + thick || px >= startX + rw - thick ||
                            py < startY + thick || py >= startY + rh - thick) {
                            setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                        }
                    }
                }
            }
            else if (type == "qr") {
                String content = elem["content"].as<String>();
                if (content.indexOf("{{qrData}}") >= 0) {
                    content.replace("{{qrData}}", req.qrData);
                } else if ((content == "" || content == "QR_CODE") && req.qrData.length() > 0) {
                    content = req.qrData;
                }

                int qrSize = elem["size"] | elem["width"] | 40;
                if (qrSize < 10) qrSize = 40;
                int startX = x - qrSize / 2;
                int startY = y - qrSize / 2;

                for (int py = startY; py < startY + qrSize; py++) {
                    for (int px = startX; px < startX + qrSize; px++) {
                        if (px < startX + 2 || px >= startX + qrSize - 2 ||
                            py < startY + 2 || py >= startY + qrSize - 2) {
                            setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                        }
                    }
                }
                int boxSize = qrSize / 4;
                if (boxSize >= 4) {
                    for (int py = startY + 2; py < startY + 2 + boxSize; py++) {
                        for (int px = startX + 2; px < startX + 2 + boxSize; px++) {
                            setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                        }
                    }
                    for (int py = startY + 2; py < startY + 2 + boxSize; py++) {
                        for (int px = startX + qrSize - 2 - boxSize; px < startX + qrSize - 2; px++) {
                            setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                        }
                    }
                    for (int py = startY + qrSize - 2 - boxSize; py < startY + qrSize - 2; py++) {
                        for (int px = startX + 2; px < startX + 2 + boxSize; px++) {
                            setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                        }
                    }
                }
            }
            else if (type == "image" || type == "icon") {
                int imgW = elem["width"] | 40;
                int imgH = elem["height"] | 40;
                if (imgW < 10) imgW = 40;
                if (imgH < 10) imgH = 40;
                int startX = x - imgW / 2;
                int startY = y - imgH / 2;

                for (int py = startY; py < startY + imgH; py++) {
                    for (int px = startX; px < startX + imgW; px++) {
                        if (px < startX + 2 || px >= startX + imgW - 2 ||
                            py < startY + 2 || py >= startY + imgH - 2) {
                            if (px >= 0 && px < logicalW && py >= 0 && py < logicalH) {
                                setPixelBlack(logicalBuf, logicalWidthBytes, px, py);
                            }
                        }
                    }
                }
                for (int d = 2; d < imgW - 2 && d < imgH - 2; d++) {
                    int px1 = startX + d;
                    int py1 = startY + d;
                    int px2 = startX + imgW - 1 - d;
                    int py2 = startY + d;
                    if (px1 >= 0 && px1 < logicalW && py1 >= 0 && py1 < logicalH) {
                        setPixelBlack(logicalBuf, logicalWidthBytes, px1, py1);
                    }
                    if (px2 >= 0 && px2 < logicalW && py2 >= 0 && py2 < logicalH) {
                        setPixelBlack(logicalBuf, logicalWidthBytes, px2, py2);
                    }
                }
            }
        }
    }

    int physW = logicalH;
    int physH = logicalW;
    physW = ((physW + 7) / 8) * 8;
    int physWidthBytes = physW / 8;

    int physTotalBytes = physWidthBytes * physH;
    uint8_t* physBuf = (uint8_t*)malloc(physTotalBytes);
    if (!physBuf) {
        free(logicalBuf);
        return generateTSPLStream(req);
    }
    memset(physBuf, 0xFF, physTotalBytes);

    for (int ly = 0; ly < logicalH; ly++) {
        for (int lx = 0; lx < logicalW; lx++) {
            int lByteIdx = (ly * logicalWidthBytes) + (lx / 8);
            int lBitIdx = 7 - (lx % 8);
            bool isBlack = ((logicalBuf[lByteIdx] & (1 << lBitIdx)) == 0);

            if (isBlack) {
                int px = logicalH - 1 - ly;
                int py = lx;

                int pByteIdx = (py * physWidthBytes) + (px / 8);
                int pBitIdx = 7 - (px % 8);
                physBuf[pByteIdx] &= ~(1 << pBitIdx);
            }
        }
    }
    free(logicalBuf);

    String header = "";
    header += "SIZE " + String((int)heightMm) + " mm, " + String((int)widthMm) + " mm\r\n";
    header += "GAP " + String((int)gapMm) + " mm, 0 mm\r\n";
    header += "DIRECTION 0\r\n";
    header += "CLS\r\n";
    header += "BITMAP 0,0," + String(physWidthBytes) + "," + String(physH) + ",0,";

    String result = header;
    for (int i = 0; i < physTotalBytes; i++) {
        result += (char)physBuf[i];
    }
    free(physBuf);

    result += "\r\nPRINT " + String(copies) + ",1\r\n";
    return result;
}


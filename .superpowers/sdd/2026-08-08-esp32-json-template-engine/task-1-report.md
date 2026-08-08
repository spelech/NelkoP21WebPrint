# Task 1 Report: ESP32 C++ JSON Template Parser & Rasterizer Engine

## Summary of Implementation
- Updated [`tspl_generator.h`](file:///Z:/repos/esp32-LabelPrinter/tspl_generator.h):
  - Included `<ArduinoJson.h>`
  - Added signature `String generateTSPLFromJSON(const String& jsonStr, const SimpleLabelRequest& req)`
- Implemented `generateTSPLFromJSON` in [`tspl_generator.cpp`](file:///Z:/repos/esp32-LabelPrinter/tspl_generator.cpp):
  - Added support for ArduinoJson v6 and v7 compatibility using conditional allocation (`#if ARDUINOJSON_VERSION_MAJOR >= 7`).
  - Parsed `preset` parameters (`width`, `height`, `gap`, `copies`) and top-level fields with fallback to `SimpleLabelRequest` values.
  - Allocated dynamic monochrome logical bitmap buffer (`(int)(widthMm * 8)` x `(int)(heightMm * 8)`).
  - Loop through layout `elements` array supporting:
    - `text`: Percentage-based placement (`x`, `y`), dynamic placeholder substitution (`{{mainText}}`, `{{subtitle}}`), font scaling mapped from `fontSize` (1x, 2x, 3x), and alignment (`center`/`left`).
    - `barcode`: Code128 pattern drawing using `drawBarcode128`, module width selection, dynamic content substitution (`{{barcodeData}}`).
    - `line`: Solid black rectangle box centered at percentage coordinates.
    - `rectangle`: Outline border frame with configurable thickness centered at percentage coordinates.
    - `qr`: QR code square frame placeholder with finder pattern boxes, dynamic content substitution (`{{qrData}}`).
  - Rendered 90° clockwise memory rotation mapping for the physical Nelko P21 14mm thermal printhead (`physW = logicalH`, `physH = logicalW`).
  - Clean memory deallocation (`free(logicalBuf)`, `free(physBuf)`).
  - Built TSPL packet headers (`SIZE`, `GAP`, `DIRECTION 0`, `CLS`, `BITMAP`, raw bitmap payload, `PRINT copies,1`).

## Files Modified
- [`tspl_generator.h`](file:///Z:/repos/esp32-LabelPrinter/tspl_generator.h)
- [`tspl_generator.cpp`](file:///Z:/repos/esp32-LabelPrinter/tspl_generator.cpp)

## Verification
- Code structure and memory allocations verified for clean leak-free execution.

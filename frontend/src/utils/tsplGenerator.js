/**
 * Client-Side TSPL / TSPL2 Generator & 1-Bit Monochrome Rasterizer
 * Runs 100% in the web browser (JS) for direct Web Bluetooth / Web Serial printing.
 */

// 16x16 Bayer Matrix for ordered dithering
const BAYER_16x16 = [
  [  0, 128,  32, 160,   8, 136,  40, 168,   2, 130,  34, 162,  10, 138,  42, 170],
  [192,  64, 224,  96, 200,  72, 232, 104, 194,  66, 226,  98, 202,  74, 234, 106],
  [ 48, 176,  16, 144,  56, 184,  24, 152,  50, 178,  18, 146,  58, 186,  26, 154],
  [240, 112, 208,  80, 248, 120, 216,  88, 242, 114, 210,  82, 250, 122, 202,  90],
  [ 12, 140,  44, 172,   4, 132,  36, 164,  14, 142,  46, 174,   6, 134,  38, 166],
  [204,  76, 236, 108, 196,  68, 228, 100, 206,  78, 238, 110, 198,  70, 230, 102],
  [ 60, 188,  28, 156,  52, 180,  20, 148,  62, 190,  30, 158,  54, 182,  22, 150],
  [252, 124, 220,  92, 244, 116, 212,  84, 254, 126, 222,  94, 246, 118, 214,  86],
  [  3, 131,  35, 163,  11, 139,  43, 171,   1, 129,  33, 161,   9, 137,  41, 169],
  [195,  67, 227,  99, 203,  75, 235, 107, 193,  65, 225,  97, 201,  73, 233, 105],
  [ 51, 179,  19, 147,  59, 187,  27, 155,  49, 177,  17, 145,  57, 185,  25, 153],
  [243, 115, 211,  83, 251, 123, 219,  91, 241, 113, 209,  81, 249, 121, 217,  89],
  [ 15, 143,  47, 175,   7, 135,  39, 167,  13, 141,  45, 173,   5, 133,  37, 165],
  [207,  79, 239, 111, 199,  71, 231, 103, 205,  77, 237, 109, 197,  69, 229, 101],
  [ 63, 191,  31, 159,  55, 183,  23, 151,  61, 189,  29, 157,  53, 181,  21, 149],
  [254, 127, 223,  95, 255, 119, 221,  87, 253, 125, 221,  93, 245, 117, 213,  85]
];

export function mmToDots(mm, dpi = 203) {
  return Math.round((mm * dpi) / 25.4);
}

/**
 * Converts an HTML5 Canvas to a 1-bit packed TSPL bitmap Uint8Array payload.
 * Automatically rotates landscape canvases 90 degrees clockwise to align with physical 14mm printhead.
 */
export function convertCanvasToTsplBytes(canvas, widthMm, heightMm, gapMm = 5, density = 3, copies = 1, ditherMethod = 'threshold', invertColors = false) {
  let srcCanvas = canvas;
  let printWidthMm = widthMm;
  let printHeightMm = heightMm;

  // Auto-rotate landscape canvas 90 degrees clockwise for physical 14mm printhead alignment
  if (canvas.width > canvas.height) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = canvas.height;
    rotCanvas.height = canvas.width;
    const rotCtx = rotCanvas.getContext('2d');
    
    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate(Math.PI / 2); // 90 deg clockwise
    rotCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    srcCanvas = rotCanvas;
    printWidthMm = heightMm;
    printHeightMm = widthMm;
  }

  const ctx = srcCanvas.getContext('2d');
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  // Compute padded width for 8-bit byte alignment
  const widthBytes = Math.ceil(w / 8);
  const rawBuffer = new Uint8Array(widthBytes * h);
  let idx = 0;

  for (let y = 0; y < h; y++) {
    for (let xByte = 0; xByte < widthBytes; xByte++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const xPixel = xByte * 8 + bit;
        if (xPixel < w) {
          const pixelIdx = (y * w + xPixel) * 4;
          const r = pixels[pixelIdx];
          const g = pixels[pixelIdx + 1];
          const b = pixels[pixelIdx + 2];
          const a = pixels[pixelIdx + 3];

          // Grayscale luminance
          const lum = a < 128 ? 255 : Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          let isBlack = false;
          if (ditherMethod === 'bayer16') {
            const bayerVal = BAYER_16x16[y % 16][xPixel % 16];
            isBlack = lum < bayerVal;
          } else {
            isBlack = lum < 128; // Default thresholding
          }

          // TSPL BITMAP Bit Mapping on Nelko P21:
          // 0 bit = Black pixel (thermal pin fires)
          // 1 bit = White paper (thermal pin off)
          const setBit = invertColors ? isBlack : !isBlack;
          if (setBit) {
            byteVal |= (1 << (7 - bit)); // MSB to LSB bit setting
          }
        }
      }
      rawBuffer[idx++] = byteVal;
    }
  }

  // Construct TSPL text header & footer matching rotated printhead dimensions
  const encoder = new TextEncoder();
  let headerStr = `SIZE ${printWidthMm.toFixed(1)} mm, ${printHeightMm.toFixed(1)} mm\r\n`;
  headerStr += gapMm > 0 ? `GAP ${gapMm.toFixed(1)} mm, 0 mm\r\n` : `GAP 0 mm, 0 mm\r\n`;
  headerStr += `DIRECTION 0\r\n`;
  headerStr += `DENSITY ${density}\r\n`;
  headerStr += `CLS\r\n`;
  headerStr += `BITMAP 0,0,${widthBytes},${h},0,`;

  const footerStr = `\r\nPRINT ${copies},1\r\n`;

  const headerBytes = encoder.encode(headerStr);
  const footerBytes = encoder.encode(footerStr);

  // Concatenate header + raw 1-bit binary raster + footer
  const totalPayload = new Uint8Array(headerBytes.length + rawBuffer.length + footerBytes.length);
  totalPayload.set(headerBytes, 0);
  totalPayload.set(rawBuffer, headerBytes.length);
  totalPayload.set(footerBytes, headerBytes.length + rawBuffer.length);

  return totalPayload;
}

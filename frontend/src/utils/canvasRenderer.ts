import { LabelElement } from '../types';
import { QrCacheItem } from '../components/CanvasWorkspace';

/**
 * Simple Code128 (Type B) encoder and canvas drawer helper
 */
export function drawCode128OnCanvas(
  ctx: CanvasRenderingContext2D,
  codeData: string,
  startX: number,
  startY: number,
  bcW: number,
  bcH: number
): void {
  const patterns = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "112214", "112412", "114212", "114411", "121124",
    "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211",
    "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211",
    "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
    "114311", "411113", "411311", "113141", "114131", "311141", "411131"
  ];
  
  const startPattern = "211214";
  const stopPattern = "2331112";
  
  let checksum = 104;
  let encodedModules = startPattern;
  
  for (let i = 0; i < codeData.length; i++) {
    const code = codeData.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      encodedModules += patterns[code];
      checksum += code * (i + 1);
    }
  }
  
  const checkDigit = checksum % 103;
  encodedModules += patterns[checkDigit];
  encodedModules += stopPattern;
  
  const totalModules = encodedModules.split('').reduce((sum, char) => sum + parseInt(char, 10), 0);
  const moduleW = bcW / totalModules;
  
  ctx.fillStyle = "#000000";
  let curX = startX - bcW / 2;
  
  for (let i = 0; i < encodedModules.length; i++) {
    const val = parseInt(encodedModules[i], 10);
    const isBar = (i % 2 === 0);
    const drawW = val * moduleW;
    
    if (isBar) {
      ctx.fillRect(curX, startY - bcH / 2, drawW, bcH);
    }
    curX += drawW;
  }
}

/**
 * Offscreen canvas builder helper for preview & print rasterization
 */
export function buildOffscreenCanvas(
  elements: LabelElement[],
  activeWidthMm: number,
  activeHeightMm: number,
  qrCache: Record<string, QrCacheItem> = {}
): HTMLCanvasElement {
  const dpi = 203;
  const canvasWidthPx = Math.round((activeWidthMm * dpi) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * dpi) / 25.4);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidthPx;
  canvas.height = canvasHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fill White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  // Draw Elements
  ctx.fillStyle = '#000000';
  elements.forEach(el => {
    const posX = (el.x / 100) * canvasWidthPx;
    const posY = (el.y / 100) * canvasHeightPx;

    if (el.type === 'text') {
      const fontFamily = el.fontFamily === 'monospace' ? 'monospace, "Courier New"' : 'Inter, sans-serif';
      ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.content, posX, posY);
    } else if (el.type === 'qr') {
      const qrSize = (el.size || 60);
      const cached = qrCache[el.content];
      if (cached && cached.img) {
        ctx.drawImage(cached.img, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
      } else {
        ctx.fillRect(posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - qrSize / 2 + 4, posY - qrSize / 2 + 4, qrSize - 8, qrSize - 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX - qrSize / 2 + 8, posY - qrSize / 2 + 8, qrSize - 16, qrSize - 16);
      }
    } else if (el.type === 'barcode') {
      const bcW = (el.width || 100);
      const bcH = (el.height || 30);
      drawCode128OnCanvas(ctx, el.content || '12345678', posX, posY, bcW, bcH);
    } else if (el.type === 'image' && el.url) {
      const img = el.imgObject || new Image();
      if (!el.imgObject) img.src = el.url;
      const imgW = (el.width || 60);
      const imgH = (el.height || 60);
      ctx.drawImage(img, posX - imgW / 2, posY - imgH / 2, imgW, imgH);
    } else if (el.type === 'line') {
      const lineW = (el.width || 120);
      const lineH = (el.height || 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(posX - lineW / 2, posY - lineH / 2, lineW, lineH);
    } else if (el.type === 'rectangle') {
      const rectW = (el.width || 160);
      const rectH = (el.height || 60);
      const thickness = (el.thickness || 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = thickness;
      ctx.strokeRect(posX - rectW / 2, posY - rectH / 2, rectW, rectH);
    }
  });

  return canvas;
}

/**
 * Offscreen canvas builder helper for a specific job elements structure (e.g. batch)
 */
export function buildOffscreenCanvasForJob(
  jobElements: LabelElement[],
  activeWidthMm: number,
  activeHeightMm: number,
  qrCache: Record<string, QrCacheItem> = {}
): HTMLCanvasElement {
  const dpi = 203;
  const canvasWidthPx = Math.round((activeWidthMm * dpi) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * dpi) / 25.4);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidthPx;
  canvas.height = canvasHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fill White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  // Draw Elements
  ctx.fillStyle = '#000000';
  jobElements.forEach(el => {
    const posX = (el.x / 100) * canvasWidthPx;
    const posY = (el.y / 100) * canvasHeightPx;

    if (el.type === 'text') {
      const fontFamily = el.fontFamily === 'monospace' ? 'monospace, "Courier New"' : 'Inter, sans-serif';
      ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.content, posX, posY);
    } else if (el.type === 'qr') {
      const qrSize = (el.size || 60);
      const cached = qrCache[el.content];
      if (el.imgObject) {
        ctx.drawImage(el.imgObject, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
      } else if (cached && cached.img) {
        ctx.drawImage(cached.img, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
      } else {
        ctx.fillRect(posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - qrSize / 2 + 4, posY - qrSize / 2 + 4, qrSize - 8, qrSize - 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX - qrSize / 2 + 8, posY - qrSize / 2 + 8, qrSize - 16, qrSize - 16);
      }
    } else if (el.type === 'barcode') {
      const bcW = (el.width || 100);
      const bcH = (el.height || 30);
      drawCode128OnCanvas(ctx, el.content || '12345678', posX, posY, bcW, bcH);
    } else if (el.type === 'image' && el.url) {
      const img = el.imgObject || new Image();
      if (!el.imgObject) img.src = el.url;
      const imgW = (el.width || 60);
      const imgH = (el.height || 60);
      ctx.drawImage(img, posX - imgW / 2, posY - imgH / 2, imgW, imgH);
    } else if (el.type === 'line') {
      const lineW = (el.width || 120);
      const lineH = (el.height || 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(posX - lineW / 2, posY - lineH / 2, lineW, lineH);
    } else if (el.type === 'rectangle') {
      const rectW = (el.width || 160);
      const rectH = (el.height || 60);
      const thickness = (el.thickness || 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = thickness;
      ctx.strokeRect(posX - rectW / 2, posY - rectH / 2, rectW, rectH);
    }
  });

  return canvas;
}

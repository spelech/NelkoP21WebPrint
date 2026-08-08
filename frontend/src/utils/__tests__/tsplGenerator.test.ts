import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mmToDots, convertCanvasToTsplBytes } from '../tsplGenerator';

describe('tsplGenerator', () => {
  describe('mmToDots', () => {
    it('calculates dots accurately at default 203 DPI', () => {
      expect(mmToDots(40)).toBe(320);
      expect(mmToDots(14)).toBe(112);
      expect(mmToDots(25.4)).toBe(203);
      expect(mmToDots(0)).toBe(0);
    });

    it('calculates dots accurately with custom DPI', () => {
      expect(mmToDots(10, 300)).toBe(118);
      expect(mmToDots(25.4, 300)).toBe(300);
    });
  });

  describe('convertCanvasToTsplBytes', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    function setupCanvasMock(pixelColor: [number, number, number, number] = [0, 0, 0, 255]) {
      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
        this: HTMLCanvasElement,
        contextId: string
      ) {
        if (contextId === '2d') {
          const width = this.width || 100;
          const height = this.height || 100;
          const mockData = new Uint8ClampedArray(width * height * 4);
          for (let i = 0; i < width * height; i++) {
            mockData[i * 4] = pixelColor[0];
            mockData[i * 4 + 1] = pixelColor[1];
            mockData[i * 4 + 2] = pixelColor[2];
            mockData[i * 4 + 3] = pixelColor[3];
          }

          return {
            translate: vi.fn(),
            rotate: vi.fn(),
            drawImage: vi.fn(),
            getImageData: vi.fn().mockImplementation((_x, _y, w, h) => ({
              data: new Uint8ClampedArray(w * h * 4)
            }))
          } as unknown as CanvasRenderingContext2D;
        }
        return null;
      });

      return getContextSpy;
    }

    it('renders portrait canvas to TSPL byte payload with correct header commands', () => {
      setupCanvasMock();

      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 320;

      const bytes = convertCanvasToTsplBytes(canvas, 14, 40, 5, 3, 1, 'threshold', false);
      expect(bytes).toBeInstanceOf(Uint8Array);

      const outputStr = new TextDecoder().decode(bytes);
      expect(outputStr).toContain('SIZE 14.0 mm, 40.0 mm');
      expect(outputStr).toContain('GAP 5.0 mm, 0 mm');
      expect(outputStr).toContain('DIRECTION 0');
      expect(outputStr).toContain('DENSITY 3');
      expect(outputStr).toContain('CLS');
      expect(outputStr).toContain('BITMAP 0,0,14,320,0,');
      expect(outputStr).toContain('PRINT 1,1');
    });

    it('auto-rotates landscape canvas 90 degrees clockwise for physical printhead alignment', () => {
      const mockTranslate = vi.fn();
      const mockRotate = vi.fn();
      const mockDrawImage = vi.fn();

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
        this: HTMLCanvasElement,
        contextId: string
      ) {
        if (contextId === '2d') {
          const width = this.width || 100;
          const height = this.height || 100;

          return {
            translate: mockTranslate,
            rotate: mockRotate,
            drawImage: mockDrawImage,
            getImageData: vi.fn().mockReturnValue({
              data: new Uint8ClampedArray(width * height * 4)
            })
          } as unknown as CanvasRenderingContext2D;
        }
        return null;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 112; // Landscape: width > height

      const bytes = convertCanvasToTsplBytes(canvas, 40, 14, 5, 3, 1, 'threshold', false);
      const outputStr = new TextDecoder().decode(bytes);

      expect(outputStr).toContain('SIZE 14.0 mm, 40.0 mm');
      expect(mockTranslate).toHaveBeenCalledWith(56, 160);
      expect(mockRotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(mockDrawImage).toHaveBeenCalled();
    });

    it('handles custom density, copies, gap, ditherMethod, and invertColors parameters', () => {
      setupCanvasMock();

      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 320;

      // Custom options: gapMm = 0, density = 5, copies = 3, bayer16 dithering, invertColors = true
      const bytes = convertCanvasToTsplBytes(canvas, 14, 40, 0, 5, 3, 'bayer16', true);
      const outputStr = new TextDecoder().decode(bytes);

      expect(outputStr).toContain('GAP 0 mm, 0 mm');
      expect(outputStr).toContain('DENSITY 5');
      expect(outputStr).toContain('PRINT 3,1');
    });

    it('throws error when canvas context is unavailable', () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 320;

      expect(() => {
        convertCanvasToTsplBytes(canvas, 14, 40);
      }).toThrow('Failed to get 2D context from canvas');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { drawCode128OnCanvas, buildOffscreenCanvas, buildOffscreenCanvasForJob } from './canvasRenderer';
import { LabelElement } from '../types';

describe('canvasRenderer', () => {
  beforeEach(() => {
    // Mock getContext('2d') for jsdom environment
    (HTMLCanvasElement.prototype.getContext as any) = function (contextId: string) {
      if (contextId === '2d') {
        return {
          fillStyle: '#000000',
          strokeStyle: '#000000',
          lineWidth: 1,
          font: '',
          textAlign: 'left',
          textBaseline: 'alphabetic',
          fillRect: () => {},
          strokeRect: () => {},
          fillText: () => {},
          drawImage: () => {}
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    };
  });

  it('draws Code128 on canvas context without throwing', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    if (ctx) {
      expect(() => drawCode128OnCanvas(ctx, '12345678', 100, 50, 80, 40)).not.toThrow();
    }
  });

  it('builds offscreen canvas for elements array', () => {
    const elements: LabelElement[] = [
      {
        id: 1,
        type: 'text',
        content: 'Test Label',
        fontSize: 16,
        fontStyle: 'normal',
        fontFamily: 'sans-serif',
        x: 50,
        y: 50
      },
      {
        id: 2,
        type: 'barcode',
        content: 'CODE128',
        barcodeType: 'code128',
        x: 50,
        y: 70,
        width: 80,
        height: 20
      },
      {
        id: 3,
        type: 'line',
        x: 50,
        y: 30,
        width: 100,
        height: 2
      },
      {
        id: 4,
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 120,
        height: 60,
        thickness: 2
      }
    ];

    const canvas = buildOffscreenCanvas(elements, 40, 30, {});
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('builds offscreen canvas for job elements', () => {
    const jobElements: LabelElement[] = [
      {
        id: 10,
        type: 'text',
        content: 'Job Text',
        fontSize: 14,
        fontStyle: 'bold',
        fontFamily: 'monospace',
        x: 50,
        y: 50
      }
    ];

    const canvas = buildOffscreenCanvasForJob(jobElements, 40, 30);
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});

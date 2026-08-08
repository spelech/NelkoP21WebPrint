import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrinterBridge } from './usePrinterBridge';
import { LabelPreset, LabelElement } from '../types';

describe('usePrinterBridge', () => {
  const mockPreset: LabelPreset = {
    name: '40 x 14 mm',
    width: 40,
    height: 14,
    gap: 5,
  };

  const mockElements: LabelElement[] = [
    { id: 1, type: 'text', content: 'Test Label', x: 50, y: 50, fontSize: 16 }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      contextId: string
    ) {
      if (contextId === '2d') {
        const width = this.width || 100;
        const height = this.height || 100;
        return {
          fillStyle: '#000000',
          strokeStyle: '#000000',
          lineWidth: 1,
          font: '',
          textAlign: 'left',
          textBaseline: 'alphabetic',
          translate: vi.fn(),
          rotate: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          fillText: vi.fn(),
          drawImage: vi.fn(),
          getImageData: vi.fn().mockImplementation((_x, _y, w, h) => ({
            data: new Uint8ClampedArray((w || width) * (h || height) * 4)
          }))
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    });
  });

  it('initializes default printer state correctly', () => {
    const { result } = renderHook(() =>
      usePrinterBridge({
        elements: mockElements,
        activeWidthMm: 40,
        activeHeightMm: 14,
        selectedPreset: mockPreset,
        qrCache: {},
        selectedTemplateId: null,
      })
    );

    expect(result.current.density).toBe(3);
    expect(result.current.copies).toBe(1);
    expect(result.current.invertColors).toBe(false);
    expect(result.current.ditherMethod).toBe('threshold');
    expect(result.current.useBrowserBt).toBe(true);
    expect(result.current.browserBtConnected).toBe(false);
    expect(result.current.isPrinting).toBe(false);
    expect(result.current.printStatus).toBeNull();
    expect(result.current.showPreview).toBe(false);
    expect(result.current.previewUrl).toBeNull();
  });

  it('updates density and copies state', () => {
    const { result } = renderHook(() =>
      usePrinterBridge({
        elements: mockElements,
        activeWidthMm: 40,
        activeHeightMm: 14,
        selectedPreset: mockPreset,
        qrCache: {},
        selectedTemplateId: null,
      })
    );

    act(() => {
      result.current.setDensity(5);
      result.current.setCopies(2);
      result.current.setInvertColors(true);
    });

    expect(result.current.density).toBe(5);
    expect(result.current.copies).toBe(2);
    expect(result.current.invertColors).toBe(true);
  });

  it('renders canvas to TSPL bytes', () => {
    const { result } = renderHook(() =>
      usePrinterBridge({
        elements: mockElements,
        activeWidthMm: 40,
        activeHeightMm: 14,
        selectedPreset: mockPreset,
        qrCache: {},
        selectedTemplateId: null,
      })
    );

    let bytes: Uint8Array | undefined;
    act(() => {
      bytes = result.current.renderCanvasToTsplBytes();
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes!.length).toBeGreaterThan(0);
  });
});

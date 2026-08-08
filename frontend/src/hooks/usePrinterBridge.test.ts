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
    vi.clearAllMocks();
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

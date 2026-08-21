import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrinterBridge, isMobileClient } from './usePrinterBridge';
import { LabelPreset, LabelElement } from '../types';

describe('isMobileClient helper', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('detects mobile user agents (Android, iPhone, iPad)', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      configurable: true,
    });
    expect(isMobileClient()).toBe(true);

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
      configurable: true,
    });
    expect(isMobileClient()).toBe(true);
  });

  it('detects coarse pointer (touch screen) as mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isMobileClient()).toBe(true);
  });

  it('returns false for desktop browsers without coarse pointer', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
      configurable: true,
    });
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isMobileClient()).toBe(false);
  });
});

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

  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    localStorage.clear();
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

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    localStorage.clear();
  });

  it('initializes default printer state correctly on desktop (isMobile=false, useBrowserBt=false)', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
      configurable: true,
    });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

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

    expect(result.current.isMobile).toBe(false);
    expect(result.current.useBrowserBt).toBe(false);
    expect(result.current.density).toBe(3);
    expect(result.current.copies).toBe(1);
    expect(result.current.invertColors).toBe(false);
    expect(result.current.ditherMethod).toBe('threshold');
    expect(result.current.browserBtConnected).toBe(false);
    expect(result.current.isPrinting).toBe(false);
    expect(result.current.printStatus).toBeNull();
    expect(result.current.showPreview).toBe(false);
    expect(result.current.previewUrl).toBeNull();
  });

  it('initializes default printer state correctly on mobile (isMobile=true, useBrowserBt=true)', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      configurable: true,
    });

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

    expect(result.current.isMobile).toBe(true);
    expect(result.current.useBrowserBt).toBe(true);
  });

  it('hydrates initial state from localStorage', () => {
    localStorage.setItem('nelko_print_density', '8');
    localStorage.setItem('nelko_print_copies', '5');
    localStorage.setItem('nelko_invert_colors', 'true');
    localStorage.setItem('nelko_use_browser_bt', 'false');

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      configurable: true,
    });

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

    expect(result.current.density).toBe(8);
    expect(result.current.copies).toBe(5);
    expect(result.current.invertColors).toBe(true);
    expect(result.current.useBrowserBt).toBe(false);
  });

  it('persists state changes to localStorage', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      configurable: true,
    });

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
      result.current.setDensity(6);
      result.current.setCopies(3);
      result.current.setInvertColors(true);
      result.current.setUseBrowserBt(false);
    });

    expect(result.current.density).toBe(6);
    expect(result.current.copies).toBe(3);
    expect(result.current.invertColors).toBe(true);
    expect(result.current.useBrowserBt).toBe(false);

    expect(localStorage.getItem('nelko_print_density')).toBe('6');
    expect(localStorage.getItem('nelko_print_copies')).toBe('3');
    expect(localStorage.getItem('nelko_invert_colors')).toBe('true');
    expect(localStorage.getItem('nelko_use_browser_bt')).toBe('false');
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

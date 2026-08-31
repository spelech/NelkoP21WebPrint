import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIconSearch } from '../useIconSearch';

describe('useIconSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns empty iconResults when iconSearch is empty string', () => {
    const { result } = renderHook(() => useIconSearch());

    expect(result.current.iconSearch).toBe('');
    expect(result.current.iconResults).toEqual([]);
    expect(result.current.isSearchingIcons).toBe(false);
  });

  it('filters offline catalog matching search query after debounce delay', async () => {
    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setIconSearch('home');
    });

    expect(result.current.isSearchingIcons).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.iconResults.some(ic => ic.name === 'home' && ic.source === 'offline')).toBe(true);
  });

  it('fetches online icons from Iconify API when navigator.onLine is true', async () => {
    const mockIconifyResponse = {
      icons: ['mdi:home-variant', 'lucide:home-heart'],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(mockIconifyResponse),
    } as Response);

    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setIconSearch('home');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('api.iconify.design/search?query=home&prefixes=lucide,fa6-solid,mdi'),
      expect.any(Object)
    );

    expect(result.current.iconResults.some(ic => ic.name === 'home-variant' && ic.source === 'online')).toBe(true);
    expect(result.current.iconResults.some(ic => ic.name === 'home-heart' && ic.source === 'online')).toBe(true);
    expect(result.current.isSearchingIcons).toBe(false);
  });

  it('skips online fetch when navigator.onLine is false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setIconSearch('home');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.iconResults.length).toBeGreaterThan(0);
    expect(result.current.isSearchingIcons).toBe(false);

    onLineSpy.mockRestore();
  });

  it('handles fetch failure gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setIconSearch('home');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Iconify lookup failed:', expect.any(Error));
    expect(result.current.isSearchingIcons).toBe(false);
  });

  it('resets results when search query is cleared', async () => {
    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setIconSearch('home');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.iconResults.length).toBeGreaterThan(0);

    act(() => {
      result.current.setIconSearch('');
    });

    expect(result.current.iconResults).toEqual([]);
    expect(result.current.isSearchingIcons).toBe(false);
  });

  it('filters offline catalog and online queries when selectedSet is changed', async () => {
    const mockIconifyResponse = {
      icons: ['lucide:home'],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(mockIconifyResponse),
    } as Response);

    const { result } = renderHook(() => useIconSearch());

    act(() => {
      result.current.setSelectedSet('lucide');
      result.current.setIconSearch('home');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('prefixes=lucide'),
      expect.any(Object)
    );
  });
});

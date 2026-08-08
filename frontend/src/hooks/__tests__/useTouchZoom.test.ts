import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTouchZoom } from '../useTouchZoom';

describe('useTouchZoom', () => {
  it('initializes with default zoom scale (1.5) or custom initial zoom', () => {
    const { result: defaultResult } = renderHook(() => useTouchZoom());
    expect(defaultResult.current.zoomScale).toBe(1.5);

    const { result: customResult } = renderHook(() => useTouchZoom(2.0));
    expect(customResult.current.zoomScale).toBe(2.0);
  });

  it('handles touch start with two fingers', () => {
    const { result } = renderHook(() => useTouchZoom(1.0));

    const mockStartEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 3, clientY: 4 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchStart(mockStartEvent);
    });

    expect(result.current.zoomScale).toBe(1.0);
  });

  it('calculates zoom scale change on touch move with pinch gesture', () => {
    const { result } = renderHook(() => useTouchZoom(1.0));

    const touchStartEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 100 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    const touchMoveEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 150 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchMove(touchMoveEvent);
    });

    expect(result.current.zoomScale).toBe(1.5);
  });

  it('clamps zoom scale to maximum 3.0 when zooming in excessively', () => {
    const { result } = renderHook(() => useTouchZoom(2.0));

    const touchStartEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 50 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    const touchMoveEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 200 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchMove(touchMoveEvent);
    });

    expect(result.current.zoomScale).toBe(3.0);
  });

  it('clamps zoom scale to minimum 0.5 when zooming out excessively', () => {
    const { result } = renderHook(() => useTouchZoom(1.0));

    const touchStartEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 100 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    const touchMoveEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 10 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchMove(touchMoveEvent);
    });

    expect(result.current.zoomScale).toBe(0.5);
  });

  it('resets touch distance on touch end', () => {
    const { result } = renderHook(() => useTouchZoom(1.0));

    const touchStartEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 100 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchStart(touchStartEvent);
    });

    act(() => {
      result.current.handleTouchEnd();
    });

    const touchMoveEvent = {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 0, clientY: 200 },
      ],
    } as unknown as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.handleTouchMove(touchMoveEvent);
    });

    expect(result.current.zoomScale).toBe(1.0);
  });

  it('allows manual setZoomScale', () => {
    const { result } = renderHook(() => useTouchZoom(1.0));

    act(() => {
      result.current.setZoomScale(2.5);
    });

    expect(result.current.zoomScale).toBe(2.5);
  });
});

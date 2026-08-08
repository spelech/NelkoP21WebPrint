import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasDrag } from '../useCanvasDrag';
import { LabelElement } from '../../types';

describe('useCanvasDrag', () => {
  const initialElements: LabelElement[] = [
    { id: 1, type: 'text', content: 'Item 1', x: 10, y: 20, fontSize: 12 },
    { id: 2, type: 'rectangle', x: 50, y: 50, width: 20, height: 20 },
  ];

  let mockContainer: HTMLDivElement;
  let elements: LabelElement[];
  let elementsRef: { current: LabelElement[] };
  let setElements: any;
  let pushHistory: any;
  let handleUndo: any;
  let handleRedo: any;

  beforeEach(() => {
    elements = [...initialElements];
    elementsRef = { current: elements };
    setElements = vi.fn((updater) => {
      if (typeof updater === 'function') {
        elements = updater(elements);
      } else {
        elements = updater;
      }
      elementsRef.current = elements;
    });
    pushHistory = vi.fn();
    handleUndo = vi.fn();
    handleRedo = vi.fn();

    mockContainer = document.createElement('div');
    vi.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 200,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts drag on handleStartDrag for mouse event', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    const mockEvent = {
      stopPropagation: vi.fn(),
      clientX: 40,
      clientY: 40,
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleStartDrag(mockEvent, 1);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.selectedId).toBe(1);
    expect(result.current.draggingId).toBe(1);
  });

  it('does nothing on handleStartDrag if containerRef is null', () => {
    const containerRef = { current: null };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    const mockEvent = {
      stopPropagation: vi.fn(),
      clientX: 40,
      clientY: 40,
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleStartDrag(mockEvent, 1);
    });

    expect(result.current.selectedId).toBeNull();
    expect(result.current.draggingId).toBeNull();
  });

  it('handles drag movement and mouseup reset', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.handleStartDrag({ stopPropagation: vi.fn(), clientX: 40, clientY: 40 } as unknown as React.MouseEvent, 1);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 60 }));
    });

    expect(setElements).toHaveBeenCalled();
    expect(elements[0].x).toBe(20);
    expect(elements[0].y).toBe(30);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.draggingId).toBeNull();
    expect(result.current.alignmentGuides).toEqual([]);
  });

  it('applies 8px grid snapping when snapToGrid is true', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: true,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.handleStartDrag({ stopPropagation: vi.fn(), clientX: 40, clientY: 40 } as unknown as React.MouseEvent, 1);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 45, clientY: 40 }));
    });

    expect(elements[0].x).toBe(12);
  });

  it('calculates alignment guides within 1.5% threshold', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.handleStartDrag({ stopPropagation: vi.fn(), clientX: 40, clientY: 40 } as unknown as React.MouseEvent, 1);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 198, clientY: 99 }));
    });

    expect(result.current.alignmentGuides.length).toBeGreaterThan(0);
    expect(elements[0].x).toBe(50);
    expect(elements[0].y).toBe(50);
  });

  it('nudges selected element with nudgeSelectedElement and arrow keys', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.setSelectedId(1);
    });

    act(() => {
      result.current.nudgeSelectedElement(2, -3);
    });

    expect(pushHistory).toHaveBeenCalled();
    expect(elements[0].x).toBe(12);
    expect(elements[0].y).toBe(17);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(elements[0].x).toBe(13);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true }));
    });
    expect(elements[0].x).toBe(8);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(elements[0].y).toBe(18);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
    });
    expect(elements[0].y).toBe(13);
  });

  it('deletes selected element on deleteSelectedElement or Delete/Backspace keys', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.setSelectedId(1);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    });

    expect(pushHistory).toHaveBeenCalled();
    expect(elements.find(el => el.id === 1)).toBeUndefined();
    expect(result.current.selectedId).toBe(2);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    });

    expect(elements).toEqual([]);
    expect(result.current.selectedId).toBeNull();
  });

  it('triggers undo and redo keyboard shortcuts', () => {
    const containerRef = { current: mockContainer };
    renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
        handleUndo,
        handleRedo,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
    expect(handleUndo).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    });
    expect(handleRedo).toHaveBeenCalled();
  });

  it('ignores arrow and delete keys when focus is on an input element', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() =>
      useCanvasDrag({
        elements,
        elementsRef,
        setElements,
        pushHistory,
        snapToGrid: false,
        canvasWidthPx: 400,
        canvasHeightPx: 200,
        containerRef,
      })
    );

    act(() => {
      result.current.setSelectedId(1);
    });

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(elements.length).toBe(2);
    document.body.removeChild(input);
  });
});

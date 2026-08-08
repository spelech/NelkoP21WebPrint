import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';
import { LabelElement } from '../../types';

describe('useHistory', () => {
  const initialElements: LabelElement[] = [
    { id: 1, type: 'text', content: 'Initial', x: 10, y: 10, fontSize: 14 },
  ];

  it('initializes with default state when no arguments provided', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.elements).toEqual([]);
    expect(result.current.history).toEqual([[]]);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.elementsRef.current).toEqual([]);
  });

  it('initializes with provided initial elements', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    expect(result.current.elements).toEqual(initialElements);
    expect(result.current.history).toEqual([initialElements]);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.elementsRef.current).toEqual(initialElements);
  });

  it('pushes new state into history', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    const newElements: LabelElement[] = [
      ...initialElements,
      { id: 2, type: 'rectangle', x: 20, y: 20, width: 30, height: 15 },
    ];

    act(() => {
      result.current.pushHistory(newElements);
    });

    expect(result.current.history.length).toBe(2);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.history[1]).toEqual(newElements);
  });

  it('handles undo correctly', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    const step1: LabelElement[] = [
      ...initialElements,
      { id: 2, type: 'rectangle', x: 20, y: 20 },
    ];

    act(() => {
      result.current.pushHistory(step1);
    });

    expect(result.current.historyIndex).toBe(1);

    act(() => {
      result.current.handleUndo();
    });

    expect(result.current.historyIndex).toBe(0);
    expect(result.current.elements).toEqual(initialElements);
  });

  it('handles redo correctly', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    const step1: LabelElement[] = [
      ...initialElements,
      { id: 2, type: 'rectangle', x: 20, y: 20 },
    ];

    act(() => {
      result.current.pushHistory(step1);
    });

    act(() => {
      result.current.handleUndo();
    });

    expect(result.current.historyIndex).toBe(0);
    expect(result.current.elements).toEqual(initialElements);

    act(() => {
      result.current.handleRedo();
    });

    expect(result.current.historyIndex).toBe(1);
    expect(result.current.elements).toEqual(step1);
  });

  it('respects undo boundary at index 0', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    expect(result.current.historyIndex).toBe(0);

    act(() => {
      result.current.handleUndo();
    });

    expect(result.current.historyIndex).toBe(0);
    expect(result.current.elements).toEqual(initialElements);
  });

  it('respects redo boundary at end of history', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    const step1: LabelElement[] = [
      ...initialElements,
      { id: 2, type: 'rectangle', x: 20, y: 20 },
    ];

    act(() => {
      result.current.pushHistory(step1);
    });

    expect(result.current.historyIndex).toBe(1);

    act(() => {
      result.current.handleRedo();
    });

    expect(result.current.historyIndex).toBe(1);
    expect(result.current.elements).toEqual(initialElements);
  });

  it('truncates future history when pushing new state after undo', () => {
    const { result } = renderHook(() => useHistory(initialElements));

    const step1: LabelElement[] = [{ id: 1, type: 'text', content: 'Step 1', x: 0, y: 0, fontSize: 12 }];
    const step2: LabelElement[] = [{ id: 1, type: 'text', content: 'Step 2', x: 0, y: 0, fontSize: 12 }];
    const step3Branch: LabelElement[] = [{ id: 1, type: 'text', content: 'Step 3 Alt', x: 0, y: 0, fontSize: 12 }];

    act(() => {
      result.current.pushHistory(step1);
    });
    act(() => {
      result.current.pushHistory(step2);
    });
    expect(result.current.history.length).toBe(3);

    act(() => {
      result.current.handleUndo();
    });

    act(() => {
      result.current.pushHistory(step3Branch);
    });

    expect(result.current.history.length).toBe(3);
    expect(result.current.historyIndex).toBe(2);
    expect(result.current.history[2]).toEqual(step3Branch);
  });

  it('allows manual setElements, setHistory, and setHistoryIndex', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.setElements(initialElements);
      result.current.setHistory([initialElements]);
      result.current.setHistoryIndex(0);
    });

    expect(result.current.elements).toEqual(initialElements);
    expect(result.current.history).toEqual([initialElements]);
    expect(result.current.historyIndex).toBe(0);
  });
});

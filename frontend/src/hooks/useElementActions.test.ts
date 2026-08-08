import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useElementActions } from './useElementActions';
import { LabelPreset, LabelElement } from '../types';

describe('useElementActions', () => {
  const mockPreset: LabelPreset = {
    name: '40 x 14 mm',
    width: 40,
    height: 14,
    gap: 5
  };

  it('adds a text element and updates history', () => {
    let elements: LabelElement[] = [];
    const setElements = vi.fn((newElements) => {
      elements = typeof newElements === 'function' ? newElements(elements) : newElements;
    });
    const pushHistory = vi.fn();
    const setSelectedPreset = vi.fn();
    const setSelectedTemplateId = vi.fn();
    const setSelectedId = vi.fn();
    const setHistory = vi.fn();
    const setHistoryIndex = vi.fn();

    const { result } = renderHook(() =>
      useElementActions({
        elements,
        setElements,
        pushHistory,
        selectedPreset: mockPreset,
        setSelectedPreset,
        setSelectedTemplateId,
        selectedId: null,
        setSelectedId,
        setHistory,
        setHistoryIndex,
      })
    );

    act(() => {
      result.current.addTextElement();
    });

    expect(pushHistory).toHaveBeenCalled();
    expect(setElements).toHaveBeenCalled();
    expect(setSelectedId).toHaveBeenCalled();
  });

  it('clears canvas when confirmed', () => {
    const windowConfirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const elements: LabelElement[] = [{ id: 1, type: 'text', content: 'test', x: 0, y: 0, fontSize: 16 }];
    const setElements = vi.fn();
    const pushHistory = vi.fn();

    const { result } = renderHook(() =>
      useElementActions({
        elements,
        setElements,
        pushHistory,
        selectedPreset: mockPreset,
        setSelectedPreset: vi.fn(),
        setSelectedTemplateId: vi.fn(),
        selectedId: 1,
        setSelectedId: vi.fn(),
        setHistory: vi.fn(),
        setHistoryIndex: vi.fn(),
      })
    );

    act(() => {
      result.current.handleClearCanvas();
    });

    expect(pushHistory).toHaveBeenCalledWith([]);
    expect(setElements).toHaveBeenCalledWith([]);
    windowConfirmSpy.mockRestore();
  });
});

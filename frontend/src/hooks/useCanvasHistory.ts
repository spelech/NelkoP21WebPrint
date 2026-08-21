import { useState, useCallback } from 'react';
import { LabelElement } from '../types';

export type SetElementsAction = LabelElement[] | ((prev: LabelElement[]) => LabelElement[]);

export interface UseCanvasHistoryReturn {
  elements: LabelElement[];
  setElements: (newElements: SetElementsAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: (newElements?: LabelElement[]) => void;
}

export function useCanvasHistory(initialElements: LabelElement[] = []): UseCanvasHistoryReturn {
  const [past, setPast] = useState<LabelElement[][]>([]);
  const [present, setPresent] = useState<LabelElement[]>(initialElements);
  const [future, setFuture] = useState<LabelElement[][]>([]);

  const setElements = useCallback((newElements: SetElementsAction) => {
    setPast(prevPast => [...prevPast, present]);
    setPresent(prevPresent => typeof newElements === 'function' ? newElements(prevPresent) : newElements);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture(prevFuture => [present, ...prevFuture]);
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prevPast => [...prevPast, present]);
    setFuture(newFuture);
    setPresent(next);
  }, [future, present]);

  const clearHistory = useCallback((newElements: LabelElement[] = []) => {
    setPast([]);
    setPresent(newElements);
    setFuture([]);
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    elements: present,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
}

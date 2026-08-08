import { useState, useRef, useEffect } from 'react';
import { LabelElement } from '../types';

export function useHistory(initialElements: LabelElement[] = []) {
  const [elements, setElements] = useState<LabelElement[]>(initialElements);
  const [history, setHistory] = useState<LabelElement[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const elementsRef = useRef<LabelElement[]>(elements);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const pushHistory = (newElements: LabelElement[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newElements);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setElements(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElements(history[nextIndex]);
    }
  };

  return {
    elements,
    setElements,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    elementsRef,
    pushHistory,
    handleUndo,
    handleRedo,
  };
}

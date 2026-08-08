import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { LabelElement } from '../types';

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  x?: number;
  y?: number;
}

interface UseCanvasDragOptions {
  elements: LabelElement[];
  elementsRef: React.MutableRefObject<LabelElement[]>;
  setElements: Dispatch<SetStateAction<LabelElement[]>>;
  pushHistory: (newElements: LabelElement[]) => void;
  snapToGrid: boolean;
  canvasWidthPx: number;
  canvasHeightPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function useCanvasDrag({
  elements,
  elementsRef,
  setElements,
  pushHistory,
  snapToGrid,
  canvasWidthPx,
  canvasHeightPx,
  containerRef,
  handleUndo,
  handleRedo,
}: UseCanvasDragOptions) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const snapToGridRef = useRef(snapToGrid);
  useEffect(() => {
    snapToGridRef.current = snapToGrid;
  }, [snapToGrid]);

  const canvasWidthPxRef = useRef(canvasWidthPx);
  const canvasHeightPxRef = useRef(canvasHeightPx);
  useEffect(() => {
    canvasWidthPxRef.current = canvasWidthPx;
    canvasHeightPxRef.current = canvasHeightPx;
  }, [canvasWidthPx, canvasHeightPx]);

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, id: number) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = ((clientX - rect.left) / rect.width) * 100;
    const cursorY = ((clientY - rect.top) / rect.height) * 100;

    const el = elements.find(item => item.id === id);
    if (el) {
      dragOffsetRef.current = { x: cursorX - el.x, y: cursorY - el.y };
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
    }

    setSelectedId(id);
    setDraggingId(id);
  };

  useEffect(() => {
    if (draggingId === null) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 1) return;
      if (!containerRef.current) return;

      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = ((clientX - rect.left) / rect.width) * 100;
      const cursorY = ((clientY - rect.top) / rect.height) * 100;

      let newX = cursorX - dragOffsetRef.current.x;
      let newY = cursorY - dragOffsetRef.current.y;

      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      let snappedX = false;
      let snappedY = false;

      if (snapToGridRef.current && canvasWidthPxRef.current > 0 && canvasHeightPxRef.current > 0) {
        const pxX = (newX / 100) * canvasWidthPxRef.current;
        const pxY = (newY / 100) * canvasHeightPxRef.current;
        const snappedPxX = Math.round(pxX / 8) * 8;
        const snappedPxY = Math.round(pxY / 8) * 8;
        newX = (snappedPxX / canvasWidthPxRef.current) * 100;
        newY = (snappedPxY / canvasHeightPxRef.current) * 100;
        snappedX = true;
        snappedY = true;
      }

      const threshold = 1.5;
      const guides: AlignmentGuide[] = [];
      const otherElements = elementsRef.current.filter(el => el.id !== draggingId);

      const xTargets = [50, ...otherElements.map(el => el.x)];
      for (const targetX of xTargets) {
        if (Math.abs(newX - targetX) <= threshold) {
          newX = targetX;
          guides.push({ type: 'vertical', x: targetX });
          snappedX = true;
          break;
        }
      }

      const yTargets = [50, ...otherElements.map(el => el.y)];
      for (const targetY of yTargets) {
        if (Math.abs(newY - targetY) <= threshold) {
          newY = targetY;
          guides.push({ type: 'horizontal', y: targetY });
          snappedY = true;
          break;
        }
      }

      if (!snappedX) {
        newX = Math.round(newX * 10) / 10;
      }
      if (!snappedY) {
        newY = Math.round(newY * 10) / 10;
      }

      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setAlignmentGuides(guides);
      setElements(prev => prev.map(el => el.id === draggingId ? { ...el, x: newX, y: newY } : el));
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      setAlignmentGuides([]);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingId, containerRef, setElements, elementsRef]);

  const nudgeSelectedElement = (dx: number, dy: number) => {
    if (!selectedId) return;
    const selected = elementsRef.current.find(el => el.id === selectedId);
    if (!selected) return;

    const newX = Math.max(0, Math.min(100, Math.round((selected.x + dx) * 10) / 10));
    const newY = Math.max(0, Math.min(100, Math.round((selected.y + dy) * 10) / 10));
    const newElements = elementsRef.current.map(el => el.id === selectedId ? { ...el, x: newX, y: newY } : el);
    pushHistory(newElements);
    setElements(newElements);
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    const newElements = elementsRef.current.filter(el => el.id !== selectedId);
    pushHistory(newElements);
    setElements(newElements);
    setSelectedId(newElements.length > 0 ? newElements[0].id : null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo?.();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo?.();
        return;
      }

      if (!selectedId) return;
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      const step = e.shiftKey ? 5 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedElement(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedElement(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelectedElement(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelectedElement(0, step);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleUndo, handleRedo]);

  return {
    selectedId,
    setSelectedId,
    draggingId,
    setDraggingId,
    alignmentGuides,
    handleStartDrag,
    nudgeSelectedElement,
    deleteSelectedElement,
  };
}

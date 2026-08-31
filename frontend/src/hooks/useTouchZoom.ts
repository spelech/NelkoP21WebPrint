import { useState, useRef, TouchEvent, useCallback } from 'react';

export function useTouchZoom(initialZoom = 1.5) {
  const [zoomScale, setZoomScale] = useState<number>(initialZoom);
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const touchStartDistRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLElement>): void => {
    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLElement>): void => {
    if (e.touches && e.touches.length === 2 && (touchStartDistRef.current || touchStartDist)) {
      const currentDist = touchStartDistRef.current || touchStartDist || 0;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (currentDist > 0) {
        setZoomScale(prev => {
          const newScale = prev * (dist / currentDist);
          return Math.min(Math.max(Math.round(newScale * 100) / 100, 0.5), 3.0);
        });
      }
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  }, [touchStartDist]);

  const handleTouchEnd = useCallback((): void => {
    setTouchStartDist(null);
    touchStartDistRef.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    setZoomScale(prev => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomScale(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomScale(1.0);
  }, []);

  const fitToWidth = useCallback((containerWidthPx: number, canvasWidthPx: number) => {
    if (containerWidthPx > 0 && canvasWidthPx > 0) {
      const scale = Math.min(1.0, Math.max(0.5, (containerWidthPx - 32) / canvasWidthPx));
      setZoomScale(Math.round(scale * 100) / 100);
    }
  }, []);

  return {
    zoomScale,
    setZoomScale,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth
  };
}

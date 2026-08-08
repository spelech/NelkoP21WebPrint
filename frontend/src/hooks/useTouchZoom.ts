import { useState, useRef, TouchEvent } from 'react';

export function useTouchZoom(initialZoom = 1.5) {
  const [zoomScale, setZoomScale] = useState<number>(initialZoom);
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const touchStartDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.touches.length === 2 && (touchStartDistRef.current || touchStartDist)) {
      const currentDist = touchStartDistRef.current || touchStartDist || 0;
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (currentDist > 0) setZoomScale(prev => Math.min(Math.max(prev * (dist / currentDist), 0.5), 3.0));
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = (): void => {
    setTouchStartDist(null);
    touchStartDistRef.current = null;
  };

  return { zoomScale, setZoomScale, handleTouchStart, handleTouchMove, handleTouchEnd };
}

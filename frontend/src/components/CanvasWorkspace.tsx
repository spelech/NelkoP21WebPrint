import React, { RefObject, MouseEvent, TouchEvent, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { LabelElement } from '../types';

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  x?: number;
  y?: number;
}

export interface QrCacheItem {
  url: string;
  img: HTMLImageElement;
}

export interface CanvasWorkspaceProps {
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  activeWidthMm: number;
  activeHeightMm: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  isPortraitView: boolean;
  showGrid: boolean;
  containerRef: RefObject<HTMLDivElement>;
  setSelectedId: (id: number | null) => void;
  handleTouchStart: (e: TouchEvent<HTMLElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLElement>) => void;
  handleTouchEnd: () => void;
  draggingId: number | null;
  alignmentGuides: AlignmentGuide[];
  elements: LabelElement[];
  selectedId: number | null;
  handleStartDrag: (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>, id: number) => void;
  qrCache: Record<string, QrCacheItem>;
}

export default function CanvasWorkspace({
  zoomScale,
  setZoomScale,
  canvasWidthPx,
  canvasHeightPx,
  showGrid,
  containerRef,
  setSelectedId,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  draggingId,
  alignmentGuides,
  elements,
  selectedId,
  handleStartDrag,
  qrCache
}: CanvasWorkspaceProps): React.ReactElement {
  // Auto-fit canvas on initial load or canvas dimension change on mobile viewports
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const availableWidth = window.innerWidth - 32;
      if (canvasWidthPx > availableWidth) {
        const fitScale = Math.min(1.0, Math.max(0.5, availableWidth / canvasWidthPx));
        setZoomScale(Math.round(fitScale * 100) / 100);
      }
    }
  }, [canvasWidthPx, setZoomScale]);

  return (
    <main 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 bg-slate-900/50 p-2 md:p-8 flex flex-col items-center justify-start md:justify-center relative overflow-auto pb-32 md:pb-0 touch-manipulation select-none"
    >
      {/* Thermal Label Workspace Simulation */}
      <div className="flex flex-col items-center max-w-full">
        {/* Scalable Label Paper Sheet Wrapper */}
        <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} className="my-4 transition-transform duration-75 ease-out">
          <div 
            ref={containerRef}
            onClick={() => setSelectedId(null)}
            style={{ 
              width: `${canvasWidthPx}px`, 
              height: `${canvasHeightPx}px`,
              ...(showGrid ? {
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                backgroundSize: '8px 8px'
              } : {})
            }}
            className="bg-white rounded-lg shadow-2xl shadow-indigo-500/10 border-2 border-slate-300 relative select-none overflow-visible"
          >
            {/* Alignment Guides Overlay Layer */}
            {draggingId !== null && alignmentGuides.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-md">
                {alignmentGuides.map((guide, idx) => {
                  if (guide.type === 'vertical') {
                    return (
                      <div
                        key={`v-${idx}-${guide.x}`}
                        style={{
                          position: 'absolute',
                          left: `${guide.x}%`,
                          top: 0,
                          bottom: 0,
                          width: '1px',
                          borderLeft: '1px dashed #ef4444',
                          transform: 'translateX(-50%)'
                        }}
                      />
                    );
                  } else {
                    return (
                      <div
                        key={`h-${idx}-${guide.y}`}
                        style={{
                          position: 'absolute',
                          top: `${guide.y}%`,
                          left: 0,
                          right: 0,
                          height: '1px',
                          borderTop: '1px dashed #ef4444',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    );
                  }
                })}
              </div>
            )}

            {/* LAYER 1: Core Element Drawing */}
            <div className="absolute inset-0 overflow-hidden rounded-md">
              {elements.map(el => (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.width || 60}px` : el.type === 'barcode' ? `${el.width || 100}px` : el.type === 'line' ? `${el.width || 120}px` : el.type === 'rectangle' ? `${el.width || 160}px` : 'max-content',
                    height: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.height || 60}px` : el.type === 'barcode' ? `${el.height || 30}px` : el.type === 'line' ? `${el.height || 4}px` : el.type === 'rectangle' ? `${el.height || 60}px` : 'auto',
                    minWidth: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.width || 60}px` : el.type === 'barcode' ? `${el.width || 100}px` : el.type === 'line' ? `${el.width || 120}px` : el.type === 'rectangle' ? `${el.width || 160}px` : 'max-content',
                    minHeight: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.height || 60}px` : el.type === 'barcode' ? `${el.height || 30}px` : el.type === 'line' ? `${el.height || 4}px` : el.type === 'rectangle' ? `${el.height || 60}px` : 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    flexShrink: 0,
                    cursor: 'move',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {el.type === 'text' && (
                    <span 
                      style={{ 
                        fontFamily: el.fontFamily === 'monospace' ? 'monospace' : 'sans-serif',
                        fontSize: `${el.fontSize || 22}px`, 
                        fontWeight: el.fontStyle === 'bold' ? 'bold' : 'normal',
                        textAlign: el.align || 'center',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        maxWidth: 'none',
                        flexShrink: 0
                      }}
                      className="text-slate-900 leading-none select-none tracking-tight font-outfit"
                    >
                      {el.content}
                    </span>
                  )}

                  {el.type === 'qr' && (
                    qrCache[el.content] && qrCache[el.content].url ? (
                      <img 
                        src={qrCache[el.content].url} 
                        alt="QR Code" 
                        style={{ 
                          width: `${el.size || 60}px`, 
                          height: `${el.size || 60}px`,
                          minWidth: `${el.size || 60}px`,
                          minHeight: `${el.size || 60}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          flexShrink: 0
                        }}
                        className="shadow-sm"
                      />
                    ) : (
                      <div 
                        style={{ 
                          width: `${el.size || 60}px`, 
                          height: `${el.size || 60}px`,
                          minWidth: `${el.size || 60}px`,
                          minHeight: `${el.size || 60}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          flexShrink: 0
                        }} 
                        className="bg-slate-900 text-white flex flex-col items-center justify-center rounded text-[9px] font-mono p-1 text-center shadow-inner overflow-hidden"
                      >
                        <QrCode className="w-1/2 h-1/2 mb-0.5 text-indigo-300 min-w-[16px] min-h-[16px]" />
                        {(el.size || 60) >= 50 && <span className="text-[8px] opacity-80 leading-none">[QR Code]</span>}
                      </div>
                    )
                  )}

                  {el.type === 'image' && (
                    <img 
                      src={el.url} 
                      alt="Uploaded Graphic" 
                      style={{ 
                        width: `${el.width || 60}px`, 
                        height: `${el.height || 60}px`,
                        minWidth: `${el.width || 60}px`,
                        minHeight: `${el.height || 60}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        flexShrink: 0,
                        objectFit: 'contain' 
                      }}
                      className="rounded shadow-sm"
                    />
                  )}

                  {el.type === 'barcode' && (
                    <div 
                      style={{ 
                        width: `${el.width || 100}px`, 
                        height: `${el.height || 30}px`,
                        minWidth: `${el.width || 100}px`, 
                        minHeight: `${el.height || 30}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        flexShrink: 0
                      }} 
                      className="bg-white border border-slate-200 flex flex-col items-center justify-between rounded p-1 shadow-inner relative overflow-hidden"
                    >
                      <div className="w-full flex-1 flex items-stretch justify-around px-2 opacity-80 pointer-events-none">
                        {[1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2].map((w, idx) => (
                          <div key={idx} className="bg-slate-900" style={{ width: `${w}px` }} />
                        ))}
                      </div>
                      <span className="text-[7px] font-mono leading-none tracking-widest uppercase text-slate-700 truncate max-w-full px-1">
                        {el.content}
                      </span>
                    </div>
                  )}

                  {el.type === 'line' && (
                    <div 
                      style={{ 
                        width: `${el.width || 120}px`, 
                        height: `${el.height || 4}px`,
                        minWidth: `${el.width || 120}px`, 
                        minHeight: `${el.height || 4}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        flexShrink: 0
                      }} 
                      className="bg-slate-900 rounded-full animate-pulse-subtle"
                    />
                  )}

                  {el.type === 'rectangle' && (
                    <div 
                      style={{ 
                        width: `${el.width || 160}px`, 
                        height: `${el.height || 60}px`,
                        minWidth: `${el.width || 160}px`, 
                        minHeight: `${el.height || 60}px`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        flexShrink: 0,
                        border: `${el.thickness || 2}px solid #0f172a`
                      }} 
                      className="bg-transparent rounded-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* LAYER 2: Interactive Handles & Position Badges (Floats outside without clipping) */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
              {elements.map(el => {
                const isSelected = selectedId === el.id;
                const isBeingDragged = draggingId === el.id;

                return (
                  <div 
                    key={el.id}
                    onMouseDown={(e) => handleStartDrag(e, el.id)}
                    onTouchStart={(e) => handleStartDrag(e, el.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.width || 60}px` : el.type === 'barcode' ? `${el.width || 100}px` : el.type === 'line' ? `${el.width || 120}px` : el.type === 'rectangle' ? `${el.width || 160}px` : undefined,
                      height: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.height || 60}px` : el.type === 'barcode' ? `${el.height || 30}px` : el.type === 'line' ? `${el.height || 4}px` : el.type === 'rectangle' ? `${el.height || 60}px` : undefined,
                      minWidth: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.width || 60}px` : el.type === 'barcode' ? `${el.width || 100}px` : el.type === 'line' ? `${el.width || 120}px` : el.type === 'rectangle' ? `${el.width || 160}px` : 'max-content',
                      minHeight: el.type === 'qr' ? `${el.size || 60}px` : el.type === 'image' ? `${el.height || 60}px` : el.type === 'barcode' ? `${el.height || 30}px` : el.type === 'line' ? `${el.height || 4}px` : el.type === 'rectangle' ? `${el.height || 60}px` : 'auto',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      flexShrink: 0,
                      transform: 'translate(-50%, -50%)',
                      border: isSelected ? '2.5px solid #6366f1' : '1px dashed rgba(99, 102, 241, 0.4)',
                      borderRadius: '4px',
                      cursor: isBeingDragged ? 'grabbing' : 'grab',
                      zIndex: isSelected ? 40 : 10,
                      boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.35)' : 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      pointerEvents: 'auto'
                    }}
                    className="group"
                  >
                    {/* Hover tooltip for quick label reading */}
                    <div className="absolute top-[-26px] left-1/2 translate-x-[-50%] bg-slate-950/90 text-[10px] text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 shadow-md whitespace-nowrap z-50 capitalize">
                      {el.type}: {Math.round(el.x)}%, {Math.round(el.y)}%
                    </div>

                    {/* Dragging coordinate badge */}
                    {isSelected && (
                      <div className="absolute bottom-[-24px] left-1/2 translate-x-[-50%] bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                        X: {Math.round(el.x)}% Y: {Math.round(el.y)}%
                      </div>
                    )}

                    {/* Resize handle (bottom right) */}
                    {isSelected && (el.type === 'image' || el.type === 'barcode' || el.type === 'line' || el.type === 'rectangle') && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md transform translate-x-1/2 translate-y-1/2 z-50 flex items-center justify-center"
                        title="Drag to resize element width & height"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Zoom & Fit Controls Pill */}
      <div className="fixed bottom-16 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-full px-2 py-1 shadow-xl text-xs">
        <button
          onClick={() => setZoomScale(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-300 active:scale-95 transition font-bold text-sm"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            const fit = Math.min(1.0, Math.max(0.5, (window.innerWidth - 32) / canvasWidthPx));
            setZoomScale(Math.round(fit * 100) / 100);
          }}
          className="min-h-[28px] px-2.5 py-1 rounded-full hover:bg-slate-800 text-indigo-300 font-mono text-[11px] font-semibold active:scale-95 transition flex items-center justify-center"
          title="Fit to Screen Width"
        >
          {Math.round(zoomScale * 100)}%
        </button>
        <button
          onClick={() => setZoomScale(z => Math.min(3.0, Math.round((z + 0.1) * 10) / 10))}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-300 active:scale-95 transition font-bold text-sm"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
      </div>
    </main>
  );
}

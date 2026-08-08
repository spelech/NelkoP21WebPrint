import React, { RefObject, MouseEvent, TouchEvent } from 'react';
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
  handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLDivElement>) => void;
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
  return (
    <main className="flex-1 bg-slate-900/50 p-2 md:p-8 flex flex-col items-center justify-center relative overflow-auto pb-20 md:pb-0">
      {/* Thermal Label Workspace Simulation */}
      <div className="flex flex-col items-center">
        {/* Scalable Label Paper Sheet Wrapper */}
        <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} className="my-4">
          <div 
            ref={containerRef}
            onClick={() => setSelectedId(null)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                    cursor: 'move',
                    userSelect: 'none'
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
                        whiteSpace: 'nowrap'
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
                        style={{ width: `${el.size || 60}px`, height: `${el.size || 60}px` }}
                        className="shadow-sm"
                      />
                    ) : (
                      <div 
                        style={{ width: `${el.size || 60}px`, height: `${el.size || 60}px` }} 
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
                      style={{ width: `${el.width || 60}px`, height: `${el.height || 60}px`, objectFit: 'contain' }}
                      className="rounded shadow-sm"
                    />
                  )}

                  {el.type === 'barcode' && (
                    <div 
                      style={{ width: `${el.width || 100}px`, height: `${el.height || 30}px` }} 
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
                        height: `${el.height || 4}px` 
                      }} 
                      className="bg-slate-900 rounded-full animate-pulse-subtle"
                    />
                  )}

                  {el.type === 'rectangle' && (
                    <div 
                      style={{ 
                        width: `${el.width || 160}px`, 
                        height: `${el.height || 60}px`,
                        border: `${el.thickness || 2}px solid #0f172a`
                      }} 
                      className="bg-transparent rounded-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* LAYER 2: Interactive Handles & Position Badges (Floats outside without clipping) */}
            <div className="absolute inset-0 overflow-visible">
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
                      width: el.type === 'qr' ? `${el.size || 60}px` : `${el.width || 60}px`,
                      height: el.type === 'qr' ? `${el.size || 60}px` : `${el.height || 60}px`,
                      transform: 'translate(-50%, -50%)',
                      border: isSelected ? '2.5px solid #6366f1' : '1px dashed rgba(99, 102, 241, 0.4)',
                      borderRadius: '4px',
                      cursor: isBeingDragged ? 'grabbing' : 'grab',
                      zIndex: isSelected ? 40 : 10,
                      boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.35)' : 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
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
    </main>
  );
}

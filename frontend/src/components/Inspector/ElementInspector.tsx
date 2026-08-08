import React from 'react';
import { 
  Sliders, 
  Trash2, 
  Move, 
  AlignCenter, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { LabelElement, TextElement, BarcodeElement, QRElement } from '../../types';
import TextInspector from './TextInspector';
import BarcodeInspector from './BarcodeInspector';
import QRInspector from './QRInspector';

export interface ElementInspectorProps {
  selectedElement: LabelElement | null;
  updateSelectedElement: (key: string, val: any) => void;
  updateQRHelper: (helperType: string, fieldUpdates: Record<string, string>) => void;
  deleteSelectedElement: () => void;
  nudgeSelectedElement: (dx: number, dy: number) => void;
  sendToBack: () => void;
  bringToFront: () => void;
  pushHistory: (newElements: LabelElement[]) => void;
  elementsRef: React.MutableRefObject<LabelElement[]>;
  elements: LabelElement[];
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  selectedElement,
  updateSelectedElement,
  updateQRHelper,
  deleteSelectedElement,
  nudgeSelectedElement,
  sendToBack,
  bringToFront,
  pushHistory,
  elementsRef,
  elements,
  setElements,
}) => {
  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm gap-3">
        <Sliders className="w-8 h-8 text-slate-700" />
        <p>Tap an element on the canvas to inspect it</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4 pb-2">
      {/* Inspector Header & Delete Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Element Properties
        </span>
        <button 
          type="button"
          onClick={deleteSelectedElement}
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
          title="Delete element"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Inspectors */}
      {selectedElement.type === 'text' && (
        <TextInspector 
          element={selectedElement as TextElement}
          updateSelectedElement={updateSelectedElement}
          pushHistory={pushHistory}
          elementsRef={elementsRef}
        />
      )}

      {selectedElement.type === 'barcode' && (
        <BarcodeInspector 
          element={selectedElement as BarcodeElement}
          updateSelectedElement={updateSelectedElement}
          pushHistory={pushHistory}
          elementsRef={elementsRef}
        />
      )}

      {selectedElement.type === 'qr' && (
        <QRInspector 
          element={selectedElement as QRElement}
          updateQRHelper={updateQRHelper}
          updateSelectedElement={updateSelectedElement}
          pushHistory={pushHistory}
          elementsRef={elementsRef}
        />
      )}

      {/* Dimension Sliders for Image, Barcode, Line, Rectangle */}
      {(selectedElement.type === 'image' || selectedElement.type === 'barcode' || selectedElement.type === 'line' || selectedElement.type === 'rectangle') && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                {selectedElement.type === 'line' ? 'Line Length' : 'Width'}
              </label>
              <span className="text-xs font-mono text-indigo-300">{selectedElement.width || 60}px</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="320" 
              value={selectedElement.width || 60}
              onChange={(e) => {
                const newW = parseInt(e.target.value, 10);
                const currentH = selectedElement.height || 60;
                const currentW = selectedElement.width || 60;
                const ratio = currentH / currentW;
                if (selectedElement.type === 'image' && (selectedElement as any).keepRatio !== false && ratio) {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, width: newW, height: Math.round(newW * ratio) } : el));
                } else {
                  updateSelectedElement('width', newW);
                }
              }}
              onMouseUp={() => pushHistory(elementsRef.current)}
              onTouchEnd={() => pushHistory(elementsRef.current)}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                {selectedElement.type === 'line' ? 'Line Thickness' : 'Height'}
              </label>
              <span className="text-xs font-mono text-indigo-300">{selectedElement.height || (selectedElement.type === 'line' ? 4 : 60)}px</span>
            </div>
            <input 
              type="range" 
              min={selectedElement.type === 'line' ? 1 : 5} 
              max={selectedElement.type === 'line' ? 24 : 150} 
              value={selectedElement.height || (selectedElement.type === 'line' ? 4 : 60)}
              onChange={(e) => {
                const newH = parseInt(e.target.value, 10);
                const currentH = selectedElement.height || 60;
                const currentW = selectedElement.width || 60;
                const ratio = currentW / currentH;
                if (selectedElement.type === 'image' && (selectedElement as any).keepRatio !== false && ratio) {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, height: newH, width: Math.round(newH * ratio) } : el));
                } else {
                  updateSelectedElement('height', newH);
                }
              }}
              onMouseUp={() => pushHistory(elementsRef.current)}
              onTouchEnd={() => pushHistory(elementsRef.current)}
              className="w-full accent-indigo-500"
            />
          </div>
          {selectedElement.type === 'image' && (
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox"
                checked={(selectedElement as any).keepRatio !== false}
                onChange={(e) => {
                  updateSelectedElement('keepRatio', e.target.checked);
                  pushHistory(elementsRef.current);
                }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
              />
              Lock Aspect Ratio
            </label>
          )}
          {selectedElement.type === 'rectangle' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400">Border Thickness</label>
                <span className="text-xs font-mono text-indigo-300">{(selectedElement as any).thickness || 2}px</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="12" 
                value={(selectedElement as any).thickness || 2}
                onChange={(e) => updateSelectedElement('thickness', parseInt(e.target.value, 10))}
                onMouseUp={() => pushHistory(elementsRef.current)}
                onTouchEnd={() => pushHistory(elementsRef.current)}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Position & Alignment Controls */}
      <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          Position & Alignment
        </span>

        {/* Numerical Sliders */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Position X</label>
              <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.x)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={selectedElement.x}
              onChange={(e) => updateSelectedElement('x', parseFloat(e.target.value))}
              onMouseUp={() => pushHistory(elementsRef.current)}
              onTouchEnd={() => pushHistory(elementsRef.current)}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Position Y</label>
              <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.y)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={selectedElement.y}
              onChange={(e) => updateSelectedElement('y', parseFloat(e.target.value))}
              onMouseUp={() => pushHistory(elementsRef.current)}
              onTouchEnd={() => pushHistory(elementsRef.current)}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Quick Align & Nudge */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400">Quick Align & Nudge</label>
          <div className="flex flex-col gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between gap-2">
              <button 
                type="button"
                onClick={() => {
                  const newElements = elements.map(el => el.id === selectedElement.id ? { ...el, x: 50 } : el);
                  pushHistory(newElements);
                  setElements(newElements);
                }}
                className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                title="Center Horizontally"
              >
                <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
                Center X
              </button>
              <button 
                type="button"
                onClick={() => {
                  const newElements = elements.map(el => el.id === selectedElement.id ? { ...el, y: 50 } : el);
                  pushHistory(newElements);
                  setElements(newElements);
                }}
                className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                title="Center Vertically"
              >
                <AlignCenter className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
                Center Y
              </button>
            </div>

            {/* D-Pad Nudge Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <div></div>
              <button 
                type="button"
                onClick={() => nudgeSelectedElement(0, -2)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div></div>
              <button 
                type="button"
                onClick={() => nudgeSelectedElement(-2, 0)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={() => nudgeSelectedElement(0, 2)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={() => nudgeSelectedElement(2, 0)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layer arrangement buttons */}
            <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-800/80">
              <button 
                type="button"
                onClick={sendToBack}
                className="py-1 px-2 rounded bg-slate-800/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition"
                title="Send Element to Back (bottom layer)"
              >
                Send to Back
              </button>
              <button 
                type="button"
                onClick={bringToFront}
                className="py-1 px-2 rounded bg-slate-800/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition"
                title="Bring Element to Front (top layer)"
              >
                Bring to Front
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementInspector;

import React, { RefObject, ChangeEvent } from 'react';
import { Plus, ChevronDown, Type, QrCode, Barcode, Minus, Square, Image as ImageIcon } from 'lucide-react';

export interface AddElementsProps {
  addTextElement: () => void;
  addQRElement: () => void;
  addBarcodeElement: () => void;
  addLineElement: () => void;
  addRectangleElement: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  collapsedAddElements: boolean;
  setCollapsedAddElements: (collapsed: boolean) => void;
}

export default function AddElements({
  addTextElement,
  addQRElement,
  addBarcodeElement,
  addLineElement,
  addRectangleElement,
  fileInputRef,
  handleImageUpload,
  collapsedAddElements,
  setCollapsedAddElements
}: AddElementsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setCollapsedAddElements(!collapsedAddElements)}
        className="flex items-center justify-between w-full text-left focus:outline-none py-1 group"
      >
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          Add Elements
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsedAddElements ? '-rotate-90' : ''}`} />
      </button>

      {!collapsedAddElements && (
        <div className="grid grid-cols-3 gap-2 pl-1">
          <button 
            onClick={addTextElement}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
          >
            <Type className="w-4 h-4 text-indigo-400" />
            Text
          </button>
          <button 
            onClick={addQRElement}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
          >
            <QrCode className="w-4 h-4 text-violet-400" />
            QR
          </button>
          <button 
            onClick={addBarcodeElement}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
          >
            <Barcode className="w-4 h-4 text-indigo-400" />
            Barcode
          </button>
          <button 
            onClick={addLineElement}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
          >
            <Minus className="w-4 h-4 text-amber-400" />
            Line
          </button>
          <button 
            onClick={addRectangleElement}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
          >
            <Square className="w-4 h-4 text-sky-400" />
            Border
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            title="Upload Graphic / Logo / Image"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Image
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
}

import React, { RefObject, ChangeEvent } from 'react';
import { Plus, ChevronDown, Type, QrCode, Barcode, Minus, Square, Image as ImageIcon, Variable } from 'lucide-react';

export interface AddElementsProps {
  addTextElement: () => void;
  addQRElement: () => void;
  addBarcodeElement: () => void;
  addLineElement: () => void;
  addRectangleElement: () => void;
  addPlaceholderElement?: (placeholderVar: string) => void;
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
  addPlaceholderElement,
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
        <div className="flex flex-col gap-3 pl-1">
          {/* Core Elements Grid */}
          <div className="grid grid-cols-3 gap-2">
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

          {/* ESP32 Template Placeholders Section */}
          {addPlaceholderElement && (
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Variable className="w-3 h-3 text-amber-400" />
                ESP32 Template Fields
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => addPlaceholderElement('mainText')}
                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[10px] text-amber-300 font-medium transition text-left"
                >
                  + &#123;&#123;mainText&#125;&#125;
                </button>
                <button
                  onClick={() => addPlaceholderElement('subtitle')}
                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[10px] text-amber-300 font-medium transition text-left"
                >
                  + &#123;&#123;subtitle&#125;&#125;
                </button>
                <button
                  onClick={() => addPlaceholderElement('barcodeData')}
                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[10px] text-amber-300 font-medium transition text-left"
                >
                  + &#123;&#123;barcodeData&#125;&#125;
                </button>
                <button
                  onClick={() => addPlaceholderElement('qrData')}
                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[10px] text-amber-300 font-medium transition text-left"
                >
                  + &#123;&#123;qrData&#125;&#125;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

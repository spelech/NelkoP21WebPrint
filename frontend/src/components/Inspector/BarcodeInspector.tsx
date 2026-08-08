import React from 'react';
import { BarcodeElement, LabelElement } from '../../types';

interface BarcodeInspectorProps {
  element: BarcodeElement;
  updateSelectedElement: (key: string, val: any) => void;
  pushHistory: (newElements: LabelElement[]) => void;
  elementsRef: React.MutableRefObject<LabelElement[]>;
}

export const BarcodeInspector: React.FC<BarcodeInspectorProps> = ({
  element,
  updateSelectedElement,
  pushHistory,
  elementsRef,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Barcode Content</label>
        <input 
          type="text" 
          value={element.content || ''}
          onChange={(e) => updateSelectedElement('content', e.target.value)}
          onBlur={() => pushHistory(elementsRef.current)}
          className="w-full p-2.5 rounded-xl glass-input text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Barcode Encoding</label>
        <select
          value={element.barcodeType || 'code128'}
          onChange={(e) => {
            updateSelectedElement('barcodeType', e.target.value);
            pushHistory(elementsRef.current);
          }}
          className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
        >
          <option value="code128" className="bg-slate-900 text-slate-100">Code 128 (Standard)</option>
          <option value="ean13" className="bg-slate-900 text-slate-100">EAN 13 (Retail Product)</option>
          <option value="ean8" className="bg-slate-900 text-slate-100">EAN 8 (Mini Retail)</option>
        </select>
      </div>
    </div>
  );
};

export default BarcodeInspector;

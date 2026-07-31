import React from 'react';
import { Sliders, ChevronDown, Upload, Eye } from 'lucide-react';

export default function PrintParameters({
  density,
  setDensity,
  copies,
  setCopies,
  invertColors,
  setInvertColors,
  elements,
  setShowBatchModal,
  collapsedPrintParams,
  setCollapsedPrintParams,
  handleGeneratePreview
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setCollapsedPrintParams(!collapsedPrintParams)}
        className="flex items-center justify-between w-full text-left focus:outline-none py-1 group"
      >
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Print Parameters
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsedPrintParams ? '-rotate-90' : ''}`} />
      </button>

      {!collapsedPrintParams && (
        <div className="flex flex-col gap-3 pl-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Density ({density})</label>
              <input 
                type="range" 
                min="0" 
                max="15" 
                value={density}
                onChange={(e) => setDensity(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Copies</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                className="w-full p-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={invertColors}
                onChange={(e) => setInvertColors(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
              />
              Invert Colors (White-on-Black)
            </label>
          </div>

          <button
            onClick={() => {
              if (elements.length === 0) {
                alert("Canvas is empty. Add elements first or load a template.");
                return;
              }
              setShowBatchModal(true);
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Batch Print from CSV...
          </button>

          <button
            onClick={handleGeneratePreview}
            className="mt-1 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 text-xs font-semibold transition"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Print Output
          </button>
        </div>
      )}
    </div>
  );
}

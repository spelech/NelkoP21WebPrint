import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function PreviewModal({ isOpen, onClose, previewUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col items-center">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          1-Bit Thermal Print Preview
        </h3>
        <p className="text-xs text-slate-400 mb-4 text-center">
          Simulated monochrome 203 DPI thermal print head output (Rotated for Printhead)
        </p>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-6 flex items-center justify-center min-h-[200px] w-full">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="1-bit preview" 
              className="max-h-[300px] border border-slate-700 shadow-lg object-contain" 
            />
          ) : (
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          )}
        </div>

        <button 
          onClick={onClose}
          className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}

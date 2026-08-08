import React, { RefObject, ChangeEvent } from 'react';
import { Grid, ChevronDown, RotateCw, Wifi } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { LabelPreset, LabelElement } from '../types';

export interface TemplateItem {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
  layout_json?: string | LabelElement[];
}

export interface LayoutPresetsProps {
  selectedPreset: LabelPreset;
  setSelectedPreset: (preset: LabelPreset) => void;
  isPortraitView: boolean;
  setIsPortraitView: (isPortrait: boolean) => void;
  templates: TemplateItem[];
  selectedTemplateId: number | string | null;
  setSelectedTemplateId: (id: number | string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  setHistory: (history: LabelElement[][]) => void;
  setHistoryIndex: (index: number) => void;
  elements: LabelElement[];
  handleExportLayout: () => void;
  layoutFileInputRef: RefObject<HTMLInputElement>;
  handleImportLayout: (e: ChangeEvent<HTMLInputElement>) => void;
  handleClearCanvas: () => void;
  handlePushToEsp32: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  collapsedPresets: boolean;
  setCollapsedPresets: (collapsed: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
  PRESETS: LabelPreset[];
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
}

export default function LayoutPresets({
  selectedPreset,
  setSelectedPreset,
  isPortraitView,
  setIsPortraitView,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  setElements,
  setHistory,
  setHistoryIndex,
  handleExportLayout,
  layoutFileInputRef,
  handleImportLayout,
  handleClearCanvas,
  handlePushToEsp32,
  snapToGrid,
  setSnapToGrid,
  showGrid,
  setShowGrid,
  collapsedPresets,
  setCollapsedPresets,
  theme,
  setTheme,
  PRESETS,
  zoomScale,
  setZoomScale
}: LayoutPresetsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setCollapsedPresets(!collapsedPresets)}
        className="flex items-center justify-between w-full text-left focus:outline-none py-1 group"
      >
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
          <Grid className="w-3.5 h-3.5 text-indigo-400" />
          Presets & Layout
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsedPresets ? '-rotate-90' : ''}`} />
      </button>

      {!collapsedPresets && (
        <div className="flex flex-col gap-4 pl-1">
          {/* Preset Selector */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Label Dimension Preset</label>
            <select
              value={selectedPreset.name}
              onChange={(e) => {
                const found = PRESETS.find(p => p.name === e.target.value);
                if (found) {
                  setSelectedPreset(found);
                  setSelectedTemplateId(null);
                  setElements([]);
                  setHistory([[]]);
                  setHistoryIndex(0);
                }
              }}
              className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
            >
              {PRESETS.map(p => (
                <option key={p.name} value={p.name} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Workspace Orientation</span>
            <button
              onClick={() => setIsPortraitView(!isPortraitView)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-slate-200 text-xs font-semibold transition"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isPortraitView ? 'Portrait (Vertical)' : 'Landscape (Horizontal)'}</span>
            </button>
          </div>

          {/* Template Database Dropdown */}
          {templates.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Load Design Template</label>
              <select
                value={selectedTemplateId ? String(selectedTemplateId) : ''}
                onChange={(e) => {
                  const tid = e.target.value;
                  if (!tid) {
                    setSelectedTemplateId(null);
                    setElements([]);
                    setHistory([[]]);
                    setHistoryIndex(0);
                  } else {
                    const t = templates.find(item => String(item.id) === String(tid));
                    if (t) {
                      const foundPreset = PRESETS.find(p => p.width === t.width_mm && p.height === t.height_mm) || {
                        name: `${t.width_mm}x${t.height_mm} mm (Custom)`,
                        width: t.width_mm,
                        height: t.height_mm,
                        gap: 5
                      };
                      setSelectedPreset(foundPreset);
                      
                      let initialElements: LabelElement[] = [];
                      if (t.layout_json) {
                        try {
                          initialElements = typeof t.layout_json === 'string' ? JSON.parse(t.layout_json) : t.layout_json;
                        } catch (err) {
                          console.error("Failed to parse design JSON:", err);
                        }
                      }
                      
                      // Preload image elements for the canvas
                      const imagePreloads = initialElements.map(el => {
                        if (el.type === 'image' && el.url) {
                          const img = new Image();
                          img.onload = () => { el.imgObject = img; };
                          img.src = el.url;
                        }
                        return el;
                      });

                      setElements(imagePreloads);
                      setSelectedTemplateId(t.id);
                      setHistory([initialElements]);
                      setHistoryIndex(0);
                    }
                  }
                }}
                className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-medium"
              >
                <option value="" className="bg-slate-900 text-slate-400">-- Start Blank / No Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={String(t.id)} className="bg-slate-900 text-slate-100">
                    {t.name} ({t.width_mm}x{t.height_mm}mm)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Layout Action Buttons (Export, Import, Clear, Push to ESP32) */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button 
                onClick={handleExportLayout}
                className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-350 hover:text-slate-200 transition text-center"
                title="Export current canvas layout as JSON file"
              >
                Export
              </button>
              <button 
                onClick={() => layoutFileInputRef.current?.click()}
                className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-350 hover:text-slate-200 transition text-center"
                title="Import a previously saved canvas layout JSON"
              >
                Import
              </button>
              <button 
                onClick={handleClearCanvas}
                className="flex-1 py-1.5 px-2 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition text-center"
                title="Clear all elements from canvas to start fresh"
              >
                Clear
              </button>
              <input 
                type="file" 
                ref={layoutFileInputRef} 
                onChange={handleImportLayout} 
                accept=".json" 
                className="hidden" 
              />
            </div>

            <button
              onClick={handlePushToEsp32}
              className="w-full py-2 px-3 rounded-xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              title="Push current layout template directly to ESP32 Bridge over Wi-Fi"
            >
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
              <span>Push to ESP32 Bridge</span>
            </button>
          </div>

          {/* Layout Parameters - Snap to Grid & Show Grid Toggles */}
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              Layout Settings
            </span>
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
              />
              Snap to 8px Grid
            </label>
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
              />
              Show Grid
            </label>

            {/* Workspace Zoom Control */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-450">Workspace Zoom</span>
              <div className="flex items-center gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                {[1.0, 1.5, 2.0].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setZoomScale(s)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[9px] transition-all ${zoomScale === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {s * 100}%
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <ThemeSelector theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

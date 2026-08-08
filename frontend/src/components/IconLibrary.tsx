import React from 'react';
import { Sparkles, ChevronDown, RefreshCw } from 'lucide-react';
import { MdiCategories } from '../utils/mdiIcons';

export interface IconResult {
  name: string;
  path?: string;
  source: 'offline' | 'online';
}

export interface IconLibraryProps {
  iconSearch: string;
  setIconSearch: (search: string) => void;
  iconResults: IconResult[];
  isSearchingIcons: boolean;
  addIconElement: (name: string, path: string) => void;
  handleSelectWebIcon: (iconName: string) => void;
  collapsedIcons: boolean;
  setCollapsedIcons: (collapsed: boolean) => void;
  MDI_OFFLINE: MdiCategories;
}

export default function IconLibrary({
  iconSearch,
  setIconSearch,
  iconResults,
  isSearchingIcons,
  addIconElement,
  handleSelectWebIcon,
  collapsedIcons,
  setCollapsedIcons,
  MDI_OFFLINE
}: IconLibraryProps): React.ReactElement {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <button
        onClick={() => setCollapsedIcons(!collapsedIcons)}
        className="flex items-center justify-between w-full text-left focus:outline-none py-1 group"
      >
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Icons Library
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsedIcons ? '-rotate-90' : ''}`} />
      </button>

      {!collapsedIcons && (
        <div className="pl-1">
          <input 
            type="text" 
            placeholder="Search icons (e.g., home, star)..."
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            className="w-full p-2.5 mb-3 rounded-xl glass-input text-sm"
          />
          
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
            {iconSearch === '' ? (
              // Default Offline Curated Icons Grid
              Object.values(MDI_OFFLINE).flat().map((ic, i) => (
                <button
                  key={`offline-${i}`}
                  onClick={() => addIconElement(ic.name, ic.path)}
                  className="flex items-center justify-center p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition"
                  title={ic.name}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="currentColor">
                    <path d={ic.path} />
                  </svg>
                </button>
              ))
            ) : (
              // Search Results
              <>
                {iconResults.map((ic, i) => (
                  <button
                    key={`res-${i}`}
                    onClick={() => {
                      if (ic.source === 'offline' && ic.path) {
                        addIconElement(ic.name, ic.path);
                      } else {
                        handleSelectWebIcon(ic.name);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition relative"
                    title={ic.name}
                  >
                    {ic.source === 'offline' && ic.path ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="currentColor">
                        <path d={ic.path} />
                      </svg>
                    ) : (
                      <img 
                        src={`https://api.iconify.design/mdi/${ic.name}.svg?color=%23cbd5e1`} 
                        alt={ic.name}
                        className="w-5 h-5 object-contain"
                        loading="lazy"
                      />
                    )}
                    {ic.source === 'online' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                    )}
                  </button>
                ))}
                {isSearchingIcons && (
                  <div className="col-span-4 py-4 flex justify-center">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  </div>
                )}
                {!isSearchingIcons && iconResults.length === 0 && (
                  <div className="col-span-4 text-center py-4 text-xs text-slate-500">
                    No matching icons found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

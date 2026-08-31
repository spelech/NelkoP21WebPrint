import React from 'react';
import { Sparkles, ChevronDown, RefreshCw } from 'lucide-react';
import { MdiCategories, MdiIcon } from '../utils/mdiIcons';
import { IconResult } from '../hooks/useIconSearch';

export interface IconLibraryProps {
  iconSearch: string;
  setIconSearch: (search: string) => void;
  selectedSet?: 'all' | 'lucide' | 'fa6-solid' | 'mdi';
  setSelectedSet?: (set: 'all' | 'lucide' | 'fa6-solid' | 'mdi') => void;
  iconResults: IconResult[];
  isSearchingIcons: boolean;
  addIconElement: (name: string, pathOrSvg: string, iconSet?: string, viewBox?: string) => void;
  handleSelectWebIcon: (iconName: string, iconSet?: string) => void;
  collapsedIcons: boolean;
  setCollapsedIcons: (collapsed: boolean) => void;
  MDI_OFFLINE: MdiCategories;
}

export default function IconLibrary({
  iconSearch,
  setIconSearch,
  selectedSet = 'all',
  setSelectedSet,
  iconResults,
  isSearchingIcons,
  addIconElement,
  handleSelectWebIcon,
  collapsedIcons,
  setCollapsedIcons,
  MDI_OFFLINE
}: IconLibraryProps): React.ReactElement {
  const iconSets: Array<{ id: 'all' | 'lucide' | 'fa6-solid' | 'mdi'; label: string }> = [
    { id: 'all', label: 'All Sets' },
    { id: 'lucide', label: 'Lucide' },
    { id: 'fa6-solid', label: 'Font Awesome' },
    { id: 'mdi', label: 'MDI' },
  ];

  const renderIconPreview = (ic: { name: string; path?: string; svg?: string; set?: string; viewBox?: string }) => {
    const viewBox = ic.viewBox || '0 0 24 24';
    const isLucide = ic.set === 'lucide';

    if (ic.svg) {
      if (ic.svg.trim().startsWith('<svg')) {
        return (
          <div 
            className="w-5 h-5 flex items-center justify-center text-slate-300 [&>svg]:w-5 [&>svg]:h-5"
            dangerouslySetInnerHTML={{ __html: ic.svg }} 
          />
        );
      }
      return (
        <svg 
          viewBox={viewBox} 
          className="w-5 h-5 text-slate-300"
          fill={isLucide ? 'none' : 'currentColor'}
          stroke={isLucide ? 'currentColor' : 'none'}
          strokeWidth={isLucide ? 2 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: ic.svg }}
        />
      );
    }

    return (
      <svg 
        viewBox={viewBox} 
        className="w-5 h-5 text-slate-300"
        fill={isLucide ? 'none' : 'currentColor'}
        stroke={isLucide ? 'currentColor' : 'none'}
        strokeWidth={isLucide ? 2 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={ic.path || ''} />
      </svg>
    );
  };

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
          {/* Icon Set Filters */}
          {setSelectedSet && (
            <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 no-scrollbar">
              {iconSets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSet(s.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition whitespace-nowrap ${
                    selectedSet === s.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <input 
            type="text" 
            placeholder="Search icons (e.g. home, box, star)..."
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            className="w-full p-2.5 mb-3 rounded-xl glass-input text-sm"
          />
          
          <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {iconSearch === '' ? (
              // Default Offline Curated Icons Grid
              Object.values(MDI_OFFLINE)
                .flat()
                .filter((ic: MdiIcon) => selectedSet === 'all' || (ic.set || 'mdi') === selectedSet)
                .map((ic: MdiIcon, i: number) => (
                  <button
                    key={`offline-${i}`}
                    onClick={() => addIconElement(ic.name, ic.svg || ic.path || '', ic.set || 'mdi', ic.viewBox || '0 0 24 24')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition relative group"
                    title={`${ic.name} (${ic.set || 'mdi'})`}
                  >
                    {renderIconPreview(ic)}
                    <span className="text-[8px] text-slate-400 truncate w-full text-center mt-1 font-mono">
                      {ic.name}
                    </span>
                    {ic.set && (
                      <span className="absolute top-0.5 right-1 text-[7px] text-slate-500 uppercase font-mono group-hover:text-indigo-400">
                        {ic.set === 'fa6-solid' ? 'fa' : ic.set}
                      </span>
                    )}
                  </button>
                ))
            ) : (
              // Search Results
              <>
                {iconResults.map((ic, i) => (
                  <button
                    key={`res-${i}`}
                    onClick={() => {
                      if (ic.source === 'offline' && (ic.svg || ic.path)) {
                        addIconElement(ic.name, ic.svg || ic.path || '', ic.set || 'mdi', ic.viewBox || '0 0 24 24');
                      } else {
                        handleSelectWebIcon(ic.name, ic.set || 'mdi');
                      }
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition relative group"
                    title={`${ic.name} (${ic.set || 'mdi'})`}
                  >
                    {ic.source === 'offline' && (ic.svg || ic.path) ? (
                      renderIconPreview(ic)
                    ) : (
                      <img 
                        src={`https://api.iconify.design/${ic.set || 'mdi'}/${ic.name}.svg?color=%23cbd5e1`} 
                        alt={ic.name}
                        className="w-5 h-5 object-contain"
                        loading="lazy"
                      />
                    )}
                    <span className="text-[8px] text-slate-400 truncate w-full text-center mt-1 font-mono">
                      {ic.name}
                    </span>
                    <span className="absolute top-0.5 right-1 text-[7px] text-slate-500 uppercase font-mono group-hover:text-indigo-400">
                      {ic.set === 'fa6-solid' ? 'fa' : ic.set || 'mdi'}
                    </span>
                    {ic.source === 'online' && (
                      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online Iconify Icon" />
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

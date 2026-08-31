import { useState, useEffect, useRef } from 'react';
import { MDI_OFFLINE, MdiIcon } from '../utils/mdiIcons';

export interface IconResult {
  name: string;
  source: 'offline' | 'online';
  set?: 'lucide' | 'fa6-solid' | 'mdi' | string;
  category?: string;
  path?: string;
  svg?: string;
  viewBox?: string;
  fullName?: string;
}

export function useIconSearch() {
  const [iconSearch, setIconSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<'all' | 'lucide' | 'fa6-solid' | 'mdi'>('all');
  const [iconResults, setIconResults] = useState<IconResult[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!iconSearch) {
      setIconResults([]);
      setIsSearchingIcons(false);
      return;
    }

    setIsSearchingIcons(true);

    const delayDebounceFn = setTimeout(async () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      searchAbortControllerRef.current = controller;

      const matches: IconResult[] = [];
      const catalog = MDI_OFFLINE as Record<string, MdiIcon[]>;
      Object.entries(catalog).forEach(([cat, icons]) => {
        icons.forEach((ic) => {
          const iconSet = ic.set || 'mdi';
          if (selectedSet !== 'all' && iconSet !== selectedSet) {
            return;
          }
          if (ic.name.toLowerCase().includes(iconSearch.toLowerCase())) {
            matches.push({
              name: ic.name,
              set: iconSet,
              category: cat,
              source: 'offline',
              path: ic.path,
              svg: ic.svg,
              viewBox: ic.viewBox,
              fullName: `${iconSet}:${ic.name}`
            });
          }
        });
      });
      setIconResults(matches);

      if (navigator.onLine) {
        try {
          const prefixes = selectedSet === 'all' ? 'lucide,fa6-solid,mdi' : selectedSet;
          const res = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(iconSearch)}&prefixes=${prefixes}&limit=24`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (data.icons && data.icons.length > 0) {
            const webMatches: IconResult[] = [];
            for (let i = 0; i < Math.min(data.icons.length, 24); i++) {
              const full: string = data.icons[i];
              let prefix = 'mdi';
              let cleanName = full;
              if (full.includes(':')) {
                const parts = full.split(':');
                prefix = parts[0];
                cleanName = parts[1];
              }
              if (!matches.some(m => m.name === cleanName && (m.set === prefix || !m.set))) {
                webMatches.push({
                  name: cleanName,
                  set: prefix,
                  source: 'online',
                  fullName: full
                });
              }
            }
            if (!controller.signal.aborted) {
              setIconResults(prev => [...prev, ...webMatches]);
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('Iconify lookup failed:', err);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingIcons(false);
          }
        }
      } else {
        setIsSearchingIcons(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [iconSearch, selectedSet]);

  return {
    iconSearch,
    setIconSearch,
    selectedSet,
    setSelectedSet,
    iconResults,
    isSearchingIcons,
  };
}

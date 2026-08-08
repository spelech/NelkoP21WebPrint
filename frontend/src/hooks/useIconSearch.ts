import { useState, useEffect, useRef } from 'react';
import { MDI_OFFLINE } from '../utils/mdiIcons';

export interface IconResult {
  name: string;
  source: 'offline' | 'online';
  category?: string;
  path?: string;
}

export function useIconSearch() {
  const [iconSearch, setIconSearch] = useState('');
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
      const catalog = MDI_OFFLINE as Record<string, Array<{ name: string; path: string }>>;
      Object.entries(catalog).forEach(([_cat, icons]) => {
        icons.forEach((ic: { name: string; path: string }) => {
          if (ic.name.toLowerCase().includes(iconSearch.toLowerCase())) {
            matches.push({ ...ic, source: 'offline' });
          }
        });
      });
      setIconResults(matches);

      if (navigator.onLine) {
        try {
          const res = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(iconSearch)}&prefix=mdi`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (data.icons && data.icons.length > 0) {
            const webMatches: IconResult[] = [];
            for (let i = 0; i < Math.min(data.icons.length, 12); i++) {
              const fullName: string = data.icons[i];
              const cleanName = fullName.replace('mdi:', '');
              if (!matches.some(m => m.name === cleanName)) {
                webMatches.push({ name: cleanName, source: 'online' });
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
  }, [iconSearch]);

  return {
    iconSearch,
    setIconSearch,
    iconResults,
    isSearchingIcons,
  };
}

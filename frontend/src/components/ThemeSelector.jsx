import React from 'react';
import { Sparkles } from 'lucide-react';

export const THEMES = [
  { id: 'slate', name: 'Sleek Slate (Dark)' },
  { id: 'indigo', name: 'Deep Indigo' },
  { id: 'emerald', name: 'Emerald Forest' },
  { id: 'cyberpunk', name: 'Cyberpunk Crimson' },
  { id: 'light', name: 'Minimal Light' }
];

export default function ThemeSelector({ theme, setTheme }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        Workspace Theme
      </label>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full p-2.5 rounded-xl glass-input text-xs font-semibold text-indigo-300"
      >
        {THEMES.map(t => (
          <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

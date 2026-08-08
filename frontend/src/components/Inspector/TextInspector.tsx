import React from 'react';
import { TextElement, LabelElement } from '../../types';

interface TextInspectorProps {
  element: TextElement;
  updateSelectedElement: (key: string, val: any) => void;
  pushHistory: (newElements: LabelElement[]) => void;
  elementsRef: React.MutableRefObject<LabelElement[]>;
}

export const TextInspector: React.FC<TextInspectorProps> = ({
  element,
  updateSelectedElement,
  pushHistory,
  elementsRef,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Text Content</label>
        <input 
          type="text" 
          value={element.content || ''}
          onChange={(e) => updateSelectedElement('content', e.target.value)}
          onBlur={() => pushHistory(elementsRef.current)}
          className="w-full p-2.5 rounded-xl glass-input text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Font Family</label>
        <select
          value={element.fontFamily || 'sans-serif'}
          onChange={(e) => {
            updateSelectedElement('fontFamily', e.target.value);
            pushHistory(elementsRef.current);
          }}
          className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
        >
          <option value="sans-serif" className="bg-slate-900 text-slate-100">Sans-serif</option>
          <option value="monospace" className="bg-slate-900 text-slate-100">Monospace</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Font Size ({element.fontSize || 22}px)</label>
        <input 
          type="range" 
          min="8" 
          max="64" 
          value={element.fontSize || 22}
          onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value, 10))}
          onMouseUp={() => pushHistory(elementsRef.current)}
          onTouchEnd={() => pushHistory(elementsRef.current)}
          className="w-full accent-indigo-500"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Alignment</label>
        <div className="grid grid-cols-3 gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => {
                updateSelectedElement('align', align);
                pushHistory(elementsRef.current);
              }}
              className={`py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                (element.align || 'center') === align
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'glass-input text-slate-400 hover:text-slate-200'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextInspector;

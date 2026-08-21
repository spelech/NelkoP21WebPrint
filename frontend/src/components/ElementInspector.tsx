import React from 'react';
import { Sliders, Trash2, AlignCenter, ArrowUp, ArrowLeft, ArrowDown, ArrowRight, Move } from 'lucide-react';
import { LabelElement } from '../types';

export interface ElementInspectorProps {
  selectedElement: LabelElement | null;
  deleteSelectedElement: () => void;
  updateSelectedElement: (key: string, val: any) => void;
  updateQRHelper: (helperType: string, fieldUpdates: Record<string, string>) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  nudgeSelectedElement: (dx: number, dy: number) => void;
  sendToBack: () => void;
  bringToFront: () => void;
}

export default function ElementInspector({
  selectedElement,
  deleteSelectedElement,
  updateSelectedElement,
  updateQRHelper,
  setElements,
  nudgeSelectedElement,
  sendToBack,
  bringToFront
}: ElementInspectorProps) {
  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm gap-3">
        <Sliders className="w-8 h-8 text-slate-700" />
        <p>Tap an element on the canvas to inspect it</p>
      </div>
    );
  }

  const helperType = selectedElement.type === 'qr' ? selectedElement.qrHelperType || 'text' : 'text';
  const qrFields = selectedElement.type === 'qr' ? selectedElement.qrHelperFields || {} : {};

  return (
    <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Element Properties
        </span>
        <button 
          onClick={deleteSelectedElement}
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
          title="Delete element"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {selectedElement.type !== 'image' && selectedElement.type !== 'line' && selectedElement.type !== 'rectangle' && selectedElement.type !== 'qr' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">
            {selectedElement.type === 'barcode' ? 'Barcode Content' : 'Text Content'}
          </label>
          <input 
            type="text" 
            value={selectedElement.content || ''}
            onChange={(e) => updateSelectedElement('content', e.target.value)}
            className="w-full p-2.5 rounded-xl glass-input text-sm"
          />
        </div>
      )}

      {selectedElement.type === 'barcode' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Barcode Encoding</label>
          <select
            value={selectedElement.barcodeType || 'code128'}
            onChange={(e) => {
              updateSelectedElement('barcodeType', e.target.value);
            }}
            className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
          >
            <option value="code128" className="bg-slate-900 text-slate-100">Code 128 (Standard)</option>
            <option value="ean13" className="bg-slate-900 text-slate-100">EAN 13 (Retail Product)</option>
            <option value="ean8" className="bg-slate-900 text-slate-100">EAN 8 (Mini Retail)</option>
          </select>
        </div>
      )}

      {selectedElement.type === 'text' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Font Family</label>
            <select
              value={selectedElement.fontFamily || 'sans-serif'}
              onChange={(e) => {
                updateSelectedElement('fontFamily', e.target.value);
              }}
              className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
            >
              <option value="sans-serif" className="bg-slate-900 text-slate-100">Sans-serif</option>
              <option value="monospace" className="bg-slate-900 text-slate-100">Monospace</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Font Size ({selectedElement.fontSize || 22}px)</label>
            <input 
              type="range" 
              min="8" 
              max="64" 
              value={selectedElement.fontSize || 22}
              onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      )}

      {selectedElement.type === 'qr' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">QR Content Helper</label>
            <select
              value={helperType}
              onChange={(e) => {
                updateQRHelper(e.target.value, {});
              }}
              className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
            >
              <option value="text" className="bg-slate-900 text-slate-100">Plain Text / URL</option>
              <option value="wifi" className="bg-slate-900 text-slate-100">WiFi Network</option>
              <option value="vcard" className="bg-slate-900 text-slate-100">vCard Contact</option>
              <option value="phone" className="bg-slate-900 text-slate-100">Phone Call</option>
            </select>
          </div>

          {helperType === 'text' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">QR Code Text / URL</label>
              <input
                type="text"
                value={selectedElement.content || ''}
                onChange={(e) => updateQRHelper('text', { plainText: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-sm"
                placeholder="https://example.com or any text"
              />
            </div>
          )}

          {helperType === 'wifi' && (
            <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Network Name (SSID)</label>
                <input
                  type="text"
                  value={qrFields.wifiSsid || ''}
                  onChange={(e) => updateQRHelper('wifi', { wifiSsid: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="MyHomeWiFi"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <input
                  type="text"
                  value={qrFields.wifiPassword || ''}
                  onChange={(e) => updateQRHelper('wifi', { wifiPassword: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="WiFi Password"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Encryption</label>
                <select
                  value={qrFields.wifiEncryption || 'WPA'}
                  onChange={(e) => {
                    updateQRHelper('wifi', { wifiEncryption: e.target.value });
                  }}
                  className="w-full p-2 rounded-lg glass-input text-xs text-indigo-300 font-medium"
                >
                  <option value="WPA" className="bg-slate-900 text-slate-100">WPA / WPA2 / WPA3</option>
                  <option value="WEP" className="bg-slate-900 text-slate-100">WEP</option>
                  <option value="None" className="bg-slate-900 text-slate-100">None (Open Network)</option>
                </select>
              </div>
            </div>
          )}

          {helperType === 'vcard' && (
            <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={qrFields.vcardFirstName || ''}
                    onChange={(e) => updateQRHelper('vcard', { vcardFirstName: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={qrFields.vcardLastName || ''}
                    onChange={(e) => updateQRHelper('vcard', { vcardLastName: e.target.value })}
                    className="w-full p-2 rounded-lg glass-input text-xs"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone Number</label>
                <input
                  type="text"
                  value={qrFields.vcardPhone || ''}
                  onChange={(e) => updateQRHelper('vcard', { vcardPhone: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="+1 555-123-4567"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={qrFields.vcardEmail || ''}
                  onChange={(e) => updateQRHelper('vcard', { vcardEmail: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Organization / Company</label>
                <input
                  type="text"
                  value={qrFields.vcardOrg || ''}
                  onChange={(e) => updateQRHelper('vcard', { vcardOrg: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          )}

          {helperType === 'phone' && (
            <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone Number</label>
                <input
                  type="text"
                  value={qrFields.phoneNum || ''}
                  onChange={(e) => updateQRHelper('phone', { phoneNum: e.target.value })}
                  className="w-full p-2 rounded-lg glass-input text-xs"
                  placeholder="+1 555-123-4567"
                />
              </div>
            </div>
          )}

          {helperType !== 'text' && (
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Compiled QR Payload</label>
              <div className="p-2 rounded-lg bg-slate-900 text-indigo-300 font-mono text-[10px] break-all border border-slate-800 max-h-20 overflow-y-auto whitespace-pre-wrap select-all">
                {selectedElement.content || '(empty)'}
              </div>
            </div>
          )}
        </div>
      )}

      {(selectedElement.type === 'image' || selectedElement.type === 'barcode' || selectedElement.type === 'line' || selectedElement.type === 'rectangle') && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                {selectedElement.type === 'line' ? 'Line Length' : 'Width'}
              </label>
              <span className="text-xs font-mono text-indigo-300">{selectedElement.width || 60}px</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="320" 
              value={selectedElement.width || 60}
              onChange={(e) => {
                const newW = parseInt(e.target.value);
                const ratio = (selectedElement.height || 60) / (selectedElement.width || 60);
                if (selectedElement.type === 'image' && (selectedElement as any).keepRatio !== false && ratio) {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, width: newW, height: Math.round(newW * ratio) } : el));
                } else {
                  updateSelectedElement('width', newW);
                }
              }}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                {selectedElement.type === 'line' ? 'Line Thickness' : 'Height'}
              </label>
              <span className="text-xs font-mono text-indigo-300">{selectedElement.height || (selectedElement.type === 'line' ? 4 : 60)}px</span>
            </div>
            <input 
              type="range" 
              min={selectedElement.type === 'line' ? 1 : 5} 
              max={selectedElement.type === 'line' ? 24 : 150} 
              value={selectedElement.height || (selectedElement.type === 'line' ? 4 : 60)}
              onChange={(e) => {
                const newH = parseInt(e.target.value);
                const ratio = (selectedElement.width || 60) / (selectedElement.height || 60);
                if (selectedElement.type === 'image' && (selectedElement as any).keepRatio !== false && ratio) {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, height: newH, width: Math.round(newH * ratio) } : el));
                } else {
                  updateSelectedElement('height', newH);
                }
              }}
              className="w-full accent-indigo-500"
            />
          </div>
          {selectedElement.type === 'image' && (
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox"
                checked={(selectedElement as any).keepRatio !== false}
                onChange={(e) => {
                  updateSelectedElement('keepRatio', e.target.checked);
                }}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
              />
              Lock Aspect Ratio
            </label>
          )}
          {selectedElement.type === 'rectangle' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400">Border Thickness</label>
                <span className="text-xs font-mono text-indigo-300">{selectedElement.thickness || 2}px</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="12" 
                value={selectedElement.thickness || 2}
                onChange={(e) => updateSelectedElement('thickness', parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          Position & Alignment
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Position X</label>
              <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.x)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={selectedElement.x}
              onChange={(e) => updateSelectedElement('x', parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Position Y</label>
              <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.y)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={selectedElement.y}
              onChange={(e) => updateSelectedElement('y', parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400">Quick Align & Nudge</label>
          <div className="flex flex-col gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, x: 50 } : el));
                }}
                className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                title="Center Horizontally"
              >
                <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
                Center X
              </button>
              <button 
                onClick={() => {
                  setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, y: 50 } : el));
                }}
                className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                title="Center Vertically"
              >
                <AlignCenter className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
                Center Y
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <div></div>
              <button 
                onClick={() => nudgeSelectedElement(0, -2)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div></div>
              <button 
                onClick={() => nudgeSelectedElement(-2, 0)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => nudgeSelectedElement(0, 2)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => nudgeSelectedElement(2, 0)}
                className="p-1 rounded hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 transition flex items-center justify-center"
                title="Nudge Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-800/80">
              <button 
                onClick={sendToBack}
                className="py-1 px-2 rounded bg-slate-800/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition"
                title="Send Element to Back (bottom layer)"
              >
                Send to Back
              </button>
              <button 
                onClick={bringToFront}
                className="py-1 px-2 rounded bg-slate-800/50 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition"
                title="Bring Element to Front (top layer)"
              >
                Bring to Front
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { QRElement, LabelElement } from '../../types';

interface QRInspectorProps {
  element: QRElement;
  updateQRHelper: (helperType: string, fieldUpdates: Record<string, string>) => void;
  updateSelectedElement: (key: string, val: any) => void;
  pushHistory: (newElements: LabelElement[]) => void;
  elementsRef: React.MutableRefObject<LabelElement[]>;
}

export const QRInspector: React.FC<QRInspectorProps> = ({
  element,
  updateQRHelper,
  updateSelectedElement,
  pushHistory,
  elementsRef,
}) => {
  const helperType = element.qrHelperType || 'text';
  const fields = element.qrHelperFields || {};

  return (
    <div className="flex flex-col gap-3">
      {/* Helper Type Selector */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">QR Content Helper</label>
        <select
          value={helperType}
          onChange={(e) => {
            updateQRHelper(e.target.value, {});
            pushHistory(elementsRef.current);
          }}
          className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-semibold"
        >
          <option value="text" className="bg-slate-900 text-slate-100">Plain Text / URL</option>
          <option value="wifi" className="bg-slate-900 text-slate-100">WiFi Network</option>
          <option value="vcard" className="bg-slate-900 text-slate-100">vCard Contact</option>
          <option value="phone" className="bg-slate-900 text-slate-100">Phone Call</option>
        </select>
      </div>

      {/* Plain Text / URL Fields */}
      {helperType === 'text' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">QR Code Text / URL</label>
          <input
            type="text"
            value={element.content || ''}
            onChange={(e) => updateQRHelper('text', { plainText: e.target.value })}
            onBlur={() => pushHistory(elementsRef.current)}
            className="w-full p-2.5 rounded-xl glass-input text-sm"
            placeholder="https://example.com or any text"
          />
        </div>
      )}

      {/* WiFi Network Fields */}
      {helperType === 'wifi' && (
        <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Network Name (SSID)</label>
            <input
              type="text"
              value={fields.wifiSsid || ''}
              onChange={(e) => updateQRHelper('wifi', { wifiSsid: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="MyHomeWiFi"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              type="text"
              value={fields.wifiPassword || ''}
              onChange={(e) => updateQRHelper('wifi', { wifiPassword: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="WiFi Password"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Encryption</label>
            <select
              value={fields.wifiEncryption || 'WPA'}
              onChange={(e) => {
                updateQRHelper('wifi', { wifiEncryption: e.target.value });
                pushHistory(elementsRef.current);
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

      {/* vCard Contact Fields */}
      {helperType === 'vcard' && (
        <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">First Name</label>
              <input
                type="text"
                value={fields.vcardFirstName || ''}
                onChange={(e) => updateQRHelper('vcard', { vcardFirstName: e.target.value })}
                onBlur={() => pushHistory(elementsRef.current)}
                className="w-full p-2 rounded-lg glass-input text-xs"
                placeholder="John"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Last Name</label>
              <input
                type="text"
                value={fields.vcardLastName || ''}
                onChange={(e) => updateQRHelper('vcard', { vcardLastName: e.target.value })}
                onBlur={() => pushHistory(elementsRef.current)}
                className="w-full p-2 rounded-lg glass-input text-xs"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone Number</label>
            <input
              type="text"
              value={fields.vcardPhone || ''}
              onChange={(e) => updateQRHelper('vcard', { vcardPhone: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="+1 555-123-4567"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email Address</label>
            <input
              type="email"
              value={fields.vcardEmail || ''}
              onChange={(e) => updateQRHelper('vcard', { vcardEmail: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Organization / Company</label>
            <input
              type="text"
              value={fields.vcardOrg || ''}
              onChange={(e) => updateQRHelper('vcard', { vcardOrg: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="Acme Corp"
            />
          </div>
        </div>
      )}

      {/* Phone Call Fields */}
      {helperType === 'phone' && (
        <div className="flex flex-col gap-2.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone Number</label>
            <input
              type="text"
              value={fields.phoneNum || ''}
              onChange={(e) => updateQRHelper('phone', { phoneNum: e.target.value })}
              onBlur={() => pushHistory(elementsRef.current)}
              className="w-full p-2 rounded-lg glass-input text-xs"
              placeholder="+1 555-123-4567"
            />
          </div>
        </div>
      )}

      {/* Compiled Data String Preview (for non-text helpers) */}
      {helperType !== 'text' && (
        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">Compiled QR Payload</label>
          <div className="p-2 rounded-lg bg-slate-900 text-indigo-300 font-mono text-[10px] break-all border border-slate-800 max-h-20 overflow-y-auto whitespace-pre-wrap select-all">
            {element.content || '(empty)'}
          </div>
        </div>
      )}

      {/* QR Size Slider */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">QR Size ({element.size || 60}px)</label>
        <input 
          type="range" 
          min="20" 
          max="180" 
          value={element.size || 60}
          onChange={(e) => updateSelectedElement('size', parseInt(e.target.value, 10))}
          onMouseUp={() => pushHistory(elementsRef.current)}
          onTouchEnd={() => pushHistory(elementsRef.current)}
          className="w-full accent-indigo-500"
        />
      </div>
    </div>
  );
};

export default QRInspector;

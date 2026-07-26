import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Settings, 
  Plus, 
  Type, 
  QrCode, 
  Sliders, 
  Trash2, 
  Check, 
  RefreshCw,
  Eye,
  Sparkles,
  Grid,
  FileText,
  Smartphone,
  Wifi,
  Bluetooth
} from 'lucide-react';
import { browserBtDriver } from './utils/webBluetoothDriver';
import { convertCanvasToTsplBytes, mmToDots } from './utils/tsplGenerator';

const PRESETS = [
  { name: '14 x 40 mm (Standard Gap)', width: 14, height: 40, gap: 5 },
  { name: '12 x 40 mm White Gap', width: 12, height: 40, gap: 5 },
  { name: '12 x 30 mm Compact', width: 12, height: 30, gap: 5 },
  { name: '12 x 22 mm Mini', width: 12, height: 22, gap: 5 },
  { name: '15 x 50 mm Cable Flag', width: 15, height: 50, gap: 5 },
  { name: '12 mm Continuous Roll', width: 12, height: 60, gap: 0 },
];

export default function App() {
  // Preset & Label Dimensions
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);

  // Label Elements
  const [elements, setElements] = useState([
    { id: 1, type: 'text', content: 'NELKO P21', fontSize: 24, fontStyle: 'bold', x: 20, y: 30, width: 180, height: 30, align: 'center' },
    { id: 2, type: 'text', content: 'SAMPLE LABEL', fontSize: 14, fontStyle: 'normal', x: 20, y: 70, width: 180, height: 20, align: 'center' },
    { id: 3, type: 'qr', content: 'https://nelko.app', x: 70, y: 110, size: 80 }
  ]);
  const [selectedId, setSelectedId] = useState(1);

  // Print & Driver State
  const [useBrowserBt, setUseBrowserBt] = useState(true); // Default to Browser Direct BT
  const [browserBtConnected, setBrowserBtConnected] = useState(false);
  const [browserBtDeviceName, setBrowserBtDeviceName] = useState('');
  
  const [density, setDensity] = useState(3);
  const [copies, setCopies] = useState(1);
  const [ditherMethod, setDitherMethod] = useState('threshold');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Driver Config for Server Bridge Mode
  const [driverConfig, setDriverConfig] = useState({
    driver_type: 'tcp',
    tcp_host: '127.0.0.1',
    tcp_port: 9100,
    bt_mac: ''
  });

  const canvasRef = useRef(null);
  const selectedElement = elements.find(el => el.id === selectedId);

  // Calculate 203 DPI Canvas px size
  const dpi = 203;
  const canvasWidthPx = Math.round((selectedPreset.width * dpi) / 25.4);
  const canvasHeightPx = Math.round((selectedPreset.height * dpi) / 25.4);

  // Fetch status on load
  useEffect(() => {
    fetch('/api/printer/status')
      .then(res => res.json())
      .then(data => {
        if (data.config) setDriverConfig(data.config);
      })
      .catch(() => {});
  }, []);

  // Connect Browser Bluetooth
  const handleConnectBrowserBt = async () => {
    setPrintStatus(null);
    const res = await browserBtDriver.requestConnection();
    if (res.success) {
      setBrowserBtConnected(true);
      setBrowserBtDeviceName(res.name);
      setPrintStatus({ type: 'success', msg: `Connected to ${res.name} via browser Bluetooth!` });
    } else {
      setBrowserBtConnected(false);
      setPrintStatus({ type: 'error', msg: res.error || 'Failed to connect via browser Bluetooth' });
    }
  };

  // Element Actions
  const addTextElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'text',
      content: 'New Text',
      fontSize: 16,
      fontStyle: 'normal',
      x: 20,
      y: 50,
      width: 160,
      height: 25,
      align: 'center'
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addQRElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'qr',
      content: 'P21-LABEL-123',
      x: 60,
      y: 100,
      size: 70
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateSelectedElement = (key, val) => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
  };

  const deleteSelectedElement = () => {
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(elements.length > 1 ? elements[0].id : null);
  };

  // Generate Preview from API or Local Canvas
  const handleGeneratePreview = async () => {
    setShowPreview(true);
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: elements.find(e => e.type === 'text')?.content || 'Nelko P21',
          subtitle: elements.filter(e => e.type === 'text')[1]?.content || '',
          barcode: elements.find(e => e.type === 'qr')?.content || '',
          width_mm: selectedPreset.width,
          height_mm: selectedPreset.height,
          gap_mm: selectedPreset.gap,
          dither_method: ditherMethod
        })
      });
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    }
  };

  // Render HTML5 Canvas to 1-Bit TSPL payload
  const renderCanvasToTsplBytes = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidthPx;
    canvas.height = canvasHeightPx;
    const ctx = canvas.getContext('2d');

    // Fill White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

    // Draw Elements
    ctx.fillStyle = '#000000';
    elements.forEach(el => {
      if (el.type === 'text') {
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize * 2}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, (el.x / 100) * canvasWidthPx, (el.y / 100) * canvasHeightPx);
      }
    });

    return convertCanvasToTsplBytes(canvas, selectedPreset.width, selectedPreset.height, selectedPreset.gap, density, copies, ditherMethod);
  };

  // Handle Print Job (Browser Direct vs Server Bridge)
  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus(null);

    if (useBrowserBt) {
      // 1. Direct Browser Bluetooth Mode
      try {
        const payloadBytes = renderCanvasToTsplBytes();
        const success = await browserBtDriver.sendBytes(payloadBytes);
        if (success) {
          setPrintStatus({ type: 'success', msg: `Direct Browser BT: Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: 'Browser Bluetooth stream failed or device disconnected' });
        }
      } catch (err) {
        setPrintStatus({ type: 'error', msg: `Direct Print Error: ${err.message}` });
      } finally {
        setIsPrinting(false);
      }
    } else {
      // 2. Server Bridge Mode
      try {
        const res = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: elements.find(e => e.type === 'text')?.content || 'Nelko P21',
            subtitle: elements.filter(e => e.type === 'text')[1]?.content || '',
            barcode: elements.find(e => e.type === 'qr')?.content || '',
            width_mm: selectedPreset.width,
            height_mm: selectedPreset.height,
            gap_mm: selectedPreset.gap,
            density: density,
            copies: copies,
            dither_method: ditherMethod
          })
        });
        const data = await res.json();
        if (res.ok) {
          setPrintStatus({ type: 'success', msg: `Server Printed ${copies} copy successfully!` });
        } else {
          setPrintStatus({ type: 'error', msg: data.detail || 'Print failed' });
        }
      } catch (err) {
        setPrintStatus({ type: 'error', msg: `Network Error: ${err.message}` });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  // Save Config
  const handleSaveConfig = async () => {
    try {
      await fetch('/api/printer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverConfig)
      });
      setShowSettings(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 glass-panel px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Nelko P21 Studio
            </h1>
            <p className="text-xs text-slate-400">203 DPI Thermal Label Engine</p>
          </div>
        </div>

        {/* Status Pill & Action Controls */}
        <div className="flex items-center gap-3">
          {useBrowserBt ? (
            <button 
              onClick={handleConnectBrowserBt}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${browserBtConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{browserBtConnected ? `BT: ${browserBtDeviceName}` : 'Pair Phone/Browser BT'}</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-input text-xs font-medium hover:border-indigo-500/50 transition"
            >
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
              <span>Server Bridge: <strong className="uppercase">{driverConfig.driver_type}</strong></span>
              <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>
          )}

          <button 
            onClick={handleGeneratePreview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition shadow-sm"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            Preview
          </button>

          <button 
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isPrinting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print Label
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar / Presets */}
        <aside className="w-80 border-r border-slate-800 glass-panel p-5 flex flex-col gap-6 overflow-y-auto">
          {/* Mode Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />
              Print Connection Target
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button 
                onClick={() => setUseBrowserBt(true)}
                className={`py-1.5 rounded-lg text-xs font-medium transition ${useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Browser Direct
              </button>
              <button 
                onClick={() => setUseBrowserBt(false)}
                className={`py-1.5 rounded-lg text-xs font-medium transition ${!useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Server Bridge
              </button>
            </div>
          </div>

          {/* Preset Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              Label Preset
            </label>
            <select 
              value={selectedPreset.name}
              onChange={(e) => {
                const preset = PRESETS.find(p => p.name === e.target.value);
                if (preset) setSelectedPreset(preset);
              }}
              className="w-full p-2.5 rounded-xl glass-input text-sm"
            >
              {PRESETS.map(p => (
                <option key={p.name} value={p.name} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Elements Section */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              Add Elements
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={addTextElement}
                className="flex items-center justify-center gap-2 p-3 rounded-xl glass-input hover:bg-slate-800 text-xs font-medium transition"
              >
                <Type className="w-4 h-4 text-indigo-400" />
                Text
              </button>
              <button 
                onClick={addQRElement}
                className="flex items-center justify-center gap-2 p-3 rounded-xl glass-input hover:bg-slate-800 text-xs font-medium transition"
              >
                <QrCode className="w-4 h-4 text-violet-400" />
                QR Code
              </button>
            </div>
          </div>

          {/* Element Inspector */}
          {selectedElement ? (
            <div className="flex-1 flex flex-col gap-4 border-t border-slate-800/80 pt-4">
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

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Content</label>
                <input 
                  type="text" 
                  value={selectedElement.content}
                  onChange={(e) => updateSelectedElement('content', e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              {selectedElement.type === 'text' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Font Size ({selectedElement.fontSize}px)</label>
                  <input 
                    type="range" 
                    min="8" 
                    max="48" 
                    value={selectedElement.fontSize}
                    onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select an element on canvas to edit properties
            </div>
          )}

          {/* Print Options */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Print Parameters
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Density ({density})</label>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  value={density}
                  onChange={(e) => setDensity(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Copies</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas Studio */}
        <main className="flex-1 bg-slate-900/50 p-8 flex flex-col items-center justify-center relative overflow-auto">
          {printStatus && (
            <div className={`absolute top-6 px-4 py-2 rounded-xl text-sm font-medium shadow-lg z-20 flex items-center gap-2 ${printStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
              {printStatus.type === 'success' ? <Check className="w-4 h-4" /> : null}
              {printStatus.msg}
            </div>
          )}

          {/* Thermal Label Workspace Simulation */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Canvas ({selectedPreset.width}mm × {selectedPreset.height}mm @ 203 DPI)</span>
            </div>

            {/* Label Paper Sheet */}
            <div 
              style={{ width: `${canvasWidthPx * 1.8}px`, height: `${canvasHeightPx * 1.8}px` }}
              className="bg-white rounded-lg shadow-2xl shadow-indigo-500/10 border-2 border-slate-300 relative p-4 flex flex-col items-center justify-center text-slate-900 transition-all"
            >
              {elements.map(el => (
                <div 
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    cursor: 'pointer'
                  }}
                  className={`p-1 rounded border-2 transition ${selectedId === el.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent hover:border-slate-300'}`}
                >
                  {el.type === 'text' && (
                    <span style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontStyle }}>
                      {el.content}
                    </span>
                  )}
                  {el.type === 'qr' && (
                    <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded text-[10px] font-mono p-1 text-center">
                      [QR: {el.content}]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Server Printer Connection Settings
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Driver Type</label>
                <select 
                  value={driverConfig.driver_type}
                  onChange={(e) => setDriverConfig({ ...driverConfig, driver_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                >
                  <option value="tcp" className="bg-slate-900">TCP Network Bridge (ESP32 / ESPHome Proxy)</option>
                  <option value="spp" className="bg-slate-900">Direct Bluetooth SPP (RFCOMM)</option>
                  <option value="mock" className="bg-slate-900">Mock Driver (Testing)</option>
                </select>
              </div>

              {driverConfig.driver_type === 'tcp' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">IP Address / Host</label>
                    <input 
                      type="text"
                      value={driverConfig.tcp_host}
                      onChange={(e) => setDriverConfig({ ...driverConfig, tcp_host: e.target.value })}
                      className="w-full p-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Port</label>
                    <input 
                      type="number"
                      value={driverConfig.tcp_port}
                      onChange={(e) => setDriverConfig({ ...driverConfig, tcp_port: parseInt(e.target.value) })}
                      className="w-full p-2.5 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>
              )}

              {driverConfig.driver_type === 'spp' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Bluetooth MAC Address</label>
                  <input 
                    type="text"
                    placeholder="e.g. 00:11:22:33:44:55"
                    value={driverConfig.bt_mac}
                    onChange={(e) => setDriverConfig({ ...driverConfig, bt_mac: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live 1-Bit Dither Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              1-Bit Thermal Print Preview
            </h3>
            <p className="text-xs text-slate-400 mb-4">Simulated monochrome 203 DPI thermal print head output</p>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-6 flex items-center justify-center min-h-[200px]">
              {previewUrl ? (
                <img src={previewUrl} alt="1-bit preview" className="max-h-[300px] border border-slate-700 shadow-lg" />
              ) : (
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              )}
            </div>

            <button 
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

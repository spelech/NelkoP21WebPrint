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
  Bluetooth,
  RotateCw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignCenter,
  Monitor,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { browserBtDriver } from './utils/webBluetoothDriver';
import { convertCanvasToTsplBytes } from './utils/tsplGenerator';

// Presets oriented in Landscape view (Width x Height) for optimal readable workspace
const PRESETS = [
  { name: '40 x 14 mm (Standard Gap)', width: 40, height: 14, gap: 5 },
  { name: '40 x 12 mm White Gap', width: 40, height: 12, gap: 5 },
  { name: '30 x 12 mm Compact', width: 30, height: 12, gap: 5 },
  { name: '22 x 12 mm Mini', width: 22, height: 12, gap: 5 },
  { name: '50 x 15 mm Cable Flag', width: 50, height: 15, gap: 5 },
  { name: '60 x 12 mm Continuous Roll', width: 60, height: 12, gap: 0 },
];

export default function App() {
  // Preset & Label Dimensions
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [isPortraitView, setIsPortraitView] = useState(false); // Default to Landscape view

  // Label Elements
  const [elements, setElements] = useState([
    { id: 1, type: 'text', content: 'NELKO P21', fontSize: 22, fontStyle: 'bold', x: 25, y: 35, width: 180, height: 30, align: 'center' },
    { id: 2, type: 'text', content: 'ASSET TAG', fontSize: 13, fontStyle: 'normal', x: 25, y: 70, width: 180, height: 20, align: 'center' },
    { id: 3, type: 'qr', content: 'https://nelko.app', x: 75, y: 50, size: 70 }
  ]);
  const [selectedId, setSelectedId] = useState(1);

  // Dragging state & refs
  const containerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Print & Driver State
  const [appVersion, setAppVersion] = useState('1.1.0');
  const [useBrowserBt, setUseBrowserBt] = useState(true);
  const [browserBtConnected, setBrowserBtConnected] = useState(false);
  const [browserBtDeviceName, setBrowserBtDeviceName] = useState('');
  
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardTab, setWizardTab] = useState('pc');
  const [showHelpAccordion, setShowHelpAccordion] = useState(false);
  
  const [density, setDensity] = useState(3);
  const [copies, setCopies] = useState(1);
  const [ditherMethod, setDitherMethod] = useState('threshold');
  const [invertColors, setInvertColors] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.5);
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

  const selectedElement = elements.find(el => el.id === selectedId);

  // Active Width & Height based on Portrait / Landscape toggle
  const activeWidthMm = isPortraitView ? selectedPreset.height : selectedPreset.width;
  const activeHeightMm = isPortraitView ? selectedPreset.width : selectedPreset.height;

  // Calculate 203 DPI Canvas px size
  const dpi = 203;
  const canvasWidthPx = Math.round((activeWidthMm * dpi) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * dpi) / 25.4);

  // Drag Event Handlers
  const handleStartDrag = (e, id) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = ((clientX - rect.left) / rect.width) * 100;
    const cursorY = ((clientY - rect.top) / rect.height) * 100;

    const el = elements.find(item => item.id === id);
    if (el) {
      dragOffsetRef.current = { x: cursorX - el.x, y: cursorY - el.y };
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
    }

    setSelectedId(id);
    setDraggingId(id);
  };

  // Global mousemove/mouseup listener while dragging
  useEffect(() => {
    if (draggingId === null) return;

    const handlePointerMove = (e) => {
      if (!containerRef.current) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = ((clientX - rect.left) / rect.width) * 100;
      const cursorY = ((clientY - rect.top) / rect.height) * 100;

      let newX = cursorX - dragOffsetRef.current.x;
      let newY = cursorY - dragOffsetRef.current.y;

      // Clamp between 0 and 100%
      newX = Math.max(0, Math.min(100, Math.round(newX * 10) / 10));
      newY = Math.max(0, Math.min(100, Math.round(newY * 10) / 10));

      setElements(prev => prev.map(el => el.id === draggingId ? { ...el, x: newX, y: newY } : el));
    };

    const handlePointerUp = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingId]);

  // Keyboard shortcut listener for moving elements with arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const step = e.shiftKey ? 5 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: Math.max(0, Math.round((el.x - step) * 10) / 10) } : el));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: Math.min(100, Math.round((el.x + step) * 10) / 10) } : el));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, y: Math.max(0, Math.round((el.y - step) * 10) / 10) } : el));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, y: Math.min(100, Math.round((el.y + step) * 10) / 10) } : el));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Fetch status on load
  useEffect(() => {
    fetch('/api/printer/status')
      .then(res => res.json())
      .then(data => {
        if (data.version) setAppVersion(data.version);
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
      setShowWizardModal(false);
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
      x: 50,
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
      x: 50,
      y: 50,
      size: 60
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const updateSelectedElement = (key, val) => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
  };

  const nudgeSelectedElement = (dx, dy) => {
    if (!selectedElement) return;
    const newX = Math.max(0, Math.min(100, Math.round((selectedElement.x + dx) * 10) / 10));
    const newY = Math.max(0, Math.min(100, Math.round((selectedElement.y + dy) * 10) / 10));
    updateSelectedElement('x', newX);
    updateSelectedElement('y', newY);
  };

  const deleteSelectedElement = () => {
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(elements.length > 1 ? elements[0].id : null);
  };

  // Offscreen canvas builder helper for preview & print rasterization
  const buildOffscreenCanvas = () => {
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
      const posX = (el.x / 100) * canvasWidthPx;
      const posY = (el.y / 100) * canvasHeightPx;

      if (el.type === 'text') {
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize * 2}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, posX, posY);
      } else if (el.type === 'qr') {
        const qrSize = (el.size || 60) * 1.2;
        ctx.fillRect(posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - qrSize / 2 + 4, posY - qrSize / 2 + 4, qrSize - 8, qrSize - 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX - qrSize / 2 + 8, posY - qrSize / 2 + 8, qrSize - 16, qrSize - 16);
      }
    });

    return canvas;
  };

  // Generate Preview from API
  const handleGeneratePreview = async () => {
    setShowPreview(true);
    setPreviewUrl(null);
    try {
      const canvas = buildOffscreenCanvas();
      const res = await fetch('/api/preview/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: canvas.toDataURL('image/png'),
          width_mm: activeWidthMm,
          height_mm: activeHeightMm,
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
    const canvas = buildOffscreenCanvas();
    return convertCanvasToTsplBytes(canvas, activeWidthMm, activeHeightMm, selectedPreset.gap, density, copies, ditherMethod, invertColors);
  };

  // Handle Print Job
  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus(null);

    if (useBrowserBt) {
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
      try {
        const canvas = buildOffscreenCanvas();
        const res = await fetch('/api/print/canvas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: canvas.toDataURL('image/png'),
            width_mm: activeWidthMm,
            height_mm: activeHeightMm,
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 glass-panel px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Nelko P21 Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-semibold">
                v{appVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400">203 DPI Thermal Label Engine</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {useBrowserBt ? (
            <button 
              onClick={() => setShowWizardModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${browserBtConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{browserBtConnected ? `BT: ${browserBtDeviceName}` : 'Pair PC/Browser BT'}</span>
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
          {/* Connection Target Switcher */}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                Label Preset
              </label>
              <button 
                onClick={() => setIsPortraitView(!isPortraitView)}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                title="Toggle Landscape / Portrait Editing View"
              >
                <RotateCw className="w-3 h-3" />
                {isPortraitView ? 'Portrait' : 'Landscape'}
              </button>
            </div>
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

              {/* Position & Alignment Controls */}
              <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-400" />
                  Position & Alignment
                </span>

                {/* Numerical Sliders */}
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

                {/* Quick Align & Nudge */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400">Quick Align & Nudge</label>
                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={() => updateSelectedElement('x', 50)}
                      className="px-2.5 py-1.5 rounded-lg glass-input text-xs font-medium hover:border-indigo-500/50 transition flex items-center gap-1"
                      title="Center Horizontally"
                    >
                      <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
                      Center X
                    </button>
                    <button 
                      onClick={() => updateSelectedElement('y', 50)}
                      className="px-2.5 py-1.5 rounded-lg glass-input text-xs font-medium hover:border-indigo-500/50 transition flex items-center gap-1"
                      title="Center Vertically"
                    >
                      <AlignCenter className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
                      Center Y
                    </button>

                    {/* D-Pad Nudge Buttons */}
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
                  </div>
                </div>
              </div>
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

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={invertColors}
                  onChange={(e) => setInvertColors(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500"
                />
                Invert Colors (White-on-Black)
              </label>
            </div>
          </div>
        </aside>

        {/* Center Canvas Studio (Wide Landscape Workspace) */}
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
              <span>
                Canvas Workspace ({activeWidthMm}mm × {activeHeightMm}mm @ 203 DPI = {canvasWidthPx}px × {canvasHeightPx}px) 
                <span className="ml-2 text-indigo-400 font-medium">({isPortraitView ? 'Portrait View' : 'Landscape View - Auto 90° Rotated for Printhead'})</span>
              </span>
            </div>

            {/* Hint & Zoom Controls */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5 shadow-sm">
                <Move className="w-3 h-3 text-indigo-400" />
                <span>Click & drag elements on label • Use Arrow Keys to nudge (Shift + Arrow for 5%)</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-full border border-slate-800 text-[11px]">
                <span className="text-slate-400 px-2 font-medium">Zoom:</span>
                {[1.0, 1.5, 2.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setZoomScale(s)}
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] transition ${zoomScale === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {s * 100}%
                  </button>
                ))}
              </div>
            </div>

            {/* Scalable Label Paper Sheet Wrapper */}
            <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} className="transition-transform duration-200 my-4">
              <div 
                ref={containerRef}
                onClick={() => setSelectedId(null)}
                style={{ 
                  width: `${canvasWidthPx}px`, 
                  height: `${canvasHeightPx}px` 
                }}
                className="bg-white rounded-lg shadow-2xl shadow-indigo-500/10 border-2 border-slate-300 relative flex items-center justify-between text-slate-900 overflow-hidden select-none"
              >
              {elements.map(el => {
                const isSelected = selectedId === el.id;
                const isBeingDragged = draggingId === el.id;

                return (
                  <div 
                    key={el.id}
                    onMouseDown={(e) => handleStartDrag(e, el.id)}
                    onTouchStart={(e) => handleStartDrag(e, el.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: isBeingDragged ? 'grabbing' : 'grab'
                    }}
                    className={`p-1.5 rounded border-2 transition-all group whitespace-nowrap ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20 z-20' 
                        : 'border-dashed border-transparent hover:border-slate-400 hover:bg-slate-50/50 z-10'
                    }`}
                  >
                    {/* Position Badge when selected or dragging */}
                    {isSelected && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow flex items-center gap-1 pointer-events-none whitespace-nowrap z-30">
                        <Move className="w-2.5 h-2.5" />
                        <span>X: {Math.round(el.x)}% Y: {Math.round(el.y)}%</span>
                      </div>
                    )}

                    {el.type === 'text' && (
                      <span style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontStyle }}>
                        {el.content}
                      </span>
                    )}

                    {el.type === 'qr' && (
                      <div className="w-14 h-14 bg-slate-900 text-white flex flex-col items-center justify-center rounded text-[9px] font-mono p-1 text-center shadow-inner">
                        <QrCode className="w-6 h-6 mb-0.5 text-indigo-300" />
                        <span>[QR Code]</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            <p className="text-xs text-slate-400 mb-4">Simulated monochrome 203 DPI thermal print head output (Rotated for Printhead)</p>

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

      {/* Printer Connection Wizard Modal */}
      {showWizardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-indigo-400" />
                Nelko P21 Connection Wizard
              </h3>
              <button 
                onClick={() => setShowWizardModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Connection Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
              <button 
                onClick={() => setWizardTab('pc')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'pc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Monitor className="w-4 h-4" />
                PC (Web Serial)
              </button>
              <button 
                onClick={() => setWizardTab('mobile')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile Direct
              </button>
              <button 
                onClick={() => setWizardTab('bridge')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${wizardTab === 'bridge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Wifi className="w-4 h-4" />
                Server Bridge
              </button>
            </div>

            {/* Tab 1: PC Direct vs Server Bridge */}
            {wizardTab === 'pc' && (
              <div className="flex flex-col gap-4 text-sm text-slate-300">
                <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200 leading-relaxed space-y-1">
                    <p><strong>Hardware & PC Compatibility Fact:</strong></p>
                    <p>1. The Nelko P21's USB-C port is <em>power charging ONLY</em> (no USB data controller hardware).</p>
                    <p>2. Windows OS Bluetooth stack fails to negotiate RFCOMM sockets with Nelko printer chips, preventing PC browser direct Bluetooth connection.</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">🌐</span>
                    <div>
                      <p className="text-xs font-semibold text-white">Recommended PC Solution: Server Bridge Mode</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Switch to <strong>Server Bridge Mode</strong>. The home server container at <code>10.0.0.10</code> (or ESP32 node) handles the Bluetooth connection to the printer directly. You can click <strong>Print</strong> from any PC, Mac, or browser on your home network with zero PC Bluetooth pairing!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setUseBrowserBt(false);
                      setShowWizardModal(false);
                      setShowSettings(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Wifi className="w-4 h-4" />
                    Switch to Server Bridge Mode
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Mobile Direct */}
            {wizardTab === 'mobile' && (
              <div className="flex flex-col gap-4 text-sm text-slate-300">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                    <p className="text-xs">
                      <strong>Open in Mobile Chrome / WebBLE:</strong> Open <code>https://labelprint.wileyriley.com</code> on Chrome (Android) or WebBLE browser (iOS).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                    <p className="text-xs">
                      <strong>Select Printer:</strong> Ensure green power light is on and tap <strong>Connect Mobile Bluetooth</strong> to pair.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={handleConnectBrowserBt}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    Pair & Connect Mobile Bluetooth
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Server Bridge */}
            {wizardTab === 'bridge' && (
              <div className="flex flex-col gap-4 text-sm text-slate-300">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-300">
                    <strong>Zero-Pairing Network Printing:</strong> Connect printer directly to the home server via an <strong>ESP32 Wi-Fi Bridge</strong> (TCP Port 9100) or host Linux Bluetooth driver (<code>/dev/rfcomm0</code>).
                  </p>
                  <p className="text-xs text-slate-400">
                    Allows any device, phone, or Home Assistant automation to print instantly without pairing Bluetooth in the browser.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setUseBrowserBt(false);
                      setShowWizardModal(false);
                      setShowSettings(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configure Server Bridge Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

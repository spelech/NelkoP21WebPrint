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
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  Barcode,
  Minus,
  Square
} from 'lucide-react';
import { browserBtDriver } from './utils/webBluetoothDriver';
import QRCode from 'qrcode';
import { convertCanvasToTsplBytes } from './utils/tsplGenerator';
import { MDI_OFFLINE } from './utils/mdiIcons';
import { parseCSV, getTemplateVariables } from './utils/csvParser';
import { useHistory } from './hooks/useHistory';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import { useIconSearch } from './hooks/useIconSearch';
import ElementInspector from './components/Inspector/ElementInspector';
import ThemeSelector from './components/ThemeSelector';
import SettingsModal from './components/Modals/SettingsModal';
import WizardModal from './components/Modals/WizardModal';
import BatchModal from './components/Modals/BatchModal';
import PreviewModal from './components/Modals/PreviewModal';
import PrintParameters from './components/PrintParameters';
import LayoutPresets from './components/LayoutPresets';
import AddElements from './components/AddElements';
import IconLibrary from './components/IconLibrary';
import Header from './components/Header';
import CanvasWorkspace from './components/CanvasWorkspace';

// Presets oriented in Landscape view (Width x Height) for optimal readable workspace
const PRESETS = [
  { name: '40 x 14 mm (Standard Gap)', width: 40, height: 14, gap: 5 },
  { name: '40 x 12 mm White Gap', width: 40, height: 12, gap: 5 },
  { name: '30 x 20 mm Small', width: 30, height: 20, gap: 5 },
  { name: '30 x 15 mm Micro', width: 30, height: 15, gap: 5 },
  { name: '30 x 12 mm Compact', width: 30, height: 12, gap: 5 },
  { name: '30 x 30 mm Square', width: 30, height: 30, gap: 5 },
  { name: '22 x 12 mm Mini', width: 22, height: 12, gap: 5 },
  { name: '50 x 15 mm Cable Flag Wrap', width: 50, height: 15, gap: 5 },
  { name: '60 x 12 mm Continuous Roll', width: 60, height: 12, gap: 0 },
];

export default function App() {
  // Preset & Label Dimensions
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [isPortraitView, setIsPortraitView] = useState(false); // Default to Landscape view

  // Undo / Redo History Stack Hook
  const {
    elements,
    setElements,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    elementsRef,
    pushHistory,
    handleUndo,
    handleRedo,
  } = useHistory([]);

  // Snap-to-Grid & Alignment Guides State
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Collapsable Sidebar Sections State
  const [collapsedPresets, setCollapsedPresets] = useState(false);
  const [collapsedAddElements, setCollapsedAddElements] = useState(false);
  const [collapsedIcons, setCollapsedIcons] = useState(false);
  const [collapsedPrintParams, setCollapsedPrintParams] = useState(false);

  // Workspace Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('nelko_theme') || 'slate');

  useEffect(() => {
    localStorage.setItem('nelko_theme', theme);
    const body = document.body;
    body.classList.remove('theme-indigo', 'theme-emerald', 'theme-cyberpunk', 'theme-light');
    if (theme !== 'slate') {
      body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Local Storage Auto-Save
  useEffect(() => {
    if (elements.length > 0) {
      const state = {
        preset: selectedPreset,
        elements: elements
      };
      localStorage.setItem('nelko_studio_autosave', JSON.stringify(state));
    }
  }, [elements, selectedPreset]);

  // Cache for preloaded QR Code images (for real scannable rendering on screen and canvas)
  const [qrCache, setQrCache] = useState({});

  useEffect(() => {
    const qrElements = elements.filter(el => el.type === 'qr');
    qrElements.forEach(el => {
      const cacheKey = el.content;
      if (cacheKey && !qrCache[cacheKey]) {
        QRCode.toDataURL(cacheKey, { margin: 1 })
          .then(url => {
            const img = new Image();
            img.onload = () => {
              setQrCache(prev => ({
                ...prev,
                [cacheKey]: { url, img }
              }));
            };
            img.src = url;
          })
          .catch(err => console.error('Failed to generate QR:', err));
      }
    });
  }, [elements, qrCache]);

  // Mobile panel tab: 'canvas' | 'add' | 'inspector' | 'print'
  const [mobilePanelTab, setMobilePanelTab] = useState('canvas');

  // MDI Icons Search Custom Hook
  const {
    iconSearch,
    setIconSearch,
    iconResults,
    isSearchingIcons,
  } = useIconSearch();

  const handleSelectWebIcon = async (iconName) => {
    try {
      const res = await fetch(`https://api.iconify.design/mdi/${iconName}.svg`);
      const svgText = await res.text();
      const pathMatch = svgText.match(/d="([^"]+)"/);
      if (pathMatch && pathMatch[1]) {
        addIconElement(iconName, pathMatch[1]);
      } else {
        alert("Failed to extract vector path from icon.");
      }
    } catch (err) {
      alert("Failed to load icon from server.");
    }
  };

  // Templates library & CSV Batch state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [variableMapping, setVariableMapping] = useState({});
  const [batchPreviewIndex, setBatchPreviewIndex] = useState(0);
  const [csvFilename, setCsvFilename] = useState('');

  const csvFileInputRef = useRef(null);
  const layoutFileInputRef = useRef(null);

  // Active Width & Height based on Portrait / Landscape toggle
  const activeWidthMm = isPortraitView ? selectedPreset.height : selectedPreset.width;
  const activeHeightMm = isPortraitView ? selectedPreset.width : selectedPreset.height;

  // Calculate 203 DPI Canvas px size
  const dpi = 203;
  const canvasWidthPx = Math.round((activeWidthMm * dpi) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * dpi) / 25.4);

  // Canvas Dragging & Keyboard Controls Custom Hook
  const containerRef = useRef(null);

  const {
    selectedId,
    setSelectedId,
    draggingId,
    setDraggingId,
    alignmentGuides,
    handleStartDrag,
    nudgeSelectedElement,
    deleteSelectedElement,
  } = useCanvasDrag({
    elements,
    elementsRef,
    setElements,
    pushHistory,
    snapToGrid,
    canvasWidthPx,
    canvasHeightPx,
    containerRef,
    handleUndo,
    handleRedo,
  });

  // Print & Driver State
  const [appVersion, setAppVersion] = useState('1.1.0');
  const [useBrowserBt, setUseBrowserBt] = useState(true);
  const [browserBtConnected, setBrowserBtConnected] = useState(false);
  const [browserBtDeviceName, setBrowserBtDeviceName] = useState('');
  const [browserBtConnecting, setBrowserBtConnecting] = useState(false);
  
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardTab, setWizardTab] = useState('pc');
  
  const [density, setDensity] = useState(3);
  const [copies, setCopies] = useState(1);
  const [ditherMethod, setDitherMethod] = useState('threshold');
  const [invertColors, setInvertColors] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.5);
  const [touchStartDist, setTouchStartDist] = useState(null);
  const touchStartDistRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && (touchStartDistRef.current || touchStartDist)) {
      const currentDist = touchStartDistRef.current || touchStartDist;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (currentDist > 0) {
        const ratio = dist / currentDist;
        setZoomScale(prev => Math.min(Math.max(prev * ratio, 0.5), 3.0));
      }
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
    touchStartDistRef.current = null;
  };

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

  // Fetch status and templates on load
  const fetchTemplates = () => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/printer/status')
      .then(res => res.json())
      .then(data => {
        if (data.version) setAppVersion(data.version);
        if (data.config) setDriverConfig(data.config);
      })
      .catch(() => {});
    fetchTemplates();

    const saved = localStorage.getItem('nelko_studio_autosave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.elements && parsed.preset) {
          setElements(parsed.elements);
          setSelectedPreset(parsed.preset);
          setHistory([parsed.elements]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.error("Auto-save load failed:", e);
      }
    }
  }, []);

  // Connect Browser Bluetooth
  const handleConnectBrowserBt = async () => {
    setPrintStatus(null);
    setBrowserBtConnecting(true);
    try {
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
    } finally {
      setBrowserBtConnecting(false);
    }
  };

  const handleDisconnectBrowserBt = async () => {
    await browserBtDriver.disconnect();
    setBrowserBtConnected(false);
    setBrowserBtDeviceName('');
    setPrintStatus({ type: 'success', msg: 'Disconnected from Bluetooth device.' });
  };

  // Element Actions
  const addTextElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'text',
      content: 'New Text',
      fontSize: 16,
      fontStyle: 'normal',
      fontFamily: 'sans-serif',
      x: 50,
      y: 50
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const fileInputRef = useRef(null);

  const addQRElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'qr',
      content: 'P21-LABEL-123',
      qrHelperType: 'text',
      qrHelperFields: { plainText: 'P21-LABEL-123' },
      x: 50,
      y: 50,
      size: 60
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addBarcodeElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'barcode',
      content: '12345678',
      barcodeType: 'code128',
      x: 50,
      y: 50,
      width: 100,
      height: 30
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addLineElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'line',
      x: 50,
      y: 50,
      width: 120,
      height: 4
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addRectangleElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 160,
      height: 60,
      thickness: 2
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const newEl = {
          id: Date.now(),
          type: 'image',
          url: evt.target.result,
          x: 50,
          y: 50,
          width: 60,
          height: 60,
          imgObject: img
        };
        pushHistory([...elements, newEl]);
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      img.src = String(evt.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addIconElement = (name, path) => {
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60"><path fill="#000000" d="${path}"/></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
    
    const newEl = {
      id: Date.now(),
      type: 'image',
      url: dataUrl,
      x: 50,
      y: 50,
      width: 60,
      height: 60,
      iconName: name
    };
    
    const img = new Image();
    img.onload = () => {
      newEl.imgObject = img;
      pushHistory([...elements, newEl]);
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    };
    img.src = dataUrl;
  };

  const handleExportLayout = () => {
    const state = { preset: selectedPreset, elements };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nelko-layout-${selectedPreset.name.replace(/\s+/g, '-')}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportLayout = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.target.result));
        if (parsed.elements && parsed.preset) {
          pushHistory(parsed.elements);
          setElements(parsed.elements);
          setSelectedPreset(parsed.preset);
          setSelectedTemplateId(null);
          alert("Layout imported successfully!");
        } else {
          alert("Invalid design JSON file structure.");
        }
      } catch (err) {
        alert("Failed to parse design file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearCanvas = () => {
    if (elements.length === 0) return;
    if (window.confirm("Are you sure you want to clear all elements and start fresh?")) {
      pushHistory([]);
      setElements([]);
      setSelectedId(null);
    }
  };

  const handlePushToEsp32 = async () => {
    const target = window.prompt("Enter ESP32 IP or Hostname (e.g. 192.168.4.1 or nelko-bridge.local):", "192.168.4.1");
    if (!target) return;
    const cleanTarget = target.trim().replace(/^https?:\/\//, '');
    try {
      const res = await fetch(`http://${cleanTarget}/api/template/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: selectedPreset, elements })
      });
      if (res.ok) {
        setPrintStatus({ type: 'success', msg: 'Successfully pushed layout template to ESP32 bridge!' });
      } else {
        const errText = await res.text();
        setPrintStatus({ type: 'error', msg: `ESP32 Push Error: ${errText || res.statusText}` });
      }
    } catch (err) {
      setPrintStatus({ type: 'error', msg: `Failed to push template to ESP32: ${err.message}` });
    }
  };

  const updateSelectedElement = (key, val) => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
  };

  const updateQRHelper = (helperType, fieldUpdates) => {
    if (!selectedElement || selectedElement.type !== 'qr') return;

    const prevFields = selectedElement.qrHelperFields || {};
    const updatedFields = { ...prevFields, ...fieldUpdates };

    let compiledValue = selectedElement.content || '';

    if (helperType === 'wifi') {
      const ssid = updatedFields.wifiSsid || '';
      const pass = updatedFields.wifiPassword || '';
      const enc = updatedFields.wifiEncryption || 'WPA';
      const authType = enc === 'None' ? 'nopass' : enc;
      compiledValue = `WIFI:S:${ssid};T:${authType};P:${pass};;`;
    } else if (helperType === 'vcard') {
      const fn = updatedFields.vcardFirstName || '';
      const ln = updatedFields.vcardLastName || '';
      const phone = updatedFields.vcardPhone || '';
      const email = updatedFields.vcardEmail || '';
      const org = updatedFields.vcardOrg || '';
      const fullName = `${fn} ${ln}`.trim();

      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${ln};${fn};;;`, `FN:${fullName}`];
      if (phone) lines.push(`TEL:${phone}`);
      if (email) lines.push(`EMAIL:${email}`);
      if (org) lines.push(`ORG:${org}`);
      lines.push('END:VCARD');
      compiledValue = lines.join('\n');
    } else if (helperType === 'phone') {
      const phone = updatedFields.phoneNum || '';
      compiledValue = `tel:${phone}`;
    } else if (helperType === 'text') {
      compiledValue = updatedFields.plainText !== undefined ? updatedFields.plainText : (selectedElement.content || '');
    }

    const updatedElements = elements.map(el => {
      if (el.id === selectedId) {
        return {
          ...el,
          qrHelperType: helperType,
          qrHelperFields: updatedFields,
          content: compiledValue
        };
      }
      return el;
    });

    setElements(updatedElements);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const item = elements.find(el => el.id === selectedId);
    if (!item) return;
    const remaining = elements.filter(el => el.id !== selectedId);
    const newElements = [item, ...remaining];
    pushHistory(newElements);
    setElements(newElements);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const item = elements.find(el => el.id === selectedId);
    if (!item) return;
    const remaining = elements.filter(el => el.id !== selectedId);
    const newElements = [...remaining, item];
    pushHistory(newElements);
    setElements(newElements);
  };

  // Simple Code128 (Type B) encoder and canvas drawer helper
  const drawCode128OnCanvas = (ctx, text, x, y, width, height) => {
    const patterns = [
      "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
      "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
      "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
      "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
      "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
      "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
      "314111", "221411", "431111", "111224", "111422", "112214", "112412", "114212", "114411", "121124",
      "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211",
      "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211",
      "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
      "114311", "411113", "411311", "113141", "114131", "311141", "411131"
    ];
    
    const startPattern = "211214";
    const stopPattern = "2331112";
    
    let checksum = 104;
    let encodedModules = startPattern;
    
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) - 32;
      if (code >= 0 && code <= 95) {
        encodedModules += patterns[code];
        checksum += code * (i + 1);
      }
    }
    
    const checkDigit = checksum % 103;
    encodedModules += patterns[checkDigit];
    encodedModules += stopPattern;
    
    const totalModules = encodedModules.split('').reduce((sum, char) => sum + parseInt(char, 10), 0);
    const moduleW = width / totalModules;
    
    ctx.fillStyle = "#000000";
    let curX = x - width / 2;
    
    for (let i = 0; i < encodedModules.length; i++) {
      const val = parseInt(encodedModules[i], 10);
      const isBar = (i % 2 === 0);
      const drawW = val * moduleW;
      
      if (isBar) {
        ctx.fillRect(curX, y - height / 2, drawW, height);
      }
      curX += drawW;
    }
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
        const fontFamily = el.fontFamily === 'monospace' ? 'monospace, "Courier New"' : 'Inter, sans-serif';
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, posX, posY);
      } else if (el.type === 'qr') {
        const qrSize = (el.size || 60);
        const cached = qrCache[el.content];
        if (cached && cached.img) {
          ctx.drawImage(cached.img, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        } else {
          ctx.fillRect(posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(posX - qrSize / 2 + 4, posY - qrSize / 2 + 4, qrSize - 8, qrSize - 8);
          ctx.fillStyle = '#000000';
          ctx.fillRect(posX - qrSize / 2 + 8, posY - qrSize / 2 + 8, qrSize - 16, qrSize - 16);
        }
      } else if (el.type === 'barcode') {
        const bcW = (el.width || 100);
        const bcH = (el.height || 30);
        drawCode128OnCanvas(ctx, el.content || '12345678', posX, posY, bcW, bcH);
      } else if (el.type === 'image' && el.url) {
        const img = el.imgObject || new Image();
        if (!el.imgObject) img.src = el.url;
        const imgW = (el.width || 60);
        const imgH = (el.height || 60);
        ctx.drawImage(img, posX - imgW / 2, posY - imgH / 2, imgW, imgH);
      } else if (el.type === 'line') {
        const lineW = (el.width || 120);
        const lineH = (el.height || 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX - lineW / 2, posY - lineH / 2, lineW, lineH);
      } else if (el.type === 'rectangle') {
        const rectW = (el.width || 160);
        const rectH = (el.height || 60);
        const thickness = (el.thickness || 2);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = thickness;
        ctx.strokeRect(posX - rectW / 2, posY - rectH / 2, rectW, rectH);
      }
    });

    return canvas;
  };

  // Offscreen canvas builder helper for a specific job elements structure (e.g. batch)
  const buildOffscreenCanvasForJob = (jobElements) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidthPx;
    canvas.height = canvasHeightPx;
    const ctx = canvas.getContext('2d');

    // Fill White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

    // Draw Elements
    ctx.fillStyle = '#000000';
    jobElements.forEach(el => {
      const posX = (el.x / 100) * canvasWidthPx;
      const posY = (el.y / 100) * canvasHeightPx;

      if (el.type === 'text') {
        const fontFamily = el.fontFamily === 'monospace' ? 'monospace, "Courier New"' : 'Inter, sans-serif';
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, posX, posY);
      } else if (el.type === 'qr') {
        const qrSize = (el.size || 60);
        const cached = qrCache[el.content];
        if (el.imgObject) {
          ctx.drawImage(el.imgObject, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        } else if (cached && cached.img) {
          ctx.drawImage(cached.img, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
        } else {
          ctx.fillRect(posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(posX - qrSize / 2 + 4, posY - qrSize / 2 + 4, qrSize - 8, qrSize - 8);
          ctx.fillStyle = '#000000';
          ctx.fillRect(posX - qrSize / 2 + 8, posY - qrSize / 2 + 8, qrSize - 16, qrSize - 16);
        }
      } else if (el.type === 'barcode') {
        const bcW = (el.width || 100);
        const bcH = (el.height || 30);
        drawCode128OnCanvas(ctx, el.content || '12345678', posX, posY, bcW, bcH);
      } else if (el.type === 'image' && el.url) {
        const img = el.imgObject || new Image();
        if (!el.imgObject) img.src = el.url;
        const imgW = (el.width || 60);
        const imgH = (el.height || 60);
        ctx.drawImage(img, posX - imgW / 2, posY - imgH / 2, imgW, imgH);
      } else if (el.type === 'line') {
        const lineW = (el.width || 120);
        const lineH = (el.height || 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX - lineW / 2, posY - lineH / 2, lineW, lineH);
      } else if (el.type === 'rectangle') {
        const rectW = (el.width || 160);
        const rectH = (el.height || 60);
        const thickness = (el.thickness || 2);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = thickness;
        ctx.strokeRect(posX - rectW / 2, posY - rectH / 2, rectW, rectH);
      }
    });

    return canvas;
  };

  const handleExecuteBatchPrint = async (jobs) => {
    if (useBrowserBt) {
      await handlePrintBatchDirect(jobs);
    } else {
      setIsPrinting(true);
      setPrintStatus(null);
      try {
        const res = await fetch('/api/print/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: selectedTemplateId || 'custom_batch_temp',
            jobs: jobs,
            density: density,
            dither_method: ditherMethod
          })
        });
        const data = await res.json();
        if (res.ok) {
          setPrintStatus({ type: 'success', msg: `Batch of ${jobs.length} labels printed successfully via bridge!` });
        } else {
          setPrintStatus({ type: 'error', msg: data.detail || 'Batch print failed' });
        }
      } catch (err) {
        setPrintStatus({ type: 'error', msg: `Bridge Batch Error: ${err.message}` });
      } finally {
        setIsPrinting(false);
      }
    }
  };

  // Direct Bluetooth Sequential Batch Printer
  const handlePrintBatchDirect = async (jobs) => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const jobElements = elements.map(el => {
          let content = el.content || '';
          if (el.type === 'text' || el.type === 'qr') {
            Object.entries(job.variables).forEach(([k, v]) => {
              content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
            });
          }
          return { ...el, content };
        });

        for (let j = 0; j < jobElements.length; j++) {
          const el = jobElements[j];
          if (el.type === 'qr') {
            const dataUrl = await QRCode.toDataURL(el.content, { margin: 1 });
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = dataUrl;
            });
            el.imgObject = img;
          }
        }

        const canvas = buildOffscreenCanvasForJob(jobElements);
        const payloadBytes = convertCanvasToTsplBytes(canvas, activeWidthMm, activeHeightMm, selectedPreset.gap, density, job.copies, ditherMethod, invertColors);
        
        const success = await browserBtDriver.sendBytes(payloadBytes);
        if (!success) {
          throw new Error(`Failed to send job #${i + 1} in batch`);
        }
        setPrintStatus({ type: 'success', msg: `Printed label #${i + 1}/${jobs.length} in batch...` });
        await new Promise(r => setTimeout(r, 200));
      }
      setPrintStatus({ type: 'success', msg: `Successfully printed all ${jobs.length} labels in batch!` });
    } catch (err) {
      setPrintStatus({ type: 'error', msg: `Batch Print Error: ${err.message}` });
    } finally {
      setIsPrinting(false);
    }
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

  // Sidebar content as a reusable helper function (rendered in desktop aside OR mobile panel)
  const renderSidebarContent = (mobileTab) => (
    <>
      {/* Connection Target Switcher — mobile only */}
      {mobileTab === 'print' && (
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
      )}

      {/* Preset Selection — show in desktop, or 'add' mobile tab */}
      {(!mobileTab || mobileTab === 'add') && (
        <LayoutPresets
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          isPortraitView={isPortraitView}
          setIsPortraitView={setIsPortraitView}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          setElements={setElements}
          setHistory={setHistory}
          setHistoryIndex={setHistoryIndex}
          elements={elements}
          handleExportLayout={handleExportLayout}
          layoutFileInputRef={layoutFileInputRef}
          handleImportLayout={handleImportLayout}
          handleClearCanvas={handleClearCanvas}
          handlePushToEsp32={handlePushToEsp32}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          collapsedPresets={collapsedPresets}
          setCollapsedPresets={setCollapsedPresets}
          theme={theme}
          setTheme={setTheme}
          PRESETS={PRESETS}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
        />
      )}

      {/* Add Elements — show in desktop, or 'add' mobile tab */}
      {(!mobileTab || mobileTab === 'add') && (
        <AddElements
          addTextElement={addTextElement}
          addQRElement={addQRElement}
          addBarcodeElement={addBarcodeElement}
          addLineElement={addLineElement}
          addRectangleElement={addRectangleElement}
          fileInputRef={fileInputRef}
          handleImageUpload={handleImageUpload}
          collapsedAddElements={collapsedAddElements}
          setCollapsedAddElements={setCollapsedAddElements}
        />
      )}

      {/* Icons Library Search Panel */}
      {(!mobileTab || mobileTab === 'add') && (
        <IconLibrary
          iconSearch={iconSearch}
          setIconSearch={setIconSearch}
          iconResults={iconResults}
          isSearchingIcons={isSearchingIcons}
          addIconElement={addIconElement}
          handleSelectWebIcon={handleSelectWebIcon}
          collapsedIcons={collapsedIcons}
          setCollapsedIcons={setCollapsedIcons}
          MDI_OFFLINE={MDI_OFFLINE}
        />
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Navigation Bar */}
      <Header
        appVersion={appVersion}
        historyIndex={historyIndex}
        history={history}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        useBrowserBt={useBrowserBt}
        setUseBrowserBt={setUseBrowserBt}
        browserBtConnected={browserBtConnected}
        browserBtDeviceName={browserBtDeviceName}
        browserBtConnecting={browserBtConnecting}
        handleConnectBrowserBt={handleConnectBrowserBt}
        handleDisconnectBrowserBt={handleDisconnectBrowserBt}
        setShowWizardModal={setShowWizardModal}
        handlePrint={handlePrint}
        isPrinting={isPrinting}
      />

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar / Presets — desktop only */}
        <aside className="hidden md:flex w-80 border-r border-slate-800 glass-panel p-5 flex-col gap-6 overflow-y-auto">
          <PrintParameters
            density={density}
            setDensity={setDensity}
            copies={copies}
            setCopies={setCopies}
            invertColors={invertColors}
            setInvertColors={setInvertColors}
            elements={elements}
            setShowBatchModal={setShowBatchModal}
            collapsedPrintParams={collapsedPrintParams}
            setCollapsedPrintParams={setCollapsedPrintParams}
            handleGeneratePreview={handleGeneratePreview}
          />

          {renderSidebarContent(null)}

          {/* Element Inspector — desktop */}
          <ElementInspector
            selectedElement={selectedElement}
            updateSelectedElement={updateSelectedElement}
            updateQRHelper={updateQRHelper}
            deleteSelectedElement={deleteSelectedElement}
            nudgeSelectedElement={nudgeSelectedElement}
            sendToBack={sendToBack}
            bringToFront={bringToFront}
            pushHistory={pushHistory}
            elementsRef={elementsRef}
            elements={elements}
            setElements={setElements}
          />
        </aside>

        <CanvasWorkspace
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          activeWidthMm={activeWidthMm}
          activeHeightMm={activeHeightMm}
          canvasWidthPx={canvasWidthPx}
          canvasHeightPx={canvasHeightPx}
          isPortraitView={isPortraitView}
          showGrid={showGrid}
          containerRef={containerRef}
          setSelectedId={setSelectedId}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          draggingId={draggingId}
          alignmentGuides={alignmentGuides}
          elements={elements}
          selectedId={selectedId}
          handleStartDrag={handleStartDrag}
          qrCache={qrCache}
        />
      </div>

      {/* Mobile Bottom Panel — slides up when a non-canvas tab is active */}
      <div className="md:hidden">
        {/* Mobile Panel Content */}
        {mobilePanelTab !== 'canvas' && (
          <div className="fixed inset-x-0 bottom-14 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-4">
            {(mobilePanelTab === 'add') && (
              renderSidebarContent("add")
            )}
            {(mobilePanelTab === 'inspector') && (
              <ElementInspector
                selectedElement={selectedElement}
                updateSelectedElement={updateSelectedElement}
                updateQRHelper={updateQRHelper}
                deleteSelectedElement={deleteSelectedElement}
                nudgeSelectedElement={nudgeSelectedElement}
                sendToBack={sendToBack}
                bringToFront={bringToFront}
                pushHistory={pushHistory}
                elementsRef={elementsRef}
                elements={elements}
                setElements={setElements}
              />
            )}
            {(mobilePanelTab === 'print') && (
              <div className="flex flex-col gap-4">
                {renderSidebarContent("print")}
                <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Print Parameters
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Density ({density})</label>
                      <input type="range" min="0" max="15" value={density}
                        onChange={(e) => setDensity(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Copies</label>
                      <input type="number" min="1" max="100" value={copies}
                        onChange={(e) => setCopies(parseInt(e.target.value, 10) || 1)}
                        className="w-full p-2 rounded-xl glass-input text-xs" />
                    </div>
                  </div>
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={invertColors}
                      onChange={(e) => setInvertColors(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500" />
                    Invert Colors (White-on-Black)
                  </label>
                  <button onClick={() => setShowWizardModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition">
                    <Bluetooth className="w-4 h-4 text-indigo-400" />
                    Connection Wizard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 inset-x-0 z-50 h-14 bg-slate-900 border-t border-slate-800 grid grid-cols-4">
          {[
            { id: 'canvas', icon: <Monitor className="w-5 h-5" />, label: 'Canvas' },
            { id: 'add', icon: <Plus className="w-5 h-5" />, label: 'Add' },
            { id: 'inspector', icon: <Sliders className="w-5 h-5" />, label: 'Inspector' },
            { id: 'print', icon: <Printer className="w-5 h-5" />, label: 'Print' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobilePanelTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                mobilePanelTab === tab.id
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'inspector' && selectedElement && (
                <span className="absolute mt-[-18px] ml-4 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Modal Dialogs */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        driverConfig={driverConfig}
        setDriverConfig={setDriverConfig}
        handleSaveConfig={handleSaveConfig}
      />

      <WizardModal 
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        browserBtConnected={browserBtConnected}
        browserBtDeviceName={browserBtDeviceName}
        handleConnectBrowserBt={handleConnectBrowserBt}
        wizardTab={wizardTab}
        setWizardTab={setWizardTab}
        setUseBrowserBt={setUseBrowserBt}
        setShowSettings={setShowSettings}
      />

      <BatchModal 
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setCsvRows([]);
          setCsvHeaders([]);
          setCsvFilename('');
        }}
        csvHeaders={csvHeaders}
        setCsvHeaders={setCsvHeaders}
        csvRows={csvRows}
        setCsvRows={setCsvRows}
        csvFilename={csvFilename}
        setCsvFilename={setCsvFilename}
        variableMapping={variableMapping}
        setVariableMapping={setVariableMapping}
        batchPreviewIndex={batchPreviewIndex}
        setBatchPreviewIndex={setBatchPreviewIndex}
        getTemplateVariables={getTemplateVariables}
        handleExecuteBatchPrint={handleExecuteBatchPrint}
        parseCSV={parseCSV}
        csvFileInputRef={csvFileInputRef}
      />

      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewUrl={previewUrl}
      />
    </div>
  );
}

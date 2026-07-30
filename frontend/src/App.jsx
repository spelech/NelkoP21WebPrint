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
import { convertCanvasToTsplBytes } from './utils/tsplGenerator';
import QRCode from 'qrcode';

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
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

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

  // Helper: robust CSV string scanner
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const cleanLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    if (cleanLines.length === 0) return { headers: [], rows: [] };

    const headers = parseLine(cleanLines[0]);
    const rows = [];
    for (let i = 1; i < cleanLines.length; i++) {
      const values = parseLine(cleanLines[i]);
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((h, index) => {
          row[h] = values[index] || '';
        });
        rows.push(row);
      }
    }
    return { headers, rows };
  };

  // Helper: scan elements for double curly braces template variables
  const getTemplateVariables = () => {
    const vars = new Set();
    elements.forEach(el => {
      if (el.type === 'text' || el.type === 'qr') {
        const matches = (el.content || '').match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach(m => {
            vars.add(m.slice(2, -2).trim());
          });
        }
      }
    });
    return Array.from(vars);
  };

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

  // Keyboard shortcut listener for editor actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!selectedId) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const step = e.shiftKey ? 5 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = elementsRef.current.map(el => el.id === selectedId ? { ...el, x: Math.max(0, Math.round((el.x - step) * 10) / 10) } : el);
        pushHistory(next);
        setElements(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = elementsRef.current.map(el => el.id === selectedId ? { ...el, x: Math.min(100, Math.round((el.x + step) * 10) / 10) } : el);
        pushHistory(next);
        setElements(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = elementsRef.current.map(el => el.id === selectedId ? { ...el, y: Math.max(0, Math.round((el.y - step) * 10) / 10) } : el);
        pushHistory(next);
        setElements(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = elementsRef.current.map(el => el.id === selectedId ? { ...el, y: Math.min(100, Math.round((el.y + step) * 10) / 10) } : el);
        pushHistory(next);
        setElements(next);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex]);

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
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateSelectedElement = (key, val) => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
  };

  const nudgeSelectedElement = (dx, dy) => {
    if (!selectedElement) return;
    const newX = Math.max(0, Math.min(100, Math.round((selectedElement.x + dx) * 10) / 10));
    const newY = Math.max(0, Math.min(100, Math.round((selectedElement.y + dy) * 10) / 10));
    const newElements = elements.map(el => el.id === selectedId ? { ...el, x: newX, y: newY } : el);
    pushHistory(newElements);
    setElements(newElements);
  };

  const deleteSelectedElement = () => {
    const newElements = elements.filter(el => el.id !== selectedId);
    pushHistory(newElements);
    setElements(newElements);
    setSelectedId(newElements.length > 0 ? newElements[0].id : null);
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
    
    const totalModules = encodedModules.split('').reduce((sum, char) => sum + parseInt(char), 0);
    const moduleW = width / totalModules;
    
    ctx.fillStyle = "#000000";
    let curX = x - width / 2;
    
    for (let i = 0; i < encodedModules.length; i++) {
      const val = parseInt(encodedModules[i]);
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
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px Inter, sans-serif`;
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
        ctx.font = `${el.fontStyle === 'bold' ? 'bold' : ''} ${el.fontSize}px Inter, sans-serif`;
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


  // Direct Bluetooth Sequential Batch Printer
  const handlePrintBatchDirect = async (jobs) => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        // Substitute variables in elements
        const jobElements = elements.map(el => {
          let content = el.content || '';
          if (el.type === 'text' || el.type === 'qr') {
            Object.entries(job.variables).forEach(([k, v]) => {
              content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
            });
          }
          return { ...el, content };
        });

        // Preload any QR codes for this job
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
        // Tiny pause between labels
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

  // Sidebar content as a reusable component (rendered in desktop aside OR mobile panel)
  const SidebarContent = ({ mobileTab }) => (
    <>
      {/* Connection Target Switcher — always visible */}
      {(!mobileTab || mobileTab === 'print') && (
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
        <div className="flex flex-col gap-4">
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
                if (preset) {
                  setSelectedPreset(preset);
                  setSelectedTemplateId(null); // Clear active template layout name
                }
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

          {/* Load templates dropdown */}
          {templates.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Load Template Layout
              </label>
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => {
                  const tid = e.target.value;
                  if (!tid) {
                    setSelectedTemplateId(null);
                    setElements([]);
                    setHistory([[]]);
                    setHistoryIndex(0);
                  } else {
                    const temp = templates.find(t => t.id === tid);
                    if (temp) {
                      const initialElements = temp.data?.elements || temp.elements || [];
                      setElements(initialElements);
                      const matchingPreset = PRESETS.find(p => p.width === temp.width_mm && p.height === temp.height_mm) 
                        || { name: `${temp.width_mm}x${temp.height_mm} mm`, width: temp.width_mm, height: temp.height_mm, gap: temp.data?.gap_mm || 5 };
                      setSelectedPreset(matchingPreset);
                      setSelectedTemplateId(tid);
                      setHistory([initialElements]);
                      setHistoryIndex(0);
                    }
                  }
                }}
                className="w-full p-2.5 rounded-xl glass-input text-sm text-indigo-300 font-medium"
              >
                <option value="" className="bg-slate-900 text-slate-400">-- Start Blank / No Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.name} ({t.width_mm}x{t.height_mm}mm)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Add Elements — show in desktop, or 'add' mobile tab */}
      {(!mobileTab || mobileTab === 'add') && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Add Elements
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={addTextElement}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            >
              <Type className="w-4 h-4 text-indigo-400" />
              Text
            </button>
            <button 
              onClick={addQRElement}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            >
              <QrCode className="w-4 h-4 text-violet-400" />
              QR
            </button>
            <button 
              onClick={addBarcodeElement}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            >
              <Barcode className="w-4 h-4 text-indigo-400" />
              Barcode
            </button>
            <button 
              onClick={addLineElement}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            >
              <Minus className="w-4 h-4 text-amber-400" />
              Line
            </button>
            <button 
              onClick={addRectangleElement}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
            >
              <Square className="w-4 h-4 text-sky-400" />
              Border
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl glass-input hover:bg-slate-850 hover:border-indigo-500/50 text-[11px] font-medium transition"
              title="Upload Graphic / Logo / Image"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 md:h-16 border-b border-slate-800 glass-panel px-4 md:px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Printer className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Nelko P21 Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-semibold">
                v{appVersion}
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-400">203 DPI Thermal Label Engine</p>
          </div>
        </div>

        {/* Action Controls — compact on mobile */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo controls */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-805 p-1 rounded-xl mr-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold"
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold"
              title="Redo (Ctrl+Y)"
            >
              Redo
            </button>
          </div>

          {/* Connection button hidden on mobile (accessible via Print tab) */}
          <div className="hidden md:flex items-center gap-3">
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
          </div>

          {/* Preview button visible on mobile */}
          <button 
            onClick={handleGeneratePreview}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            Preview
          </button>

          <button 
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isPrinting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span className="hidden sm:inline">Print Label</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar / Presets — desktop only */}
        <aside className="hidden md:flex w-80 border-r border-slate-800 glass-panel p-5 flex-col gap-6 overflow-y-auto">
          <SidebarContent mobileTab={null} />

          {/* Element Inspector — desktop */}
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

            {/* Text, QR, Barcode content input */}
            {selectedElement.type !== 'image' && selectedElement.type !== 'line' && selectedElement.type !== 'rectangle' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  {selectedElement.type === 'qr' ? 'QR Code Text / URL' : selectedElement.type === 'barcode' ? 'Barcode Content' : 'Text Content'}
                </label>
                <input 
                  type="text" 
                  value={selectedElement.content || ''}
                  onChange={(e) => updateSelectedElement('content', e.target.value)}
                  onBlur={() => pushHistory(elementsRef.current)}
                  className="w-full p-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            )}

            {/* Barcode Type selection */}
            {selectedElement.type === 'barcode' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Barcode Encoding</label>
                <select
                  value={selectedElement.barcodeType || 'code128'}
                  onChange={(e) => {
                    updateSelectedElement('barcodeType', e.target.value);
                    pushHistory(elementsRef.current);
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
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Font Size ({selectedElement.fontSize}px)</label>
                <input 
                  type="range" 
                  min="8" 
                  max="64" 
                  value={selectedElement.fontSize || 22}
                  onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value))}
                  onMouseUp={() => pushHistory(elementsRef.current)}
                  onTouchEnd={() => pushHistory(elementsRef.current)}
                  className="w-full accent-indigo-500"
                />
              </div>
            )}

            {selectedElement.type === 'qr' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">QR Size ({selectedElement.size || 60}px)</label>
                <input 
                  type="range" 
                  min="20" 
                  max="180" 
                  value={selectedElement.size || 60}
                  onChange={(e) => updateSelectedElement('size', parseInt(e.target.value))}
                  onMouseUp={() => pushHistory(elementsRef.current)}
                  onTouchEnd={() => pushHistory(elementsRef.current)}
                  className="w-full accent-indigo-500"
                />
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
                      if (selectedElement.type === 'image' && selectedElement.keepRatio !== false && ratio) {
                        setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, width: newW, height: Math.round(newW * ratio) } : el));
                      } else {
                        updateSelectedElement('width', newW);
                      }
                    }}
                    onMouseUp={() => pushHistory(elementsRef.current)}
                    onTouchEnd={() => pushHistory(elementsRef.current)}
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
                      if (selectedElement.type === 'image' && selectedElement.keepRatio !== false && ratio) {
                        setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, height: newH, width: Math.round(newH * ratio) } : el));
                      } else {
                        updateSelectedElement('height', newH);
                      }
                    }}
                    onMouseUp={() => pushHistory(elementsRef.current)}
                    onTouchEnd={() => pushHistory(elementsRef.current)}
                    className="w-full accent-indigo-500"
                  />
                </div>
                {selectedElement.type === 'image' && (
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer pt-1">
                    <input 
                      type="checkbox"
                      checked={selectedElement.keepRatio !== false}
                      onChange={(e) => {
                        updateSelectedElement('keepRatio', e.target.checked);
                        pushHistory(elementsRef.current);
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
                      onMouseUp={() => pushHistory(elementsRef.current)}
                      onTouchEnd={() => pushHistory(elementsRef.current)}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                )}
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
                      onMouseUp={() => pushHistory(elementsRef.current)}
                      onTouchEnd={() => pushHistory(elementsRef.current)}
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
                      onMouseUp={() => pushHistory(elementsRef.current)}
                      onTouchEnd={() => pushHistory(elementsRef.current)}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Align & Nudge */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400">Quick Align & Nudge</label>
                  <div className="flex flex-col gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between gap-2">
                      <button 
                        onClick={() => {
                          const newElements = elements.map(el => el.id === selectedId ? { ...el, x: 50 } : el);
                          pushHistory(newElements);
                          setElements(newElements);
                        }}
                        className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                        title="Center Horizontally"
                      >
                        <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
                        Center X
                      </button>
                      <button 
                        onClick={() => {
                          const newElements = elements.map(el => el.id === selectedId ? { ...el, y: 50 } : el);
                          pushHistory(newElements);
                          setElements(newElements);
                        }}
                        className="flex-1 py-1.5 rounded-lg glass-input text-[11px] font-medium hover:border-indigo-500/50 transition flex items-center justify-center gap-1"
                        title="Center Vertically"
                      >
                        <AlignCenter className="w-3.5 h-3.5 text-indigo-400 rotate-90" />
                        Center Y
                      </button>
                    </div>

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

                    {/* Layer arrangement buttons */}
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

            <button
              onClick={() => {
                if (elements.length === 0) {
                  alert("Canvas is empty. Add elements first or load a template.");
                  return;
                }
                setShowBatchModal(true);
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-xs font-semibold transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Batch Print from CSV...
            </button>
          </div>
        </aside>


        {/* Center Canvas Studio (Wide Landscape Workspace) */}
        <main className="flex-1 bg-slate-900/50 p-2 md:p-8 flex flex-col items-center justify-center relative overflow-auto pb-20 md:pb-0">
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
            <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }} className="my-4">
              <div 
                ref={containerRef}
                onClick={() => setSelectedId(null)}
                style={{ 
                  width: `${canvasWidthPx}px`, 
                  height: `${canvasHeightPx}px` 
                }}
                className="bg-white rounded-lg shadow-2xl shadow-indigo-500/10 border-2 border-slate-300 relative select-none overflow-visible"
              >
                {/* Empty canvas hint */}
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300/40 select-none gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-[11px] font-medium text-center px-3 leading-tight">Add elements from the sidebar<br className="hidden md:inline" /><span className="md:hidden"> or </span>or Add tab</span>
                  </div>
                )}

                <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                  {elements.map(el => (
                    <div 
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="p-1.5 whitespace-nowrap text-slate-900"
                    >
                      {el.type === 'text' && (
                        <span style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontStyle }}>
                          {el.content}
                        </span>
                      )}

                      {el.type === 'qr' && (
                        qrCache[el.content] && qrCache[el.content].url ? (
                          <img 
                            src={qrCache[el.content].url} 
                            alt="QR Code" 
                            style={{ width: `${el.size || 60}px`, height: `${el.size || 60}px` }}
                            className="shadow-sm"
                          />
                        ) : (
                          <div 
                            style={{ width: `${el.size || 60}px`, height: `${el.size || 60}px` }} 
                            className="bg-slate-900 text-white flex flex-col items-center justify-center rounded text-[9px] font-mono p-1 text-center shadow-inner overflow-hidden"
                          >
                            <QrCode className="w-1/2 h-1/2 mb-0.5 text-indigo-300 min-w-[16px] min-h-[16px]" />
                            {(el.size || 60) >= 50 && <span className="text-[8px] opacity-80 leading-none">[QR Code]</span>}
                          </div>
                        )
                      )}

                      {el.type === 'image' && (
                        <img 
                          src={el.url} 
                          alt="Uploaded Graphic" 
                          style={{ width: `${el.width || 60}px`, height: `${el.height || 60}px`, objectFit: 'contain' }}
                          className="rounded shadow-sm"
                        />
                      )}

                      {el.type === 'barcode' && (
                        <div 
                          style={{ width: `${el.width || 100}px`, height: `${el.height || 30}px` }} 
                          className="bg-white border border-slate-200 flex flex-col items-center justify-between rounded p-1 shadow-inner relative overflow-hidden"
                        >
                          <div className="w-full flex-1 flex items-stretch justify-around px-2 opacity-80 pointer-events-none">
                            {[1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2].map((w, idx) => (
                              <div key={idx} className="bg-slate-900" style={{ width: `${w}px` }} />
                            ))}
                          </div>
                          <span className="text-[7px] font-mono leading-none tracking-widest uppercase text-slate-700 truncate max-w-full px-1">{el.content}</span>
                        </div>
                      )}

                      {el.type === 'line' && (
                        <div 
                          style={{ 
                            width: `${el.width || 120}px`, 
                            height: `${el.height || 4}px` 
                          }} 
                          className="bg-slate-900 rounded-full animate-pulse-subtle"
                        />
                      )}

                      {el.type === 'rectangle' && (
                        <div 
                          style={{ 
                            width: `${el.width || 160}px`, 
                            height: `${el.height || 60}px`,
                            border: `${el.thickness || 2}px solid #0f172a`
                          }} 
                          className="bg-transparent rounded-none"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* LAYER 2: Interactive Handles & Position Badges (Floats outside without clipping) */}
                <div className="absolute inset-0 overflow-visible">
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
                        className={`p-1.5 rounded border-2 group whitespace-nowrap ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-500/10 shadow-md ring-2 ring-indigo-500/20 z-20' 
                            : 'border-dashed border-transparent hover:border-slate-400 hover:bg-slate-500/10 z-10'
                        }`}
                      >
                        {/* Position Badge floating outside without clipping */}
                        {isSelected && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow flex items-center gap-1 pointer-events-none whitespace-nowrap z-30">
                            <Move className="w-2.5 h-2.5" />
                            <span>X: {Math.round(el.x)}% Y: {Math.round(el.y)}%</span>
                          </div>
                        )}

                        {/* Transparent Footprint for Click/Drag Targeting */}
                        <div className="opacity-0 pointer-events-none">
                          {el.type === 'text' && (
                            <span style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontStyle }}>
                              {el.content}
                            </span>
                          )}
                          {el.type === 'qr' && (
                            <div style={{ width: `${el.size || 60}px`, height: `${el.size || 60}px` }} />
                          )}
                          {el.type === 'image' && (
                            <div style={{ width: `${el.width || 60}px`, height: `${el.height || 60}px` }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
      </main>
      </div>

      {/* Mobile Bottom Panel — slides up when a non-canvas tab is active */}
      <div className="md:hidden">
        {/* Mobile Panel Content */}
        {mobilePanelTab !== 'canvas' && (
          <div className="fixed inset-x-0 bottom-14 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-4">
            {(mobilePanelTab === 'add') && (
              <SidebarContent mobileTab="add" />
            )}
            {(mobilePanelTab === 'inspector') && (
              <>
                {selectedElement ? (
                  <div className="flex flex-col gap-4">
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
                    {selectedElement.type !== 'image' && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          {selectedElement.type === 'qr' ? 'QR Code Text / URL' : 'Text Content'}
                        </label>
                        <input 
                          type="text" 
                          value={selectedElement.content || ''}
                          onChange={(e) => updateSelectedElement('content', e.target.value)}
                          className="w-full p-2.5 rounded-xl glass-input text-sm"
                        />
                      </div>
                    )}
                    {selectedElement.type === 'text' && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Font Size ({selectedElement.fontSize}px)</label>
                        <input type="range" min="8" max="64" value={selectedElement.fontSize || 22}
                          onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value))}
                          className="w-full accent-indigo-500" />
                      </div>
                    )}
                    {selectedElement.type === 'qr' && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">QR Size ({selectedElement.size || 60}px)</label>
                        <input type="range" min="20" max="180" value={selectedElement.size || 60}
                          onChange={(e) => updateSelectedElement('size', parseInt(e.target.value))}
                          className="w-full accent-indigo-500" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-slate-400">Position X</label>
                          <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.x)}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={selectedElement.x}
                          onChange={(e) => updateSelectedElement('x', parseFloat(e.target.value))}
                          className="w-full accent-indigo-500" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-slate-400">Position Y</label>
                          <span className="text-xs font-mono text-indigo-300">{Math.round(selectedElement.y)}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={selectedElement.y}
                          onChange={(e) => updateSelectedElement('y', parseFloat(e.target.value))}
                          className="w-full accent-indigo-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSelectedElement('x', 50)}
                        className="flex-1 px-2 py-2 rounded-lg glass-input text-xs font-medium flex items-center justify-center gap-1">
                        <AlignCenter className="w-3.5 h-3.5 text-indigo-400" /> Center X
                      </button>
                      <button onClick={() => updateSelectedElement('y', 50)}
                        className="flex-1 px-2 py-2 rounded-lg glass-input text-xs font-medium flex items-center justify-center gap-1">
                        <AlignCenter className="w-3.5 h-3.5 text-indigo-400 rotate-90" /> Center Y
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm gap-3">
                    <Sliders className="w-8 h-8 text-slate-700" />
                    <p>Tap an element on the canvas to inspect it</p>
                  </div>
                )}
              </>
            )}
            {(mobilePanelTab === 'print') && (
              <div className="flex flex-col gap-4">
                <SidebarContent mobileTab="print" />
                <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Print Parameters
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Density ({density})</label>
                      <input type="range" min="0" max="15" value={density}
                        onChange={(e) => setDensity(parseInt(e.target.value))}
                        className="w-full accent-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Copies</label>
                      <input type="number" min="1" max="100" value={copies}
                        onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
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
      {/* CSV Batch Print Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] text-left select-text">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                CSV Batch Print Studio
              </h3>
              <button 
                onClick={() => {
                  setShowBatchModal(false);
                  setCsvRows([]);
                  setCsvHeaders([]);
                  setCsvFilename('');
                }}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-sm text-slate-300">
              {csvRows.length === 0 ? (
                <div 
                  onClick={() => csvFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500 bg-slate-900/40 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
                >
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition" />
                  <div>
                    <p className="font-semibold text-white">Upload CSV File</p>
                    <p className="text-xs text-slate-500 mt-1">Select or drag a CSV file containing label rows</p>
                  </div>
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const { headers, rows } = parseCSV(evt.target.result);
                        if (headers.length === 0 || rows.length === 0) {
                          alert("Invalid or empty CSV file.");
                          return;
                        }
                        setCsvHeaders(headers);
                        setCsvRows(rows);
                        setCsvFilename(file.name);
                        
                        // Auto-map matching variable names
                        const templateVars = getTemplateVariables();
                        const initialMapping = {};
                        templateVars.forEach(v => {
                          const match = headers.find(h => h.toLowerCase() === v.toLowerCase());
                          if (match) initialMapping[v] = match;
                        });
                        setVariableMapping(initialMapping);
                        setBatchPreviewIndex(0);
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              ) : (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400">Active CSV File</p>
                      <p className="text-sm font-semibold text-indigo-300">{csvFilename}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCsvRows([]);
                        setCsvHeaders([]);
                        setCsvFilename('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition"
                    >
                      Clear File
                    </button>
                  </div>

                  {/* Mapping variables */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Map Template Placeholders to CSV Columns
                    </h4>
                    {getTemplateVariables().length === 0 ? (
                      <div className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                        ⚠️ No variables like <code>{"{{variable}}"}</code> found in current label elements. Add text/QR codes containing double curly braces to map CSV fields.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {getTemplateVariables().map(v => (
                          <div key={v} className="grid grid-cols-3 items-center gap-3">
                            <span className="text-xs font-mono text-indigo-300">{"{{"}{v}{"}}"}</span>
                            <span className="text-center text-xs text-slate-500">maps to</span>
                            <select
                              value={variableMapping[v] || ''}
                              onChange={(e) => setVariableMapping({ ...variableMapping, [v]: e.target.value })}
                              className="p-2 rounded-lg glass-input text-xs"
                            >
                              <option value="">-- Ignore / Clear --</option>
                              {csvHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Batch Preview Slider */}
                  {csvRows.length > 0 && (
                    <div className="border-t border-slate-800/80 pt-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Label Preview (Row {batchPreviewIndex + 1} of {csvRows.length})
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={batchPreviewIndex === 0}
                            onClick={() => setBatchPreviewIndex(prev => prev - 1)}
                            className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition"
                          >
                            ◀ Prev
                          </button>
                          <button
                            disabled={batchPreviewIndex === csvRows.length - 1}
                            onClick={() => setBatchPreviewIndex(prev => prev + 1)}
                            className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition"
                          >
                            Next ▶
                          </button>
                        </div>
                      </div>

                      {/* Display rendered variables for preview */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
                        {getTemplateVariables().map(v => {
                          const col = variableMapping[v];
                          const val = col ? csvRows[batchPreviewIndex]?.[col] : `{{${v}}}`;
                          return (
                            <div key={v} className="flex justify-between border-b border-slate-905 pb-1">
                              <span className="text-slate-500">{"{{"}{v}{"}}"}</span>
                              <span className="text-indigo-400 font-semibold truncate max-w-[250px]">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button 
                onClick={() => {
                  setShowBatchModal(false);
                  setCsvRows([]);
                  setCsvHeaders([]);
                  setCsvFilename('');
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
              >
                Close
              </button>
              {csvRows.length > 0 && (
                <button 
                  onClick={async () => {
                    const jobs = csvRows.map(row => {
                      const variables = {};
                      Object.entries(variableMapping).forEach(([k, col]) => {
                        variables[k] = row[col] || '';
                      });
                      return { variables, copies: 1 };
                    });

                    setShowBatchModal(false);

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
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Batch ({csvRows.length} labels)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useRef, ChangeEvent } from 'react';
import { 
  LabelPreset, LabelElement, TextElement, QRElement, BarcodeElement, LineElement, 
  RectangleElement, ImageElement, PrintStatus 
} from '../types';

export interface UseElementActionsParams {
  elements: LabelElement[];
  elementsRef?: React.MutableRefObject<LabelElement[]>;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  pushHistory: (newElements: LabelElement[]) => void;
  selectedPreset: LabelPreset;
  setSelectedPreset: React.Dispatch<React.SetStateAction<LabelPreset>>;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<number | string | null>>;
  selectedId: number | null;
  setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
  setHistory: React.Dispatch<React.SetStateAction<LabelElement[][]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setPrintStatus?: React.Dispatch<React.SetStateAction<PrintStatus | null>>;
}

export interface UseElementActionsReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  layoutFileInputRef: React.RefObject<HTMLInputElement>;
  addTextElement: () => void;
  addQRElement: () => void;
  addBarcodeElement: () => void;
  addLineElement: () => void;
  addRectangleElement: () => void;
  addPlaceholderElement: (placeholderVar: string) => void;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  addIconElement: (name: string, path: string) => void;
  handleExportLayout: () => void;
  handleImportLayout: (e: ChangeEvent<HTMLInputElement>) => void;
  handleClearCanvas: () => void;
  handlePushToEsp32: () => Promise<void>;
  updateSelectedElement: (key: string, val: any) => void;
  updateQRHelper: (helperType: string, fieldUpdates: Record<string, string>) => void;
  sendToBack: () => void;
  bringToFront: () => void;
}

export function useElementActions({
  elements, setElements, pushHistory, selectedPreset, setSelectedPreset,
  setSelectedTemplateId, selectedId, setSelectedId, setPrintStatus
}: UseElementActionsParams): UseElementActionsReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layoutFileInputRef = useRef<HTMLInputElement>(null);

  const addTextElement = (): void => {
    const newEl: TextElement = {
      id: Date.now(), type: 'text', content: 'New Text', fontSize: 16, fontStyle: 'normal', fontFamily: 'sans-serif', x: 50, y: 50
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addQRElement = (): void => {
    const newEl: QRElement = {
      id: Date.now(), type: 'qr', content: 'P21-LABEL-123', qrHelperType: 'text', qrHelperFields: { plainText: 'P21-LABEL-123' }, x: 50, y: 50, size: 60
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addBarcodeElement = (): void => {
    const newEl: BarcodeElement = {
      id: Date.now(), type: 'barcode', content: '12345678', barcodeType: 'code128', x: 50, y: 50, width: 100, height: 30
    };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addLineElement = (): void => {
    const newEl: LineElement = { id: Date.now(), type: 'line', x: 50, y: 50, width: 120, height: 4 };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addRectangleElement = (): void => {
    const newEl: RectangleElement = { id: Date.now(), type: 'rectangle', x: 50, y: 50, width: 160, height: 60, thickness: 2 };
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addPlaceholderElement = (placeholderVar: string): void => {
    const tag = `{{${placeholderVar}}}`;
    let newEl: LabelElement;
    if (placeholderVar === 'barcodeData') {
      newEl = { id: Date.now(), type: 'barcode', content: tag, barcodeType: 'code128', x: 50, y: 50, width: 100, height: 30 };
    } else if (placeholderVar === 'qrData') {
      newEl = { id: Date.now(), type: 'qr', content: tag, qrHelperType: 'text', qrHelperFields: { plainText: tag }, x: 50, y: 50, size: 60 };
    } else {
      newEl = { id: Date.now(), type: 'text', content: tag, fontSize: (placeholderVar === 'mainText') ? 22 : 14, fontStyle: 'bold', fontFamily: 'sans-serif', x: 50, y: 50 };
    }
    pushHistory([...elements, newEl]);
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (typeof result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const newEl: ImageElement = {
          id: Date.now(), type: 'image', url: result, x: 50, y: 50, width: 60, height: 60, imgObject: img
        };
        pushHistory([...elements, newEl]);
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addIconElement = (name: string, path: string): void => {
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="60" height="60"><path fill="#000000" d="${path}"/></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
    const newEl: ImageElement = { id: Date.now(), type: 'image', url: dataUrl, x: 50, y: 50, width: 60, height: 60, iconName: name };
    const img = new Image();
    img.onload = () => {
      newEl.imgObject = img;
      pushHistory([...elements, newEl]);
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    };
    img.src = dataUrl;
  };

  const handleExportLayout = (): void => {
    const state = { preset: selectedPreset, elements };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nelko-layout-${selectedPreset.name.replace(/\s+/g, '-')}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportLayout = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = evt.target?.result;
        if (typeof result !== 'string') return;
        const parsed = JSON.parse(result);
        if (parsed.elements && parsed.preset) {
          pushHistory(parsed.elements);
          setElements(parsed.elements);
          setSelectedPreset(parsed.preset);
          setSelectedTemplateId(null);
          alert("Layout imported successfully!");
        } else alert("Invalid design JSON file structure.");
      } catch { alert("Failed to parse design file."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearCanvas = (): void => {
    if (elements.length === 0) return;
    if (window.confirm("Are you sure you want to clear all elements and start fresh?")) {
      pushHistory([]);
      setElements([]);
      setSelectedId(null);
    }
  };

  const handlePushToEsp32 = async (): Promise<void> => {
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
        setPrintStatus?.({ type: 'success', msg: 'Successfully pushed layout template to ESP32 bridge!' });
      } else {
        const errText = await res.text();
        setPrintStatus?.({ type: 'error', msg: `ESP32 Push Error: ${errText || res.statusText}` });
      }
    } catch (err: any) {
      setPrintStatus?.({ type: 'error', msg: `Failed to push template to ESP32: ${err?.message || err}` });
    }
  };

  const updateSelectedElement = (key: string, val: any): void => {
    setElements(elements.map(el => el.id === selectedId ? { ...el, [key]: val } as LabelElement : el));
  };

  const updateQRHelper = (helperType: string, fieldUpdates: Record<string, string>): void => {
    const selectedElement = elements.find(el => el.id === selectedId) || null;
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
      compiledValue = `tel:${updatedFields.phoneNum || ''}`;
    } else if (helperType === 'text') {
      compiledValue = updatedFields.plainText !== undefined ? updatedFields.plainText : (selectedElement.content || '');
    }

    const updatedElements = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, qrHelperType: helperType, qrHelperFields: updatedFields, content: compiledValue } as LabelElement;
      }
      return el;
    });
    setElements(updatedElements);
  };

  const sendToBack = (): void => {
    if (!selectedId) return;
    const item = elements.find(el => el.id === selectedId);
    if (!item) return;
    const remaining = elements.filter(el => el.id !== selectedId);
    const newElements = [item, ...remaining];
    pushHistory(newElements);
    setElements(newElements);
  };

  const bringToFront = (): void => {
    if (!selectedId) return;
    const item = elements.find(el => el.id === selectedId);
    if (!item) return;
    const remaining = elements.filter(el => el.id !== selectedId);
    const newElements = [...remaining, item];
    pushHistory(newElements);
    setElements(newElements);
  };

  return {
    fileInputRef, layoutFileInputRef, addTextElement, addQRElement, addBarcodeElement, addLineElement,
    addRectangleElement, addPlaceholderElement, handleImageUpload, addIconElement, handleExportLayout, handleImportLayout,
    handleClearCanvas, handlePushToEsp32, updateSelectedElement, updateQRHelper, sendToBack, bringToFront,
  };
}

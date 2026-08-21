import React, { useState, useEffect, useRef } from 'react';
import { Printer, Plus, Sliders, Monitor, CheckCircle2, AlertCircle, X } from 'lucide-react';
import QRCode from 'qrcode';
import { parseCSV, getTemplateVariables } from './utils/csvParser';
import { useHistory } from './hooks/useHistory';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import { useIconSearch } from './hooks/useIconSearch';
import { useTouchZoom } from './hooks/useTouchZoom';
import { useElementActions } from './hooks/useElementActions';
import { usePrinterBridge } from './hooks/usePrinterBridge';
import SidebarContent from './components/SidebarContent';
import SettingsModal, { DriverConfig } from './components/Modals/SettingsModal';
import WizardModal from './components/Modals/WizardModal';
import BatchModal from './components/Modals/BatchModal';
import PreviewModal from './components/Modals/PreviewModal';
import { TemplateItem } from './components/LayoutPresets';
import Header from './components/Header';
import CanvasWorkspace, { QrCacheItem } from './components/CanvasWorkspace';
import { LabelPreset, QRElement } from './types';
import { PRESETS } from './constants/presets';

export default function App(): React.ReactElement {
  const [selectedPreset, setSelectedPreset] = useState<LabelPreset>(PRESETS[0]);
  const [isPortraitView, setIsPortraitView] = useState<boolean>(false);

  const {
    elements, setElements, history, setHistory, historyIndex, setHistoryIndex,
    elementsRef, pushHistory, handleUndo, handleRedo,
  } = useHistory([]);

  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [collapsedPresets, setCollapsedPresets] = useState<boolean>(false);
  const [collapsedAddElements, setCollapsedAddElements] = useState<boolean>(false);
  const [collapsedIcons, setCollapsedIcons] = useState<boolean>(false);
  const [collapsedPrintParams, setCollapsedPrintParams] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('nelko_theme') || 'slate');

  useEffect(() => {
    localStorage.setItem('nelko_theme', theme);
    document.body.classList.remove('theme-indigo', 'theme-emerald', 'theme-cyberpunk', 'theme-light');
    if (theme !== 'slate') document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    if (elements.length > 0) {
      localStorage.setItem('nelko_studio_autosave', JSON.stringify({ preset: selectedPreset, elements }));
    }
  }, [elements, selectedPreset]);

  const [qrCache, setQrCache] = useState<Record<string, QrCacheItem>>({});

  useEffect(() => {
    elements.filter((el): el is QRElement => el.type === 'qr').forEach(el => {
      if (el.content && !qrCache[el.content]) {
        QRCode.toDataURL(el.content, { margin: 1 }).then((url: string) => {
          const img = new Image();
          img.onload = () => setQrCache(prev => ({ ...prev, [el.content]: { url, img } }));
          img.src = url;
        }).catch((err: any) => console.error('Failed to generate QR:', err));
      }
    });
  }, [elements, qrCache]);

  const [mobilePanelTab, setMobilePanelTab] = useState<string>('canvas');
  const { iconSearch, setIconSearch, iconResults, isSearchingIcons } = useIconSearch();

  const handleSelectWebIcon = async (iconName: string): Promise<void> => {
    try {
      const res = await fetch(`https://api.iconify.design/mdi/${iconName}.svg`);
      const svgText = await res.text();
      const pathMatch = svgText.match(/d="([^"]+)"/);
      if (pathMatch && pathMatch[1]) addIconElement(iconName, pathMatch[1]);
      else alert("Failed to extract vector path from icon.");
    } catch { alert("Failed to load icon from server."); }
  };

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [batchPreviewIndex, setBatchPreviewIndex] = useState<number>(0);
  const [csvFilename, setCsvFilename] = useState<string>('');
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const activeWidthMm = isPortraitView ? selectedPreset.height : selectedPreset.width;
  const activeHeightMm = isPortraitView ? selectedPreset.width : selectedPreset.height;
  const canvasWidthPx = Math.round((activeWidthMm * 203) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * 203) / 25.4);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    selectedId, setSelectedId, draggingId, alignmentGuides, handleStartDrag,
    nudgeSelectedElement, deleteSelectedElement,
  } = useCanvasDrag({
    elements, elementsRef, setElements, pushHistory, snapToGrid, canvasWidthPx, canvasHeightPx, containerRef, handleUndo, handleRedo,
  });

  const [appVersion, setAppVersion] = useState<string>('3.1.1');
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  const [wizardTab, setWizardTab] = useState<string>('esp32');
  const { zoomScale, setZoomScale, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchZoom(1.5);

  const {
    isMobile, density, setDensity, copies, setCopies, invertColors, setInvertColors, isPrinting, printStatus, setPrintStatus,
    previewUrl, showPreview, setShowPreview, useBrowserBt, setUseBrowserBt, browserBtConnected, browserBtDeviceName,
    browserBtConnecting, handleConnectBrowserBt, handleDisconnectBrowserBt, handlePrint, handleGeneratePreview, handleExecuteBatchPrint,
  } = usePrinterBridge({ elements, activeWidthMm, activeHeightMm, selectedPreset, qrCache, selectedTemplateId, setShowWizardModal });

  useEffect(() => {
    if (printStatus) {
      const timer = setTimeout(() => {
        setPrintStatus(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [printStatus, setPrintStatus]);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [driverConfig, setDriverConfig] = useState<DriverConfig>({ driver_type: 'tcp', tcp_host: '10.0.0.205', tcp_port: 9100, bt_mac: '' });
  const selectedElement = elements.find(el => el.id === selectedId) || null;

  useEffect(() => {
    fetch('/api/printer/status').then(res => res.json()).then(d => {
      if (d.version) setAppVersion(d.version);
      if (d.config) setDriverConfig(d.config);
    }).catch(() => {});
    fetch('/api/templates').then(res => res.json()).then(d => { if (Array.isArray(d)) setTemplates(d); }).catch(() => {});
    const saved = localStorage.getItem('nelko_studio_autosave');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.elements && p.preset) {
          setElements(p.elements); setSelectedPreset(p.preset); setHistory([p.elements]); setHistoryIndex(0);
        }
      } catch (e) { console.error("Auto-save load failed:", e); }
    }
  }, []);

  const {
    fileInputRef, layoutFileInputRef, addTextElement, addQRElement, addBarcodeElement, addLineElement,
    addRectangleElement, addPlaceholderElement, handleImageUpload, addIconElement, handleExportLayout, handleImportLayout,
    handleClearCanvas, handlePushToEsp32, updateSelectedElement, updateQRHelper, sendToBack, bringToFront,
  } = useElementActions({
    elements, elementsRef, setElements, pushHistory, selectedPreset, setSelectedPreset, setSelectedTemplateId, selectedId, setSelectedId, setHistory, setHistoryIndex, setPrintStatus,
  });

  const handleSaveConfig = async (): Promise<void> => {
    try {
      await fetch('/api/printer/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(driverConfig) });
      setShowSettings(false);
    } catch (err) { console.error(err); }
  };

  const sidebarProps = {
    density, setDensity, copies, setCopies, invertColors, setInvertColors, useBrowserBt, setUseBrowserBt, elements, setShowBatchModal, setShowWizardModal, collapsedPrintParams, setCollapsedPrintParams, handleGeneratePreview, selectedPreset, setSelectedPreset, isPortraitView, setIsPortraitView, templates, selectedTemplateId, setSelectedTemplateId, setElements, setHistory, setHistoryIndex, handleExportLayout, layoutFileInputRef, handleImportLayout, handleClearCanvas, handlePushToEsp32, snapToGrid, setSnapToGrid, showGrid, setShowGrid, collapsedPresets, setCollapsedPresets, theme, setTheme, zoomScale, setZoomScale, addTextElement, addQRElement, addBarcodeElement, addLineElement, addRectangleElement, addPlaceholderElement, fileInputRef, handleImageUpload, collapsedAddElements, setCollapsedAddElements, iconSearch, setIconSearch, iconResults, isSearchingIcons, addIconElement, handleSelectWebIcon, collapsedIcons, setCollapsedIcons, selectedElement, updateSelectedElement, updateQRHelper, deleteSelectedElement, nudgeSelectedElement, sendToBack, bringToFront, pushHistory, elementsRef
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      <Header appVersion={appVersion} historyIndex={historyIndex} history={history} handleUndo={handleUndo} handleRedo={handleRedo} useBrowserBt={useBrowserBt} setUseBrowserBt={setUseBrowserBt} browserBtConnected={browserBtConnected} browserBtDeviceName={browserBtDeviceName} browserBtConnecting={browserBtConnecting} handleConnectBrowserBt={handleConnectBrowserBt} handleDisconnectBrowserBt={handleDisconnectBrowserBt} setShowWizardModal={setShowWizardModal} handlePrint={handlePrint} isPrinting={isPrinting} isMobile={isMobile} driverConfig={driverConfig} setShowSettings={setShowSettings} />
      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex w-80 border-r border-slate-800 glass-panel p-5 flex-col gap-6 overflow-y-auto">
          <SidebarContent {...sidebarProps} />
        </aside>
        <CanvasWorkspace zoomScale={zoomScale} setZoomScale={setZoomScale} activeWidthMm={activeWidthMm} activeHeightMm={activeHeightMm} canvasWidthPx={canvasWidthPx} canvasHeightPx={canvasHeightPx} isPortraitView={isPortraitView} showGrid={showGrid} containerRef={containerRef} setSelectedId={setSelectedId} handleTouchStart={handleTouchStart} handleTouchMove={handleTouchMove} handleTouchEnd={handleTouchEnd} draggingId={draggingId} alignmentGuides={alignmentGuides} elements={elements} selectedId={selectedId} handleStartDrag={handleStartDrag} qrCache={qrCache} />
      </div>
      <div className="md:hidden">
        {mobilePanelTab !== 'canvas' && (
          <div className="fixed inset-x-0 bottom-14 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-4">
            <SidebarContent mobileTab={mobilePanelTab} {...sidebarProps} />
          </div>
        )}
        <nav className="fixed bottom-0 inset-x-0 z-50 h-14 bg-slate-900 border-t border-slate-800 grid grid-cols-4">
          {[
            { id: 'canvas', icon: <Monitor className="w-5 h-5" />, label: 'Canvas' },
            { id: 'add', icon: <Plus className="w-5 h-5" />, label: 'Add' },
            { id: 'inspector', icon: <Sliders className="w-5 h-5" />, label: 'Inspector' },
            { id: 'print', icon: <Printer className="w-5 h-5" />, label: 'Print' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobilePanelTab(tab.id)} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${mobilePanelTab === tab.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.icon} {tab.label}
              {tab.id === 'inspector' && selectedElement && <span className="absolute mt-[-18px] ml-4 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </button>
          ))}
        </nav>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} driverConfig={driverConfig} setDriverConfig={setDriverConfig} handleSaveConfig={handleSaveConfig} isMobile={isMobile} />
      <WizardModal isOpen={showWizardModal} onClose={() => setShowWizardModal(false)} browserBtConnected={browserBtConnected} browserBtDeviceName={browserBtDeviceName} handleConnectBrowserBt={handleConnectBrowserBt} wizardTab={wizardTab} setWizardTab={setWizardTab} setUseBrowserBt={setUseBrowserBt} setShowSettings={setShowSettings} isMobile={isMobile} />
      <BatchModal isOpen={showBatchModal} onClose={() => { setShowBatchModal(false); setCsvRows([]); setCsvHeaders([]); setCsvFilename(''); }} csvHeaders={csvHeaders} setCsvHeaders={setCsvHeaders} csvRows={csvRows} setCsvRows={setCsvRows} csvFilename={csvFilename} setCsvFilename={setCsvFilename} variableMapping={variableMapping} setVariableMapping={setVariableMapping} batchPreviewIndex={batchPreviewIndex} setBatchPreviewIndex={setBatchPreviewIndex} getTemplateVariables={() => getTemplateVariables(elements)} handleExecuteBatchPrint={handleExecuteBatchPrint} parseCSV={parseCSV} csvFileInputRef={csvFileInputRef} />
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} previewUrl={previewUrl} />
      {printStatus && (
        <div className={`fixed bottom-16 md:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          printStatus.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50' 
            : 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50'
        }`}>
          {printStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs md:text-sm font-medium">{printStatus.msg}</span>
          <button 
            onClick={() => setPrintStatus(null)}
            className="ml-2 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

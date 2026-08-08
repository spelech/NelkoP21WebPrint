import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { 
  Printer, 
  Plus, 
  Sliders, 
  Bluetooth, 
  Monitor
} from 'lucide-react';
import QRCode from 'qrcode';
import { MDI_OFFLINE } from './utils/mdiIcons';
import { parseCSV, getTemplateVariables } from './utils/csvParser';
import { useHistory } from './hooks/useHistory';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import { useIconSearch } from './hooks/useIconSearch';
import { useElementActions } from './hooks/useElementActions';
import { usePrinterBridge } from './hooks/usePrinterBridge';
import ElementInspector from './components/Inspector/ElementInspector';
import SettingsModal, { DriverConfig } from './components/Modals/SettingsModal';
import WizardModal from './components/Modals/WizardModal';
import BatchModal from './components/Modals/BatchModal';
import PreviewModal from './components/Modals/PreviewModal';
import PrintParameters from './components/PrintParameters';
import LayoutPresets, { TemplateItem } from './components/LayoutPresets';
import AddElements from './components/AddElements';
import IconLibrary from './components/IconLibrary';
import Header from './components/Header';
import CanvasWorkspace, { QrCacheItem } from './components/CanvasWorkspace';
import { LabelPreset, QRElement } from './types';

// Presets oriented in Landscape view (Width x Height) for optimal readable workspace
const PRESETS: LabelPreset[] = [
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

export default function App(): React.ReactElement {
  // Preset & Label Dimensions
  const [selectedPreset, setSelectedPreset] = useState<LabelPreset>(PRESETS[0]);
  const [isPortraitView, setIsPortraitView] = useState<boolean>(false); // Default to Landscape view

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
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Collapsable Sidebar Sections State
  const [collapsedPresets, setCollapsedPresets] = useState<boolean>(false);
  const [collapsedAddElements, setCollapsedAddElements] = useState<boolean>(false);
  const [collapsedIcons, setCollapsedIcons] = useState<boolean>(false);
  const [collapsedPrintParams, setCollapsedPrintParams] = useState<boolean>(false);

  // Workspace Theme State
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('nelko_theme') || 'slate');

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
  const [qrCache, setQrCache] = useState<Record<string, QrCacheItem>>({});

  useEffect(() => {
    const qrElements = elements.filter((el): el is QRElement => el.type === 'qr');
    qrElements.forEach(el => {
      const cacheKey = el.content;
      if (cacheKey && !qrCache[cacheKey]) {
        QRCode.toDataURL(cacheKey, { margin: 1 })
          .then((url: string) => {
            const img = new Image();
            img.onload = () => {
              setQrCache(prev => ({
                ...prev,
                [cacheKey]: { url, img }
              }));
            };
            img.src = url;
          })
          .catch((err: any) => console.error('Failed to generate QR:', err));
      }
    });
  }, [elements, qrCache]);

  // Mobile panel tab: 'canvas' | 'add' | 'inspector' | 'print'
  const [mobilePanelTab, setMobilePanelTab] = useState<string>('canvas');

  // MDI Icons Search Custom Hook
  const {
    iconSearch,
    setIconSearch,
    iconResults,
    isSearchingIcons,
  } = useIconSearch();

  const handleSelectWebIcon = async (iconName: string): Promise<void> => {
    try {
      const res = await fetch(`https://api.iconify.design/mdi/${iconName}.svg`);
      const svgText = await res.text();
      const pathMatch = svgText.match(/d="([^"]+)"/);
      if (pathMatch && pathMatch[1]) {
        addIconElement(iconName, pathMatch[1]);
      } else {
        alert("Failed to extract vector path from icon.");
      }
    } catch {
      alert("Failed to load icon from server.");
    }
  };

  // Templates library & CSV Batch state
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [batchPreviewIndex, setBatchPreviewIndex] = useState<number>(0);
  const [csvFilename, setCsvFilename] = useState<string>('');

  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Active Width & Height based on Portrait / Landscape toggle
  const activeWidthMm = isPortraitView ? selectedPreset.height : selectedPreset.width;
  const activeHeightMm = isPortraitView ? selectedPreset.width : selectedPreset.height;

  // Calculate 203 DPI Canvas px size
  const dpi = 203;
  const canvasWidthPx = Math.round((activeWidthMm * dpi) / 25.4);
  const canvasHeightPx = Math.round((activeHeightMm * dpi) / 25.4);

  // Canvas Dragging & Keyboard Controls Custom Hook
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    selectedId,
    setSelectedId,
    draggingId,
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

  // App Version & Connection Wizard State
  const [appVersion, setAppVersion] = useState<string>('1.1.0');
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  const [wizardTab, setWizardTab] = useState<string>('pc');

  // Zoom & Pinch Controls
  const [zoomScale, setZoomScale] = useState<number>(1.5);
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const touchStartDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>): void => {
    if (e.touches.length === 2 && (touchStartDistRef.current || touchStartDist)) {
      const currentDist = touchStartDistRef.current || touchStartDist || 0;
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

  const handleTouchEnd = (): void => {
    setTouchStartDist(null);
    touchStartDistRef.current = null;
  };

  // Printer Bridge Hook
  const {
    density,
    setDensity,
    copies,
    setCopies,
    invertColors,
    setInvertColors,
    isPrinting,
    setPrintStatus,
    previewUrl,
    showPreview,
    setShowPreview,
    useBrowserBt,
    setUseBrowserBt,
    browserBtConnected,
    browserBtDeviceName,
    browserBtConnecting,
    handleConnectBrowserBt,
    handleDisconnectBrowserBt,
    handlePrint,
    handleGeneratePreview,
    handleExecuteBatchPrint,
  } = usePrinterBridge({
    elements,
    activeWidthMm,
    activeHeightMm,
    selectedPreset,
    qrCache,
    selectedTemplateId,
    setShowWizardModal,
  });

  // Modals & Settings State
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Driver Config for Server Bridge Mode
  const [driverConfig, setDriverConfig] = useState<DriverConfig>({
    driver_type: 'tcp',
    tcp_host: '127.0.0.1',
    tcp_port: 9100,
    bt_mac: ''
  });

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  // Fetch status and templates on load
  const fetchTemplates = (): void => {
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

  // Element Actions Hook
  const {
    fileInputRef,
    layoutFileInputRef,
    addTextElement,
    addQRElement,
    addBarcodeElement,
    addLineElement,
    addRectangleElement,
    handleImageUpload,
    addIconElement,
    handleExportLayout,
    handleImportLayout,
    handleClearCanvas,
    handlePushToEsp32,
    updateSelectedElement,
    updateQRHelper,
    sendToBack,
    bringToFront,
  } = useElementActions({
    elements,
    elementsRef,
    setElements,
    pushHistory,
    selectedPreset,
    setSelectedPreset,
    setSelectedTemplateId,
    selectedId,
    setSelectedId,
    setHistory,
    setHistoryIndex,
    setPrintStatus,
  });

  // Save Config
  const handleSaveConfig = async (): Promise<void> => {
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
  const renderSidebarContent = (mobileTab: string | null): React.ReactElement => (
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
        getTemplateVariables={() => getTemplateVariables(elements)}
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

import React from 'react';
import { Bluetooth, Sliders } from 'lucide-react';
import PrintParameters from './PrintParameters';
import LayoutPresets, { TemplateItem } from './LayoutPresets';
import AddElements from './AddElements';
import IconLibrary from './IconLibrary';
import ElementInspector from './Inspector/ElementInspector';
import { LabelElement, LabelPreset } from '../types';
import { MDI_OFFLINE } from '../utils/mdiIcons';
import { PRESETS } from '../constants/presets';
import { IconResult } from '../hooks/useIconSearch';

export interface SidebarContentProps {
  mobileTab?: string | null;

  // Print Parameters & Bridge
  density: number;
  setDensity: (density: number) => void;
  copies: number;
  setCopies: (copies: number) => void;
  invertColors: boolean;
  setInvertColors: (invert: boolean) => void;
  useBrowserBt: boolean;
  setUseBrowserBt: (use: boolean) => void;
  elements: LabelElement[];
  setShowBatchModal: (show: boolean) => void;
  setShowWizardModal: (show: boolean) => void;
  collapsedPrintParams: boolean;
  setCollapsedPrintParams: (collapsed: boolean) => void;
  handleGeneratePreview: () => void;

  // Presets & Layout
  selectedPreset: LabelPreset;
  setSelectedPreset: (preset: LabelPreset) => void;
  isPortraitView: boolean;
  setIsPortraitView: (portrait: boolean) => void;
  templates: TemplateItem[];
  selectedTemplateId: number | string | null;
  setSelectedTemplateId: (id: number | string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  setHistory: (history: LabelElement[][]) => void;
  setHistoryIndex: (index: number) => void;
  handleExportLayout: () => void;
  layoutFileInputRef: React.RefObject<HTMLInputElement>;
  handleImportLayout: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearCanvas: () => void;
  handlePushToEsp32: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  collapsedPresets: boolean;
  setCollapsedPresets: (collapsed: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;

  // Add Elements
  addTextElement: () => void;
  addQRElement: () => void;
  addBarcodeElement: () => void;
  addLineElement: () => void;
  addRectangleElement: () => void;
  addPlaceholderElement?: (placeholderVar: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  collapsedAddElements: boolean;
  setCollapsedAddElements: (collapsed: boolean) => void;

  // Icon Library
  iconSearch: string;
  setIconSearch: (search: string) => void;
  iconResults: IconResult[];
  isSearchingIcons: boolean;
  addIconElement: (iconName: string, svgPath: string) => void;
  handleSelectWebIcon: (iconName: string) => Promise<void>;
  collapsedIcons: boolean;
  setCollapsedIcons: (collapsed: boolean) => void;

  // Element Inspector
  selectedElement: LabelElement | null;
  updateSelectedElement: (key: string, val: any) => void;
  updateQRHelper: (helperType: string, fieldUpdates: Record<string, string>) => void;
  deleteSelectedElement: () => void;
  nudgeSelectedElement: (dx: number, dy: number) => void;
  sendToBack: () => void;
  bringToFront: () => void;
  pushHistory: (newElements: LabelElement[]) => void;
  elementsRef: React.MutableRefObject<LabelElement[]>;
}

export default function SidebarContent(props: SidebarContentProps): React.ReactElement {
  const { mobileTab } = props;

  // Mobile 'print' tab
  if (mobileTab === 'print') {
    return (
      <div className="flex flex-col gap-4">
        {/* Connection Target Switcher */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />
            Print Connection Target
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button 
              onClick={() => props.setUseBrowserBt(true)}
              className={`py-1.5 rounded-lg text-xs font-medium transition ${props.useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Browser Direct
            </button>
            <button 
              onClick={() => props.setUseBrowserBt(false)}
              className={`py-1.5 rounded-lg text-xs font-medium transition ${!props.useBrowserBt ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Server Bridge
            </button>
          </div>
        </div>

        {/* Print Parameters Controls */}
        <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Print Parameters
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Density ({props.density})</label>
              <input 
                type="range" 
                min="0" 
                max="15" 
                value={props.density}
                onChange={(e) => props.setDensity(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Copies</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={props.copies}
                onChange={(e) => props.setCopies(parseInt(e.target.value, 10) || 1)}
                className="w-full p-2 rounded-xl glass-input text-xs" 
              />
            </div>
          </div>
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={props.invertColors}
              onChange={(e) => props.setInvertColors(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-500" 
            />
            Invert Colors (White-on-Black)
          </label>
          <button 
            onClick={() => props.setShowWizardModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            <Bluetooth className="w-4 h-4 text-indigo-400" />
            Connection Wizard
          </button>
        </div>
      </div>
    );
  }

  // Mobile 'inspector' tab
  if (mobileTab === 'inspector') {
    return (
      <ElementInspector
        selectedElement={props.selectedElement}
        updateSelectedElement={props.updateSelectedElement}
        updateQRHelper={props.updateQRHelper}
        deleteSelectedElement={props.deleteSelectedElement}
        nudgeSelectedElement={props.nudgeSelectedElement}
        sendToBack={props.sendToBack}
        bringToFront={props.bringToFront}
        pushHistory={props.pushHistory}
        elementsRef={props.elementsRef}
        elements={props.elements}
        setElements={props.setElements}
      />
    );
  }

  // Mobile 'add' tab or Desktop (mobileTab === null / undefined)
  return (
    <>
      {/* Print Parameters — desktop only */}
      {!mobileTab && (
        <PrintParameters
          density={props.density}
          setDensity={props.setDensity}
          copies={props.copies}
          setCopies={props.setCopies}
          invertColors={props.invertColors}
          setInvertColors={props.setInvertColors}
          elements={props.elements}
          setShowBatchModal={props.setShowBatchModal}
          collapsedPrintParams={props.collapsedPrintParams}
          setCollapsedPrintParams={props.setCollapsedPrintParams}
          handleGeneratePreview={props.handleGeneratePreview}
        />
      )}

      {/* Preset Selection */}
      <LayoutPresets
        selectedPreset={props.selectedPreset}
        setSelectedPreset={props.setSelectedPreset}
        isPortraitView={props.isPortraitView}
        setIsPortraitView={props.setIsPortraitView}
        templates={props.templates}
        selectedTemplateId={props.selectedTemplateId}
        setSelectedTemplateId={props.setSelectedTemplateId}
        setElements={props.setElements}
        setHistory={props.setHistory}
        setHistoryIndex={props.setHistoryIndex}
        elements={props.elements}
        handleExportLayout={props.handleExportLayout}
        layoutFileInputRef={props.layoutFileInputRef}
        handleImportLayout={props.handleImportLayout}
        handleClearCanvas={props.handleClearCanvas}
        handlePushToEsp32={props.handlePushToEsp32}
        snapToGrid={props.snapToGrid}
        setSnapToGrid={props.setSnapToGrid}
        showGrid={props.showGrid}
        setShowGrid={props.setShowGrid}
        collapsedPresets={props.collapsedPresets}
        setCollapsedPresets={props.setCollapsedPresets}
        theme={props.theme}
        setTheme={props.setTheme}
        PRESETS={PRESETS}
        zoomScale={props.zoomScale}
        setZoomScale={props.setZoomScale}
      />

      {/* Add Elements */}
      <AddElements
        addTextElement={props.addTextElement}
        addQRElement={props.addQRElement}
        addBarcodeElement={props.addBarcodeElement}
        addLineElement={props.addLineElement}
        addRectangleElement={props.addRectangleElement}
        addPlaceholderElement={props.addPlaceholderElement}
        fileInputRef={props.fileInputRef}
        handleImageUpload={props.handleImageUpload}
        collapsedAddElements={props.collapsedAddElements}
        setCollapsedAddElements={props.setCollapsedAddElements}
      />

      {/* Icon Library */}
      <IconLibrary
        iconSearch={props.iconSearch}
        setIconSearch={props.setIconSearch}
        iconResults={props.iconResults}
        isSearchingIcons={props.isSearchingIcons}
        addIconElement={props.addIconElement}
        handleSelectWebIcon={props.handleSelectWebIcon}
        collapsedIcons={props.collapsedIcons}
        setCollapsedIcons={props.setCollapsedIcons}
        MDI_OFFLINE={MDI_OFFLINE}
      />

      {/* Element Inspector — desktop only */}
      {!mobileTab && (
        <ElementInspector
          selectedElement={props.selectedElement}
          updateSelectedElement={props.updateSelectedElement}
          updateQRHelper={props.updateQRHelper}
          deleteSelectedElement={props.deleteSelectedElement}
          nudgeSelectedElement={props.nudgeSelectedElement}
          sendToBack={props.sendToBack}
          bringToFront={props.bringToFront}
          pushHistory={props.pushHistory}
          elementsRef={props.elementsRef}
          elements={props.elements}
          setElements={props.setElements}
        />
      )}
    </>
  );
}

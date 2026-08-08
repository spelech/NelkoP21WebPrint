import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarContent, { SidebarContentProps } from '../SidebarContent';
import { LabelPreset } from '../../types';

describe('SidebarContent Component', () => {
  const mockPreset: LabelPreset = { name: '40 x 14 mm', width: 40, height: 14, gap: 5 };

  const defaultProps: SidebarContentProps = {
    mobileTab: null,
    density: 3,
    setDensity: vi.fn(),
    copies: 1,
    setCopies: vi.fn(),
    invertColors: false,
    setInvertColors: vi.fn(),
    useBrowserBt: true,
    setUseBrowserBt: vi.fn(),
    elements: [],
    setShowBatchModal: vi.fn(),
    setShowWizardModal: vi.fn(),
    collapsedPrintParams: false,
    setCollapsedPrintParams: vi.fn(),
    handleGeneratePreview: vi.fn(),

    selectedPreset: mockPreset,
    setSelectedPreset: vi.fn(),
    isPortraitView: false,
    setIsPortraitView: vi.fn(),
    templates: [],
    selectedTemplateId: null,
    setSelectedTemplateId: vi.fn(),
    setElements: vi.fn(),
    setHistory: vi.fn(),
    setHistoryIndex: vi.fn(),
    handleExportLayout: vi.fn(),
    layoutFileInputRef: { current: null },
    handleImportLayout: vi.fn(),
    handleClearCanvas: vi.fn(),
    handlePushToEsp32: vi.fn(),
    snapToGrid: false,
    setSnapToGrid: vi.fn(),
    showGrid: true,
    setShowGrid: vi.fn(),
    collapsedPresets: false,
    setCollapsedPresets: vi.fn(),
    theme: 'dark',
    setTheme: vi.fn(),
    zoomScale: 1.0,
    setZoomScale: vi.fn(),

    addTextElement: vi.fn(),
    addQRElement: vi.fn(),
    addBarcodeElement: vi.fn(),
    addLineElement: vi.fn(),
    addRectangleElement: vi.fn(),
    fileInputRef: { current: null },
    handleImageUpload: vi.fn(),
    collapsedAddElements: false,
    setCollapsedAddElements: vi.fn(),

    iconSearch: '',
    setIconSearch: vi.fn(),
    iconResults: [],
    isSearchingIcons: false,
    addIconElement: vi.fn(),
    handleSelectWebIcon: vi.fn(),
    collapsedIcons: false,
    setCollapsedIcons: vi.fn(),

    selectedElement: null,
    updateSelectedElement: vi.fn(),
    updateQRHelper: vi.fn(),
    deleteSelectedElement: vi.fn(),
    nudgeSelectedElement: vi.fn(),
    sendToBack: vi.fn(),
    bringToFront: vi.fn(),
    pushHistory: vi.fn(),
    elementsRef: { current: [] }
  };

  it('renders all desktop sections when mobileTab is null / undefined', () => {
    render(<SidebarContent {...defaultProps} mobileTab={null} />);

    expect(screen.getByRole('button', { name: /Print Parameters/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Presets & Layout/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Elements/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Icons Library/i })).toBeDefined();
    // Empty element inspector message when no element is selected
    expect(screen.getByText(/Tap an element on the canvas to inspect it/i)).toBeDefined();
  });

  it('renders mobile "print" tab content correctly', () => {
    const setUseBrowserBt = vi.fn();
    const setShowWizardModal = vi.fn();

    render(
      <SidebarContent
        {...defaultProps}
        mobileTab="print"
        setUseBrowserBt={setUseBrowserBt}
        setShowWizardModal={setShowWizardModal}
      />
    );

    expect(screen.getByText('Print Connection Target')).toBeDefined();

    const serverBridgeBtn = screen.getByRole('button', { name: 'Server Bridge' });
    fireEvent.click(serverBridgeBtn);
    expect(setUseBrowserBt).toHaveBeenCalledWith(false);

    const wizardBtn = screen.getByRole('button', { name: /Connection Wizard/i });
    fireEvent.click(wizardBtn);
    expect(setShowWizardModal).toHaveBeenCalledWith(true);

    // Desktop only elements should not be rendered
    expect(screen.queryByRole('button', { name: /Presets & Layout/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Add Elements/i })).toBeNull();
  });

  it('renders mobile "inspector" tab content correctly', () => {
    const { rerender } = render(<SidebarContent {...defaultProps} mobileTab="inspector" selectedElement={null} />);

    expect(screen.getByText(/Tap an element on the canvas to inspect it/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Print Parameters/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Add Elements/i })).toBeNull();

    // With selected element
    const mockElement = { id: 1, type: 'text' as const, content: 'Label', x: 0, y: 0, fontSize: 16 };
    rerender(<SidebarContent {...defaultProps} mobileTab="inspector" selectedElement={mockElement} />);
    expect(screen.getByText(/Element Properties/i)).toBeDefined();
  });

  it('renders mobile "add" tab content correctly', () => {
    render(<SidebarContent {...defaultProps} mobileTab="add" />);

    expect(screen.getByRole('button', { name: /Presets & Layout/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Elements/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Icons Library/i })).toBeDefined();

    // Desktop only components should be hidden
    expect(screen.queryByRole('button', { name: /Print Parameters/i })).toBeNull();
  });
});

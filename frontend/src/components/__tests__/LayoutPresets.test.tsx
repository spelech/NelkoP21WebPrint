import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LayoutPresets, { LayoutPresetsProps, TemplateItem } from '../LayoutPresets';
import { LabelPreset } from '../../types';

describe('LayoutPresets Component', () => {
  const PRESETS: LabelPreset[] = [
    { name: '40 x 14 mm', width: 40, height: 14, gap: 5 },
    { name: '50 x 30 mm', width: 50, height: 30, gap: 5 },
  ];

  const templates: TemplateItem[] = [
    { id: 1, name: 'Barcode Label', width_mm: 40, height_mm: 14, layout_json: JSON.stringify([{ id: 1, type: 'text', content: 'Sample' }]) },
    { id: 2, name: 'Asset Tag', width_mm: 50, height_mm: 30, layout_json: [] }
  ];

  const defaultProps: LayoutPresetsProps = {
    selectedPreset: PRESETS[0],
    setSelectedPreset: vi.fn(),
    isPortraitView: false,
    setIsPortraitView: vi.fn(),
    templates,
    selectedTemplateId: null,
    setSelectedTemplateId: vi.fn(),
    setElements: vi.fn(),
    setHistory: vi.fn(),
    setHistoryIndex: vi.fn(),
    elements: [],
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
    PRESETS,
    zoomScale: 1.0,
    setZoomScale: vi.fn()
  };

  it('renders section header and toggles collapse state when header clicked', () => {
    const setCollapsedPresets = vi.fn();
    render(<LayoutPresets {...defaultProps} setCollapsedPresets={setCollapsedPresets} />);

    const collapseBtn = screen.getByRole('button', { name: /Presets & Layout/i });
    fireEvent.click(collapseBtn);
    expect(setCollapsedPresets).toHaveBeenCalledWith(true);
  });

  it('selects preset from dropdown and resets elements and history', () => {
    const setSelectedPreset = vi.fn();
    const setSelectedTemplateId = vi.fn();
    const setElements = vi.fn();
    const setHistory = vi.fn();
    const setHistoryIndex = vi.fn();

    render(
      <LayoutPresets
        {...defaultProps}
        setSelectedPreset={setSelectedPreset}
        setSelectedTemplateId={setSelectedTemplateId}
        setElements={setElements}
        setHistory={setHistory}
        setHistoryIndex={setHistoryIndex}
      />
    );

    const comboboxes = screen.getAllByRole('combobox');
    const presetSelect = comboboxes[0];
    fireEvent.change(presetSelect, { target: { value: '50 x 30 mm' } });

    expect(setSelectedPreset).toHaveBeenCalledWith(PRESETS[1]);
    expect(setSelectedTemplateId).toHaveBeenCalledWith(null);
    expect(setElements).toHaveBeenCalledWith([]);
    expect(setHistory).toHaveBeenCalledWith([[]]);
    expect(setHistoryIndex).toHaveBeenCalledWith(0);
  });

  it('toggles orientation mode on button click', () => {
    const setIsPortraitView = vi.fn();
    const { rerender } = render(
      <LayoutPresets {...defaultProps} isPortraitView={false} setIsPortraitView={setIsPortraitView} />
    );

    const toggleBtn = screen.getByText('Landscape (Horizontal)');
    fireEvent.click(toggleBtn.parentElement!);
    expect(setIsPortraitView).toHaveBeenCalledWith(true);

    rerender(
      <LayoutPresets {...defaultProps} isPortraitView={true} setIsPortraitView={setIsPortraitView} />
    );
    expect(screen.getByText('Portrait (Vertical)')).toBeDefined();
  });

  it('handles template selection dropdown', () => {
    const setSelectedTemplateId = vi.fn();
    const setSelectedPreset = vi.fn();
    const setElements = vi.fn();

    render(
      <LayoutPresets
        {...defaultProps}
        setSelectedTemplateId={setSelectedTemplateId}
        setSelectedPreset={setSelectedPreset}
        setElements={setElements}
      />
    );

    const comboboxes = screen.getAllByRole('combobox');
    const templateSelect = comboboxes[1];
    fireEvent.change(templateSelect, { target: { value: '1' } });

    expect(setSelectedPreset).toHaveBeenCalled();
    expect(setElements).toHaveBeenCalled();
    expect(setSelectedTemplateId).toHaveBeenCalledWith('1');

    // Selecting blank template
    fireEvent.change(templateSelect, { target: { value: '' } });
    expect(setSelectedTemplateId).toHaveBeenCalledWith(null);
  });

  it('triggers export, import, clear, and push to ESP32 actions', () => {
    const handleExportLayout = vi.fn();
    const handleClearCanvas = vi.fn();
    const handlePushToEsp32 = vi.fn();
    const fileRef = React.createRef<HTMLInputElement>();

    render(
      <LayoutPresets
        {...defaultProps}
        handleExportLayout={handleExportLayout}
        handleClearCanvas={handleClearCanvas}
        handlePushToEsp32={handlePushToEsp32}
        layoutFileInputRef={fileRef}
      />
    );

    const clickSpy = vi.spyOn(fileRef.current!, 'click').mockImplementation(() => {});

    const exportBtn = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(exportBtn);
    expect(handleExportLayout).toHaveBeenCalledTimes(1);

    const importBtn = screen.getByRole('button', { name: 'Import' });
    fireEvent.click(importBtn);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearBtn);
    expect(handleClearCanvas).toHaveBeenCalledTimes(1);

    const pushBtn = screen.getByRole('button', { name: /Push to ESP32 Bridge/i });
    fireEvent.click(pushBtn);
    expect(handlePushToEsp32).toHaveBeenCalledTimes(1);
  });

  it('handles layout settings checkboxes and zoom controls', () => {
    const setSnapToGrid = vi.fn();
    const setShowGrid = vi.fn();
    const setZoomScale = vi.fn();

    render(
      <LayoutPresets
        {...defaultProps}
        snapToGrid={false}
        setSnapToGrid={setSnapToGrid}
        showGrid={true}
        setShowGrid={setShowGrid}
        setZoomScale={setZoomScale}
      />
    );

    const snapCheckbox = screen.getByLabelText('Snap to 8px Grid');
    fireEvent.click(snapCheckbox);
    expect(setSnapToGrid).toHaveBeenCalledWith(true);

    const gridCheckbox = screen.getByLabelText('Show Grid');
    fireEvent.click(gridCheckbox);
    expect(setShowGrid).toHaveBeenCalledWith(false);

    const zoom150Btn = screen.getByText('150%');
    fireEvent.click(zoom150Btn);
    expect(setZoomScale).toHaveBeenCalledWith(1.5);
  });
});

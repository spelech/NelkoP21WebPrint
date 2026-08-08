import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintParameters, { PrintParametersProps } from '../PrintParameters';

describe('PrintParameters Component', () => {
  const defaultProps: PrintParametersProps = {
    density: 3,
    setDensity: vi.fn(),
    copies: 1,
    setCopies: vi.fn(),
    invertColors: false,
    setInvertColors: vi.fn(),
    elements: [],
    setShowBatchModal: vi.fn(),
    collapsedPrintParams: false,
    setCollapsedPrintParams: vi.fn(),
    handleGeneratePreview: vi.fn()
  };

  it('renders section header and toggles collapse state', () => {
    const setCollapsedPrintParams = vi.fn();
    render(<PrintParameters {...defaultProps} setCollapsedPrintParams={setCollapsedPrintParams} />);

    const headerBtn = screen.getByRole('button', { name: /Print Parameters/i });
    fireEvent.click(headerBtn);
    expect(setCollapsedPrintParams).toHaveBeenCalledWith(true);
  });

  it('handles density range slider changes', () => {
    const setDensity = vi.fn();
    render(<PrintParameters {...defaultProps} density={3} setDensity={setDensity} />);

    const densitySlider = screen.getByRole('slider');
    expect(densitySlider).toHaveProperty('value', '3');

    fireEvent.change(densitySlider, { target: { value: '8' } });
    expect(setDensity).toHaveBeenCalledWith(8);
  });

  it('handles copies input changes', () => {
    const setCopies = vi.fn();
    render(<PrintParameters {...defaultProps} copies={1} setCopies={setCopies} />);

    const copiesInput = screen.getByRole('spinbutton');
    expect(copiesInput).toHaveProperty('value', '1');

    fireEvent.change(copiesInput, { target: { value: '5' } });
    expect(setCopies).toHaveBeenCalledWith(5);

    // Fallback when input is cleared / invalid
    fireEvent.change(copiesInput, { target: { value: '' } });
    expect(setCopies).toHaveBeenCalledWith(1);
  });

  it('handles invert colors checkbox toggle', () => {
    const setInvertColors = vi.fn();
    render(<PrintParameters {...defaultProps} invertColors={false} setInvertColors={setInvertColors} />);

    const invertCheckbox = screen.getByLabelText('Invert Colors (White-on-Black)');
    expect(invertCheckbox).toHaveProperty('checked', false);

    fireEvent.click(invertCheckbox);
    expect(setInvertColors).toHaveBeenCalledWith(true);
  });

  it('alerts when batch modal is clicked with empty canvas, or opens modal when elements exist', () => {
    const setShowBatchModal = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { rerender } = render(
      <PrintParameters {...defaultProps} elements={[]} setShowBatchModal={setShowBatchModal} />
    );

    const batchBtn = screen.getByRole('button', { name: /Batch Print from CSV/i });
    fireEvent.click(batchBtn);

    expect(alertSpy).toHaveBeenCalledWith("Canvas is empty. Add elements first or load a template.");
    expect(setShowBatchModal).not.toHaveBeenCalled();

    // Canvas with elements
    rerender(
      <PrintParameters
        {...defaultProps}
        elements={[{ id: 1, type: 'text', content: 'Test', x: 10, y: 10, fontSize: 16 }]}
        setShowBatchModal={setShowBatchModal}
      />
    );

    fireEvent.click(batchBtn);
    expect(setShowBatchModal).toHaveBeenCalledWith(true);

    alertSpy.mockRestore();
  });

  it('triggers preview output generation when button clicked', () => {
    const handleGeneratePreview = vi.fn();
    render(<PrintParameters {...defaultProps} handleGeneratePreview={handleGeneratePreview} />);

    const previewBtn = screen.getByRole('button', { name: /Preview Print Output/i });
    fireEvent.click(previewBtn);

    expect(handleGeneratePreview).toHaveBeenCalledTimes(1);
  });
});

import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchModal, { BatchModalProps } from '../BatchModal';

describe('BatchModal Component', () => {
  const defaultProps: BatchModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    csvHeaders: ['Name', 'SKU', 'Price'],
    setCsvHeaders: vi.fn(),
    csvRows: [
      { Name: 'Product A', SKU: 'SKU-001', Price: '$10' },
      { Name: 'Product B', SKU: 'SKU-002', Price: '$20' }
    ],
    setCsvRows: vi.fn(),
    csvFilename: 'products.csv',
    setCsvFilename: vi.fn(),
    variableMapping: { name: 'Name', sku: 'SKU' },
    setVariableMapping: vi.fn(),
    batchPreviewIndex: 0,
    setBatchPreviewIndex: vi.fn(),
    getTemplateVariables: () => ['name', 'sku'],
    handleExecuteBatchPrint: vi.fn(),
    parseCSV: vi.fn().mockReturnValue({
      headers: ['Name', 'SKU'],
      rows: [{ Name: 'Item 1', SKU: 'S1' }]
    }),
    csvFileInputRef: createRef<HTMLInputElement>() as React.RefObject<HTMLInputElement>
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<BatchModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dropzone when csvRows is empty and handles file upload', async () => {
    const parseCSV = vi.fn().mockReturnValue({
      headers: ['Header1', 'Header2'],
      rows: [{ Header1: 'Val1', Header2: 'Val2' }]
    });
    const setCsvHeaders = vi.fn();
    const setCsvRows = vi.fn();
    const setCsvFilename = vi.fn();
    const setVariableMapping = vi.fn();
    const setBatchPreviewIndex = vi.fn();

    render(
      <BatchModal
        {...defaultProps}
        csvRows={[]}
        parseCSV={parseCSV}
        setCsvHeaders={setCsvHeaders}
        setCsvRows={setCsvRows}
        setCsvFilename={setCsvFilename}
        setVariableMapping={setVariableMapping}
        setBatchPreviewIndex={setBatchPreviewIndex}
        getTemplateVariables={() => ['header1']}
      />
    );

    expect(screen.getByText('Upload CSV File')).toBeDefined();

    const inputEl = document.querySelector('input[type="file"]');
    expect(inputEl).not.toBeNull();

    const file = new File(['Header1,Header2\nVal1,Val2'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(inputEl!, { target: { files: [file] } });

    await waitFor(() => {
      expect(parseCSV).toHaveBeenCalled();
      expect(setCsvHeaders).toHaveBeenCalledWith(['Header1', 'Header2']);
      expect(setCsvRows).toHaveBeenCalledWith([{ Header1: 'Val1', Header2: 'Val2' }]);
      expect(setCsvFilename).toHaveBeenCalledWith('test.csv');
      expect(setVariableMapping).toHaveBeenCalledWith({ header1: 'Header1' });
      expect(setBatchPreviewIndex).toHaveBeenCalledWith(0);
    });
  });

  it('shows alert when uploaded CSV is empty or invalid', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const parseCSV = vi.fn().mockReturnValue({ headers: [], rows: [] });

    render(
      <BatchModal
        {...defaultProps}
        csvRows={[]}
        parseCSV={parseCSV}
      />
    );

    const inputEl = document.querySelector('input[type="file"]');
    const file = new File([''], 'empty.csv', { type: 'text/csv' });

    fireEvent.change(inputEl!, { target: { files: [file] } });

    await waitFor(() => {
      expect(parseCSV).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Invalid or empty CSV file.');
    });

    alertSpy.mockRestore();
  });

  it('renders active CSV details and handles clear/close button', () => {
    const onClose = vi.fn();
    render(<BatchModal {...defaultProps} onClose={onClose} />);

    expect(screen.getByText('products.csv')).toBeDefined();
    
    const clearBtn = screen.getByRole('button', { name: /Clear File/i });
    fireEvent.click(clearBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders variable mapping warning when template has no variables', () => {
    render(
      <BatchModal
        {...defaultProps}
        getTemplateVariables={() => []}
      />
    );

    expect(screen.getByText(/No variables like/i)).toBeDefined();
  });

  it('renders variable mapping dropdowns and updates mapping on change', () => {
    const setVariableMapping = vi.fn();
    render(
      <BatchModal
        {...defaultProps}
        setVariableMapping={setVariableMapping}
      />
    );

    expect(screen.getAllByText(/\{\{name\}\}/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\{\{sku\}\}/).length).toBeGreaterThan(0);

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);

    fireEvent.change(selects[0], { target: { value: 'Price' } });
    expect(setVariableMapping).toHaveBeenCalledWith({
      name: 'Price',
      sku: 'SKU'
    });
  });

  it('handles batch preview navigation prev and next buttons', () => {
    const setBatchPreviewIndex = vi.fn();

    const { rerender } = render(
      <BatchModal
        {...defaultProps}
        batchPreviewIndex={0}
        setBatchPreviewIndex={setBatchPreviewIndex}
      />
    );

    expect(screen.getByText('Label Preview (Row 1 of 2)')).toBeDefined();

    const prevBtn = screen.getByRole('button', { name: /◀ Prev/i });
    const nextBtn = screen.getByRole('button', { name: /Next ▶/i });

    expect(prevBtn).toHaveProperty('disabled', true);
    expect(nextBtn).toHaveProperty('disabled', false);

    fireEvent.click(nextBtn);
    expect(setBatchPreviewIndex).toHaveBeenCalled();

    // Rerender on second row
    rerender(
      <BatchModal
        {...defaultProps}
        batchPreviewIndex={1}
        setBatchPreviewIndex={setBatchPreviewIndex}
      />
    );

    const prevBtn2 = screen.getByRole('button', { name: /◀ Prev/i });
    const nextBtn2 = screen.getByRole('button', { name: /Next ▶/i });

    expect(prevBtn2).toHaveProperty('disabled', false);
    expect(nextBtn2).toHaveProperty('disabled', true);

    fireEvent.click(prevBtn2);
    expect(setBatchPreviewIndex).toHaveBeenCalled();
  });

  it('executes batch print action with generated batch jobs', async () => {
    const handleExecuteBatchPrint = vi.fn().mockResolvedValue(undefined);

    render(
      <BatchModal
        {...defaultProps}
        handleExecuteBatchPrint={handleExecuteBatchPrint}
      />
    );

    const printBtn = screen.getByRole('button', { name: /Print Batch \(2 labels\)/i });
    fireEvent.click(printBtn);

    expect(handleExecuteBatchPrint).toHaveBeenCalledWith([
      { variables: { name: 'Product A', sku: 'SKU-001' }, copies: 1 },
      { variables: { name: 'Product B', sku: 'SKU-002' }, copies: 1 }
    ]);
  });
});

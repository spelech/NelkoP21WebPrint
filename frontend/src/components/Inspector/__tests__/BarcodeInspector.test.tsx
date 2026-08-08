import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BarcodeInspector from '../BarcodeInspector';
import { BarcodeElement, LabelElement } from '../../../types';

describe('BarcodeInspector', () => {
  const mockElement: BarcodeElement = {
    id: 2,
    type: 'barcode',
    content: '12345678',
    barcodeType: 'code128',
    x: 15,
    y: 25,
    width: 100,
    height: 40,
  };

  const defaultProps = {
    element: mockElement,
    updateSelectedElement: vi.fn(),
    pushHistory: vi.fn(),
    elementsRef: { current: [mockElement] } as React.MutableRefObject<LabelElement[]>,
  };

  it('renders content input and encoding selector with initial values', () => {
    render(<BarcodeInspector {...defaultProps} />);

    const input = screen.getByDisplayValue('12345678') as HTMLInputElement;
    expect(input).toBeTruthy();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('code128');
  });

  it('handles barcode content input change and blur', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <BarcodeInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const input = screen.getByDisplayValue('12345678');
    fireEvent.change(input, { target: { value: '87654321' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('content', '87654321');

    fireEvent.blur(input);
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);
  });

  it('handles barcode encoding change for code128, ean13, and ean8', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <BarcodeInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const select = screen.getByRole('combobox');
    
    // Change to ean13
    fireEvent.change(select, { target: { value: 'ean13' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('barcodeType', 'ean13');
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);

    // Change to ean8
    fireEvent.change(select, { target: { value: 'ean8' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('barcodeType', 'ean8');

    // Change back to code128
    fireEvent.change(select, { target: { value: 'code128' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('barcodeType', 'code128');
  });
});

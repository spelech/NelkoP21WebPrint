import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddElements, { AddElementsProps } from '../AddElements';

describe('AddElements Component', () => {
  const defaultProps: AddElementsProps = {
    addTextElement: vi.fn(),
    addQRElement: vi.fn(),
    addBarcodeElement: vi.fn(),
    addLineElement: vi.fn(),
    addRectangleElement: vi.fn(),
    fileInputRef: { current: null },
    handleImageUpload: vi.fn(),
    collapsedAddElements: false,
    setCollapsedAddElements: vi.fn(),
  };

  it('renders section header and toggles collapse state', () => {
    const setCollapsedAddElements = vi.fn();
    render(<AddElements {...defaultProps} setCollapsedAddElements={setCollapsedAddElements} />);

    const collapseBtn = screen.getByRole('button', { name: /Add Elements/i });
    fireEvent.click(collapseBtn);
    expect(setCollapsedAddElements).toHaveBeenCalledWith(true);
  });

  it('triggers element creation callbacks when buttons are clicked', () => {
    const addTextElement = vi.fn();
    const addQRElement = vi.fn();
    const addBarcodeElement = vi.fn();
    const addLineElement = vi.fn();
    const addRectangleElement = vi.fn();
    const fileRef = React.createRef<HTMLInputElement>();

    render(
      <AddElements
        {...defaultProps}
        addTextElement={addTextElement}
        addQRElement={addQRElement}
        addBarcodeElement={addBarcodeElement}
        addLineElement={addLineElement}
        addRectangleElement={addRectangleElement}
        fileInputRef={fileRef}
      />
    );

    const clickSpy = vi.spyOn(fileRef.current!, 'click').mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    expect(addTextElement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /QR/i }));
    expect(addQRElement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Barcode/i }));
    expect(addBarcodeElement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Line/i }));
    expect(addLineElement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Border/i }));
    expect(addRectangleElement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Image/i }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('handles image file upload change event', () => {
    const handleImageUpload = vi.fn();
    render(<AddElements {...defaultProps} handleImageUpload={handleImageUpload} />);

    // File input is hidden
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(handleImageUpload).toHaveBeenCalledTimes(1);
  });

  it('hides element grid when collapsed is true', () => {
    render(<AddElements {...defaultProps} collapsedAddElements={true} />);

    expect(screen.queryByRole('button', { name: /Text/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /QR/i })).toBeNull();
  });
});

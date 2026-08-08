import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ElementInspector from '../ElementInspector';
import { LabelElement, BarcodeElement, TextElement, RectangleElement } from '../../../types';

describe('ElementInspector', () => {
  const mockBarcodeElement: BarcodeElement = {
    id: 1,
    type: 'barcode',
    content: 'BC123',
    barcodeType: 'code128',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
  };

  const mockTextElement: TextElement = {
    id: 2,
    type: 'text',
    content: 'Sample Text',
    fontSize: 18,
    x: 15,
    y: 25,
  };

  const mockRectElement: RectangleElement = {
    id: 3,
    type: 'rectangle',
    x: 5,
    y: 5,
    width: 60,
    height: 40,
    thickness: 2,
  };

  const defaultProps = {
    selectedElement: mockBarcodeElement,
    updateSelectedElement: vi.fn(),
    updateQRHelper: vi.fn(),
    deleteSelectedElement: vi.fn(),
    nudgeSelectedElement: vi.fn(),
    sendToBack: vi.fn(),
    bringToFront: vi.fn(),
    pushHistory: vi.fn(),
    elementsRef: { current: [mockBarcodeElement] } as React.MutableRefObject<LabelElement[]>,
    elements: [mockBarcodeElement],
    setElements: vi.fn(),
  };

  it('renders unselected empty state when selectedElement is null', () => {
    render(<ElementInspector {...defaultProps} selectedElement={null} />);
    expect(screen.getByText('Tap an element on the canvas to inspect it')).toBeTruthy();
  });

  it('renders header, sub-inspector, and calls deleteSelectedElement on delete button click', () => {
    const deleteSelectedElement = vi.fn();
    render(
      <ElementInspector
        {...defaultProps}
        deleteSelectedElement={deleteSelectedElement}
      />
    );

    expect(screen.getByText('Element Properties')).toBeTruthy();
    expect(screen.getByDisplayValue('BC123')).toBeTruthy();

    const deleteBtn = screen.getByTitle('Delete element');
    fireEvent.click(deleteBtn);
    expect(deleteSelectedElement).toHaveBeenCalledTimes(1);
  });

  it('renders sub-inspector based on element type (Text vs Barcode)', () => {
    const { rerender } = render(
      <ElementInspector {...defaultProps} selectedElement={mockTextElement} />
    );
    expect(screen.getByDisplayValue('Sample Text')).toBeTruthy();
    expect(screen.getByText('Font Family')).toBeTruthy();

    rerender(
      <ElementInspector {...defaultProps} selectedElement={mockBarcodeElement} />
    );
    expect(screen.getByDisplayValue('BC123')).toBeTruthy();
    expect(screen.getByText('Barcode Encoding')).toBeTruthy();
  });

  it('handles width and height sliders for barcode/rectangle elements', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        selectedElement={mockBarcodeElement}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const sliders = screen.getAllByRole('slider');
    // Width slider
    const widthSlider = sliders.find(s => s.getAttribute('min') === '5' && s.getAttribute('max') === '320');
    expect(widthSlider).toBeDefined();
    if (widthSlider) {
      fireEvent.change(widthSlider, { target: { value: '150' } });
      expect(updateSelectedElement).toHaveBeenCalledWith('width', 150);

      fireEvent.mouseUp(widthSlider);
      expect(pushHistory).toHaveBeenCalled();
    }

    // Height slider
    const heightSlider = sliders.find(s => s.getAttribute('min') === '5' && s.getAttribute('max') === '150');
    expect(heightSlider).toBeDefined();
    if (heightSlider) {
      fireEvent.change(heightSlider, { target: { value: '75' } });
      expect(updateSelectedElement).toHaveBeenCalledWith('height', 75);
    }
  });

  it('handles border thickness slider for rectangle elements', () => {
    const updateSelectedElement = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        selectedElement={mockRectElement}
        updateSelectedElement={updateSelectedElement}
      />
    );

    const sliders = screen.getAllByRole('slider');
    const thicknessSlider = sliders.find(s => s.getAttribute('min') === '1' && s.getAttribute('max') === '12');
    expect(thicknessSlider).toBeDefined();
    if (thicknessSlider) {
      fireEvent.change(thicknessSlider, { target: { value: '5' } });
      expect(updateSelectedElement).toHaveBeenCalledWith('thickness', 5);
    }
  });

  it('handles position X and position Y sliders', () => {
    const updateSelectedElement = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
      />
    );

    const sliders = screen.getAllByRole('slider');
    const posXSlider = sliders.find(s => s.getAttribute('min') === '0' && s.getAttribute('max') === '100' && s.getAttribute('value') === '10');
    expect(posXSlider).toBeDefined();
    if (posXSlider) {
      fireEvent.change(posXSlider, { target: { value: '45' } });
      expect(updateSelectedElement).toHaveBeenCalledWith('x', 45);
    }

    const posYSlider = sliders.find(s => s.getAttribute('min') === '0' && s.getAttribute('max') === '100' && s.getAttribute('value') === '20');
    expect(posYSlider).toBeDefined();
    if (posYSlider) {
      fireEvent.change(posYSlider, { target: { value: '60' } });
      expect(updateSelectedElement).toHaveBeenCalledWith('y', 60);
    }
  });

  it('handles Quick Align (Center X and Center Y) buttons', () => {
    const setElements = vi.fn();
    const pushHistory = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        setElements={setElements}
        pushHistory={pushHistory}
      />
    );

    const centerXBtn = screen.getByTitle('Center Horizontally');
    fireEvent.click(centerXBtn);
    expect(setElements).toHaveBeenCalledWith([{ ...mockBarcodeElement, x: 50 }]);
    expect(pushHistory).toHaveBeenCalledWith([{ ...mockBarcodeElement, x: 50 }]);

    const centerYBtn = screen.getByTitle('Center Vertically');
    fireEvent.click(centerYBtn);
    expect(setElements).toHaveBeenCalledWith([{ ...mockBarcodeElement, y: 50 }]);
    expect(pushHistory).toHaveBeenCalledWith([{ ...mockBarcodeElement, y: 50 }]);
  });

  it('handles D-Pad nudge buttons', () => {
    const nudgeSelectedElement = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        nudgeSelectedElement={nudgeSelectedElement}
      />
    );

    fireEvent.click(screen.getByTitle('Nudge Up'));
    expect(nudgeSelectedElement).toHaveBeenCalledWith(0, -2);

    fireEvent.click(screen.getByTitle('Nudge Left'));
    expect(nudgeSelectedElement).toHaveBeenCalledWith(-2, 0);

    fireEvent.click(screen.getByTitle('Nudge Down'));
    expect(nudgeSelectedElement).toHaveBeenCalledWith(0, 2);

    fireEvent.click(screen.getByTitle('Nudge Right'));
    expect(nudgeSelectedElement).toHaveBeenCalledWith(2, 0);
  });

  it('handles layer arrangement buttons (Send to Back and Bring to Front)', () => {
    const sendToBack = vi.fn();
    const bringToFront = vi.fn();

    render(
      <ElementInspector
        {...defaultProps}
        sendToBack={sendToBack}
        bringToFront={bringToFront}
      />
    );

    const sendToBackBtn = screen.getByTitle('Send Element to Back (bottom layer)');
    fireEvent.click(sendToBackBtn);
    expect(sendToBack).toHaveBeenCalledTimes(1);

    const bringToFrontBtn = screen.getByTitle('Bring Element to Front (top layer)');
    fireEvent.click(bringToFrontBtn);
    expect(bringToFront).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TextInspector from '../TextInspector';
import { TextElement, LabelElement } from '../../../types';

describe('TextInspector', () => {
  const mockElement: TextElement = {
    id: 1,
    type: 'text',
    content: 'Hello World',
    fontSize: 22,
    fontFamily: 'sans-serif',
    align: 'center',
    x: 10,
    y: 20,
  };

  const defaultProps = {
    element: mockElement,
    updateSelectedElement: vi.fn(),
    pushHistory: vi.fn(),
    elementsRef: { current: [mockElement] } as React.MutableRefObject<LabelElement[]>,
  };

  it('renders all fields with correct initial values', () => {
    render(<TextInspector {...defaultProps} />);

    const textInput = screen.getByDisplayValue('Hello World') as HTMLInputElement;
    expect(textInput).toBeTruthy();

    const fontFamilySelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(fontFamilySelect.value).toBe('sans-serif');

    const fontSizeSlider = screen.getByRole('slider') as HTMLInputElement;
    expect(fontSizeSlider.value).toBe('22');

    expect(screen.getByText('left')).toBeTruthy();
    expect(screen.getByText('center')).toBeTruthy();
    expect(screen.getByText('right')).toBeTruthy();
  });

  it('handles text content input change and blur', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <TextInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const textInput = screen.getByDisplayValue('Hello World');
    fireEvent.change(textInput, { target: { value: 'New Text' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('content', 'New Text');

    fireEvent.blur(textInput);
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);
  });

  it('handles font family selection change', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <TextInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const fontFamilySelect = screen.getByRole('combobox');
    fireEvent.change(fontFamilySelect, { target: { value: 'monospace' } });

    expect(updateSelectedElement).toHaveBeenCalledWith('fontFamily', 'monospace');
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);
  });

  it('handles font size range slider change and release', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <TextInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const fontSizeSlider = screen.getByRole('slider');
    fireEvent.change(fontSizeSlider, { target: { value: '32' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('fontSize', 32);

    fireEvent.mouseUp(fontSizeSlider);
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);

    fireEvent.touchEnd(fontSizeSlider);
    expect(pushHistory).toHaveBeenCalledTimes(2);
  });

  it('handles alignment button clicks', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <TextInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const leftButton = screen.getByText('left');
    fireEvent.click(leftButton);

    expect(updateSelectedElement).toHaveBeenCalledWith('align', 'left');
    expect(pushHistory).toHaveBeenCalledWith([mockElement]);

    const rightButton = screen.getByText('right');
    fireEvent.click(rightButton);

    expect(updateSelectedElement).toHaveBeenCalledWith('align', 'right');
  });
});

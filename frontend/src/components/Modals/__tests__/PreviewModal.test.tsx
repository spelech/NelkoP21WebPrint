import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreviewModal, { PreviewModalProps } from '../PreviewModal';

describe('PreviewModal Component', () => {
  const defaultProps: PreviewModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    previewUrl: null,
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<PreviewModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and loading spinner when previewUrl is null', () => {
    render(<PreviewModal {...defaultProps} previewUrl={null} />);
    expect(screen.getByText('1-Bit Thermal Print Preview')).toBeDefined();
    expect(screen.getByText(/Simulated monochrome 203 DPI thermal print head output/i)).toBeDefined();

    const imgEl = screen.queryByRole('img');
    expect(imgEl).toBeNull();
  });

  it('renders preview image when previewUrl is provided', () => {
    const sampleUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    render(<PreviewModal {...defaultProps} previewUrl={sampleUrl} />);

    const img = screen.getByRole('img', { name: '1-bit preview' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(sampleUrl);
  });

  it('triggers onClose when Close Preview button is clicked', () => {
    const onClose = vi.fn();
    render(<PreviewModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close Preview/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

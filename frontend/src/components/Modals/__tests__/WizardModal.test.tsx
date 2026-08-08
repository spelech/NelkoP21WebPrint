import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WizardModal, { WizardModalProps } from '../WizardModal';

describe('WizardModal Component', () => {
  const defaultProps: WizardModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    browserBtConnected: false,
    browserBtDeviceName: '',
    handleConnectBrowserBt: vi.fn(),
    wizardTab: 'pc',
    setWizardTab: vi.fn(),
    setUseBrowserBt: vi.fn(),
    setShowSettings: vi.fn(),
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<WizardModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header and close button action', () => {
    const onClose = vi.fn();
    render(<WizardModal {...defaultProps} onClose={onClose} />);

    expect(screen.getByText('Nelko P21 Connection Wizard')).toBeDefined();
    const closeBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles tab switches between ESP32 Print Bridge and Direct Mobile Bluetooth', () => {
    const setWizardTab = vi.fn();
    render(<WizardModal {...defaultProps} setWizardTab={setWizardTab} />);

    const esp32Tab = screen.getByRole('button', { name: /ESP32 Print Bridge \(Wi-Fi\)/i });
    const mobileTab = screen.getByRole('button', { name: /Direct Mobile Bluetooth/i });

    fireEvent.click(mobileTab);
    expect(setWizardTab).toHaveBeenCalledWith('mobile');

    fireEvent.click(esp32Tab);
    expect(setWizardTab).toHaveBeenCalledWith('esp32');
  });

  it('renders ESP32 Print Bridge tab content and handles Configure ESP32 / Server Bridge action', () => {
    const setUseBrowserBt = vi.fn();
    const onClose = vi.fn();
    const setShowSettings = vi.fn();

    render(
      <WizardModal
        {...defaultProps}
        wizardTab="esp32"
        setUseBrowserBt={setUseBrowserBt}
        onClose={onClose}
        setShowSettings={setShowSettings}
      />
    );

    expect(screen.getByText(/ESP32 Hardware Print Bridge & Standalone Web UI/i)).toBeDefined();

    const switchBtn = screen.getByRole('button', { name: /Configure ESP32 \/ Server Bridge Settings/i });
    fireEvent.click(switchBtn);

    expect(setUseBrowserBt).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setShowSettings).toHaveBeenCalledWith(true);
  });

  it('renders Mobile tab content and triggers Bluetooth pair button', () => {
    const handleConnectBrowserBt = vi.fn();

    render(
      <WizardModal
        {...defaultProps}
        wizardTab="mobile"
        handleConnectBrowserBt={handleConnectBrowserBt}
      />
    );

    expect(screen.getByText(/Open in Mobile Chrome \/ WebBLE:/i)).toBeDefined();
    const pairBtn = screen.getByRole('button', { name: /Pair & Connect Mobile Bluetooth/i });
    fireEvent.click(pairBtn);

    expect(handleConnectBrowserBt).toHaveBeenCalledTimes(1);
  });
});

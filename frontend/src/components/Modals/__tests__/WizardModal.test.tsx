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

  it('handles tab switches between PC, Mobile, and Server Bridge', () => {
    const setWizardTab = vi.fn();
    render(<WizardModal {...defaultProps} setWizardTab={setWizardTab} />);

    const pcTab = screen.getByRole('button', { name: /PC \(Web Serial\)/i });
    const mobileTab = screen.getByRole('button', { name: /Mobile Direct/i });
    const bridgeTab = screen.getByRole('button', { name: /^Server Bridge$/i });

    fireEvent.click(mobileTab);
    expect(setWizardTab).toHaveBeenCalledWith('mobile');

    fireEvent.click(bridgeTab);
    expect(setWizardTab).toHaveBeenCalledWith('bridge');

    fireEvent.click(pcTab);
    expect(setWizardTab).toHaveBeenCalledWith('pc');
  });

  it('renders PC tab content and handles Switch to Server Bridge action', () => {
    const setUseBrowserBt = vi.fn();
    const onClose = vi.fn();
    const setShowSettings = vi.fn();

    render(
      <WizardModal
        {...defaultProps}
        wizardTab="pc"
        setUseBrowserBt={setUseBrowserBt}
        onClose={onClose}
        setShowSettings={setShowSettings}
      />
    );

    expect(screen.getByText(/Hardware & PC Compatibility Fact:/i)).toBeDefined();
    expect(screen.getByText(/Recommended PC Solution: Server Bridge Mode/i)).toBeDefined();

    const switchBtn = screen.getByRole('button', { name: /Switch to Server Bridge Mode/i });
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

  it('renders Server Bridge tab content and handles Configure Server Bridge button', () => {
    const setUseBrowserBt = vi.fn();
    const onClose = vi.fn();
    const setShowSettings = vi.fn();

    render(
      <WizardModal
        {...defaultProps}
        wizardTab="bridge"
        setUseBrowserBt={setUseBrowserBt}
        onClose={onClose}
        setShowSettings={setShowSettings}
      />
    );

    expect(screen.getByText(/Zero-Pairing Network Printing:/i)).toBeDefined();
    const configBtn = screen.getByRole('button', { name: /Configure Server Bridge Settings/i });
    fireEvent.click(configBtn);

    expect(setUseBrowserBt).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setShowSettings).toHaveBeenCalledWith(true);
  });
});

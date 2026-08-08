import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header, { HeaderProps } from '../Header';

describe('Header Component', () => {
  const defaultProps: HeaderProps = {
    appVersion: '3.0.0',
    historyIndex: 0,
    history: [[]],
    handleUndo: vi.fn(),
    handleRedo: vi.fn(),
    useBrowserBt: true,
    setUseBrowserBt: vi.fn(),
    browserBtConnected: false,
    browserBtDeviceName: '',
    browserBtConnecting: false,
    handleConnectBrowserBt: vi.fn(),
    handleDisconnectBrowserBt: vi.fn(),
    setShowWizardModal: vi.fn(),
    handlePrint: vi.fn(),
    isPrinting: false
  };

  it('renders app title and version badge', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('P21 Studio')).toBeDefined();
    expect(screen.getByText('v3.0.0')).toBeDefined();
  });

  it('handles undo/redo button states and clicks correctly', () => {
    const handleUndo = vi.fn();
    const handleRedo = vi.fn();

    // At historyIndex 0 and history.length 1, both should be disabled
    const { rerender } = render(
      <Header
        {...defaultProps}
        historyIndex={0}
        history={[[]]}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
      />
    );

    const undoBtn = screen.getByTitle('Undo (Ctrl+Z)');
    const redoBtn = screen.getByTitle('Redo (Ctrl+Y)');

    expect(undoBtn).toHaveProperty('disabled', true);
    expect(redoBtn).toHaveProperty('disabled', true);

    // Mid-history: index 1, total 3 items
    rerender(
      <Header
        {...defaultProps}
        historyIndex={1}
        history={[[], [], []]}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
      />
    );

    expect(undoBtn).toHaveProperty('disabled', false);
    expect(redoBtn).toHaveProperty('disabled', false);

    fireEvent.click(undoBtn);
    expect(handleUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(redoBtn);
    expect(handleRedo).toHaveBeenCalledTimes(1);
  });

  it('toggles target switcher between Browser Direct and Server Bridge', () => {
    const setUseBrowserBt = vi.fn();
    render(<Header {...defaultProps} useBrowserBt={true} setUseBrowserBt={setUseBrowserBt} />);

    const serverBridgeBtn = screen.getByText('Server Bridge');
    fireEvent.click(serverBridgeBtn);
    expect(setUseBrowserBt).toHaveBeenCalledWith(false);

    const browserDirectBtn = screen.getByText('Browser Direct');
    fireEvent.click(browserDirectBtn);
    expect(setUseBrowserBt).toHaveBeenCalledWith(true);
  });

  it('renders bluetooth status and triggers pair/disconnect actions', () => {
    const handleConnectBrowserBt = vi.fn();
    const handleDisconnectBrowserBt = vi.fn();

    // Disconnected state
    const { rerender } = render(
      <Header
        {...defaultProps}
        browserBtConnected={false}
        browserBtConnecting={false}
        handleConnectBrowserBt={handleConnectBrowserBt}
        handleDisconnectBrowserBt={handleDisconnectBrowserBt}
      />
    );

    const pairBtn = screen.getByRole('button', { name: /Pair/i });
    fireEvent.click(pairBtn);
    expect(handleConnectBrowserBt).toHaveBeenCalledTimes(1);

    // Connecting state
    rerender(
      <Header
        {...defaultProps}
        browserBtConnected={false}
        browserBtConnecting={true}
      />
    );
    expect(screen.getByText('Connecting...')).toBeDefined();

    // Connected state
    rerender(
      <Header
        {...defaultProps}
        browserBtConnected={true}
        browserBtDeviceName="P21-BT-8899"
        handleDisconnectBrowserBt={handleDisconnectBrowserBt}
      />
    );

    const deviceBtn = screen.getByText('P21-BT-8899');
    fireEvent.click(deviceBtn.parentElement!);
    expect(handleDisconnectBrowserBt).toHaveBeenCalledTimes(1);
  });

  it('renders Configure Bridge button when in Server Bridge mode', () => {
    const setShowWizardModal = vi.fn();
    render(
      <Header
        {...defaultProps}
        useBrowserBt={false}
        setShowWizardModal={setShowWizardModal}
      />
    );

    const configBtn = screen.getByText('Configure Bridge');
    fireEvent.click(configBtn.parentElement!);
    expect(setShowWizardModal).toHaveBeenCalledWith(true);
  });

  it('handles print action button click and disabled state during printing', () => {
    const handlePrint = vi.fn();
    const { rerender } = render(
      <Header
        {...defaultProps}
        handlePrint={handlePrint}
        isPrinting={false}
      />
    );

    const printBtn = screen.getByRole('button', { name: /Print/i });
    expect(printBtn).toHaveProperty('disabled', false);
    fireEvent.click(printBtn);
    expect(handlePrint).toHaveBeenCalledTimes(1);

    rerender(
      <Header
        {...defaultProps}
        handlePrint={handlePrint}
        isPrinting={true}
      />
    );
    expect(printBtn).toHaveProperty('disabled', true);
  });
});

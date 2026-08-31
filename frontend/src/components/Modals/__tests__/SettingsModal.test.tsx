import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal, { SettingsModalProps, DriverConfig } from '../SettingsModal';

describe('SettingsModal Component', () => {
  const defaultConfig: DriverConfig = {
    driver_type: 'tcp',
    tcp_host: '10.0.0.10',
    tcp_port: 9100,
    bt_mac: '00:11:22:33:44:55',
  };

  const defaultProps: SettingsModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    driverConfig: defaultConfig,
    setDriverConfig: vi.fn(),
    handleSaveConfig: vi.fn(),
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<SettingsModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header and common controls when isOpen is true', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Server Printer Connection Settings')).toBeDefined();
    expect(screen.getByText('Driver Type')).toBeDefined();
  });

  it('handles driver type dropdown selection changes', () => {
    const setDriverConfig = vi.fn();
    render(<SettingsModal {...defaultProps} setDriverConfig={setDriverConfig} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'spp' } });

    expect(setDriverConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      driver_type: 'spp',
    });
  });

  it('renders TCP host and port inputs when driver_type is tcp and updates state on change', () => {
    const setDriverConfig = vi.fn();
    render(
      <SettingsModal
        {...defaultProps}
        driverConfig={{ ...defaultConfig, driver_type: 'tcp' }}
        setDriverConfig={setDriverConfig}
      />
    );

    const hostInput = screen.getByDisplayValue('10.0.0.10');
    fireEvent.change(hostInput, { target: { value: '192.168.1.50' } });
    expect(setDriverConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      driver_type: 'tcp',
      tcp_host: '192.168.1.50',
    });

    const portInput = screen.getByDisplayValue('9100');
    fireEvent.change(portInput, { target: { value: '9200' } });
    expect(setDriverConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      driver_type: 'tcp',
      tcp_port: 9200,
    });
  });

  it('fallback port to 9100 if port input is non-numeric', () => {
    const setDriverConfig = vi.fn();
    render(
      <SettingsModal
        {...defaultProps}
        driverConfig={{ ...defaultConfig, driver_type: 'tcp' }}
        setDriverConfig={setDriverConfig}
      />
    );

    const portInput = screen.getByDisplayValue('9100');
    fireEvent.change(portInput, { target: { value: '' } });
    expect(setDriverConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      driver_type: 'tcp',
      tcp_port: 9100,
    });
  });

  it('renders Bluetooth MAC input when driver_type is spp and updates state on change', () => {
    const setDriverConfig = vi.fn();
    render(
      <SettingsModal
        {...defaultProps}
        driverConfig={{ ...defaultConfig, driver_type: 'spp' }}
        setDriverConfig={setDriverConfig}
      />
    );

    expect(screen.getByText('Bluetooth MAC Address')).toBeDefined();
    const macInput = screen.getByDisplayValue('00:11:22:33:44:55');
    fireEvent.change(macInput, { target: { value: 'AA:BB:CC:DD:EE:FF' } });
    expect(setDriverConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      driver_type: 'spp',
      bt_mac: 'AA:BB:CC:DD:EE:FF',
    });
  });

  it('triggers onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers handleSaveConfig when Save Settings is clicked', () => {
    const handleSaveConfig = vi.fn();
    render(<SettingsModal {...defaultProps} handleSaveConfig={handleSaveConfig} />);

    const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveBtn);
    expect(handleSaveConfig).toHaveBeenCalledTimes(1);
  });

  it('triggers handleProbeBridge when Test Bridge Connection is clicked and displays reachable result', async () => {
    const handleProbeBridge = vi.fn().mockResolvedValue({
      reachable: true,
      status: 'Bridge online and reachable'
    });

    render(
      <SettingsModal
        {...defaultProps}
        handleProbeBridge={handleProbeBridge}
      />
    );

    const testBtn = screen.getByRole('button', { name: /Test Bridge Connection/i });
    fireEvent.click(testBtn);

    expect(handleProbeBridge).toHaveBeenCalledWith(defaultConfig);
    expect(await screen.findByText('Bridge online and reachable')).toBeDefined();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QRInspector from '../QRInspector';
import { QRElement, LabelElement } from '../../../types';

describe('QRInspector', () => {
  const mockTextQRElement: QRElement = {
    id: 3,
    type: 'qr',
    content: 'https://example.com',
    size: 60,
    qrHelperType: 'text',
    qrHelperFields: {},
    x: 30,
    y: 40,
  };

  const mockWifiQRElement: QRElement = {
    id: 4,
    type: 'qr',
    content: 'WIFI:S:MyHomeWiFi;T:WPA;P:secret123;;',
    size: 80,
    qrHelperType: 'wifi',
    qrHelperFields: {
      wifiSsid: 'MyHomeWiFi',
      wifiPassword: 'secret123',
      wifiEncryption: 'WPA',
    },
    x: 30,
    y: 40,
  };

  const mockVCardQRElement: QRElement = {
    id: 5,
    type: 'qr',
    content: 'BEGIN:VCARD\nVERSION:3.0\nN:Doe;John\nEND:VCARD',
    size: 60,
    qrHelperType: 'vcard',
    qrHelperFields: {
      vcardFirstName: 'John',
      vcardLastName: 'Doe',
      vcardPhone: '+1 555-123-4567',
      vcardEmail: 'john@example.com',
      vcardOrg: 'Acme Corp',
    },
    x: 30,
    y: 40,
  };

  const mockPhoneQRElement: QRElement = {
    id: 6,
    type: 'qr',
    content: 'tel:+15551234567',
    size: 60,
    qrHelperType: 'phone',
    qrHelperFields: {
      phoneNum: '+15551234567',
    },
    x: 30,
    y: 40,
  };

  const defaultProps = {
    element: mockTextQRElement,
    updateQRHelper: vi.fn(),
    updateSelectedElement: vi.fn(),
    pushHistory: vi.fn(),
    elementsRef: { current: [mockTextQRElement] } as React.MutableRefObject<LabelElement[]>,
  };

  it('renders default text mode and handles mode change', () => {
    const updateQRHelper = vi.fn();
    const pushHistory = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        updateQRHelper={updateQRHelper}
        pushHistory={pushHistory}
      />
    );

    const helperSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(helperSelect.value).toBe('text');

    const textInput = screen.getByPlaceholderText('https://example.com or any text');
    expect(textInput).toBeTruthy();

    fireEvent.change(helperSelect, { target: { value: 'wifi' } });
    expect(updateQRHelper).toHaveBeenCalledWith('wifi', {});
    expect(pushHistory).toHaveBeenCalledWith([mockTextQRElement]);
  });

  it('handles text helper input changes and blur', () => {
    const updateQRHelper = vi.fn();
    const pushHistory = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        updateQRHelper={updateQRHelper}
        pushHistory={pushHistory}
      />
    );

    const textInput = screen.getByPlaceholderText('https://example.com or any text');
    fireEvent.change(textInput, { target: { value: 'https://newdomain.com' } });
    expect(updateQRHelper).toHaveBeenCalledWith('text', { plainText: 'https://newdomain.com' });

    fireEvent.blur(textInput);
    expect(pushHistory).toHaveBeenCalledWith([mockTextQRElement]);
  });

  it('renders wifi helper fields, displays compiled payload, and handles field edits', () => {
    const updateQRHelper = vi.fn();
    const pushHistory = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        element={mockWifiQRElement}
        updateQRHelper={updateQRHelper}
        pushHistory={pushHistory}
      />
    );

    // Compiled payload display
    expect(screen.getByText('WIFI:S:MyHomeWiFi;T:WPA;P:secret123;;')).toBeTruthy();

    const ssidInput = screen.getByPlaceholderText('MyHomeWiFi');
    fireEvent.change(ssidInput, { target: { value: 'OfficeWiFi' } });
    expect(updateQRHelper).toHaveBeenCalledWith('wifi', { wifiSsid: 'OfficeWiFi' });

    const passwordInput = screen.getByPlaceholderText('WiFi Password');
    fireEvent.change(passwordInput, { target: { value: 'newpass' } });
    expect(updateQRHelper).toHaveBeenCalledWith('wifi', { wifiPassword: 'newpass' });

    const encryptionSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(encryptionSelect, { target: { value: 'WEP' } });
    expect(updateQRHelper).toHaveBeenCalledWith('wifi', { wifiEncryption: 'WEP' });
    expect(pushHistory).toHaveBeenCalled();
  });

  it('renders vcard helper fields and handles edits', () => {
    const updateQRHelper = vi.fn();
    const pushHistory = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        element={mockVCardQRElement}
        updateQRHelper={updateQRHelper}
        pushHistory={pushHistory}
      />
    );

    const firstNameInput = screen.getByPlaceholderText('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    expect(updateQRHelper).toHaveBeenCalledWith('vcard', { vcardFirstName: 'Jane' });

    const lastNameInput = screen.getByPlaceholderText('Doe');
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    expect(updateQRHelper).toHaveBeenCalledWith('vcard', { vcardLastName: 'Smith' });

    const orgInput = screen.getByPlaceholderText('Acme Corp');
    fireEvent.change(orgInput, { target: { value: 'Global Inc' } });
    expect(updateQRHelper).toHaveBeenCalledWith('vcard', { vcardOrg: 'Global Inc' });
  });

  it('renders phone helper fields and handles edits', () => {
    const updateQRHelper = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        element={mockPhoneQRElement}
        updateQRHelper={updateQRHelper}
      />
    );

    const phoneInput = screen.getByPlaceholderText('+1 555-123-4567');
    fireEvent.change(phoneInput, { target: { value: '+19998887777' } });
    expect(updateQRHelper).toHaveBeenCalledWith('phone', { phoneNum: '+19998887777' });
  });

  it('handles size slider changes and release', () => {
    const updateSelectedElement = vi.fn();
    const pushHistory = vi.fn();

    render(
      <QRInspector
        {...defaultProps}
        updateSelectedElement={updateSelectedElement}
        pushHistory={pushHistory}
      />
    );

    const sizeSlider = screen.getByRole('slider');
    fireEvent.change(sizeSlider, { target: { value: '120' } });
    expect(updateSelectedElement).toHaveBeenCalledWith('size', 120);

    fireEvent.mouseUp(sizeSlider);
    expect(pushHistory).toHaveBeenCalledWith([mockTextQRElement]);
  });
});

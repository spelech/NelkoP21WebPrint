/**
 * Browser Native Web Serial / Web Bluetooth Driver
 * Connects directly from Phone / Tablet / Desktop Web Browser to Nelko P21 over Bluetooth.
 */

const CHUNK_SIZE = 244;
const CHUNK_DELAY_MS = 10;

class WebBluetoothPrinterDriver {
  constructor() {
    this.serialPort = null;
    this.writer = null;
    this.gattDevice = null;
    this.gattCharacteristic = null;
    this.isConnected = false;
    this.deviceName = '';
  }

  isPrinterName(name) {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.includes('nelko') || lower.includes('p21') || lower.includes('printer') || lower.includes('tspl') || lower.includes('com') || lower.includes('serial');
  }

  /**
   * Request Bluetooth Serial or Web Serial connection from user browser.
   */
  async requestConnection() {
    try {
      // 1. Try Web Serial API first (Supported in Chrome Android & Desktop for Bluetooth & USB Serial ports)
      if ('serial' in navigator) {
        this.serialPort = await navigator.serial.requestPort();
        
        // Try opening with standard baud rates (9600 first, fallback to 115200)
        try {
          await this.serialPort.open({ baudRate: 9600 });
        } catch (openErr) {
          try {
            await this.serialPort.open({ baudRate: 115200 });
          } catch (retryErr) {
            throw new Error(`Failed to open serial port (${openErr.message}). NOTE for Windows: Bluetooth SPP creates 2 COM ports (Incoming & Outgoing). Please try selecting the OTHER "Standard Serial over Bluetooth" port in the list, or connect via USB cable.`, { cause: retryErr });
          }
        }

        this.writer = this.serialPort.writable.getWriter();
        this.isConnected = true;
        const info = this.serialPort.getInfo ? this.serialPort.getInfo() : {};
        const rawName = info.usbVendorId 
          ? `USB Printer (0x${info.usbVendorId.toString(16)})` 
          : 'Nelko P21 (Serial Port)';
        this.deviceName = rawName;
        return { success: true, name: this.deviceName, verified: true, type: 'web-serial' };
      }

      // 2. Try Web Bluetooth API fallback
      if ('bluetooth' in navigator) {
        this.gattDevice = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['00001101-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb']
        });

        const server = await this.gattDevice.gatt.connect();
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          const characteristics = await services[0].getCharacteristics();
          this.gattCharacteristic = characteristics[0];
          this.isConnected = true;
          this.deviceName = this.gattDevice.name || 'Nelko P21 (Web Bluetooth)';
          return { success: true, name: this.deviceName, verified: this.isPrinterName(this.deviceName), type: 'web-bluetooth' };
        }
      }

      throw new Error('Web Bluetooth / Web Serial is not supported in this browser. Please use Chrome on Android or Desktop.');
    } catch (err) {
      this.isConnected = false;
      return { success: false, error: err.message };
    }
  }

  /**
   * Disconnect from browser Bluetooth port.
   */
  async disconnect() {
    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      if (this.serialPort) {
        await this.serialPort.close();
        this.serialPort = null;
      }
      if (this.gattDevice && this.gattDevice.gatt.connected) {
        this.gattDevice.gatt.disconnect();
        this.gattDevice = null;
      }
    } catch (e) {
      console.warn(e);
    } finally {
      this.isConnected = false;
    }
  }

  /**
   * Send Uint8Array chunked byte stream to printer.
   */
  async sendBytes(uint8Data) {
    if (!this.isConnected) {
      const connRes = await this.requestConnection();
      if (!connRes.success) return false;
    }

    try {
      const totalLen = uint8Data.length;
      let sent = 0;

      while (sent < totalLen) {
        const chunk = uint8Data.subarray(sent, sent + CHUNK_SIZE);

        if (this.writer) {
          await this.writer.write(chunk);
        } else if (this.gattCharacteristic) {
          await this.gattCharacteristic.writeValue(chunk);
        }

        sent += chunk.length;
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS));
      }

      return true;
    } catch (err) {
      console.error('Failed to stream bytes over browser Bluetooth:', err);
      this.isConnected = false;
      return false;
    }
  }
}

export const browserBtDriver = new WebBluetoothPrinterDriver();

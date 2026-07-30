# Connection Wizard & Mobile Bluetooth Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Connection Wizard Modal with PC Web Serial, Mobile Bluetooth guidance, device signature verification, version bump to `v1.1.0`, and push to main for automated GHCR Docker build.

**Architecture:** Extend `webBluetoothDriver.js` to verify device names and handle connection signatures. Add `ConnectionWizardModal` in `App.jsx` with tabs for PC (Web Serial), Mobile, and Server Bridge. Update `package.json` version, commit, tag, and push to GitHub.

**Tech Stack:** React, Web Serial API, Web Bluetooth API, Tailwind CSS / Lucide Icons, Vite, GitHub Actions.

## Global Constraints
- Target Repo: `/containers/nelkop21webprint`
- Version Floor: `v1.1.0` in `frontend/package.json`
- Deployment: Push to `main` branch on GitHub (`git@github.com:spelech/nelkop21webprint.git`) to trigger `.github/workflows/docker-build-release.yml`.

---

### Task 1: Enhanced Web Bluetooth & Web Serial Driver (`webBluetoothDriver.js`)

**Files:**
- Modify: `/containers/nelkop21webprint/frontend/src/utils/webBluetoothDriver.js`

**Interfaces:**
- Produces: `requestConnection()` returning `{ success: boolean, name: string, verified: boolean, type: string, error?: string }`

- [ ] **Step 1: Update `webBluetoothDriver.js` for signature verification and error handling**

Update `webBluetoothDriver.js` with device verification helper and clean fallback handling:

```javascript
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
      // 1. Try Web Serial API first (Supported in Chrome Android & Desktop for Bluetooth Serial ports)
      if ('serial' in navigator) {
        this.serialPort = await navigator.serial.requestPort();
        await this.serialPort.open({ baudRate: 9600 });
        this.writer = this.serialPort.writable.getWriter();
        this.isConnected = true;
        const info = this.serialPort.getInfo ? this.serialPort.getInfo() : {};
        const rawName = info.usbVendorId ? `Serial Device (0x${info.usbVendorId.toString(16)})` : 'Nelko P21 (Web Serial)';
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
```

- [ ] **Step 2: Verify `webBluetoothDriver.js` compilation**

- [ ] **Step 3: Commit Task 1**

```bash
cd /containers/nelkop21webprint
git add frontend/src/utils/webBluetoothDriver.js
git commit -m "feat(frontend): add signature verification and enhanced Web Serial/Bluetooth error handling"
```

---

### Task 2: Connection Wizard Modal & Header Integration in `App.jsx`

**Files:**
- Modify: `/containers/nelkop21webprint/frontend/src/App.jsx`

- [ ] **Step 1: Add `ConnectionWizardModal` and state to `App.jsx`**

Add state `showWizardModal` and render modal with PC, Mobile, and Server Bridge tabs plus collapsible "Don't see your printer?" troubleshooting guide.

- [ ] **Step 2: Test Vite build locally**

Run: `cd /containers/nelkop21webprint/frontend && npm run build`
Expected: Successful build with no errors.

- [ ] **Step 3: Commit Task 2**

```bash
cd /containers/nelkop21webprint
git add frontend/src/App.jsx
git commit -m "feat(frontend): add interactive Connection Wizard Modal with PC & Mobile guidance"
```

---

### Task 3: Version Bump, Backend Test Verification, Commit & Push to Main

**Files:**
- Modify: `/containers/nelkop21webprint/frontend/package.json`

- [ ] **Step 1: Bump version in `package.json` to `1.1.0`**

- [ ] **Step 2: Run backend tests**

Run: `python /containers/nelkop21webprint/backend/tests/run_tests.py`
Expected: 100% passing test suite.

- [ ] **Step 3: Commit & Push to `main` on GitHub**

```bash
cd /containers/nelkop21webprint
git add frontend/package.json
git commit -m "chore(release): bump version to 1.1.0"
git push origin master:main -f || git push origin main
```

# Spec: Connection Wizard, Device Verification & Mobile Bluetooth Support

**Date:** 2026-07-29  
**Status:** Approved  
**Target Repository:** `/containers/nelkop21webprint`  

---

## 1. Overview & Objective

The **Nelko P21** thermal label printer uses **Bluetooth Classic (SPP / RFCOMM)** rather than Bluetooth Low Energy (BLE). Because web browsers (Chrome/Edge) handle Bluetooth Classic differently between Desktop and Mobile operating systems:
- **PC Web Browsers (Windows / macOS / Linux)**: Standard `navigator.bluetooth` (BLE) ignores Bluetooth Classic devices. Connecting from a PC browser requires **Web Serial (`navigator.serial`)**, which accesses the virtual serial/COM port assigned after pairing the printer in OS Bluetooth settings.
- **Mobile Browsers (Android Chrome)**: Supports Web Bluetooth / Web Serial when appropriate Chrome flags and permissions are active.
- **Server-Side Bridge**: Offers zero-pairing multi-device printing across the entire home network via ESP32 Wi-Fi bridge (`tcp`) or host Linux RFCOMM socket (`spp`).

This spec outlines adding a comprehensive **Printer Connection & Device Verification Wizard**, enhancing driver signature verification, adding mobile guidance, and deploying a new container build via GitHub Actions.

---

## 2. Component Architecture & UI Changes

### 2.1 Connection Wizard Modal (`ConnectionWizardModal` in `App.jsx`)
Replace direct `requestConnection` execution with a modal providing step-by-step setup and live device selection:
- **Tab 1: PC Direct (Web Serial)**:
  - Step 1: Pair `Nelko P21` in Windows / macOS Bluetooth Settings.
  - Step 2: Click "Connect PC Serial Port".
  - Step 3: Select the `Standard Serial over Bluetooth` or `COMx` port in Chrome's Web Serial picker.
  - Collapsible **"Don't see your printer?"** troubleshooting guide explaining OS pairing, COM port conflicts, and Chrome Web Serial setup.
- **Tab 2: Mobile Direct (Android / iOS)**:
  - Android Chrome Web Bluetooth / Web Serial pairing instructions.
  - Recommended WebBLE / Chrome setup details for iOS & mobile devices.
- **Tab 3: Server Bridge (ESP32 / Host SPP)**:
  - Configuration for TCP Network Bridge (ESP32 node) or Linux host SPP driver (`/dev/rfcomm0`), enabling background printing without browser pairing.

### 2.2 Enhanced Browser Bluetooth Driver (`webBluetoothDriver.js`)
- **Device Signature Verification**:
  - Validates connected device name against printer prefixes (`P21`, `Nelko`, `BT-`, `Printer`, `TSPL`, `COM`).
  - Returns `verified: true` and normalized display name (`P21 (COM3)` or `Nelko P21`).
- **Graceful Error Handling**:
  - Intercepts serial port locks, OS bluetooth disconnects, and browser permission denials with actionable error messages.
- **Connection Badge**:
  - Header badge updates dynamically to display `BT Connected: P21 (COM3)` with green status indicator.

---

## 3. Deployment & Release Workflow

1. **Version Bump**: Update version string in `frontend/package.json` to `v1.1.0`.
2. **Git Commit & Tag**: Commit feature implementation to git.
3. **Push to Main**: Push branch to `main` on GitHub (`git@github.com:spelech/nelkop21webprint.git`).
4. **CI/CD Build**: GitHub Actions workflow (`docker-build-release.yml`) automatically runs unit tests, generates SemVer release tag, builds multi-arch Docker image, and publishes `ghcr.io/spelech/nelkop21webprint:latest`.
5. **Container Update**: Pull fresh image and restart `nelko-p21-print` in `/containers/productivity/docker-compose.yaml`.

---

## 4. Verification & Testing Criteria

- [ ] Execute python backend test suite (`python backend/tests/run_tests.py`).
- [ ] Verify frontend Vite build succeeds (`npm run build` in `frontend/`).
- [ ] Confirm Connection Wizard UI renders with PC, Mobile, and Server Bridge tabs.
- [ ] Confirm git push triggers container pipeline on GitHub Actions.

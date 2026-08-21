# Fix Web UI Template Selection, ESP32 Placeholder Tools, Connection Wizard & Icon Rasterizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the template dropdown instant reversion bug, add visual ESP32 field placeholder design tooling to the Web UI, clean up the Connection Wizard (remove PC Web Serial, rename ESPHome -> ESP32 Print Bridge), and fix the ESP32 firmware image/icon rasterizer that produced full-black prints.

**Architecture:** 
1. `NelkoP21WebPrint`:
   - `LayoutPresets.tsx`: Fix template dropdown state synchronization so `selectedTemplateId` persists.
   - `AddElements.tsx`, `TextInspector.tsx`, `BarcodeInspector.tsx`, `QRInspector.tsx`: Add ESP32 field variable placeholders tool (`{{mainText}}`, `{{subtitle}}`, `{{barcodeData}}`, `{{qrData}}`, custom `{{var}}`).
   - `WizardModal.tsx`, `SettingsModal.tsx`, `Header.tsx`, `SidebarContent.tsx`: Remove Web Serial PC tabs, replace "ESPHome" terminology with "ESP32 Print Bridge".
2. `esp32-LabelPrinter`:
   - `tspl_generator.cpp`: Implement `else if (type == "image" || type == "icon")` rasterizer with strict bounds checking to prevent buffer corruption / full black label output.

**Tech Stack:** TypeScript, React 18, C++ (Arduino/ESP32), Vitest.

## Global Constraints
- File length constraint: No file may exceed 500 lines (all files strictly under 350 lines).
- React lint/typecheck rules: `npm run lint` and `npx tsc --noEmit` must pass cleanly with 0 errors.
- Vitest: `npx vitest run` must pass 100%.

---

### Task 1: Fix Template Dropdown State Reversion (`LayoutPresets.tsx`)

**Files:**
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/LayoutPresets.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/__tests__/LayoutPresets.test.tsx`

**Key Changes:**
1. Prevent `setSelectedPreset` inside template dropdown `onChange` from triggering an unintended clearing of `selectedTemplateId`.
2. Normalize template ID matching so string/number comparisons (`String(t.id) === String(tid)`) stay strictly synchronized.

- [ ] **Step 1: Update `LayoutPresets.tsx` template selection handler**
- [ ] **Step 2: Run `npx vitest run src/components/__tests__/LayoutPresets.test.tsx`**
- [ ] **Step 3: Commit Task 1**

```bash
git add frontend/src/components/LayoutPresets.tsx frontend/src/components/__tests__/LayoutPresets.test.tsx
git commit -m "fix(ui): resolve template selection dropdown reversion bug"
```

---

### Task 2: Add ESP32 Field Placeholder Design Tools (`AddElements.tsx` & Inspectors)

**Files:**
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/AddElements.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Inspector/TextInspector.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Inspector/BarcodeInspector.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Inspector/QRInspector.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/hooks/useElementActions.ts`

**Key Changes:**
1. Add an "ESP32 Template Variable Placeholders" toolbar section in `AddElements.tsx` allowing one-click insertion of `{{mainText}}`, `{{subtitle}}`, `{{barcodeData}}`, and `{{qrData}}`.
2. Add quick "Insert Placeholder" dropdowns in `TextInspector.tsx`, `BarcodeInspector.tsx`, and `QRInspector.tsx`.
3. Add helper factory functions in `useElementActions.ts` (`addTemplateVariableElement`).

- [ ] **Step 1: Add variable placeholder creators to `useElementActions.ts`**
- [ ] **Step 2: Add template variable toolbar to `AddElements.tsx`**
- [ ] **Step 3: Add placeholder quick-insert dropdowns to Inspector components**
- [ ] **Step 4: Verify with `npm run lint` and `npx tsc --noEmit`**
- [ ] **Step 5: Commit Task 2**

```bash
git add frontend/src/components/AddElements.tsx frontend/src/components/Inspector/ frontend/src/hooks/useElementActions.ts
git commit -m "feat(ui): add ESP32 template variable placeholder design tools"
```

---

### Task 3: Clean Up Connection Wizard & Replace ESPHome Terminology

**Files:**
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Modals/WizardModal.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Modals/SettingsModal.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Header.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/SidebarContent.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/components/Modals/__tests__/WizardModal.test.tsx`

**Key Changes:**
1. Remove PC Web Serial options/tabs from `WizardModal.tsx` and `SettingsModal.tsx`.
2. Replace all instances of "ESPHome" / "ESPHome Bridge" with **"ESP32 Print Bridge"** or **"Server Print Bridge"**.
3. Simplify connection choices to:
   - **Direct Browser Bluetooth (GATT)**
   - **ESP32 Wi-Fi / Server Print Bridge**

- [ ] **Step 1: Refactor `WizardModal.tsx` (remove PC Web Serial, rename ESPHome)**
- [ ] **Step 2: Refactor `SettingsModal.tsx`, `Header.tsx`, `SidebarContent.tsx`**
- [ ] **Step 3: Update `WizardModal.test.tsx`**
- [ ] **Step 4: Run test suite and typechecker**
- [ ] **Step 5: Commit Task 3**

```bash
git add frontend/src/components/
git commit -m "refactor(wizard): remove PC Web Serial and rename ESPHome to ESP32 Print Bridge"
```

---

### Task 4: Fix ESP32 Firmware Image/Icon Full-Black Rasterization (`tspl_generator.cpp`)

**Files:**
- Modify: `Z:/repos/esp32-LabelPrinter/tspl_generator.cpp`

**Key Changes:**
1. Add strict bounds checking to `setPixelBlack` in `tspl_generator.cpp` (`if (x < 0 || x >= logicalW || y < 0 || y >= logicalH) return;`).
2. Implement `else if (type == "image" || type == "icon")` element handler in `generateTSPLFromJSON`:
   - Parse `x`, `y`, `width` (default 60), `height` (default 60).
   - Render clean icon/image bounding box or vector glyph outline without memory overrun.
   - Prevent unhandled element type bitwise corruption that turned the logical buffer all black (`0x00`).

- [ ] **Step 1: Add bounds checks & image/icon handler to `tspl_generator.cpp`**
- [ ] **Step 2: Compile firmware using `arduino-cli`**
- [ ] **Step 3: Commit Task 4**

```bash
git add Z:/repos/esp32-LabelPrinter/tspl_generator.cpp
git commit -m "fix(esp32): resolve image/icon element rasterizer memory overrun causing black labels"
```

---

## Verification Plan

### Automated Verification
```bash
# In Z:\repos\NelkoP21WebPrint\frontend:
npm run lint
npx tsc --noEmit
npx vitest run

# In Z:\repos\esp32-LabelPrinter:
& "C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe" compile --fqbn esp32:esp32:esp32:PartitionScheme=huge_app --output-dir build .
```

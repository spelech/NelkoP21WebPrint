# Comprehensive Test Coverage Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Vitest & React Testing Library test coverage across all custom hooks, Inspector property controls, UI toolbars, and Modal dialogs in `NelkoP21WebPrint`.

**Architecture:** 
1. `src/hooks/__tests__/`: Unit tests for `useHistory`, `useCanvasDrag`, `useIconSearch`, `useTouchZoom`.
2. `src/components/Inspector/__tests__/`: Component tests for `ElementInspector`, `TextInspector`, `BarcodeInspector`, `QRInspector`.
3. `src/components/__tests__/`: Component tests for `Header`, `LayoutPresets`, `AddElements`, `PrintParameters`, `IconLibrary`, `SidebarContent`.
4. `src/components/Modals/__tests__/`: Component tests for `SettingsModal`, `WizardModal`, `BatchModal`, `PreviewModal`.

**Tech Stack:** TypeScript, Vitest, React Testing Library, JSDOM.

## Global Constraints
- Every file created must be strictly under 350 lines.
- React lint/typecheck rules: `npm run lint` and `npx tsc --noEmit` must pass cleanly with 0 errors.
- Vitest: `npx vitest run --coverage` must pass 100%.

---

### Task 1: Custom Hooks Unit Test Suite (`src/hooks/__tests__/`)

**Files:**
- Create: `src/hooks/__tests__/useHistory.test.ts`
- Create: `src/hooks/__tests__/useCanvasDrag.test.ts`
- Create: `src/hooks/__tests__/useIconSearch.test.ts`
- Create: `src/hooks/__tests__/useTouchZoom.test.ts`

- [ ] **Step 1: Write `useHistory.test.ts`**
  - Test initial state array, `pushHistory`, `handleUndo`, `handleRedo`, and history index bounds.

- [ ] **Step 2: Write `useCanvasDrag.test.ts`**
  - Test `handleStartDrag`, 8px grid snapping, 1.5% threshold alignment guide calculation, `nudgeSelectedElement` arrow key nudging, and deletion key shortcuts.

- [ ] **Step 3: Write `useIconSearch.test.ts`**
  - Test offline catalog string search filtering and debounced Iconify API fetch lookup.

- [ ] **Step 4: Write `useTouchZoom.test.ts`**
  - Test pinch/zoom touch event listeners and scale clamping.

- [ ] **Step 5: Run `npx vitest run`**
  - Verify all hook unit tests pass cleanly.

- [ ] **Step 6: Commit Hooks Test Suite**

```bash
git add src/hooks/__tests__/
git commit -m "test: add comprehensive unit test suite for custom React hooks"
```

---

### Task 2: Inspector Sub-Components Test Suite (`src/components/Inspector/__tests__/`)

**Files:**
- Create: `src/components/Inspector/__tests__/TextInspector.test.tsx`
- Create: `src/components/Inspector/__tests__/BarcodeInspector.test.tsx`
- Create: `src/components/Inspector/__tests__/QRInspector.test.tsx`
- Create: `src/components/Inspector/__tests__/ElementInspector.test.tsx`

- [ ] **Step 1: Write `TextInspector.test.tsx`**
  - Test font size range slider, font family dropdown, font style, and alignment buttons.

- [ ] **Step 2: Write `BarcodeInspector.test.tsx`**
  - Test barcode content text input and barcode encoding dropdown (code128, ean13, ean8).

- [ ] **Step 3: Write `QRInspector.test.tsx`**
  - Test QR helper mode selector (plain text, WiFi, vCard, phone), helper field inputs, and dynamic payload calculation.

- [ ] **Step 4: Write `ElementInspector.test.tsx`**
  - Test rendering selected element controls (width/height sliders, layer ordering buttons, delete element button).

- [ ] **Step 5: Run `npx vitest run`**
  - Verify all Inspector component tests pass cleanly.

- [ ] **Step 6: Commit Inspector Test Suite**

```bash
git add src/components/Inspector/__tests__/
git commit -m "test: add React Testing Library test suite for Inspector components"
```

---

### Task 3: UI Controls & Sidebar Test Suite (`src/components/__tests__/`)

**Files:**
- Create: `src/components/__tests__/Header.test.tsx`
- Create: `src/components/__tests__/LayoutPresets.test.tsx`
- Create: `src/components/__tests__/AddElements.test.tsx`
- Create: `src/components/__tests__/PrintParameters.test.tsx`
- Create: `src/components/__tests__/IconLibrary.test.tsx`
- Create: `src/components/__tests__/SidebarContent.test.tsx`

- [ ] **Step 1: Write `Header.test.tsx`**
  - Test undo/redo button clicks, Web Bluetooth connection status badge and connect/disconnect actions, print button.

- [ ] **Step 2: Write `LayoutPresets.test.tsx`**
  - Test preset size selector, portrait/landscape orientation toggle, Push to ESP32 button, export/import layout file buttons.

- [ ] **Step 3: Write `AddElements.test.tsx`**
  - Test add text, QR code, barcode, line, rectangle, and image upload buttons.

- [ ] **Step 4: Write `PrintParameters.test.tsx` & `IconLibrary.test.tsx`**
  - Test density slider, copy count input, color inversion toggle, batch print trigger, and icon search input.

- [ ] **Step 5: Write `SidebarContent.test.tsx`**
  - Test sidebar drawer rendering and tab switches.

- [ ] **Step 6: Run `npx vitest run`**
  - Verify all UI control component tests pass cleanly.

- [ ] **Step 7: Commit UI Controls Test Suite**

```bash
git add src/components/__tests__/
git commit -m "test: add React Testing Library test suite for main UI toolbars and controls"
```

---

### Task 4: Modals Test Suite & Final Coverage Report (`src/components/Modals/__tests__/`)

**Files:**
- Create: `src/components/Modals/__tests__/SettingsModal.test.tsx`
- Create: `src/components/Modals/__tests__/WizardModal.test.tsx`
- Create: `src/components/Modals/__tests__/BatchModal.test.tsx`
- Create: `src/components/Modals/__tests__/PreviewModal.test.tsx`

- [ ] **Step 1: Write `SettingsModal.test.tsx`**
  - Test settings modal inputs and save callback.

- [ ] **Step 2: Write `WizardModal.test.tsx`**
  - Test setup wizard tab navigation and step actions.

- [ ] **Step 3: Write `BatchModal.test.tsx` & `PreviewModal.test.tsx`**
  - Test CSV file import dropzone, variable column mapping, batch print preview, and canvas preview modal.

- [ ] **Step 4: Execute Full Verification Suite with Coverage**
  - Run: `npm run lint`
  - Run: `npx tsc --noEmit`
  - Run: `npx vitest run --coverage`

- [ ] **Step 5: Commit Modals Test Suite**

```bash
git add src/components/Modals/__tests__/
git commit -m "test: add test suite for Modals and verify full coverage report"
```

---

## Verification Plan

### Automated Verification
```bash
# In Z:\repos\NelkoP21WebPrint\frontend:
npm run lint
npx tsc --noEmit
npx vitest run --coverage
```

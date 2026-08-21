# React TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the frontend code from loose JavaScript (`.js`/`.jsx`) to fully typed React TypeScript (`.ts`/`.tsx`) to prevent UI regressions, enforce data interface structures, and improve linter/typecheck verification at build time.

**Architecture:** We migrate files incrementally by layer, starting with core types and utilities, followed by custom refactored hooks, modular leaf components (modals and controls), and finally the high-level layout components and the main application coordinator ([`App.jsx`](file:///containers/nelkop21webprint/frontend/src/App.jsx)). Verification is enforced at each checkpoint using the local TS compiler.

**Tech Stack:** React 18, Vite 5, TypeScript 7, ESLint 9, TailwindCSS 3.

## Global Constraints

- **Type Safety & Imports:** No custom global bypasses in `eslint.config.js` or `tsconfig.json`. Every dependency (e.g., `QRCode`, `browserBtDriver`) must be explicitly imported.
- **Strict Verification:** Every task must pass `npm run typecheck` (`tsc --noEmit`) and `npm run build` (`tsc --noEmit && vite build`) without warnings or errors.
- **Browser Draft APIs:** Cast `navigator` to `any` (or use type extensions) when calling non-standard browser features (e.g., `navigator.bluetooth` or `navigator.serial`).
- **UX Consistency:** The version badge `v{appVersion}` must remain `inline-block` (visible on mobile and desktop). Undo/Redo controls must remain iconified on narrow screens (`md`). Direct vs Server toggle segmented switcher must remain functional.

---

### Task 1: Type Definitions Registry

**Files:**
- Create: `frontend/src/types/index.ts`

**Interfaces:**
- Consumes: None
- Produces: 
  - `LabelElement` type (id, type, x, y, width, height, content, font, rotation, rx, ry, isLocked)
  - `HistoryState` type (past: LabelElement[][], present: LabelElement[], future: LabelElement[][])
  - `Preset` interface (id, name, width_mm, height_mm, gap_mm, isPortrait)
  - `DriverConfig` interface (driver_type: 'tcp'|'spp'|'mock', tcp_host: string, tcp_port: number, bt_mac: string)

- [ ] **Step 1: Create type definitions file**
  Write interface declarations for all canvas layout models and driver configuration states in `frontend/src/types/index.ts`.
  ```typescript
  export interface LabelElement {
    id: string;
    type: 'text' | 'qr' | 'barcode' | 'line' | 'rect' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    font?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    rotation?: 0 | 90 | 180 | 270;
    rx?: number;
    ry?: number;
    isLocked?: boolean;
  }

  export interface Preset {
    id: string;
    name: string;
    width_mm: number;
    height_mm: number;
    gap_mm: number;
    isPortrait: boolean;
  }

  export interface DriverConfig {
    driver_type: 'tcp' | 'spp' | 'mock';
    tcp_host: string;
    tcp_port: number;
    bt_mac: string;
  }
  ```

- [ ] **Step 2: Verify code compilation**
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/types/index.ts
  git commit -m "feat(types): create frontend TypeScript interfaces registry"
  ```

---

### Task 2: Utility & Driver Migration

**Files:**
- Create/Migrate: `frontend/src/utils/mdiIcons.ts` (from `mdiIcons.js`)
- Create/Migrate: `frontend/src/utils/tsplGenerator.ts` (from `tsplGenerator.js`)
- Create/Migrate: `frontend/src/utils/webBluetoothDriver.ts` (from `webBluetoothDriver.js`)

**Interfaces:**
- Consumes: types defined in `frontend/src/types/index.ts`
- Produces: 
  - `mdiIcons` mapping dictionary
  - `generateTspl()` function signature: `(elements: LabelElement[], widthMm: number, heightMm: number, copies: number, density: number) => Uint8Array`
  - `browserBtDriver` instance of `WebBluetoothPrinterDriver`

- [ ] **Step 1: Migrate mdiIcons**
  Rename `frontend/src/utils/mdiIcons.js` to `mdiIcons.ts`. Type-cast the dictionary keys and values as strings.
  Run: `npm run typecheck` to verify correct imports.

- [ ] **Step 2: Migrate tsplGenerator**
  Rename `frontend/src/utils/tsplGenerator.js` to `tsplGenerator.ts`. Import `LabelElement` from `../types`. Strict-type the parameters of `generateTspl` and internal helpers.

- [ ] **Step 3: Migrate webBluetoothDriver**
  Rename `frontend/src/utils/webBluetoothDriver.js` to `webBluetoothDriver.ts`. Annotate fields `gattDevice` as `BluetoothDevice | null` and `gattCharacteristic` as `BluetoothRemoteGATTCharacteristic | null`. Type-cast `navigator` using:
  ```typescript
  const nav = navigator as any;
  ```

- [ ] **Step 4: Verify typecheck & build**
  Run: `npm run typecheck && npm run build`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/utils/
  git commit -m "refactor(utils): migrate utility modules and Bluetooth driver to TypeScript"
  ```

---

### Task 3: Hook Extract (useCanvasHistory)

**Files:**
- Create: `frontend/src/hooks/useCanvasHistory.ts`

**Interfaces:**
- Consumes: `LabelElement` type
- Produces: `useCanvasHistory` hook returning `[elements, setElements, undo, redo, canUndo, canRedo, clearHistory]`

- [ ] **Step 1: Create the custom canvas history hook**
  Extract undo/redo stack manager from the monolith into `frontend/src/hooks/useCanvasHistory.ts`.
  ```typescript
  import { useState, useCallback } from 'react';
  import { LabelElement } from '../types';

  export function useCanvasHistory(initialElements: LabelElement[] = []) {
    const [past, setPast] = useState<LabelElement[][]>([]);
    const [present, setPresent] = useState<LabelElement[]>(initialElements);
    const [future, setFuture] = useState<LabelElement[][]>([]);

    const setElements = useCallback((newElements: LabelElement[] | ((prev: LabelElement[]) => LabelElement[])) => {
      setPast(prevPast => [...prevPast, present]);
      setPresent(prevPresent => typeof newElements === 'function' ? newElements(prevPresent) : newElements);
      setFuture([]);
    }, [present]);

    const undo = useCallback(() => {
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      setPast(newPast);
      setFuture(prevFuture => [present, ...prevFuture]);
      setPresent(previous);
    }, [past, present]);

    const redo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[0];
      const newFuture = future.slice(1);
      setPast(prevPast => [...prevPast, present]);
      setFuture(newFuture);
      setPresent(next);
    }, [future, present]);

    return { elements: present, setElements, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
  }
  ```

- [ ] **Step 2: Verify compilation**
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/hooks/useCanvasHistory.ts
  git commit -m "feat(hooks): extract canvas history Undo/Redo logic"
  ```

---

### Task 4: Migrate Modals & Segmented Controls

**Files:**
- Migrate: `frontend/src/components/Modals/PreviewModal.jsx` ➔ `PreviewModal.tsx`
- Migrate: `frontend/src/components/Modals/SettingsModal.jsx` ➔ `SettingsModal.tsx`
- Migrate: `frontend/src/components/Modals/WizardModal.jsx` ➔ `WizardModal.tsx`
- Migrate: `frontend/src/components/Modals/BatchModal.jsx` ➔ `BatchModal.tsx`
- Migrate: `frontend/src/components/ThemeSelector.jsx` ➔ `ThemeSelector.tsx`

**Interfaces:**
- Consumes: Driver types and UI handler callbacks
- Produces: Fully typed React function components (FC)

- [ ] **Step 1: Migrate SettingsModal and ThemeSelector**
  Rename files to `.tsx`. Declare interface props for each modal. Ensure callback signatures (e.g. `onClose: () => void`, `setDriverConfig: (c: DriverConfig) => void`) match accurately.

- [ ] **Step 2: Migrate WizardModal**
  Rename to `WizardModal.tsx`. Strictly type parameter `wizardTab: 'pc' | 'mobile' | 'bridge'`. Update tabs layout checks.

- [ ] **Step 3: Migrate BatchModal and PreviewModal**
  Rename to `.tsx`. Declare interfaces for the CSV fields, template placeholders mapping, and the dithered thermal canvas preview.

- [ ] **Step 4: Verify typecheck & build**
  Run: `npm run typecheck && npm run build`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/components/Modals/ frontend/src/components/ThemeSelector.tsx
  git commit -m "refactor(components): migrate all modals and theme selectors to TSX"
  ```

---

### Task 5: Migrate Editor Action Controls

**Files:**
- Migrate: `frontend/src/components/PrintParameters.jsx` ➔ `PrintParameters.tsx`
- Migrate: `frontend/src/components/AddElements.jsx` ➔ `AddElements.tsx`
- Migrate: `frontend/src/components/IconLibrary.jsx` ➔ `IconLibrary.tsx`
- Migrate: `frontend/src/components/LayoutPresets.jsx` ➔ `LayoutPresets.tsx`

**Interfaces:**
- Consumes: element creation methods and parameter options
- Produces: Form controls and canvas action lists

- [ ] **Step 1: Migrate PrintParameters and AddElements**
  Rename to `.tsx`. Map parameters (density, copies, label size, gap) to state setters. Strictly type shape builders.

- [ ] **Step 2: Migrate IconLibrary and LayoutPresets**
  Rename to `.tsx`. Add typing for presets (standard label templates: 40x14mm, 30x12mm, etc.). Define JSON import configurations.

- [ ] **Step 3: Verify build**
  Run: `npm run typecheck && npm run build`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/
  git commit -m "refactor(components): migrate layout panels and icon libraries to TSX"
  ```

---

### Task 6: Migrate Header & Canvas Workspace

**Files:**
- Migrate: `frontend/src/components/Header.jsx` ➔ `Header.tsx`
- Migrate: `frontend/src/components/CanvasWorkspace.jsx` ➔ `CanvasWorkspace.tsx`

**Interfaces:**
- Consumes: `LabelElement`, layout guides, zoom variables, undo/redo states
- Produces: Header bar with connection flags, visual snapping guidelines canvas

- [ ] **Step 1: Migrate Header**
  Rename to `Header.tsx`. Enforce properties ensuring `v{appVersion}` remains `inline-block` and Undo/Redo buttons render as icons (`Undo2`/`Redo2`) on narrow screens (`md`).

- [ ] **Step 2: Migrate CanvasWorkspace**
  Rename to `CanvasWorkspace.tsx`. Declare typing for dragging handlers, resize node markers (`nw`, `se`, etc.), grid guidelines calculation, and bounds clamping.

- [ ] **Step 3: Verify compilation**
  Run: `npm run typecheck && npm run build`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/Header.tsx frontend/src/components/CanvasWorkspace.tsx
  git commit -m "refactor(components): migrate workspace canvas and header layout to TSX"
  ```

---

### Task 7: App Coordinator & Scaffolding Entry

**Files:**
- Migrate: `frontend/src/App.jsx` ➔ `App.tsx`
- Migrate: `frontend/src/main.jsx` ➔ `main.tsx`

**Interfaces:**
- Consumes: All sub-components and custom React hooks
- Produces: Main editor coordinator layout rendering

- [ ] **Step 1: Migrate App coordinator**
  Rename `frontend/src/App.jsx` to `App.tsx`. Import custom hooks (`useCanvasHistory`). Define internal methods (e.g. alignment guidelines snapping, keyboard listener handlers). Fix any remaining structural typings.

- [ ] **Step 2: Migrate main bootstrap entry**
  Rename `frontend/src/main.jsx` to `main.tsx`. Enforce TypeScript root node assertion:
  ```typescript
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(...)
  ```

- [ ] **Step 3: Run final clean checks**
  Run: `npm run typecheck && npm run build && npx eslint src`
  Expected: Complete success with 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/App.tsx frontend/src/main.tsx
  git commit -m "refactor(frontend): finalize complete TypeScript migration"
  ```

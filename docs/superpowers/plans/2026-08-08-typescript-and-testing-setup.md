# Strict TypeScript Conversion & Vitest Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `NelkoP21WebPrint` frontend to strict TypeScript (`.ts`/`.tsx`), enforce `strict: true` typechecking, add `npm run lint` script, decompose monolithic `App.jsx` into modular components & hooks, and install Vitest with comprehensive unit tests for TSPL generation.

**Architecture:** 
1. `src/types/index.ts` defines explicit TypeScript domain interfaces (`LabelPreset`, `LabelElement`, `TextElement`, `BarcodeElement`, etc.).
2. Monolithic `App.jsx` (2,160+ lines) decomposed into custom hooks (`useHistory`, `useCanvasDrag`, `useIconSearch`) and focused inspector sub-components (`ElementInspector`, `QRInspector`, `TextInspector`, `BarcodeInspector`).
3. Source files migrated to TypeScript (`.ts`/`.tsx`), `tsconfig.json` updated with `"strict": true`.
4. Vitest configured in `vite.config.js`, with unit tests verifying dot conversions, TSPL headers, dithering, and rasterization.

**Tech Stack:** TypeScript, React 18, Vite, Vitest, ESLint.

## Global Constraints
- React lint/typecheck rules: `npm run lint` and `npx tsc --noEmit` must pass cleanly.
- Vitest: `npx vitest run` must execute unit tests and pass 100%.
- Monolithic avoidance: Decompose `App.jsx` into focused single-responsibility modules under `src/hooks` and `src/components/Inspector`.

---

### Task 1: Type Definitions & Config Enforcement

**Files:**
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/types/index.ts`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/tsconfig.json:1-18`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/package.json:6-12`

- [ ] **Step 1: Create `src/types/index.ts`**

Define domain interfaces for presets, elements, print options, and driver types.

- [ ] **Step 2: Update `tsconfig.json` to strict mode**

Set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, remove `"allowJs": true`.

- [ ] **Step 3: Update `package.json` scripts**

Add `"lint": "eslint ."` and `"test": "vitest run"`.

- [ ] **Step 4: Commit config changes**

```bash
git add tsconfig.json package.json src/types/index.ts
git commit -m "chore: enable strict TypeScript options and add lint script"
```

---

### Task 2: Modular Component & Hook Extraction from Monolithic App

**Files:**
- Create: `src/hooks/useHistory.ts`
- Create: `src/hooks/useCanvasDrag.ts`
- Create: `src/hooks/useIconSearch.ts`
- Create: `src/components/Inspector/ElementInspector.tsx`
- Create: `src/components/Inspector/QRInspector.tsx`
- Create: `src/components/Inspector/TextInspector.tsx`
- Create: `src/components/Inspector/BarcodeInspector.tsx`
- Create: `src/utils/csvParser.ts`
- Modify: `src/App.jsx`

- [ ] **Step 1: Extract `useHistory` custom hook**

Extract history undo/redo stack logic (`elements`, `history`, `historyIndex`, `pushHistory`, `handleUndo`, `handleRedo`) into `src/hooks/useHistory.ts`.

- [ ] **Step 2: Extract `useCanvasDrag` & keyboard shortcut hooks**

Extract element drag, snap-to-grid alignment guides, and arrow key nudge logic into `src/hooks/useCanvasDrag.ts`.

- [ ] **Step 3: Extract `useIconSearch` custom hook**

Extract MDI offline search and Iconify debounced search logic into `src/hooks/useIconSearch.ts`.

- [ ] **Step 4: Extract `ElementInspector` & Inspector sub-components**

Extract element property controls (Text font size/family, Barcode encoding, QR helpers, line/rectangle dimensions) into `src/components/Inspector/ElementInspector.tsx`, `QRInspector.tsx`, `TextInspector.tsx`, and `BarcodeInspector.tsx`.

- [ ] **Step 5: Extract `csvParser.ts` utility**

Move CSV scanner and curly brace variable detection logic out of `App` into `src/utils/csvParser.ts`.

- [ ] **Step 6: Commit modular decomposition**

```bash
git add src/hooks/ src/components/Inspector/ src/utils/csvParser.ts src/App.jsx
git commit -m "refactor: decompose monolithic App.jsx into custom hooks and inspector components"
```

---

### Task 3: Migrate Utilities & Components to Strict TypeScript (`.ts`/`.tsx`)

**Files:**
- Rename/Modify: `src/utils/tsplGenerator.js` -> `src/utils/tsplGenerator.ts`
- Rename/Modify: `src/utils/webBluetoothDriver.js` -> `src/utils/webBluetoothDriver.ts`
- Rename/Modify: `src/utils/mdiIcons.js` -> `src/utils/mdiIcons.ts`
- Rename/Modify: `src/main.jsx` -> `src/main.tsx`
- Rename/Modify: `src/App.jsx` -> `src/App.tsx`
- Rename/Modify: `src/components/*.jsx` -> `src/components/*.tsx`
- Rename/Modify: `src/components/Modals/*.jsx` -> `src/components/Modals/*.tsx`

- [ ] **Step 1: Add types to `tsplGenerator.ts` and `webBluetoothDriver.ts`**

Add explicit parameters and return type annotations matching `src/types/index.ts`.

- [ ] **Step 2: Rename and type React components**

Rename components to `.tsx`, add prop type definitions for `Header`, `LayoutPresets`, `AddElements`, `CanvasWorkspace`, `PrintParameters`, `IconLibrary`, `ThemeSelector`, and Modal components.

- [ ] **Step 3: Run `npx tsc --noEmit` and `npx eslint .`**

Verify strict TypeScript compilation passes with zero errors.

- [ ] **Step 4: Commit TypeScript Migration**

```bash
git add src/
git commit -m "refactor: migrate frontend codebase to strict TypeScript (.ts/.tsx)"
```

---

### Task 4: Vitest Installation & TSPL Generator Unit Tests

**Files:**
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/package.json`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/vite.config.js`
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/utils/__tests__/tsplGenerator.test.ts`

- [ ] **Step 1: Install `vitest` devDependency**

Run `npm install -D vitest @testing-library/react jsdom`.

- [ ] **Step 2: Update `vite.config.js` with Vitest test config**

```javascript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
```

- [ ] **Step 3: Write Unit Tests in `tsplGenerator.test.ts`**

Write tests verifying:
1. `mmToDots(40, 203)` produces correct dot count (`320`).
2. `convertCanvasToTsplBytes()` constructs correct TSPL headers (`SIZE 14.0 mm, 40.0 mm`, `GAP 5.0 mm, 0 mm`, `DIRECTION 0`, `CLS`, `BITMAP`, `PRINT 1,1`).
3. Binary byte array calculations for padded width and bitmap size.

- [ ] **Step 4: Execute `npm run test`**

Run: `npx vitest run` inside `Z:/repos/NelkoP21WebPrint/frontend`.
Expected: 100% PASS.

- [ ] **Step 5: Commit Vitest Test Suite**

```bash
git add package.json package-lock.json vite.config.js src/utils/__tests__/tsplGenerator.test.ts
git commit -m "test: add Vitest setup and unit tests for TSPL generator"
```

---

## Verification Plan

### Automated Verification
```bash
# In Z:\repos\NelkoP21WebPrint\frontend:
npm run lint
npm run typecheck
npx vitest run
```

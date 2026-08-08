# Decompose App.tsx Under 500 Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose `App.tsx` (1,265 lines) into clean, modular single-responsibility hooks and components so that every file in the repository is strictly under 350 lines.

**Architecture:** 
1. `src/utils/canvasRenderer.ts`: Offscreen 2D canvas drawing logic for preview generation & TSPL conversion.
2. `src/hooks/usePrinterBridge.ts`: Web Bluetooth & backend print bridge state and actions.
3. `src/hooks/useElementActions.ts`: Element factory functions, layout import/export, and property updates.
4. `src/components/SidebarContent.tsx`: Sidebar drawer component uniting parameters, presets, element controls, and inspectors.
5. `src/App.tsx`: Lean top-level layout wrapper (under 250 lines).

**Tech Stack:** TypeScript, React 18, Vite, Vitest.

## Global Constraints
- File length constraint: **No file in the repository may exceed 500 lines** (target: under 350 lines).
- React lint/typecheck rules: `npm run lint` and `npx tsc --noEmit` must pass cleanly with 0 errors.
- Vitest: `npx vitest run` must pass 100%.

---

### Task 1: Extract Offscreen Canvas Renderer (`canvasRenderer.ts`)

**Files:**
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/utils/canvasRenderer.ts`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/App.tsx`

**Interfaces:**
- Consumes: `LabelElement`, `QrCacheItem`, canvas dimensions.
- Produces: `drawCode128OnCanvas`, `buildOffscreenCanvas`, `buildOffscreenCanvasForJob`.

- [ ] **Step 1: Create `src/utils/canvasRenderer.ts`**

Extract 2D HTML5 canvas rasterization functions (`drawCode128OnCanvas`, `buildOffscreenCanvas`, `buildOffscreenCanvasForJob`).

- [ ] **Step 2: Commit `canvasRenderer.ts`**

```bash
git add src/utils/canvasRenderer.ts
git commit -m "refactor: extract canvasRenderer.ts utility from App.tsx"
```

---

### Task 2: Extract Element Actions Hook (`useElementActions.ts`)

**Files:**
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/hooks/useElementActions.ts`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/App.tsx`

**Interfaces:**
- Consumes: history stack functions, state setters.
- Produces: element factory functions (`addTextElement`, `addQRElement`, `addBarcodeElement`, `addLineElement`, `addRectangleElement`, `handleImageUpload`, `addIconElement`, `handleExportLayout`, `handleImportLayout`, `handleClearCanvas`, `updateSelectedElement`, `updateQRHelper`).

- [ ] **Step 1: Create `src/hooks/useElementActions.ts`**

Extract element factory creation, layout import/export, clear, and inspector property update functions.

- [ ] **Step 2: Commit `useElementActions.ts`**

```bash
git add src/hooks/useElementActions.ts
git commit -m "refactor: extract useElementActions hook from App.tsx"
```

---

### Task 3: Extract Printer Bridge Hook (`usePrinterBridge.ts`)

**Files:**
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/hooks/usePrinterBridge.ts`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/App.tsx`

**Interfaces:**
- Consumes: `buildOffscreenCanvas`, `browserBtDriver`, TSPL converter.
- Produces: Bluetooth & backend print handlers (`handlePrint`, `handleExecuteBatchPrint`, `handleGeneratePreview`, `handleConnectBrowserBt`, `handleDisconnectBrowserBt`).

- [ ] **Step 1: Create `src/hooks/usePrinterBridge.ts`**

Extract print parameters, Bluetooth driver state, single/batch print actions, and preview generator.

- [ ] **Step 2: Commit `usePrinterBridge.ts`**

```bash
git add src/hooks/usePrinterBridge.ts
git commit -m "refactor: extract usePrinterBridge hook from App.tsx"
```

---

### Task 4: Extract SidebarContent Component & Refactor App.tsx

**Files:**
- Create: `Z:/repos/NelkoP21WebPrint/frontend/src/components/SidebarContent.tsx`
- Modify: `Z:/repos/NelkoP21WebPrint/frontend/src/App.tsx`

- [ ] **Step 1: Create `src/components/SidebarContent.tsx`**

Extract left-side drawer component containing `PrintParameters`, `LayoutPresets`, `AddElements`, `IconLibrary`, and `ElementInspector`.

- [ ] **Step 2: Refactor `App.tsx` into a lean layout shell (< 250 lines)**

Import `useElementActions`, `usePrinterBridge`, `SidebarContent`, `Header`, `CanvasWorkspace`, and Modals.

- [ ] **Step 3: Run Verification Suite**

Run: `npm run lint`, `npx tsc --noEmit`, and `npx vitest run` inside `Z:/repos/NelkoP21WebPrint/frontend`. Verify zero errors and all files under 500 lines!

- [ ] **Step 4: Commit Refactored App.tsx**

```bash
git add src/components/SidebarContent.tsx src/App.tsx
git commit -m "refactor: decompose App.tsx under 250 lines into SidebarContent"
```

---

## Verification Plan

### Automated Verification
```bash
# In Z:\repos\NelkoP21WebPrint\frontend:
npm run lint
npx tsc --noEmit
npx vitest run
```

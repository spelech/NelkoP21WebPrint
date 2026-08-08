# Technical Design: Strict TypeScript Conversion & Vitest Suite

**Date:** 2026-08-08  
**Repository:** `NelkoP21WebPrint` (`frontend`)

---

## 1. Overview & Objective
Currently, `NelkoP21WebPrint` frontend uses JavaScript (`.jsx`/`.js`) with loose `checkJs` and lacks automated unit testing. 

This work converts `NelkoP21WebPrint/frontend` to **Strict TypeScript** (`.tsx`/`.ts`), enforces `strict: true` typechecking in `tsconfig.json`, adds standard `"lint": "eslint ."` to `package.json`, and installs **Vitest** to unit test TSPL generator functions, 1-bit rasterization, and helper logic.

---

## 2. Structural & Architectural Plan

### A. TypeScript Type Definitions (`src/types/index.ts`)
Create comprehensive domain model interfaces:
```typescript
export interface LabelPreset {
  name: string;
  width: number;
  height: number;
  gap: number;
}

export type ElementType = 'text' | 'barcode' | 'qr' | 'line' | 'rectangle' | 'image';

export interface BaseElement {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontStyle?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  content: string;
  barcodeType?: string;
}

export interface QRElement extends BaseElement {
  type: 'qr';
  content: string;
  size?: number;
  qrHelperType?: string;
  qrHelperFields?: Record<string, string>;
}

export interface LineElement extends BaseElement {
  type: 'line';
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  thickness?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  iconName?: string;
  imgObject?: HTMLImageElement;
}

export type LabelElement = TextElement | BarcodeElement | QRElement | LineElement | RectangleElement | ImageElement;
```

### B. File Migration & Configuration
1. **Config & Package**:
   - Update `package.json`: Add `"lint": "eslint ."` and `"test": "vitest run"`.
   - Update `tsconfig.json`: Set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, remove `"allowJs": true`.
2. **File Extensions**:
   - `src/App.jsx` -> `src/App.tsx`
   - `src/main.jsx` -> `src/main.tsx`
   - `src/utils/tsplGenerator.js` -> `src/utils/tsplGenerator.ts`
   - `src/utils/webBluetoothDriver.js` -> `src/utils/webBluetoothDriver.ts`
   - `src/utils/mdiIcons.js` -> `src/utils/mdiIcons.ts`
   - All `src/components/*.jsx` -> `src/components/*.tsx`
   - All `src/components/Modals/*.jsx` -> `src/components/Modals/*.tsx`

### C. Vitest Unit Test Suite
Add `vitest` unit test files in `src/utils/__tests__/tsplGenerator.test.ts`:
- Test `mmToDots(mm, dpi)` dot conversions.
- Test `convertCanvasToTsplBytes()` TSPL header construction (`SIZE`, `GAP`, `DIRECTION 0`, `CLS`, `BITMAP`, `PRINT`).
- Test landscape canvas auto-rotation bit mapping.

---

## 3. Verification Plan
- Run `npm run lint` — verify ESLint passes with 0 errors.
- Run `npx tsc --noEmit` — verify TypeScript typechecker passes with `strict: true`.
- Run `npx vitest run` — verify all unit tests pass cleanly.

# Technical Design: Comprehensive Component & Hook Test Suite

**Date:** 2026-08-08  
**Repository:** `NelkoP21WebPrint` (`frontend`)

---

## 1. Overview & Objective
Currently, utility algorithms (`tsplGenerator.ts`, `csvParser.ts`) have ~75-100% coverage, but React custom hooks, Inspector property editors, UI controls, and Modals have low or 0% coverage (bringing overall project coverage to ~14.76%).

This design adds comprehensive unit & component tests using **Vitest** and **React Testing Library** (`@testing-library/react`) for:
1. All custom React hooks (`useHistory`, `useCanvasDrag`, `useIconSearch`, `useTouchZoom`).
2. All Inspector sub-components (`ElementInspector`, `TextInspector`, `BarcodeInspector`, `QRInspector`).
3. All main UI controls (`Header`, `LayoutPresets`, `AddElements`, `PrintParameters`, `IconLibrary`, `SidebarContent`).
4. All Modal dialogs (`SettingsModal`, `WizardModal`, `BatchModal`, `PreviewModal`).

---

## 2. Test Architecture & Directory Structure

```text
src/
├── hooks/
│   └── __tests__/
│       ├── useHistory.test.ts
│       ├── useCanvasDrag.test.ts
│       ├── useIconSearch.test.ts
│       └── useTouchZoom.test.ts
├── components/
│   ├── Inspector/
│   │   └── __tests__/
│   │       ├── ElementInspector.test.tsx
│   │       ├── TextInspector.test.tsx
│   │       ├── BarcodeInspector.test.tsx
│   │       └── QRInspector.test.tsx
│   ├── Modals/
│   │   └── __tests__/
│   │       ├── SettingsModal.test.tsx
│   │       ├── WizardModal.test.tsx
│   │       ├── BatchModal.test.tsx
│   │       └── PreviewModal.test.tsx
│   └── __tests__/
│       ├── Header.test.tsx
│       ├── LayoutPresets.test.tsx
│       ├── AddElements.test.tsx
│       ├── PrintParameters.test.tsx
│       ├── IconLibrary.test.tsx
│       └── SidebarContent.test.tsx
```

---

## 3. Verification Plan
- Run `npm run lint` — verify ESLint passes with 0 errors.
- Run `npx tsc --noEmit` — verify TypeScript typechecker passes with 0 errors.
- Run `npx vitest run --coverage` — verify all test suites pass with 100% success and high statement/function coverage across hooks and components.

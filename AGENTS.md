# Nelko P21 Studio — AI Agent Development Rules

Welcome, Agent. To maintain the codebase integrity and prevent regressions or runtime errors, you **MUST** strictly follow the following rules when modifying or refactoring this repository.

---

## 1. Type Safety & Imports
- **No Global Bypass in Linter**: Do **NOT** add library names or custom variables to the `globals` section in `eslint.config.js` to silence warnings. If a variable or library (e.g. `QRCode`, `browserBtDriver`) is utilized, it **MUST** be explicitly imported at the top of the file.
- **Enforce TypeScript Typechecking**: The codebase utilizes the TypeScript compiler (`tsc`) to typecheck pure JavaScript and JSX files at build time (`allowJs` and `checkJs` options). 
- **Pre-Commit Verification**: Run typechecking and linting locally before staging changes:
  ```bash
  npm run typecheck
  npm run build
  npx eslint src
  ```
  The build script (`npm run build`) is chained to `tsc --noEmit && vite build` and will automatically fail if there are any type mismatches or ReferenceErrors.

---

## 2. Browser Draft APIs
- **Typecasting Draft APIs**: Draft Web Serial and Web Bluetooth APIs (e.g. `navigator.serial`, `navigator.bluetooth`) are not part of standard DOM library declarations in TypeScript. Cast `navigator` to `any` using JSDoc annotations to pass typecheck validations:
  ```javascript
  const nav = /** @type {any} */ (navigator);
  if ('serial' in nav) {
      await nav.serial.requestPort();
  }
  ```

---

## 3. Docker & Deployment Pipeline
- **Immutable Container & Official Images Rule**: 
  - **NEVER** modify running containers in-place (no `docker cp`, live container file replacements, or hot-patching inside the running container).
  - Only deploy using published/built Docker images from GHCR (`docker pull ghcr.io/spelech/nelkop21webprint:latest`) or built locally via Dockerfile (`docker build -t ghcr.io/spelech/nelkop21webprint:latest -f Dockerfile .`).
- **Hardened Docker builds**: The `Dockerfile` compiles assets using `--legacy-peer-deps` to prevent peer version conflicts from failing the build process:
  ```dockerfile
  RUN npm install --legacy-peer-deps
  ```
- **Fast amd64 Pipeline**: GitHub Actions CI builds `linux/amd64` directly (no slow QEMU emulation). You can also build locally on the host server to test or roll out changes immediately:
  ```bash
  docker build -t ghcr.io/spelech/nelkop21webprint:latest -f Dockerfile .
  ```
- **Container Service Name**: The active container runs under the name `nelko-p21-print` in the `/containers/productivity/` docker-compose stack. Re-create and restart using:
  ```bash
  docker compose up -d --force-recreate nelko-p21-print
  ```

---

## 4. Mobile Layout & UX Guidelines
- **Always-Visible Version Badge**: The version badge next to the title `v{appVersion}` must remain `inline-block` so it is visible on mobile and desktop layout headers alike.
- **Iconified Controls**: To prevent mobile title and button squishing, horizontal Undo/Redo buttons must render as compact Lucide icon buttons (`Undo2`, `Redo2`) on screens narrower than `md`.
- **Direct vs Server Toggle**: Ensure the segmented toggle switcher remains functional to let users easily swap between Browser Direct (paired mobile bluetooth) and Server Bridge (TCP 9100) modes.

DEVELOPMENT.md
================

qrcode-extension — Developer Assistant
--------------------------------------

Purpose
- Provide a compact reference for developers working on the qrcode-extension Chrome extension:
  - common scripts and what they do
  - local development and debugging steps
  - build / pack / release workflow
  - docs build and deployment notes
  - quick troubleshooting checklist

Prerequisites
- Node.js >= 14 (project enforces node check via `check-node-version`; using Node 18/20+ recommended)
- Chrome (or Chromium-based browser) for loading unpacked extension

Key scripts (package.json)
- `npm run clean`
  - Reset working tree: `git clean -df && git checkout -- .`

- `npm run check-git`
  - Run `node build/check-git-status.js` to validate git state prior to release/pack.

- `npm run build`
  - Runs `bash ./scripts/bump_version.sh`. This script handles version bump and build/pack steps depending on flags. Inspect `scripts/bump_version.sh` for exact behaviour.

- `npm run build:pack`
  - Pack release artifacts (zip) for distribution. Output under `dist/` (e.g. `dist/qrcode-extension-v1.0.6.zip`).

- `npm run docs:dev`
  - Start VitePress dev server for docs in `docs/`.

- `npm run docs:build`
  - Build static documentation (VitePress). Output directory configured in `.vitepress/config.js` (commonly `dist-docs`).

- `npm run docs:deploy:*`
  - A collection of helper scripts (info/prepare/zip/git/hook/auto) that prepare and optionally push or trigger remote deploy hooks. See `scripts/deploy-docs.js` and `scripts/deploy-hook.sh`.

- `npm run postinstall`
  - Runs node version check (`npm run check-node-version`) after install.

- `npm run check-node-version`
  - Quick inline Node.js version check: abort if Node major version < 14.

Local development — quick guide
1. Install dependencies:
   npm ci

2. Load extension in Chrome (unpacked):
   - Open chrome://extensions
   - Enable "Developer mode"
   - "Load unpacked" → select project root
   - Use the extension icon or right-click menu to trigger QR generation

3. Edit & debug:
   - Content script: `src/content-script.js`
   - Background/service worker: `src/background.js`
   - Popup: `src/popup.html`, `src/popup.js`
   - Styles are injected by `injectStyles()` in `content-script.js`
   - Logs:
     - Content-script logs appear in the page's DevTools console.
     - Background/service worker logs appear in the extension's service worker console (chrome://extensions → Service Worker).

4. Rapid reload:
   - After edits, chrome://extensions → click Reload for the extension.
   - For MV3 background worker, the worker will be restarted on reload.

Build / Pack / Release
1. Ensure working tree clean and commits pushed.
2. Bump version and create package:
   npm run build:pack
   - This calls `bump_version.sh --pack-only` and produces `dist/qrcode-extension-vX.Y.Z.zip`.

3. Publish:
   - Push release commit to remote branch per your workflow.
   - Upload zip to store or release asset as needed.

Docs (VitePress)
- Local dev: `npm run docs:dev`
- Build: `npm run docs:build`
- Deploy: use `scripts/deploy-hook.sh` or the repo-based deployment scripts.
- Make sure EdgeOne/MCP has correct build config (root, build command, output dir), or use the hook method.

Testing checklist
- QR generation:
  - Confirm `qrcode.min.js` is injected prior to generating (background injects it).
  - In target page console: `typeof QRCode` should be defined.
  - Manually call injection helpers if needed to reproduce.

- UI & interactions:
  - Open the floating panel; verify QR renders; test color / padding controls and download.
  - Verify editing URL updates QR (contenteditable behavior).
  - Test on narrow viewports to ensure `.panel-content` scrolling works.

- Download verification:
  - Downloaded PNG should match visible QR including padding and colors.

Troubleshooting (common issues)
- QR always loading / never renders:
  - Check console for errors (e.g. `QRCode` not found or `qrcode.min.js` blocked).
  - Ensure background injected `qrcode.min.js` into the target tab (see `background.js` logic).
  - Check `generateQRCodeWithPadding` image load timeout logic if used.

- Styling / panel overflow:
  - Styles are injected by `injectStyles()`; if panel is clipped in some pages, use `.panel-content` scroll area. Verify `max-height` uses `calc(100vh - X)` suitable for header.

- EdgeOne / MCP 401 Unauthorized on docs deploy:
  - Ensure API token or deploy hook URL is configured in environment accessible to the deployment tool (Cursor MCP may require adding token to `~/.cursor/mcp.json`).

Developer conventions & notes
- Keep UI element ids stable: `qrcode-container`, `url-display`, `color-picker-panel`, etc.
- Persist user settings with `chrome.storage.local` (this repo stores color and padding settings).
- Use defensive DOM cleanup: remove temporary containers used for canvas generation to avoid leaks.
- Add strings to `_locales/*/messages.json` when adding UI text — keep translations in sync.

Files of interest
- `src/content-script.js` — main UI injection & QR generation
- `src/background.js` — context menu + injection logic
- `src/qrcode.min.js` — QR generation library (third-party)
- `scripts/bump_version.sh` — release / pack helper (now reads from `src/`)
- `scripts/deploy-docs.js`, `scripts/deploy-hook.sh` — docs deployment helpers

If you want, I can:
- write this file into the repo and commit it (I can do that now),
- or convert into a VitePress docs page under `docs/` and wire up build/deploy scripts.



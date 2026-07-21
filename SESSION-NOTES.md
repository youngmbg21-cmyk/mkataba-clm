# Session Notes

Reverse-chronological log of autonomous work against the product backlog
(`hati-product-backlog (1).md`). One entry per epic/session.

---

## E0 — Modularize the frontend

**Done**

- **E0-T1** — Extracted the platform core (state, Kenyan template/folder
  constants, seed data, persistence, auth, mode detection, signing seal,
  sharing, export, and the counterparty portal) from `index.html` into
  `js/core.js`, loaded as a native ES module.
- **E0-T2** — Extracted each screen into its own module under `js/views/`:
  `home`, `register` (register + folder), `queue` (pipeline),
  `intelligence` (deal map + portfolio intelligence), `settings`
  (team & settings), `contract` (workspace + inbound uploads), `portal`.
- **E0-T3** — Extracted the remaining shared pieces: `js/components.js`
  (icons + shared contract row), `js/templates.js` (template/folder
  constants + seeds), `js/api.js` (fetch layer), `js/ai.js` (scan rule
  engine + assistant). Added `js/app.js` as the single entry module that
  imports everything in original execution order, then wires nav + boot.
  `index.html` now carries no inline application JS — only
  `<script type="module" src="js/app.js">`.
- **E0-T4** — Documented the static-mode change (below); updated README
  quick-start and architecture sections.

**Design decision — window-attached globals.** The app was written
against a single global scope: inline `onclick=` handlers in generated
HTML and free cross-section function calls. ES modules are lexically
scoped, which would break both. Rather than rewrite every call site into
imports/exports (large, risky, and out of scope for a "zero behaviour
change" task), each extracted module attaches its top-level bindings to
`window`: `let` globals become `window.X`; `const`/`function` bindings
are re-exported with `Object.assign(window, {…})`. Modules therefore give
**per-file editing isolation, not scope isolation** — which is what E0
needs so later epics can work on one area safely. A future cleanup can
migrate hot paths to real imports incrementally.

**Static mode now requires an HTTP server.** ES modules are fetched under
CORS, so opening `index.html` from the filesystem (`file://`) is blocked
by the browser ("Cross origin requests are only supported for protocol
schemes: …http, https…"). Static mode must now be served, e.g.
`python3 -m http.server 8000`. Server mode is unaffected — Express already
serves the files over HTTP. README updated to remove the "or just open
index.html" instruction.

**Tested**

- Rebuilt Tailwind locally (CDN is blocked in the sandbox) and ran the
  21-check Portfolio Intelligence Playwright suite against the split
  build — all pass, no page errors.
- Verified every view renders (dashboard, register, pipeline, team,
  contract workspace) and the counterparty portal entry point is defined;
  the 30-contract sample portfolio still loads.
- Confirmed `file://` now fails with the CORS error above (the documented
  static-mode change), while HTTP serving works.

**Skipped / deferred** — none for E0.

**Definition of Done** — met: app works identically in server mode; all
views render; sample portfolio loads; signing and counterparty share
paths intact (portal module + seal logic untouched).

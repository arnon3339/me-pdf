---
'@embedpdf/plugin-selection': minor
---

Break out imperative selection APIs from **capability** to **plugin**, and slim the capability surface.

- **Removed from `SelectionCapability`:**
  - `getGeometry(page)`
  - `begin(page, glyphIdx)`
  - `update(page, glyphIdx)`
  - `end()`
  - `clear()`
  - `registerSelectionOnPage(opts)`
- Components/hooks now use the **plugin instance** for page-level registration:
  - React: `useSelectionPlugin().plugin.registerSelectionOnPage(...)`
  - Vue: `useSelectionPlugin().plugin.registerSelectionOnPage(...)`
- Capability still provides read/query and events:
  - `getFormattedSelection`, `getFormattedSelectionForPage`
  - `getHighlightRects`, `getHighlightRectsForPage`
  - `getBoundingRects`, `getBoundingRectForPage`
  - `getSelectedText`, `copyToClipboard`
  - `onSelectionChange`, `onTextRetrieved`, `onCopyToClipboard`
  - enable/disable per mode + `getState()`

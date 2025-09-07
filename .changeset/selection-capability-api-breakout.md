---
'@embedpdf/plugin-selection': minor
---

Break out imperative selection APIs from **capability** to **plugin**, and slim the capability surface.

### What changed

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

### Migration

**React (SelectionLayer)**

```diff
-import { useSelectionCapability } from '../hooks';
+import { useSelectionCapability, useSelectionPlugin } from '../hooks';

-const { provides: sel } = useSelectionCapability();
+const { plugin: selPlugin } = useSelectionPlugin();

-useEffect(() => sel?.registerSelectionOnPage({ /* ... */ }), [sel, pageIndex]);
+useEffect(() => selPlugin?.registerSelectionOnPage({ /* ... */ }), [selPlugin, pageIndex]);
```

**Vue (selection-layer.vue)**

```diff
-import { useSelectionCapability } from '../hooks/use-selection';
+import { useSelectionPlugin } from '../hooks/use-selection';

-const { provides: sel } = useSelectionCapability();
+const { plugin: sel } = useSelectionPlugin();

onMounted(() => {
-  const off = sel.value.registerSelectionOnPage({ /* ... */ });
+  const off = sel.value.registerSelectionOnPage({ /* ... */ });
  cleanup = off;
});
```

This clarifies responsibilities: **capability = read/query + events**, **plugin = imperative controls/registration**.

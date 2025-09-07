---
'@embedpdf/plugin-viewport': minor
---

Change `onScrollActivity` payload from `boolean` to structured object and add convenience hooks.

### What changed

- `ViewportCapability.onScrollActivity` now emits a **`ScrollActivity`** object:
  ```ts
  export interface ScrollActivity {
    isSmoothScrolling: boolean;
    isScrolling: boolean;
  }
  ```

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

```

(Previously emitted a single `boolean`.)

* New React hook: `useViewportScrollActivity()` → returns `{ isScrolling, isSmoothScrolling }`.
* New Vue hook: `useViewportScrollActivity()` → returns a ref `{ isScrolling, isSmoothScrolling }`.
* Internals updated to emit whenever either `isScrolling` or `isSmoothScrolling` changes.
```

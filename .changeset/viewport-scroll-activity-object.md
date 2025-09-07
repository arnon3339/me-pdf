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

````

(Previously emitted a single `boolean`.)

* New React hook: `useViewportScrollActivity()` → returns `{ isScrolling, isSmoothScrolling }`.
* New Vue hook: `useViewportScrollActivity()` → returns a ref `{ isScrolling, isSmoothScrolling }`.
* Internals updated to emit whenever either `isScrolling` or `isSmoothScrolling` changes.

### Migration

**Before (boolean):**

```ts
const { provides } = useViewportCapability();
useEffect(() => provides?.onScrollActivity((isScrolling) => {
  // ...
}), [provides]);
```

**After (object):**

```ts
const { provides } = useViewportCapability();
useEffect(() => provides?.onScrollActivity(({ isScrolling, isSmoothScrolling }) => {
  // ...
}), [provides]);
```

**Or use the new hooks:**

* **React**

  ```ts
  const { isScrolling, isSmoothScrolling } = useViewportScrollActivity();
  ```
* **Vue**

  ```ts
  const activity = useViewportScrollActivity();
  // activity.value.isScrolling / activity.value.isSmoothScrolling
  ```
````

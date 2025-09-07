---
'@embedpdf/plugin-scroll': minor
---

Refactor scroller layout API and scroll helpers.

### What changed

- **Moved scroller layout APIs from capability → plugin instance**
  - Removed from `ScrollCapability`:
    - `onScrollerData`
    - `getScrollerLayout`
  - Added to `ScrollPlugin`:
    - `onScrollerData(callback): Unsubscribe`
    - `getScrollerLayout(): ScrollerLayout`
- Exposed `ScrollBehavior` type (`'instant' | 'smooth' | 'auto'`) and plumbed through all scroll helpers.
- Bound capability methods to plugin instance:
  - `scrollToPage`, `scrollToNextPage`, `scrollToPreviousPage` now call internal plugin methods (no behavior change for callers).
- Added auto-jump on first layout:
  - If `initialPage` is set, we now scroll **instantly** to it after layout ready.
- Strategy/base types:
  - `BaseScrollStrategy.getTotalContentSize()` now returns `Size` instead of `{ width; height }`.
  - Page-rect computations now account for horizontal centering within `totalContentSize`.

### Migration (React)

**Before**

```tsx
const { provides: scrollProvides } = useScrollCapability();
const layout = useState(() => scrollProvides?.getScrollerLayout() ?? null);

useEffect(() => {
  if (!scrollProvides) return;
  return scrollProvides.onScrollerData(setLayout);
}, [scrollProvides]);
```

**After**

```tsx
const { plugin: scrollPlugin } = useScrollPlugin();
const [layout, setLayout] = useState(
  () => scrollPlugin?.getScrollerLayout() ?? null,
);

useEffect(() => {
  if (!scrollPlugin) return;
  return scrollPlugin.onScrollerData(setLayout);
}, [scrollPlugin]);
```

> Note: You can continue to use `useScrollCapability()` for scrolling methods (`scrollToPage`, etc.). Only **scroller layout** moved to the plugin instance.

### Migration (Vue)

**Before**

```ts
const { provides: scrollProvides } = useScrollCapability();
layout.value = scrollProvides.value.getScrollerLayout();
const off = scrollProvides.value.onScrollerData((l) => (layout.value = l));
```

**After**

```ts
const { plugin: scrollPlugin } = useScrollPlugin();
layout.value = scrollPlugin.value.getScrollerLayout();
const off = scrollPlugin.value.onScrollerData((l) => (layout.value = l));
```

### Notes

- `ScrollCapability` still exposes:

  - `onLayoutChange`, `onScroll`, `onPageChange`
  - `getCurrentPage`, `getTotalPages`
  - `scrollToPage`, `scrollToNextPage`, `scrollToPreviousPage`
  - `getMetrics`, `getLayout`, `getRectPositionForPage`, `getPageGap`

- New `Unsubscribe` type is used for `onScrollerData`.

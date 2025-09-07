---
'@embedpdf/plugin-scroll': minor
---

Refactor scroller layout API and scroll helpers.

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

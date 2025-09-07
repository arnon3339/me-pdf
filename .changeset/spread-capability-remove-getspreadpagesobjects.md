---
'@embedpdf/plugin-spread': minor
---

Streamlined `SpreadCapability` and simplified Vue hook behavior.

### What changed

- Removed `getSpreadPagesObjects(pages: PdfPageObject[]): PdfPageObject[][]` from `SpreadCapability`.
  - Spread grouping is now an internal concern of the spread plugin/strategies.
- Vue `useSpread` hook refactor:
  - Replaced `watchEffect`/manual unsubscription with a `watch(provides, …, { immediate: true })` pattern that:
    - Initializes `spreadMode` from `provides.getSpreadMode()`.
    - Subscribes via `provides.onSpreadChange`, auto-cleaning the subscription.

---
'@embedpdf/utils': patch
---

Removed preventDefault() from pointer and touch event handlers in CounterRotateContainer to ensure buttons remain functional on mobile and tablet devices. Now only stopPropagation() is used to prevent event propagation without interfering with native click generation.

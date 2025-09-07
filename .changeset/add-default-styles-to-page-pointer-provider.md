---
'@embedpdf/plugin-interaction-manager': minor
---

Simplified usage of `PagePointerProvider`:

- Added default `position: relative`, `width`, and `height` styles to the React and Vue implementations of `PagePointerProvider`. Consumers no longer need to manually set these.
- Ensures consistent sizing based on `pageWidth` and `pageHeight`.

This makes integration easier and reduces boilerplate when embedding the pointer provider.

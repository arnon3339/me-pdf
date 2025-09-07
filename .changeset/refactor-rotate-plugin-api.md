---
'@embedpdf/plugin-rotate': minor
---

Refactored rotate plugin API and utilities:

- Moved `getNextRotation`, `getPreviousRotation`, and rotation matrix helpers into `utils`.
- Split matrix helpers into:
  - **`getRotationMatrix`** → returns the numeric 6-tuple.
  - **`getRotationMatrixString`** → returns a CSS `matrix(...)` string.
- `RotateCapability.onRotateChange` is now typed as an **`EventHook<Rotation>`**.
- Added **`getMatrixAsString`** method to `RotatePlugin` for CSS transforms.
- Updated React (`Rotate` component + hook) and Vue (`rotate.vue` + hook) to use `useRotatePlugin` and the new API.
- Added new `useRotate` hooks (React + Vue) for reactive rotation state.

These changes make the rotate plugin API more consistent, typed, and ergonomic across frameworks.

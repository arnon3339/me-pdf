---
'@embedpdf/core': patch
---

refactor(svelte): Update Svelte hooks (`useCapability`, `useCoreState`, `usePlugin`) to return reactive `$state` objects instead of computed getters for better integration with Svelte 5's reactivity model.

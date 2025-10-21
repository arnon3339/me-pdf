---
'@embedpdf/core': minor
'@embedpdf/engines': minor
'@embedpdf/models': minor
'@embedpdf/plugin-export': minor
'@embedpdf/plugin-fullscreen': minor
'@embedpdf/plugin-interaction-manager': minor
'@embedpdf/plugin-loader': minor
'@embedpdf/plugin-pan': minor
'@embedpdf/plugin-print': minor
'@embedpdf/plugin-render': minor
'@embedpdf/plugin-rotate': minor
'@embedpdf/plugin-scroll': minor
'@embedpdf/plugin-search': minor
'@embedpdf/plugin-selection': minor
'@embedpdf/plugin-spread': minor
'@embedpdf/plugin-thumbnail': minor
'@embedpdf/plugin-tiling': minor
'@embedpdf/plugin-viewport': minor
'@embedpdf/plugin-zoom': minor
'@embedpdf/pdfium': minor
'@embedpdf/utils': minor
---

feat: Add Svelte 5 framework adapter and example project

This change introduces support for Svelte 5 as a first-class framework adapter.

**Key Changes:**

- **New Svelte Adapters:** Added framework-specific exports for `@embedpdf/core`, `@embedpdf/engines`, and all plugins under the `/svelte` path (e.g., `@embedpdf/plugin-zoom/svelte`). These leverage Svelte 5 Runes for reactivity.
- **New Example Project:** Created a new example project `examples/svelte-tailwind` demonstrating how to build a PDF viewer UI using EmbedPDF, Svelte 5, and Tailwind CSS. Includes components for toolbar, sidebar (thumbnails), search pane, page controls, zoom controls, print dialog, etc.
- **Build System Updates:** Updated `packages/build` to handle Svelte compilation (`.svelte` files) and generate accurate TypeScript declaration files (`.d.ts`) using `svelte2tsx`.
- **Core Store Enhancement:** Implemented protection against dispatching actions from within reducers to prevent unexpected side effects, similar to Redux.
- **Removed Mock Engine:** The `@embedpdf/engines/mock` export has been removed.
- **Configuration Updates:** Updated root `.gitignore`, `.prettierignore`, `.prettierrc.js`, and `package.json` to accommodate Svelte files and dependencies (`prettier-plugin-svelte`).

A special thanks to @andrewrisse for his significant contributions to this Svelte release!

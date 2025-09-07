---
'@embedpdf/plugin-render': minor
---

Add `scale` prop and deprecate `scaleFactor` in `RenderLayer` (React & Vue).

- New `scale` prop is now the preferred way to control render scale.
- `scaleFactor` remains supported but is **deprecated** and will be removed in the next major release.
- Internally both implementations resolve `actualScale = scale ?? scaleFactor ?? 1` and pass it to the renderer.

**Migration**

- Replace `scaleFactor={x}` with `scale={x}` (React).
- Replace `:scale-factor="x"` with `:scale="x"` (Vue).

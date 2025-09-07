---
'@embedpdf/plugin-print': patch
---

Improved `PrintPlugin` flexibility:

- `print` method now accepts **optional** `PdfPrintOptions`. If none are provided, it falls back to default options.
- Updated `PrintCapability` type accordingly (`print(options?: PdfPrintOptions)`).
- Removed the hard requirement on `"render"` from the plugin manifest, simplifying dependency setup.

This makes the print plugin easier to use in scenarios where no explicit options are needed.

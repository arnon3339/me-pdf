---
'@embedpdf/core': minor
---

Refactored action dispatch handling in `BasePlugin`:

- Renamed `debouncedDispatch` to **`cooldownDispatch`**, which now executes immediately if the cooldown has expired and blocks rapid repeated calls.
- Introduced a new **`debouncedDispatch`** method that provides true debouncing: waits until no calls occur for the specified time before dispatching.
- Added **`cancelDebouncedDispatch`** to cancel pending debounced actions.
- Added internal `debouncedTimeouts` tracking and ensured all timeouts are cleared on `destroy`.

This improves clarity and provides both cooldown and debounce semantics for action dispatching.

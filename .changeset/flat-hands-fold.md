---
'@embedpdf/plugin-interaction-manager': patch
'@embedpdf/plugin-selection': patch
'@embedpdf/plugin-render': patch
'@embedpdf/plugin-scroll': patch
---

Some small bugfixes, in some cases interactionmanager state can be null and gives error on fast reload, add get state to selection manager for debugging purposes and make @embedpdf/model a dependency of scroll to make sure it doesn't get add inline inside the component

import { useCapability } from "@embedpdf/core/preact";
import { UIPlugin } from "@embedpdf/plugin-ui";

export const useUI = () => useCapability<UIPlugin>('ui');

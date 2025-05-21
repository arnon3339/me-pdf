import { useCapability, usePlugin } from "@embedpdf/core/preact";
import { SelectionPlugin } from "@embedpdf/plugin-selection";

export const useSelectionCapability = () => useCapability<SelectionPlugin>(SelectionPlugin.id);
export const useSelection = () => usePlugin<SelectionPlugin>(SelectionPlugin.id);
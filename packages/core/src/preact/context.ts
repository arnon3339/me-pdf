import { createContext } from "preact";
import type { PluginRegistry } from "@embedpdf/core";

export interface PDFContextState {
  registry: PluginRegistry | null;
  isInitializing: boolean;
}

export const PDFContext = createContext<PDFContextState>({ 
  registry: null, 
  isInitializing: true 
}); 
import { createContext } from "react";
import type { PluginRegistry } from "@embedpdf/core";

export const ViewportContext = createContext<{ setViewportRef: (ref: HTMLDivElement) => void } | null>(null);

export interface PDFContextState {
  registry: PluginRegistry | null;
  isInitializing: boolean;
}

export const PDFContext = createContext<PDFContextState>({ 
  registry: null, 
  isInitializing: true 
}); 
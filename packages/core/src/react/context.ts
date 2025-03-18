import { createContext } from "react";
import type { PluginRegistry } from "@embedpdf/core";

export const ViewportContext = createContext<{ setViewportRef: (ref: HTMLDivElement) => void } | null>(null);
export const PDFContext = createContext<PluginRegistry | null>(null);
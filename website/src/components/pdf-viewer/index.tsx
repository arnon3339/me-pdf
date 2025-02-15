'use client'

import { PDFCore } from "@embedpdf/core";
import { PDFCoreProvider } from "@embedpdf/core/react";
import { NavigationPlugin } from "@embedpdf/plugin-navigation";
import { NavigationProvider } from '@embedpdf/plugin-navigation/react';
import { PdfiumEngine } from "@embedpdf/engines";
import pdfiumWasm from "@embedpdf/pdfium/pdfium.wasm?url";
import { init } from "@embedpdf/pdfium";
import { useMemo, useState, useEffect } from "react";

// Move WASM initialization to a singleton
let engineInstance: PdfiumEngine | null = null;

async function initializeEngine() {
  if (engineInstance) return engineInstance;
  
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await init({ wasmBinary });
  engineInstance = new PdfiumEngine(wasmModule);
  return engineInstance;
}

export default function PDFViewer() {
  const [core, setCore] = useState<PDFCore | null>(null);

  useEffect(() => {
    initializeEngine()
      .then(engine => {
        setCore(new PDFCore({ engine }));
      });
  }, []);

  const navigationPlugin = useMemo(() => new NavigationPlugin({
    initialPage: 1,
    defaultZoomLevel: 1,
    defaultScrollMode: 'continuous',
  }), []);

  if (!core) return <div>Loading...</div>;

  return (
    <PDFCoreProvider core={core}>
      <NavigationProvider navigationPlugin={navigationPlugin}>
        <div>PDFViewer</div>
      </NavigationProvider>
    </PDFCoreProvider>
  );
}

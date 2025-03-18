import React, { useState, useEffect } from 'react';
import { PdfEngine } from '@embedpdf/models';
import { PluginRegistry } from '@embedpdf/core';
import type { IPlugin, PluginBatchRegistration } from '@embedpdf/core';
import { ViewportContext, PDFContext } from '../context';

interface EmbedPDFProps {
  engine: PdfEngine;
  onInitialized: (registry: PluginRegistry) => Promise<void>
  plugins: (viewportElement: HTMLDivElement) => PluginBatchRegistration<IPlugin, unknown>[]
  children: React.ReactNode;
}

export function EmbedPDF({ engine, onInitialized, plugins: getPlugins, children }: EmbedPDFProps) {
  const [registry, setRegistry] = useState<PluginRegistry | null>(null);
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportElement) return; // Wait until the viewport ref is set

    const initialize = async () => {
      const pdfViewer = new PluginRegistry(engine); 

      // Register the ViewportPlugin with the container
      const plugins = getPlugins(viewportElement)
      pdfViewer.registerPluginBatch(plugins);

      // Register additional plugins passed via props
      plugins.forEach(({ package: pkg, config }) => pdfViewer.registerPlugin(pkg, config));

      // Initialize the viewer and load the document
      await pdfViewer.initialize();
      await onInitialized(pdfViewer);

      // Provide the registry to children via context
      setRegistry(pdfViewer);
    };

    initialize().catch(console.error);
  }, [engine, onInitialized, getPlugins, viewportElement]);

  const viewportContextValue = {
    setViewportRef: (ref: HTMLDivElement) => setViewportElement(ref),
  };

  return (
    <ViewportContext.Provider value={viewportContextValue}>
      <PDFContext.Provider value={registry}>
        {children}
      </PDFContext.Provider>
    </ViewportContext.Provider>
  );
}
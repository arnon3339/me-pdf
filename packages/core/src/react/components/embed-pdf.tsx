import React, { useState, useEffect } from 'react';
import { PdfEngine } from '@embedpdf/models';
import { PluginRegistry } from '@embedpdf/core';
import type { IPlugin, PluginBatchRegistration } from '@embedpdf/core';
import { PDFContext, PDFContextState } from '../context';

interface EmbedPDFProps {
  engine: PdfEngine;
  onInitialized: (registry: PluginRegistry) => Promise<void>;
  plugins: PluginBatchRegistration<IPlugin<any>, any>[];
  children: React.ReactNode | ((state: PDFContextState) => React.ReactNode);
}

export function EmbedPDF({ engine, onInitialized, plugins, children }: EmbedPDFProps) {
  const [registry, setRegistry] = useState<PluginRegistry | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [pluginsReady, setPluginsReady] = useState<boolean>(false);

  useEffect(() => {
    console.log('useEffect', engine, onInitialized, plugins);
    const initialize = async () => {
      const pdfViewer = new PluginRegistry(engine);

      // Register the ViewportPlugin with the container
      pdfViewer.registerPluginBatch(plugins);

      // Initialize the viewer and load the document
      await pdfViewer.initialize();
      await onInitialized(pdfViewer);
      pdfViewer.pluginsReady().then(() => setPluginsReady(true));

      // Provide the registry to children via context
      setRegistry(pdfViewer);
      setIsInitializing(false);
    };

    initialize().catch(console.error);
  }, [engine, onInitialized, plugins]);

  console.log('registry', registry);
  console.log('isInitializing', isInitializing);
  console.log('pluginsReady', pluginsReady);

  return (
    <PDFContext.Provider value={{ registry, isInitializing, pluginsReady }}>
      {typeof children === 'function'
        ? children({ registry, isInitializing, pluginsReady })
        : children}
    </PDFContext.Provider>
  );
}

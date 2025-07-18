import React, { useState, useEffect, useRef } from 'react';
import { PdfEngine } from '@embedpdf/models';
import { PluginRegistry } from '@embedpdf/core';
import type { IPlugin, PluginBatchRegistration } from '@embedpdf/core';

import { PDFContext, PDFContextState } from '../context';

interface EmbedPDFProps {
  engine: PdfEngine;
  onInitialized?: (registry: PluginRegistry) => Promise<void>;
  plugins: PluginBatchRegistration<IPlugin<any>, any>[];
  children: React.ReactNode | ((state: PDFContextState) => React.ReactNode);
}

export function EmbedPDF({ engine, onInitialized, plugins, children }: EmbedPDFProps) {
  const [registry, setRegistry] = useState<PluginRegistry | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [pluginsReady, setPluginsReady] = useState<boolean>(false);
  const initRef = useRef<EmbedPDFProps['onInitialized']>(onInitialized);

  useEffect(() => {
    initRef.current = onInitialized; // update without triggering re-runs
  }, [onInitialized]);

  useEffect(() => {
    const pdfViewer = new PluginRegistry(engine);
    pdfViewer.registerPluginBatch(plugins);

    const initialize = async () => {
      await pdfViewer.initialize();
      // if the registry is destroyed, don't do anything
      if (pdfViewer.isDestroyed()) {
        return;
      }

      /* always call the *latest* callback */
      await initRef.current?.(pdfViewer);

      // if the registry is destroyed, don't do anything
      if (pdfViewer.isDestroyed()) {
        return;
      }

      pdfViewer.pluginsReady().then(() => {
        if (!pdfViewer.isDestroyed()) {
          setPluginsReady(true);
        }
      });

      // Provide the registry to children via context
      setRegistry(pdfViewer);
      setIsInitializing(false);
    };

    initialize().catch(console.error);

    return () => {
      pdfViewer.destroy();
      setRegistry(null);
      setIsInitializing(true);
      setPluginsReady(false);
    };
  }, [engine, plugins]);

  return (
    <PDFContext.Provider value={{ registry, isInitializing, pluginsReady }}>
      {typeof children === 'function'
        ? children({ registry, isInitializing, pluginsReady })
        : children}
    </PDFContext.Provider>
  );
}

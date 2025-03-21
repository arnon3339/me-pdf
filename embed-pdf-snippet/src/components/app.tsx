import React, { useState, useEffect } from 'preact/compat';
import { h, render } from 'preact';
import { EmbedPDF, Viewport } from '@embedpdf/core/react';
import { createPluginRegistration } from '@embedpdf/core';
import { PdfiumEngine } from '@embedpdf/engines';
import { init as initPdfium } from '@embedpdf/pdfium';
import { PdfEngine } from '@embedpdf/models';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import { SpreadMode, SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { LayerPluginPackage, createLayerRegistration } from '@embedpdf/plugin-layer';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { RenderLayerPackage } from '@embedpdf/layer-render';
import { ZoomPluginPackage, ZoomMode } from '@embedpdf/plugin-zoom';

// **Configuration Interface**
interface PDFViewerConfig {
  src: string;
  scrollStrategy?: 'vertical' | 'horizontal';
  zoomMode?: 'fitPage' | 'fitWidth';
}

// **Singleton Engine Instance**
let engineInstance: PdfEngine | null = null;

// **Initialize the Pdfium Engine**
async function initializeEngine(): Promise<PdfEngine> {
  if (engineInstance) return engineInstance;

  const response = await fetch('/wasm/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await initPdfium({ wasmBinary });
  engineInstance = new PdfiumEngine(wasmModule);
  return engineInstance;
}

// **Props for the PDFViewer Component**
interface PDFViewerProps {
  config: PDFViewerConfig;
}

export function PDFViewer({ config }: PDFViewerProps) {
  const [engine, setEngine] = useState<PdfEngine | null>(null);

  useEffect(() => {
    initializeEngine().then(setEngine);
  }, []);

  if (!engine) return <div>Loading...</div>;

  // Map config values to plugin settings
  const scrollStrategy = config.scrollStrategy === 'horizontal' ? ScrollStrategy.Horizontal : ScrollStrategy.Vertical;
  const zoomMode = config.zoomMode === 'fitWidth' ? ZoomMode.FitWidth : ZoomMode.FitPage;

  return (
    <EmbedPDF
      engine={engine}
      plugins={(viewportElement: HTMLElement) => [
        createPluginRegistration(LoaderPluginPackage, {
          loadingOptions: { source: config.src, id: 'pdf' },
        }),
        createPluginRegistration(ViewportPluginPackage, {
          container: viewportElement,
          viewportGap: 10,
        }),
        createPluginRegistration(ScrollPluginPackage, {
          strategy: scrollStrategy,
        }),
        createPluginRegistration(PageManagerPluginPackage, { pageGap: 10 }),
        createPluginRegistration(SpreadPluginPackage, { defaultSpreadMode: SpreadMode.None }),
        createPluginRegistration(ZoomPluginPackage, {
          defaultZoomLevel: zoomMode,
        }),
        createPluginRegistration(LayerPluginPackage, {
          layers: [createLayerRegistration(RenderLayerPackage, { maxScale: 2 })],
        }),
      ]}
    >
      <Viewport style={{ width: '100%', height: '100%' }} />
    </EmbedPDF>
  );
}
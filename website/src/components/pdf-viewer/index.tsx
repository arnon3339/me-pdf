'use client'

import React, { useMemo, useState, useEffect } from "react";
import { EmbedPDF, Viewport} from "@embedpdf/core/react";
import { createPluginRegistration } from '@embedpdf/core';
import { PdfiumEngine } from "@embedpdf/engines";
import { init } from "@embedpdf/pdfium";
import { PdfEngine } from "@embedpdf/models";
import { ViewportPluginPackage } from "@embedpdf/plugin-viewport";
import { ScrollPluginPackage, ScrollStrategy } from "@embedpdf/plugin-scroll";
import { PageManagerPluginPackage } from "@embedpdf/plugin-page-manager";
import { SpreadMode, SpreadPluginPackage } from "@embedpdf/plugin-spread";
import { LayerPluginPackage, createLayerRegistration } from "@embedpdf/plugin-layer";
import { LoaderPlugin, LoaderPluginPackage } from "@embedpdf/plugin-loader";
import { RenderLayerPackage } from "@embedpdf/layer-render";
import { ZoomPluginPackage, ZoomMode, ZoomPlugin } from "@embedpdf/plugin-zoom";

let engineInstance: PdfiumEngine | null = null;

async function initializeEngine() {
  if (engineInstance) return engineInstance;

  const response = await fetch('/wasm/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();

  const wasmModule = await init({ wasmBinary });
  const engine = new PdfiumEngine(wasmModule);

  return engine;
}

export default function PDFViewer() {
  const [engine, setEngine] = useState<PdfEngine | null>(null);

  useEffect(() => {
    initializeEngine()
      .then(setEngine);
  }, []);

  if (!engine) return <div>Loading...</div>;

  return (
    <EmbedPDF 
      engine={engine} 
      onInitialized={async (registry) => {

      }} 
      plugins={(viewportElement) => [
        createPluginRegistration(LoaderPluginPackage, {
          loadingOptions: {
            source: '/demo.pdf',
            id: 'demo'
          }
        }),
        createPluginRegistration(ViewportPluginPackage, { 
          container: viewportElement, 
          viewportGap: 10
        }),
        createPluginRegistration(ScrollPluginPackage, {
          strategy: ScrollStrategy.Vertical
        }),
        createPluginRegistration(PageManagerPluginPackage, {
          pageGap: 10
        }),
        createPluginRegistration(SpreadPluginPackage, {
          defaultSpreadMode: SpreadMode.None
        }),
        createPluginRegistration(LayerPluginPackage, {
          layers: [
            createLayerRegistration(RenderLayerPackage, {
              maxScale: 2
            })
          ]
        })
      ]}
    >
      <Viewport style={{ width: '100%', height: '500px' }} />
    </EmbedPDF>
  )
}
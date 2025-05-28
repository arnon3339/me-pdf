import { PdfiumEngine, WebWorkerEngine } from '@embedpdf/engines';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { init } from '@embedpdf/pdfium';
import {
  ZoomCapability,
  ZoomLevel,
  ZoomMode,
  ZoomPlugin,
  ZoomPluginPackage,
} from '@embedpdf/plugin-zoom';
import { PluginPackage, PluginRegistry, createPluginRegistration } from '@embedpdf/core';
import { LoaderPlugin, LoaderPluginPackage } from '@embedpdf/plugin-loader';
import {
  ViewportPlugin,
  ViewportPluginConfig,
  ViewportPluginPackage,
} from '@embedpdf/plugin-viewport';
import {
  ScrollPluginPackage,
  ScrollCapability,
  ScrollPlugin,
  ScrollStrategy,
} from '@embedpdf/plugin-scroll';
import {
  SpreadCapability,
  SpreadMode,
  SpreadPlugin,
  SpreadPluginPackage,
} from '@embedpdf/plugin-spread';
import { SearchPluginPackage, SearchPlugin, SearchCapability } from '@embedpdf/plugin-search';
import {
  AllLogger,
  ConsoleLogger,
  Logger,
  PerfLogger,
  Rotation,
  MatchFlag,
  SearchResult,
} from '@embedpdf/models';

async function loadWasmBinary() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  return wasmBinary;
}

async function initializePDFViewer() {
  // Initialize engine

  const consoleLogger = new ConsoleLogger();
  const perfLogger = new PerfLogger();
  const logger = new AllLogger([consoleLogger, perfLogger]);

  const worker = new Worker(new URL('./webworker.ts', import.meta.url), {
    type: 'module',
  });
  const engine = new WebWorkerEngine(worker, logger);

  const pdf = await fetch('/file/compressed.tracemonkey-pldi-09.pdf');
  const source = await pdf.arrayBuffer();

  const registry = new PluginRegistry(engine);

  registry.registerPlugin(LoaderPluginPackage, {
    loadingOptions: {
      type: 'url',
      pdfFile: {
        id: '1',
        url: '/file/compressed.tracemonkey-pldi-09.pdf',
      },
    },
  });
  registry.registerPlugin(ViewportPluginPackage, {});
  registry.registerPlugin(ZoomPluginPackage, {
    defaultZoomLevel: ZoomMode.Automatic,
  });
  registry.registerPlugin(SpreadPluginPackage, {
    defaultSpreadMode: SpreadMode.None,
  });
  registry.registerPlugin(ScrollPluginPackage, {
    bufferSize: 2,
    strategy: ScrollStrategy.Vertical,
  });
  registry.registerPlugin(SearchPluginPackage);

  await registry.initialize();

  const loader = registry.getPlugin<LoaderPlugin>('loader')!.provides();
  const spread = registry.getPlugin<SpreadPlugin>('spread')!.provides();
  const zoom = registry.getPlugin<ZoomPlugin>('zoom')!.provides();
  const scroll = registry.getPlugin<ScrollPlugin>('scroll')!.provides();
  const search = registry.getPlugin<SearchPlugin>('search')!.provides();

  const pdfDocument = loader.getDocument();

  if (!pdfDocument) {
    throw new Error('PDF document not loaded');
  }

  const totalPages = pdfDocument.pageCount;
}

initializePDFViewer();

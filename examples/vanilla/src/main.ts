import { PdfiumEngine, WebWorkerEngine } from '@embedpdf/engines';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { init } from '@embedpdf/pdfium';
import { LayerPlugin, LayerPluginPackage } from '@embedpdf/plugin-layer';
import { ZoomCapability, ZoomLevel, ZoomPlugin, ZoomPluginPackage } from '@embedpdf/plugin-zoom';
import { PluginRegistry } from '@embedpdf/core';
import { LoaderPlugin, LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage, ScrollCapability, ScrollPlugin } from '@embedpdf/plugin-scroll';
import { SpreadCapability, SpreadMode, SpreadPlugin, SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { TextLayerPackage } from '@embedpdf/layer-text';
import { RenderLayerPackage } from '@embedpdf/layer-render';
import { PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import {
  AllLogger,
  ConsoleLogger,
  Logger,
  PerfLogger
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

  const registry = new PluginRegistry(engine);

  registry.registerPlugin(LoaderPluginPackage);
  registry.registerPlugin(ViewportPluginPackage, {
    container: document.getElementById('pageContainer') as HTMLElement
  });
  registry.registerPlugin(PageManagerPluginPackage, {
    pageGap: 10
  });
  registry.registerPlugin(ZoomPluginPackage, {
    defaultZoomLevel: 1
  });
  registry.registerPlugin(SpreadPluginPackage, {
    defaultSpreadMode: SpreadMode.None
  });
  registry.registerPlugin(ScrollPluginPackage);
  registry.registerPlugin(LayerPluginPackage, {
    layers: [
      { package: TextLayerPackage },
      { package: RenderLayerPackage, config: { maxScale: 2 } }
    ]
  });

  await registry.initialize();

  const loader = registry.getPlugin<LoaderPlugin>('loader').provides();
  const spread = registry.getPlugin<SpreadPlugin>('spread').provides();
  const layer = registry.getPlugin<LayerPlugin>('layer').provides();
  const zoom = registry.getPlugin<ZoomPlugin>('zoom').provides();
  const scroll = registry.getPlugin<ScrollPlugin>('scroll').provides();

  const pdf = await fetch('/file/compressed.tracemonkey-pldi-09.pdf');
  const source = await pdf.arrayBuffer();

  const pdfDocument = await loader.loadDocument({
    id: '1',
    source
  });

  const totalPages = pdfDocument.pageCount;
  updatePageInfo(1, totalPages);

  scroll.onPageChange((pageNumber) => {
    updatePageInfo(pageNumber, totalPages);
  });

  setupUIControls(spread, zoom, scroll);
}

function setupUIControls(spread: SpreadCapability, zoom: ZoomCapability, scroll: ScrollCapability) {
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
  const zoomSelect = document.getElementById('zoomLevel') as HTMLSelectElement;
  const spreadSelect = document.getElementById('spreadMode') as HTMLSelectElement;

  spreadSelect.addEventListener('change', async () => {
    const newSpreadMode = spreadSelect.value as SpreadMode;
    spread.setSpreadMode(newSpreadMode);
  });

  prevButton.addEventListener('click', async () => {
    await scroll.scrollToPreviousPage();
  });

  nextButton.addEventListener('click', async () => {
    await scroll.scrollToNextPage();
  });

  // Set initial zoom level
  zoomSelect.value = zoom.getState().zoomLevel.toString();

  zoomSelect.addEventListener('change', async () => {
    const newZoom = isNaN(parseFloat(zoomSelect.value)) ? zoomSelect.value : parseFloat(zoomSelect.value);
    await zoom.updateZoomLevel(newZoom as ZoomLevel);
  });
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

initializePDFViewer();
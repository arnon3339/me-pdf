import { PDFCore } from '@embedpdf/core';
import { NavigationPlugin, ViewportRenderLayer, ZoomLevel } from '@embedpdf/plugin-navigation';
import { PdfiumEngine } from '../../../packages/engines/src/pdfium/engine';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { init } from '@embedpdf/pdfium';
import { RendererPlugin } from '@embedpdf/plugin-renderer';
import { LayerPlugin, TextLayer } from '@embedpdf/plugin-layer';

async function loadWasmBinary() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  return wasmBinary;
}

async function initializePDFViewer() {
  // Initialize engine

  const wasmBinary = await loadWasmBinary();
  const wasmModule = await init({ wasmBinary });
  const engine = new PdfiumEngine(wasmModule); 

  const core = new PDFCore({
    engine
  });

  // Initialize and register renderer plugin
  const rendererPlugin = new RendererPlugin();
  await core.registerPlugin(rendererPlugin);

  // Initialize layer plugin
  const layerPlugin = new LayerPlugin();
  await core.registerPlugin(layerPlugin);

  // Register default layers
  await layerPlugin.registerLayer(new TextLayer());
  await layerPlugin.registerLayer(new ViewportRenderLayer());

  // Initialize and register navigation plugin
  const navigationPlugin = new NavigationPlugin({
    initialPage: 4,
    defaultZoomLevel: 1,
    defaultScrollMode: 'continuous',
    container: document.getElementById('pageContainer') as HTMLElement
  });

  await core.registerPlugin(navigationPlugin);

  const pdfDocument = await core.loadDocument({
    file: {
      id: '1',
      name: 'linearized.pdf',
    },
    source: '/file/compressed.tracemonkey-pldi-09.pdf',
    password: ''
  });

  updatePageInfo(1, pdfDocument.pageCount);

  // Listen to navigation events
  core.on('navigation:pageChanged', (pageNumber) => {
    console.log(`Page changed to ${pageNumber}`);
    updatePageInfo(pageNumber, navigationPlugin.getState().totalPages);
  });

  // Set up UI controls
  setupUIControls(navigationPlugin);
}

function setupUIControls(navigationPlugin: NavigationPlugin) {
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
  const zoomSelect = document.getElementById('zoomLevel') as HTMLSelectElement;

  // Set initial zoom level
  zoomSelect.value = navigationPlugin.getState().zoomLevel.toString();

  prevButton.addEventListener('click', async () => {
    const { currentPage } = navigationPlugin.getState();
    if (currentPage > 1) {
      await navigationPlugin.goToPage(currentPage - 1);
    }
  });

  nextButton.addEventListener('click', async () => {
    const { currentPage, totalPages } = navigationPlugin.getState();
    if (currentPage < totalPages) {
      await navigationPlugin.goToPage(currentPage + 1);
    }
  });

  // Add zoom level change handler
  zoomSelect.addEventListener('change', async () => {
    const newZoom = isNaN(parseFloat(zoomSelect.value)) ? zoomSelect.value : parseFloat(zoomSelect.value);
    await navigationPlugin.updateZoomLevel(newZoom as ZoomLevel);
  });
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

initializePDFViewer();
import { PDFCore } from '@cloudpdf/core';
import { ConsoleLogger } from '@cloudpdf/models';
import { NavigationPlugin } from '@cloudpdf/plugin-navigation';
import { PdfiumEngine } from '../../../packages/engines/src/pdfium/engine';
import pdfiumWasm from '@cloudpdf/pdfium/pdfium.wasm?url';
import { init } from '@cloudpdf/pdfium';
import { RendererPlugin } from '@cloudpdf/plugin-renderer';

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

  // Initialize and register navigation plugin
  const navigationPlugin = new NavigationPlugin({
    initialPage: 1,
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

  const canvas = document.getElementById('pageCanvas') as HTMLCanvasElement;
  await rendererPlugin.renderPage(pdfDocument.pages[0], canvas, {
    scale: 1
  });

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
    const newZoom = parseFloat(zoomSelect.value);
    await navigationPlugin.updateZoomLevel(newZoom);
  });
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

initializePDFViewer();
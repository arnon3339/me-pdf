import { PDFCore } from '@cloudpdf/core';
import { ConsoleLogger } from '@cloudpdf/models';
import { NavigationPlugin } from '@cloudpdf/plugin-navigation';
import { PdfiumEngine } from '../../../packages/engines/src/pdfium/engine';
import pdfiumWasm from '@cloudpdf/pdfium/pdfium.wasm?url';
import { init } from '@cloudpdf/pdfium';

async function loadWasmBinary() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  return wasmBinary;
}

async function initializePDFViewer() {
  // Initialize engine

  const wasmBinary = await loadWasmBinary();
  const wasmModule = await init({ wasmBinary });
  const engine = new PdfiumEngine(wasmModule, new ConsoleLogger()); 

  const core = new PDFCore({
    engine
  });

  await core.loadDocumentByUrl('/file/linearized.pdf');
  
  // Initialize and register navigation plugin
  const navigationPlugin = new NavigationPlugin({
    initialPage: 1,
    defaultScrollMode: 'vertical'
  });
  
  await core.registerPlugin(navigationPlugin);

  // Listen to navigation events
  core.on('navigation:pageChanged', ({ pageNumber }) => {
    console.log(`Page changed to ${pageNumber}`);
    updatePageInfo(pageNumber, navigationPlugin.getState().totalPages);
  });

  // Set up UI controls
  setupUIControls(navigationPlugin);
}

function setupUIControls(navigationPlugin: NavigationPlugin) {
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;

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
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

initializePDFViewer();
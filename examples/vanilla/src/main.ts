import { PDFEngine } from '@cloudpdf/core';
import { NavigationPlugin } from '@cloudpdf/plugin-navigation';

async function initializePDFViewer() {
  // Initialize engine
  const engine = new PDFEngine();
  
  // Initialize and register navigation plugin
  const navigationPlugin = new NavigationPlugin({
    initialPage: 1,
    defaultScrollMode: 'vertical'
  });
  
  await engine.registerPlugin(navigationPlugin);

  // Listen to navigation events
  engine.on('navigation:pageChanged', ({ pageNumber }) => {
    console.log(`Page changed to ${pageNumber}`);
    updatePageInfo(pageNumber, navigationPlugin.getState().totalPages);
  });

  // Load sample PDF
  try {
    const response = await fetch('/sample.pdf');
    const pdfBuffer = await response.arrayBuffer();
    await engine.loadDocument(pdfBuffer);
  } catch (error) {
    console.error('Error loading PDF:', error);
  }

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
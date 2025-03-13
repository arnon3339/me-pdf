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
import { RenderPartialLayerPackage } from '@embedpdf/layer-render-partial';
import { PageManagerCapability, PageManagerPlugin, PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import { SearchPluginPackage, SearchPlugin, SearchCapability } from '@embedpdf/plugin-search';
import {
  AllLogger,
  ConsoleLogger,
  Logger,
  PerfLogger,
  Rotation,
  MatchFlag,
  SearchResult
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
      { package: RenderLayerPackage, config: { maxScale: 2 } },
      { package: RenderPartialLayerPackage, config: { minScale: 2.01 } }
    ]
  }); 
  registry.registerPlugin(SearchPluginPackage);

  await registry.initialize();

  const loader = registry.getPlugin<LoaderPlugin>('loader').provides();
  const spread = registry.getPlugin<SpreadPlugin>('spread').provides();
  const layer = registry.getPlugin<LayerPlugin>('layer').provides();
  const zoom = registry.getPlugin<ZoomPlugin>('zoom').provides();
  const scroll = registry.getPlugin<ScrollPlugin>('scroll').provides();
  const pageManager = registry.getPlugin<PageManagerPlugin>('page-manager').provides();
  const search = registry.getPlugin<SearchPlugin>('search').provides();
  
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

  setupUIControls(spread, zoom, scroll, pageManager);
  setupSearchUI(search, scroll);
}

function setupUIControls(spread: SpreadCapability, zoom: ZoomCapability, scroll: ScrollCapability, pageManager: PageManagerCapability) {
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
  const zoomSelect = document.getElementById('zoomLevel') as HTMLSelectElement;
  const spreadSelect = document.getElementById('spreadMode') as HTMLSelectElement;
  const rotateForwardButton = document.getElementById('rotateForward') as HTMLButtonElement;
  const rotateBackwardButton = document.getElementById('rotateBackward') as HTMLButtonElement;

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

  rotateForwardButton.addEventListener('click', async () => {
    const currentRotation = pageManager.getRotation();
    const newRotation = getNextRotation(currentRotation);
    await pageManager.updateRotation(newRotation);
  });

  rotateBackwardButton.addEventListener('click', async () => {
    const currentRotation = pageManager.getRotation();
    const newRotation = getPreviousRotation(currentRotation);
    await pageManager.updateRotation(newRotation);
  });

  // Set initial zoom level
  zoomSelect.value = zoom.getState().zoomLevel.toString();

  zoomSelect.addEventListener('change', async () => {
    const newZoom = isNaN(parseFloat(zoomSelect.value)) ? zoomSelect.value : parseFloat(zoomSelect.value);
    await zoom.updateZoomLevel(newZoom as ZoomLevel);
  });
}

function setupSearchUI(search: SearchCapability, scroll: ScrollCapability) {
  // Get search UI elements
  const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
  const searchOverlay = document.getElementById('searchOverlay') as HTMLDivElement;
  const searchClose = document.getElementById('searchClose') as HTMLDivElement;
  const searchKeyword = document.getElementById('searchKeyword') as HTMLInputElement;
  const searchNext = document.getElementById('searchNext') as HTMLButtonElement;
  const searchPrevious = document.getElementById('searchPrevious') as HTMLButtonElement;
  const matchCase = document.getElementById('matchCase') as HTMLInputElement;
  const matchWholeWord = document.getElementById('matchWholeWord') as HTMLInputElement;
  const matchConsecutive = document.getElementById('matchConsecutive') as HTMLInputElement;
  const searchPerformButton = document.getElementById('searchPerformButton') as HTMLButtonElement;
  
  let currentSearchKeyword = '';
  let activeSearchResult: SearchResult | undefined;

  // Listen for search start/stop events
  search.onSearchStart(() => {
    console.log('Search session started');
  });
  
  search.onSearchStop(() => {
    console.log('Search session stopped');
  });
  
  // Listen for search results
  search.onSearchResult((result) => {
    console.log('Search result:', result);
  });
  
  // Toggle search overlay visibility
  const toggleSearchOverlay = () => {
    const isActive = searchOverlay.classList.toggle('active');
    
    if (isActive) {
      // Start search session when overlay is opened
      search.startSearch();
      searchKeyword.focus();
    } else {
      // Stop search session when overlay is closed
      search.stopSearch();
    }
  };
  
  // Update search flags based on checkbox values
  const updateSearchFlags = () => {
    const flags: MatchFlag[] = [];
    
    if (matchCase.checked) {
      flags.push(MatchFlag.MatchCase);
    }
    
    if (matchWholeWord.checked) {
      flags.push(MatchFlag.MatchWholeWord);
    }
    
    if (matchConsecutive.checked) {
      flags.push(MatchFlag.MatchConsecutive);
    }
    
    search.setFlags(flags);
    
    // If we have an active search keyword, re-search with new flags
    if (currentSearchKeyword) {
      searchNext.click();
    }
  };
  
  // Search for next occurrence
  const performSearchNext = async () => {
    if (!searchKeyword.value.trim()) return;
    
    currentSearchKeyword = searchKeyword.value.trim();
    const searchIndex = search.nextResult();
    console.log('Search index:', searchIndex);
  };
  
  // Search for previous occurrence
  const performSearchPrevious = async () => {
    if (!searchKeyword.value.trim()) return;
    
    currentSearchKeyword = searchKeyword.value.trim();
    const searchIndex = search.previousResult();
    console.log('Search index:', searchIndex);
  };

  const performSearch = async () => {
    if (!searchKeyword.value.trim()) return;
    
    currentSearchKeyword = searchKeyword.value.trim();
    search.searchAllPages(currentSearchKeyword);
  };
  
  // Set up event listeners
  searchButton.addEventListener('click', toggleSearchOverlay);
  searchClose.addEventListener('click', toggleSearchOverlay);
  searchPerformButton.addEventListener('click', performSearch);
  searchNext.addEventListener('click', performSearchNext);
  searchPrevious.addEventListener('click', performSearchPrevious);
  
  // Search when Enter key is pressed in the keyword input
  searchKeyword.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Update search flags when option checkboxes change
  matchCase.addEventListener('change', updateSearchFlags);
  matchWholeWord.addEventListener('change', updateSearchFlags);
  matchConsecutive.addEventListener('change', updateSearchFlags);
}

function updatePageInfo(currentPage: number, totalPages: number) {
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

// Helper functions for rotation
function getNextRotation(currentRotation: Rotation): Rotation {
  switch (currentRotation) {
    case Rotation.Degree0:
      return Rotation.Degree90;
    case Rotation.Degree90:
      return Rotation.Degree180;
    case Rotation.Degree180:
      return Rotation.Degree270;
    case Rotation.Degree270:
      return Rotation.Degree0;
    default:
      return Rotation.Degree0;
  }
}

function getPreviousRotation(currentRotation: Rotation): Rotation {
  switch (currentRotation) {
    case Rotation.Degree0:
      return Rotation.Degree270;
    case Rotation.Degree90:
      return Rotation.Degree0;
    case Rotation.Degree180:
      return Rotation.Degree90;
    case Rotation.Degree270:
      return Rotation.Degree180;
    default:
      return Rotation.Degree0;
  }
}

initializePDFViewer();
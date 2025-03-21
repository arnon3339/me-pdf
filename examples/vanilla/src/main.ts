import { PdfiumEngine, WebWorkerEngine } from '@embedpdf/engines';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { init } from '@embedpdf/pdfium';
import { LayerPlugin, LayerPluginPackage } from '@embedpdf/plugin-layer';
import { ZoomCapability, ZoomLevel, ZoomMode, ZoomPlugin, ZoomPluginPackage } from '@embedpdf/plugin-zoom';
import { PluginPackage, PluginRegistry, createPluginRegistration } from '@embedpdf/core';
import { LoaderPlugin, LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { ViewportPlugin, ViewportPluginConfig, ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage, ScrollCapability, ScrollPlugin, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { SpreadCapability, SpreadMode, SpreadPlugin, SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { TextLayerPackage } from '@embedpdf/layer-text';
import { RenderLayerPackage } from '@embedpdf/layer-render';
import { SearchLayerPackage } from '@embedpdf/layer-search';
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

  const pdf = await fetch('/file/compressed.tracemonkey-pldi-09.pdf');
  const source = await pdf.arrayBuffer();

  const registry = new PluginRegistry(engine);

  registry.registerPlugin(LoaderPluginPackage, {
    loadingOptions: {
      id: '1',
      source
    }
  });
  registry.registerPlugin(ViewportPluginPackage, {
    container: document.getElementById('viewer-container') as HTMLElement
  });
  registry.registerPlugin(PageManagerPluginPackage, {
    pageGap: 10
  });
  registry.registerPlugin(ZoomPluginPackage, {
    defaultZoomLevel: ZoomMode.Automatic
  });
  registry.registerPlugin(SpreadPluginPackage, {
    defaultSpreadMode: SpreadMode.None
  });
  registry.registerPlugin(ScrollPluginPackage, {
    bufferSize: 2,
    strategy: ScrollStrategy.Vertical
  });
  registry.registerPlugin(LayerPluginPackage, {
    layers: [
      { package: TextLayerPackage },
      { package: RenderLayerPackage, config: { maxScale: 2 } },
      //{ package: RenderPartialLayerPackage, config: { minScale: 2.01 } },
      { package: SearchLayerPackage }
    ]
  }); 
  registry.registerPlugin(SearchPluginPackage);

  await registry.initialize();

  const loader = registry.getPlugin<LoaderPlugin>('loader').provides();
  const spread = registry.getPlugin<SpreadPlugin>('spread').provides();
  const zoom = registry.getPlugin<ZoomPlugin>('zoom').provides();
  const scroll = registry.getPlugin<ScrollPlugin>('scroll').provides();
  const pageManager = registry.getPlugin<PageManagerPlugin>('page-manager').provides();
  const search = registry.getPlugin<SearchPlugin>('search').provides();


  const pdfDocument = loader.getDocument();

  if(!pdfDocument) {
    throw new Error('PDF document not loaded');
  }

  const totalPages = pdfDocument.pageCount;
  updatePageInfo(1, totalPages);

  scroll.onPageChange((pageNumber) => {
    updatePageInfo(pageNumber, totalPages);
  });

  setupUIControls(spread, zoom, scroll, pageManager);
  setupSearchUI(search, scroll);
}

function setupUIControls(spread: SpreadCapability, zoom: ZoomCapability, scroll: ScrollCapability, pageManager: PageManagerCapability) {
  // Main toolbar controls
  const prevButton = document.getElementById('prevPage') as HTMLButtonElement;
  const nextButton = document.getElementById('nextPage') as HTMLButtonElement;
  const zoomInButton = document.getElementById('zoomIn') as HTMLButtonElement;
  const zoomOutButton = document.getElementById('zoomOut') as HTMLButtonElement;
  const zoomSelect = document.getElementById('zoomLevel') as HTMLSelectElement;
  const spreadSelect = document.getElementById('spreadMode') as HTMLSelectElement;
  const rotateForwardButton = document.getElementById('rotateForward') as HTMLButtonElement;
  const rotateBackwardButton = document.getElementById('rotateBackward') as HTMLButtonElement;
  
  // Dropdown menu controls
  const moreOptionsButton = document.getElementById('moreOptionsButton') as HTMLButtonElement;
  const moreOptionsDropdown = document.getElementById('moreOptionsDropdown') as HTMLDivElement;
  const rotateForwardDropdown = document.getElementById('rotateForwardDropdown') as HTMLButtonElement;
  const rotateBackwardDropdown = document.getElementById('rotateBackwardDropdown') as HTMLButtonElement;
  const spreadModeDropdown = document.getElementById('spreadModeDropdown')?.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>;
  const fitOptionsDropdown = document.getElementById('fitOptionsDropdown')?.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>;

  // Toggle dropdown menu
  moreOptionsButton.addEventListener('click', () => {
    moreOptionsDropdown.classList.toggle('active');
    
    // Update active states in the dropdown
    updateActiveDropdownItems(spreadModeDropdown, spread.getSpreadMode());
    updateActiveDropdownItems(fitOptionsDropdown, zoom.getState().zoomLevel);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!moreOptionsButton.contains(event.target as Node) && 
        !moreOptionsDropdown.contains(event.target as Node)) {
      moreOptionsDropdown.classList.remove('active');
    }
  });

  // Spread mode controls
  spreadSelect.addEventListener('change', async () => {
    const newSpreadMode = spreadSelect.value as SpreadMode;
    await spread.setSpreadMode(newSpreadMode);
  });

  // Spread mode dropdown controls
  spreadModeDropdown.forEach(button => {
    button.addEventListener('click', async () => {
      const newSpreadMode = button.getAttribute('data-value') as SpreadMode;
      await spread.setSpreadMode(newSpreadMode);
      spreadSelect.value = newSpreadMode;
      updateActiveDropdownItems(spreadModeDropdown, newSpreadMode);
      moreOptionsDropdown.classList.remove('active');
    });
  });

  // Fit options dropdown controls
  fitOptionsDropdown.forEach(button => {
    button.addEventListener('click', async () => {
      const newZoom = button.getAttribute('data-value') as ZoomLevel;
      const zoomEvent = zoom.updateZoomLevel(newZoom);
      zoomSelect.value = zoomEvent.newZoom.toString();
      updateActiveDropdownItems(fitOptionsDropdown, zoomEvent.newZoom);
      moreOptionsDropdown.classList.remove('active');
    });
  });

  // Navigation controls
  prevButton.addEventListener('click', async () => {
    await scroll.scrollToPreviousPage();
  });

  nextButton.addEventListener('click', async () => {
    await scroll.scrollToNextPage();
  });

  // Rotation controls
  rotateForwardButton.addEventListener('click', async () => {
    await pageManager.rotateForward();
  });

  rotateBackwardButton.addEventListener('click', async () => {
    await pageManager.rotateBackward();
  });

  // Dropdown rotation controls
  rotateForwardDropdown.addEventListener('click', async () => {
    await pageManager.rotateForward();
    moreOptionsDropdown.classList.remove('active');
  });

  rotateBackwardDropdown.addEventListener('click', async () => {
    await pageManager.rotateBackward();
    moreOptionsDropdown.classList.remove('active');
  });

  // Zoom controls
  zoomInButton.addEventListener('click', async () => {
    const zoomEvent = await zoom.zoomIn();
    updateZoomSelectValue(zoomSelect, zoomEvent.newZoom);
  });

  zoomOutButton.addEventListener('click', async () => {
    const zoomEvent = await zoom.zoomOut();
    updateZoomSelectValue(zoomSelect, zoomEvent.newZoom);
  });

  // Zoom select control
  zoomSelect.addEventListener('change', async () => {
    const newZoom = isNaN(parseFloat(zoomSelect.value)) ? zoomSelect.value : parseFloat(zoomSelect.value);
    await zoom.updateZoomLevel(newZoom as ZoomLevel);
  });
}

// Helper function to update active dropdown items
function updateActiveDropdownItems(items: NodeListOf<HTMLButtonElement>, activeValue: string | number) {
  items.forEach(item => {
    if (item.getAttribute('data-value') === activeValue.toString()) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Helper function to update zoom select value
function updateZoomSelectValue(zoomSelect: HTMLSelectElement, value: number | string) {
  // If the value exists as an option, select it
  const valueExists = Array.from(zoomSelect.options).some(option => option.value === value.toString());
  
  if (valueExists) {
    zoomSelect.value = value.toString();
  } else if (typeof value === 'number') {
    // Find the closest numeric value
    const numericOptions = Array.from(zoomSelect.options)
      .filter(option => !isNaN(parseFloat(option.value)))
      .map(option => parseFloat(option.value));
    
    if (numericOptions.length > 0) {
      const closest = numericOptions.reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
      );
      zoomSelect.value = closest.toString();
    }
  }
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

initializePDFViewer();
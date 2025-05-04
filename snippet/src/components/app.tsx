import React, { useState, useEffect } from 'preact/compat';
import { h, Fragment } from 'preact';
import styles from '../styles/index.css';
import { EmbedPDF } from '@embedpdf/core/preact';
import { createPluginRegistration, PluginRegistry } from '@embedpdf/core';
import { PdfiumEngine, WebWorkerEngine } from '@embedpdf/engines';
import { init, init as initPdfium } from '@embedpdf/pdfium';
import { PdfEngine } from '@embedpdf/models';
import { VIEWPORT_PLUGIN_ID, ViewportPluginPackage, ViewportState } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/preact';
import { SCROLL_PLUGIN_ID, ScrollPluginPackage, ScrollState, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/preact';
import { PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import { SPREAD_PLUGIN_ID, SpreadMode, SpreadPlugin, SpreadPluginPackage, SpreadState } from '@embedpdf/plugin-spread';
//import { LayerPluginPackage, createLayerRegistration } from '@embedpdf/plugin-layer';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
//import { RenderLayerPackage } from '@embedpdf/layer-render';
//import { ZoomPluginPackage, ZoomMode, ZOOM_PLUGIN_ID, ZoomState } from '@embedpdf/plugin-zoom';
import { MenuItem, defineComponent, GlobalStoreState, IconRegistry, UIComponentType, UIPlugin, UIPluginConfig, UIPluginPackage, hasActive, isActive, UI_PLUGIN_ID } from '@embedpdf/plugin-ui';
import { commandMenuRenderer, commentRender, dividerRenderer, groupedItemsRenderer, headerRenderer, iconButtonRenderer, pageControlsContainerRenderer, PageControlsProps, pageControlsRenderer, panelRenderer, searchRenderer, selectButtonRenderer, sidebarRender, tabButtonRenderer, zoomRenderer, ZoomRendererProps } from './renderers';
import { PluginUIProvider } from '@embedpdf/plugin-ui/preact';
import { ZOOM_PLUGIN_ID, ZoomPlugin, ZoomPluginPackage, ZoomState } from '@embedpdf/plugin-zoom';

// **Configuration Interface**
export interface PDFViewerConfig {
  src: string;
  workerUrl?: string;
  wasmUrl?: string;
  scrollStrategy?: string;
  zoomMode?: string;
}

// **Singleton Engine Instance**
let engineInstance: PdfEngine | null = null;

interface InitializeEngineOptions {
  workerUrl?: string;
  wasmUrl?: string;
}
// **Initialize the Pdfium Engine**
async function initializeEngine(options?: InitializeEngineOptions): Promise<PdfEngine> {
  if(options?.workerUrl) {
    const worker = new Worker(options.workerUrl, {
      type: 'module',
    });
    const engine = new WebWorkerEngine(worker);
    engineInstance = engine;
    return engine;
  } else {
    const response = await fetch(options?.wasmUrl || '/pdfium.wasm');
    const wasmBinary = await response.arrayBuffer();
    const wasmModule = await init({ wasmBinary });
    const engine = new PdfiumEngine(wasmModule);
    engineInstance = engine;
    return engine;
  }
}

// **Props for the PDFViewer Component**
interface PDFViewerProps {
  config: PDFViewerConfig;
}

type State = GlobalStoreState<{
  [ZOOM_PLUGIN_ID]: ZoomState,
  [VIEWPORT_PLUGIN_ID]: ViewportState,
  [SCROLL_PLUGIN_ID]: ScrollState,
  [SPREAD_PLUGIN_ID]: SpreadState
}>

export const icons: IconRegistry = {
  menu: {
    id: 'menu',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-menu"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8l16 0" /><path d="M4 16l16 0" /></svg>'
  },
  download: {
    id: 'download',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>'
  },
  fullscreen: {
    id: 'fullscreen',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-maximize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>'
  },
  save: {
    id: 'save',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-floppy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>'
  },
  print: {
    id: 'print',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-printer"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /></svg>'
  },
  settings: {
    id: 'settings',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>'
  },
  viewSettings: {
    id: 'viewSettings',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M12 10.5v1.5" /><path d="M12 16v1.5" /><path d="M15.031 12.25l-1.299 .75" /><path d="M10.268 15l-1.3 .75" /><path d="M15 15.803l-1.285 -.773" /><path d="M10.285 12.97l-1.285 -.773" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>'
  },
  rotateClockwise: {
    id: 'rotateClockwise',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-rotate-clockwise"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" /></svg>'
  },
  rotateCounterClockwise: {
    id: 'rotateCounterClockwise',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-rotate"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" /></svg>'
  },
  singlePage: {
    id: 'singlePage',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-columns-1"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 3m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" /></svg>'
  },
  doublePage: {
    id: 'doublePage',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-columns-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1zm9 -1v18" /></svg>'
  },
  zoomIn: {
    id: 'zoomIn',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M9 12h6" /><path d="M12 9v6" /></svg>'
  },
  zoomOut: {
    id: 'zoomOut',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l6 0" /></svg>'
  },
  fitToWidth: {
    id: 'fitToWidth',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-autofit-width"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" /><path d="M10 18h-7" /><path d="M21 18h-7" /><path d="M6 15l-3 3l3 3" /><path d="M18 15l3 3l-3 3" /></svg>'
  },
  fitToPage: {  
    id: 'fitToPage',  
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-autofit-height"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 20h-6a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h6" /><path d="M18 14v7" /><path d="M18 3v7" /><path d="M15 18l3 3l3 -3" /><path d="M15 6l3 -3l3 3" /></svg>'
  },
  chevronRight: {
    id: 'chevronRight',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>'
  },
  chevronLeft: {
    id: 'chevronLeft',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>'
  },
  chevronDown: {
    id: 'chevronDown',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>'
  },
  search: {
    id: 'search',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>'
  },
  comment: {
    id: 'comment',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-message-dots"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 11v.01" /><path d="M8 11v.01" /><path d="M16 11v.01" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" /></svg>'
  },
  sidebar: {
    id: 'sidebar',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-sidebar-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 18v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M14 18v-12a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2z" /></svg>'
  },
  dots: {
    id: 'dots',
    svg: '<svg  xmlns="http://www.w3.org/2000/svg"  width="100%"  height="100%"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>'
  }
}

export const menuItems: Record<string, MenuItem<State>> = {
  menuCtr: {
    id: 'menuCtr',
    icon: 'menu',
    label: 'Menu',
    shortcut: 'Shift+M',
    shortcutLabel: 'M',
    type: 'menu',
    children: [
      'download', 'enterFS', 'save', 'print', 'settings'
    ],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'menuCtr'
  },
  download: {
    id: 'download',
    icon: 'download',
    label: 'Download',
    shortcut: 'Shift+D',
    shortcutLabel: 'D',
    type: 'action',
    action: () => {
      console.log('download');
    }
  },
  enterFS: {
    id: 'enterFS',
    icon: 'fullscreen',
    label: 'Enter full screen',
    shortcut: 'Shift+F',
    shortcutLabel: 'F',
    type: 'action',
    action: () => {
      console.log('enterFS');
    }
  },
  save: {
    id: 'save',
    icon: 'save',
    label: 'Save',
    shortcut: 'Shift+S',
    shortcutLabel: 'S',
    type: 'action',
    action: () => {
      console.log('save');
    }
  },
  print: {
    id: 'print',
    icon: 'print',
    label: 'Print',
    shortcut: 'Shift+P',
    shortcutLabel: 'P',
    type: 'action',
    action: () => {
      console.log('print');
    }
  },
  settings: {
    id: 'settings',
    icon: 'settings',
    label: 'Settings',
    shortcut: 'Shift+E',
    shortcutLabel: 'E',
    dividerBefore: true,
    type: 'action',
    action: () => {
      console.log('settings');
    }
  },
  /* --- View controls menu --- */
  viewCtr:     {
    id:'viewCtr',     
    icon:'viewSettings',  
    label:'View controls', 
    shortcut: 'Shift+V',
    shortcutLabel: 'V',
    type: 'menu',
    children:[
      'pageOrientation', 'pageLayout', 'enterFS'
    ],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'viewCtr'
  },
  pageOrientation: {
    id: 'pageOrientation',
    label: 'Page orientation',
    type: 'group',
    children: ['rotateClockwise', 'rotateCounterClockwise']
  },
  rotateClockwise: {
    id: 'rotateClockwise',
    label: 'Rotate clockwise',
    icon: 'rotateClockwise',
    type: 'action',
    action: () => {
      console.log('rotateClockwise');
    }
  },
  rotateCounterClockwise: {
    id: 'rotateCounterClockwise',
    label: 'Rotate counter clockwise',
    icon: 'rotateCounterClockwise',
    type: 'action',
    action: () => {
      console.log('rotateCounterClockwise');
    }
  },
  pageLayout: {
    id: 'pageLayout',
    label: 'Page layout',
    type: 'group',
    children: ['singlePage', 'doublePage', 'coverFacingPage']
  },
  singlePage: {
    id: 'singlePage',
    label: 'Single page',
    icon: 'singlePage',
    type: 'action',
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.None,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if(spread) {
        spread.setSpreadMode(SpreadMode.None);
      }
    }
  },
  doublePage: {
    id: 'doublePage',
    label: 'Double page',
    icon: 'doublePage',
    type: 'action',
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.Odd,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if(spread) {
        spread.setSpreadMode(SpreadMode.Odd);
      }
    }
  },
  coverFacingPage: {
    id: 'coverFacingPage',
    label: 'Cover facing page',
    icon: 'coverFacingPage',
    type: 'action',
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.Even,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if(spread) {
        spread.setSpreadMode(SpreadMode.Even);
      }
    }
  },
  leftAction: {
    id: 'leftAction',
    label: 'Left action',
    type: 'menu',
    icon: 'dots',
    children: ['viewCtr', 'zoom'],
    active: (storeState) => 
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'leftAction' || 
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'zoom' || 
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'changeZoomLevel' ||
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'viewCtr'
  },
  zoom:     {
    id:'zoom',     
    icon:'zoomIn',  
    label:'Zoom Controls', 
    shortcut: 'Shift+Z',
    shortcutLabel: 'Z',
    type: 'menu',
    children:[
      'changeZoomLevel', 'zoomIn', 'zoomOut', 'fitToWidth', 'fitToPage'
    ],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'zoom'
  },
  changeZoomLevel: {
    id: 'changeZoomLevel',
    label: (storeState) => `Zoom level (${(storeState.plugins.zoom.currentZoomLevel * 100).toFixed(0)}%)`,
    type: 'menu',
    children: [
      'zoom25',
      'zoom50',
      'zoom100',
      'zoom125',
      'zoom150',
      'zoom200',
      'zoom400',
      'zoom800',
      'zoom1600'
    ],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'changeZoomLevel'
  },
  zoom10: {
    id: 'zoom10',
    label: '10%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(0.10);
      }
    }
  },
  zoom25: {
    id: 'zoom25',
    label: '25%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(0.25);
      }
    }
  },
  zoom50: {
    id: 'zoom50',
    label: '50%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(0.50);
      }
    }
  },
  zoom100: {
    id: 'zoom100',
    label: '100%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(1);
      }
    }
  },
  zoom125: {
    id: 'zoom125',
    label: '125%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(1.25);
      }
    }
  },
  zoom150: {
    id: 'zoom150',
    label: '150%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(1.50);
      }
    }
  },
  zoom200: {
    id: 'zoom200',
    label: '200%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(2);
      }
    }
  },
  zoom400: {
    id: 'zoom400',
    label: '400%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(4);
      }
    }
  },
  zoom800: {
    id: 'zoom800',
    label: '800%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(8);
      }
    }
  },
  zoom1600: {
    id: 'zoom1600',
    label: '1600%',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.requestZoom(16);
      }
    }
  },
  zoomIn: {     
    id: 'zoomIn',
    label: 'Zoom in',
    icon: 'zoomIn',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if(zoom) {
        zoom.zoomIn();
      }
    }
  },
  zoomOut: {
    id: 'zoomOut',
    label: 'Zoom out',
    icon: 'zoomOut',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();
      
      if(zoom) {
        zoom.zoomOut();
      }
    }
  },
  search: {
    id: 'search',
    label: 'Search',
    icon: 'search',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.togglePanel({id: 'rightPanel', visibleChild: 'search'});
      }
    },
    active: (storeState) => storeState.plugins.ui.panel.rightPanel.open === true && storeState.plugins.ui.panel.rightPanel.visibleChild === 'search'
  },
  comment: {
    id: 'comment',
    label: 'Comment',
    icon: 'comment',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.togglePanel({id: 'rightPanel', visibleChild: 'comment'});
      }
    },
    active: (storeState) => storeState.plugins.ui.panel.rightPanel.open === true && storeState.plugins.ui.panel.rightPanel.visibleChild === 'comment'
  },
  fitToWidth: {
    id: 'fitToWidth',
    label: 'Fit to width',
    icon: 'fitToWidth',
    type: 'action',
    action: () => {
      console.log('fitToWidth');
    }
  },
  fitToPage: {
    id: 'fitToPage',
    label: 'Fit to page',
    icon: 'fitToPage',
    type: 'action',
    action: () => {
      console.log('fitToPage');
    }
  },
  sidebar: {
    id: 'sidebar',
    label: 'Sidebar',
    icon: 'sidebar',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.togglePanel({id: 'leftPanel', visibleChild: 'sidebar'});
      }
    },
    active: (storeState) => storeState.plugins.ui.panel.leftPanel.open === true && storeState.plugins.ui.panel.leftPanel.visibleChild === 'sidebar'
  },
  view: {
    id: 'view',
    label: 'View',
    type: 'action',
    shortcut: 'Shift+V',
    shortcutLabel: 'V',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.setHeaderVisible({id: 'toolsHeader', visible: false});
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === false
  },
  annotate: {
    id: 'annotate',
    label: 'Annotate',
    type: 'action',
    shortcut: 'Shift+A',
    shortcutLabel: 'A',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.setHeaderVisible({id: 'toolsHeader', visible: true, visibleChild: 'annotationTools'});
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === true && storeState.plugins.ui.header.toolsHeader.visibleChild === 'annotationTools'
  },
  shapes: {
    id: 'shapes',
    label: 'Shapes',
    type: 'action',
    shortcut: 'Shift+S',
    shortcutLabel: 'S',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.setHeaderVisible({id: 'toolsHeader', visible: true, visibleChild: 'shapeTools'});
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === true && storeState.plugins.ui.header.toolsHeader.visibleChild === 'shapeTools'
  },
  fillAndSign: {
    id: 'fillAndSign',
    label: 'Fill and Sign',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.setHeaderVisible({id: 'toolsHeader', visible: true, visibleChild: 'fillAndSignTools'});
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === true && storeState.plugins.ui.header.toolsHeader.visibleChild === 'fillAndSignTools'
  },
  form: {
    id: 'form',
    label: 'Form',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if(ui) {
        ui.setHeaderVisible({id: 'toolsHeader', visible: true, visibleChild: 'formTools'});
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === true && storeState.plugins.ui.header.toolsHeader.visibleChild === 'formTools'
  },
  tabOverflow: {
    id: 'tabOverflow',
    label: 'More',
    icon: 'dots',
    type: 'menu',
    children: [
      'view',
      'annotate',
      'shapes',
      'fillAndSign',
      'form'
    ],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'tabOverflow'
  }
}

// Define components
export const components: Record<string, UIComponentType<State>> = {
  menuButton: {
    type: 'iconButton',
    id: 'menuButton',
    props: {
      commandId: 'menuCtr',
      active: false,
      label: 'Menu'
    },   
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.menuCtr, storeState)
    })
  },
  viewCtrButton: {
    type: 'iconButton',
    id: 'viewCtrButton',
    props: {
      commandId: 'viewCtr',
      active: false,
      label: 'View settings'
    },   
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.viewCtr, storeState)
    })
  },
  commentButton: {
    type: 'iconButton',
    id: 'commentButton',
    props: {
      active: false,
      commandId: 'comment',
      label: 'Comment',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.comment, storeState)
    })
  },
  searchButton: {
    type: 'iconButton',
    id: 'searchButton',
    props: {
      active: false,
      commandId: 'search',
      label: 'Search',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.search, storeState)
    })
  },
  filePickerButton: {
    type: 'iconButton',
    id: 'filePickerButton',
    props: {
      label: 'Open File',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZmlsZS1pbXBvcnQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xNCAzdjRhMSAxIDAgMCAwIDEgMWg0IiAvPjxwYXRoIGQ9Ik01IDEzdi04YTIgMiAwIDAgMSAyIC0yaDdsNSA1djExYTIgMiAwIDAgMSAtMiAyaC01LjVtLTkuNSAtMmg3bS0zIC0zbDMgM2wtMyAzIiAvPjwvc3ZnPg==',
    },
  },
  downloadButton: {
    type: 'iconButton',
    id: 'downloadButton',
    props: {
      label: 'Download',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZG93bmxvYWQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDE3djJhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMiAtMnYtMiIgLz48cGF0aCBkPSJNNyAxMWw1IDVsNSAtNSIgLz48cGF0aCBkPSJNMTIgNGwwIDEyIiAvPjwvc3ZnPg==',
    },
  },  
  zoomButton: {
    type: 'iconButton',
    id: 'zoomButton',
    props: {
      commandId: 'zoom',
      label: 'Zoom',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItY2lyY2xlLXBsdXMiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zIDEyYTkgOSAwIDEgMCAxOCAwYTkgOSAwIDAgMCAtMTggMCIgLz48cGF0aCBkPSJNOSAxMmg2IiAvPjxwYXRoIGQ9Ik0xMiA5djYiIC8+PC9zdmc+',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.zoom, storeState) || isActive(menuItems.changeZoomLevel, storeState)
    })
  },
  sidebarButton: {
    type: 'iconButton',
    id: 'sidebarButton',
    props: {
      commandId: 'sidebar',
      label: 'Sidebar',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.sidebar, storeState)
    })
  },
  divider1: {
    type: 'divider',
    id: 'divider1',
  },
  expandLeftActionsButton: {
    type: 'iconButton',
    id: 'expandLeftActionsButton',
    props: {
      commandId: 'leftAction',
      label: 'Left Panel Actions',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.leftAction, storeState)
    })
  },
  headerStart: {
    id: 'headerStart',
    type: 'groupedItems',
    slots: [
      { componentId: 'menuButton', priority: 0 }, 
      { componentId: 'divider1', priority: 1, className: 'flex' }, 
      { componentId: 'sidebarButton', priority: 2 }, 
      { componentId: 'expandLeftActionsButton', priority: 3, className: '@min-[400px]:hidden' },
      { componentId: 'viewCtrButton', priority: 4, className: 'hidden @min-[400px]:block' }, 
      { componentId: 'divider1', priority: 6, className: 'hidden @min-[400px]:flex' },
      { componentId: 'zoomButton', priority: 7, className: 'hidden @min-[400px]:block @min-[900px]:hidden' },
      { componentId: 'zoom', priority: 8, className: 'hidden @min-[900px]:block' }
    ],  
    props: {
      gap: 10
    }
  },
  viewTab: {
    type: 'tabButton',
    id: 'viewTab',
    props: {
      label: 'View',
      commandId: 'view',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.view, storeState)
    })
  },
  annotateTab: {
    type: 'tabButton',
    id: 'annotateTab',
    props: {
      label: 'Annotate',
      commandId: 'annotate',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.annotate, storeState)
    })
  },
  shapesTab: {
    type: 'tabButton',
    id: 'shapesTab',
    props: {
      label: 'Shapes',
      commandId: 'shapes',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.shapes, storeState)
    })
  },
  fillAndSignTab: {
    type: 'tabButton',
    id: 'fillAndSignTab',
    props: {
      label: 'Fill and Sign',
      commandId: 'fillAndSign',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.fillAndSign, storeState)
    })
  },
  formTab: {
    type: 'tabButton',
    id: 'formTab',
    props: {
      label: 'Form',
      commandId: 'form',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.form, storeState)
    })
  },
  tabOverflowButton: {
    type: 'iconButton',
    id: 'tabOverflowButton',
    props: {
      label: 'More',
      commandId: 'tabOverflow',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.tabOverflow, storeState)
    })
  },
  selectButton: {
    type: 'selectButton',
    id: 'selectButton',
    props: {
      menuCommandId: 'tabOverflow',
      commandIds: ['view', 'annotate', 'shapes', 'fillAndSign', 'form'],
      activeCommandId: 'view',
      active: false
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      activeCommandId: ownProps.commandIds.find(commandId => isActive(menuItems[commandId], storeState)) ?? ownProps.commandIds[0],
      active: isActive(menuItems.tabOverflow, storeState)
    })
  },
  headerCenter: {
    id: 'headerCenter',
    type: 'groupedItems',
    slots: [
      { componentId: 'selectButton', priority: 0, className: 'block @min-[500px]:hidden' },
      { componentId: 'viewTab', priority: 1, className: 'hidden @min-[500px]:block' },
      { componentId: 'annotateTab', priority: 2, className: 'hidden @min-[500px]:block' },
      { componentId: 'shapesTab', priority: 3, className: 'hidden @min-[600px]:block' },
      { componentId: 'fillAndSignTab', priority: 4, className: 'hidden @min-[700px]:block' },
      { componentId: 'formTab', priority: 5, className: 'hidden @min-[800px]:block' },
      { componentId: 'tabOverflowButton', priority: 60, className: 'hidden @min-[500px]:block @min-[701px]:hidden' },
    ],
    props: {
      gap: 10
    }
  },
  headerEnd: {
    id: 'headerEnd',
    type: 'groupedItems',
    slots: [
      { componentId: 'searchButton', priority: 1 },
      { componentId: 'commentButton', priority: 2 }
    ],
    props: {
      gap: 10
    }
  },
  pageControls: defineComponent<{ currentPage: number, pageCount: number }, PageControlsProps, State>()({
    id: 'pageControls',
    type: 'custom',
    render: 'pageControls',
    initialState: {
      currentPage: 1,
      pageCount: 1
    },
    props: (initialState) => ({
      currentPage: initialState.currentPage,
      pageCount: initialState.pageCount
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      currentPage: storeState.plugins.scroll.currentPage,
      pageCount: storeState.core.document?.pageCount ?? 1
    })
  }),
  pageControlsContainer: {
    id: 'pageControlsContainer',
    type: 'floating',
    render: 'pageControlsContainer',
    initialState: {
      open: false
    },
    props: (initialState) => ({
      open: initialState.open
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.floating.pageControlsContainer.open
    }),
    slots: [
      { componentId: 'pageControls', priority: 0 }
    ]
  },
  topHeader: {
    type: 'header',
    id: 'topHeader',
    slots: [
      { componentId: 'headerStart', priority: 0 },
      { componentId: 'headerCenter', priority: 1 },
      { componentId: 'headerEnd', priority: 2 }
    ],
    getChildContext: (props) => ({
      direction: props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical'
    }),
    props: {
      placement: 'top',
      style: { 
        backgroundColor: '#ffffff',
        gap: '10px'
      }
    },
  },
  annotationTools: {
    id: 'annotationTools',
    type: 'groupedItems',
    slots: [
      { componentId: 'downloadButton', priority: 0 }
    ],
    props: {
      gap: 10
    }
  },
  toolsHeader: {
    type: 'header',
    id: 'toolsHeader',
    initialState: {
      visible: false,
      visibleChild: null
    },
    props: (initialState) => ({
      placement: 'top',
      visible: initialState.visible,
      visibleChild: initialState.visibleChild,
      style: {
        backgroundColor: '#f1f3f5',
        justifyContent: 'center'
      }
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      visible: storeState.plugins.ui.header.toolsHeader.visible,
      visibleChild: storeState.plugins.ui.header.toolsHeader.visibleChild
    }),
    slots: [
      { componentId: 'annotationTools', priority: 0 }
    ],
    getChildContext: (props) => ({
      direction: props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical'
    })
  },
  leftPanel: {
    id: 'leftPanel',
    type: 'panel',
    initialState: {
      open: false,
      visibleChild: null
    },
    props: (initialState) => ({
      open: initialState.open,
      visibleChild: initialState.visibleChild,
      location: 'left'
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.leftPanel.open,
      visibleChild: storeState.plugins.ui.panel.leftPanel.visibleChild
    }),
    slots: [
      { componentId: 'sidebar', priority: 0 }
    ]
  },
  sidebar: {
    id: 'sidebar',
    type: 'custom',
    render: 'sidebar'
  },
  search: {
    id: 'search',
    type: 'custom',
    render: 'search'
  },
  comment: {
    id: 'comment',
    type: 'custom',
    render: 'comment'
  },
  commandMenu: {
    id: 'commandMenu',
    type: 'commandMenu',
    initialState: {
      open: false,
      activeCommand: null,
      triggerElement: undefined,
      position: undefined,
      flatten: false
    },
    props: (initialState) => ({
      open: initialState.open,
      activeCommand: initialState.activeCommand,
      triggerElement: initialState.triggerElement,
      position: initialState.position,
      flatten: initialState.flatten
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.commandMenu.commandMenu.open,
      activeCommand: storeState.plugins.ui.commandMenu.commandMenu.activeCommand,
      triggerElement: storeState.plugins.ui.commandMenu.commandMenu.triggerElement,
      position: storeState.plugins.ui.commandMenu.commandMenu.position,
      flatten: storeState.plugins.ui.commandMenu.commandMenu.flatten
    })
  },
  zoom: defineComponent<{ zoomLevel: number }, ZoomRendererProps, State>()({
    id: 'zoom',
    type: 'custom',
    render: 'zoom',
    initialState: {
      zoomLevel: 1
    },
    props: (initialState) => ({
      zoomLevel: initialState.zoomLevel,
      commandZoomIn: menuItems.zoomIn.id,
      commandZoomOut: menuItems.zoomOut.id,
      commandZoomMenu: menuItems.zoom.id,
      zoomMenuActive: false
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      zoomLevel: storeState.plugins.zoom.currentZoomLevel,
      zoomMenuActive: isActive(menuItems.zoom, storeState) || isActive(menuItems.changeZoomLevel, storeState)
    })
  }),
  rightPanel: {
    id: 'rightPanel',
    type: 'panel',
    initialState: {
      open: false,
      visibleChild: null
    },
    props: (initialState) => ({
      open: initialState.open,
      visibleChild: initialState.visibleChild,
      location: 'right'
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.rightPanel.open,
      visibleChild: storeState.plugins.ui.panel.rightPanel.visibleChild
    }),
    slots: [
      { componentId: 'search', priority: 0 },
      { componentId: 'comment', priority: 1 }
    ]
  }
};

// UIPlugin configuration
export const uiConfig: UIPluginConfig = {
  enabled: true,
  components,
  menuItems,
  icons
};

export function PDFViewer({ config }: PDFViewerProps) {
  const [engine, setEngine] = useState<PdfEngine | null>(null);

  useEffect(() => {
    initializeEngine({
      workerUrl: config.workerUrl,
      wasmUrl: config.wasmUrl
    }).then(setEngine);
  }, []);

  if (!engine) return <div>Loading...</div>;

  // Map config values to plugin settings
  //const scrollStrategy = config.scrollStrategy === 'horizontal' ? ScrollStrategy.Horizontal : ScrollStrategy.Vertical;
  //const zoomMode = config.zoomMode === 'fitWidth' ? ZoomMode.FitWidth : ZoomMode.FitPage;

  return (
    <>
      <style>
        {styles}
      </style>
      <div className="flex flex-col h-full w-full @container">
        <EmbedPDF
          engine={engine}
          onInitialized={async (registry) => {
            const uiCapability = registry.getPlugin<UIPlugin>('ui')?.provides();

            if (uiCapability) {
              uiCapability.registerComponentRenderer('groupedItems', groupedItemsRenderer);
              uiCapability.registerComponentRenderer('iconButton', iconButtonRenderer);
              uiCapability.registerComponentRenderer('tabButton', tabButtonRenderer);
              uiCapability.registerComponentRenderer('header', headerRenderer);
              uiCapability.registerComponentRenderer('divider', dividerRenderer);
              uiCapability.registerComponentRenderer('panel', panelRenderer);
              uiCapability.registerComponentRenderer('search', searchRenderer);
              uiCapability.registerComponentRenderer('zoom', zoomRenderer);
              uiCapability.registerComponentRenderer('pageControlsContainer', pageControlsContainerRenderer);
              uiCapability.registerComponentRenderer('pageControls', pageControlsRenderer);
              uiCapability.registerComponentRenderer('commandMenu', commandMenuRenderer);
              uiCapability.registerComponentRenderer('comment', commentRender);
              uiCapability.registerComponentRenderer('sidebar', sidebarRender);
              uiCapability.registerComponentRenderer('selectButton', selectButtonRenderer);
            }
          }}
          plugins={[
            createPluginRegistration(UIPluginPackage, uiConfig),
            createPluginRegistration(LoaderPluginPackage, {
              loadingOptions: { 
                type: 'url',
                pdfFile: {
                  id: 'pdf',
                  url: config.src
                },
                options: {
                  mode: 'full-fetch'
                }
              },
            }), 
            createPluginRegistration(ViewportPluginPackage, {
              viewportGap: 10,
            }),
            createPluginRegistration(ScrollPluginPackage, {
              strategy: ScrollStrategy.Vertical,
            }),
            createPluginRegistration(PageManagerPluginPackage, { 
              pageGap: 10 
            }),
            createPluginRegistration(ZoomPluginPackage, {
              defaultZoomLevel: 1,
            }),
            createPluginRegistration(SpreadPluginPackage, { 
              defaultSpreadMode: SpreadMode.None 
            }),
            /*
            createPluginRegistration(ZoomPluginPackage, {
              defaultZoomLevel: 1,
            }),
            createPluginRegistration(LayerPluginPackage, {
              layers: [createLayerRegistration(RenderLayerPackage, { 
                maxScale: 2 
              })],
            }),
            */
          ]}
        >
          <PluginUIProvider>
            {({ headers, panels, floating, commandMenu }) => (
              <div className="flex flex-col h-full w-full @container">
                {headers.top.length > 0 && (
                  <div>
                    {headers.top}
                  </div>
                )}
                <div className="flex flex-row flex-1 overflow-hidden">
                  <div className="flex flex-col">
                    {headers.left}
                  </div>
                  <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {panels.left.length > 0 && (
                      <Fragment>
                        <div className="flex md:hidden absolute bottom-0 left-0 right-0 w-full z-10">
                          {panels.left}
                        </div>
                        <div className="hidden md:flex flex-col static">
                          {panels.left}
                        </div>
                      </Fragment>
                    )}
                    <div className="flex-1 relative flex w-full overflow-hidden">
                      <Viewport
                        style={{
                          width: '100%',
                          height: '100%',
                          flexGrow: 1,
                          backgroundColor: '#f1f3f5',
                          overflow: 'auto',
                        }}
                      >
                        <Scroller />
                      </Viewport>
                      {floating}
                    </div>
                    {panels.right.length > 0 && (
                      <Fragment>
                        <div className="flex md:hidden absolute bottom-0 left-0 right-0 w-full z-10">
                          {panels.right}
                        </div>
                        <div className="hidden md:flex flex-col static">
                          {panels.right}
                        </div>
                      </Fragment>
                    )}
                  </div>
                  <div className="flex flex-col">
                    {headers.right}
                  </div>
                </div>
                {headers.bottom.length > 0 && (
                  <div>
                    {headers.bottom}
                  </div>
                )}
                {commandMenu}
              </div>
            )}
          </PluginUIProvider>
        </EmbedPDF>
      </div>
    </>
  );
}
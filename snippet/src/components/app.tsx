import React, { useState, useEffect } from 'preact/compat';
import { h, Fragment } from 'preact';
import styles from '../styles/index.css';
import { EmbedPDF } from '@embedpdf/core/preact';
import { createPluginRegistration, PluginRegistry } from '@embedpdf/core';
import { PdfiumEngine, WebWorkerEngine } from '@embedpdf/engines';
import { init, init as initPdfium } from '@embedpdf/pdfium';
import { PdfEngine } from '@embedpdf/models';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/preact';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/preact';
import { PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import { SpreadMode, SpreadPluginPackage } from '@embedpdf/plugin-spread';
//import { LayerPluginPackage, createLayerRegistration } from '@embedpdf/plugin-layer';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
//import { RenderLayerPackage } from '@embedpdf/layer-render';
//import { ZoomPluginPackage, ZoomMode, ZOOM_PLUGIN_ID, ZoomState } from '@embedpdf/plugin-zoom';
import { FlyOutComponent, GlobalStoreState, HeaderComponent, UIComponentType, UIPlugin, UIPluginConfig, UIPluginPackage } from '@embedpdf/plugin-ui';
import { actionTabsRenderer, dividerRenderer, flyOutRenderer, groupedItemsRenderer, headerRenderer, panelRenderer, searchRenderer, toggleButtonRenderer, toolButtonRenderer, zoomRenderer } from './renderers';
import { NavigationWrapper } from '@embedpdf/plugin-ui/preact';
import { ZOOM_PLUGIN_ID, ZoomPluginPackage, ZoomState } from '@embedpdf/plugin-zoom';

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
  [ZOOM_PLUGIN_ID]: ZoomState
}>

// Define components
export const components: Record<string, UIComponentType<State>> = {
  menuToggleButton: {
    type: 'toggleButton',
    id: 'menuToggleButton',
    props: {
      active: false,
      toggleElement: 'menuFlyOut',
      label: 'Menu',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbi10YWJsZXItbWVudSI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQgOGwxNiAwIiAvPjxwYXRoIGQ9Ik00IDE2bDE2IDAiIC8+PC9zdmc+',
    },   
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: storeState.plugins.ui.flyOut.menuFlyOut.open
    })
  },
  moreToggleButton: {
    type: 'toggleButton',
    id: 'moreToggleButton',
    props: {
      active: false,
      toggleElement: 'moreFlyOut',
      label: 'More',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNBNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZG90cy12ZXJ0aWNhbCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDEybS0xIDBhMSAxIDAgMSAwIDIgMGExIDEgMCAxIDAgLTIgMCIgLz48cGF0aCBkPSJNMTIgMTltLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiAvPjxwYXRoIGQ9Ik0xMiA1bS0xIDBhMSAxIDAgMSAwIDIgMGExIDEgMCAxIDAgLTIgMCIgLz48L3N2Zz4=',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: storeState.plugins.ui.flyOut.moreFlyOut.open
    })
  },
  searchToggleButton: {
    type: 'toggleButton',
    id: 'searchToggleButton',
    props: {
      active: false,
      toggleElement: 'rightPanel',
      label: 'Search',
      img: "data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNBNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItc2VhcmNoIj48cGF0aCBzdHJva2U9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTAgMTBtLTcgMGE3IDcgMCAxIDAgMTQgMGE3IDcgMCAxIDAgLTE0IDAiIC8+PHBhdGggZD0iTTIxIDIxbC02IC02IiAvPjwvc3ZnPg=="
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: storeState.plugins.ui.panel.rightPanel.open
    })
  },
  filePickerButton: {
    type: 'toolButton',
    id: 'filePickerButton',
    props: {
      toolName: 'filePicker',
      label: 'Open File',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZmlsZS1pbXBvcnQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xNCAzdjRhMSAxIDAgMCAwIDEgMWg0IiAvPjxwYXRoIGQ9Ik01IDEzdi04YTIgMiAwIDAgMSAyIC0yaDdsNSA1djExYTIgMiAwIDAgMSAtMiAyaC01LjVtLTkuNSAtMmg3bS0zIC0zbDMgM2wtMyAzIiAvPjwvc3ZnPg==',
    },
  },
  downloadButton: {
    type: 'toolButton',
    id: 'downloadButton',
    props: {
      toolName: 'download',
      label: 'Download',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZG93bmxvYWQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDE3djJhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMiAtMnYtMiIgLz48cGF0aCBkPSJNNyAxMWw1IDVsNSAtNSIgLz48cGF0aCBkPSJNMTIgNGwwIDEyIiAvPjwvc3ZnPg==',
    },
  },
  sidebarButton: {
    type: 'toolButton',
    id: 'sidebarButton',
    props: {
      toolName: 'sidebar',
      label: 'Sidebar',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNBNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItbGF5b3V0LXNpZGViYXIiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDRtMCAyYTIgMiAwIDAgMSAyIC0yaDEyYTIgMiAwIDAgMSAyIDJ2MTJhMiAyIDAgMCAxIC0yIDJoLTEyYTIgMiAwIDAgMSAtMiAtMnoiIC8+PHBhdGggZD0iTTkgNGwwIDE2IiAvPjwvc3ZnPg==',
    },
  },
  divider1: {
    type: 'divider',
    id: 'divider1',
  },
  actionTabs: {
    type: 'actionTabs',
    id: 'actionTabs',
    props: {
      targetHeader: 'toolsHeader',
      tabs: [
        { id: 'viewTab', label: 'View', triggerComponent: null },
        { id: 'annotateTab', label: 'Annotate', triggerComponent: 'annotationTools' },
        { id: 'shapesTab', label: 'Shapes', triggerComponent: null }
      ]
    }
  },
  headerStart: {
    id: 'headerStart',
    type: 'groupedItems',
    slots: [
      { componentId: 'menuToggleButton', priority: 0 }, 
      { componentId: 'divider1', priority: 1 }, 
      { componentId: 'sidebarButton', priority: 2 }, 
      { componentId: 'filePickerButton', priority: 3 }, 
      { componentId: 'downloadButton', priority: 4 }, 
      { componentId: 'moreToggleButton', priority: 5 }, 
      { componentId: 'divider1', priority: 6 },
      { componentId: 'zoom', priority: 7 }
    ],  
    props: {
      gap: 10
    }
  },
  headerCenter: {
    id: 'headerCenter',
    type: 'groupedItems',
    slots: [
      { componentId: 'actionTabs', priority: 2 }
    ]
  },
  headerEnd: {
    id: 'headerEnd',
    type: 'groupedItems',
    slots: [
      { componentId: 'searchToggleButton', priority: 2 }
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
      renderChild: null
    },
    props: (initialState) => ({
      placement: 'top',
      visible: initialState.visible,
      renderChild: initialState.renderChild,
      style: {
        backgroundColor: '#f1f3f5',
        justifyContent: 'center'
      }
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      visible: storeState.plugins.ui.header.toolsHeader.visible,
      renderChild: storeState.plugins.ui.header.toolsHeader.renderChild
    }),
    slots: [
      { componentId: 'annotationTools', priority: 0 }
    ],
    getChildContext: (props) => ({
      direction: props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical'
    })
  },
  menuFlyOut: {
    id: 'menuFlyOut',
    type: 'flyOut',
    initialState: {
      open: false,
      triggerElement: null
    },
    props: (initialState) => ({
      open: initialState.open,
      triggerElement: initialState.triggerElement
    }),
    mapStateToProps: (storeState) => ({
      open: storeState.plugins.ui.flyOut.menuFlyOut.open,
      triggerElement: storeState.plugins.ui.flyOut.menuFlyOut.triggerElement
    }),
    slots: []
  },
  moreFlyOut: {
    id: 'moreFlyOut',
    type: 'flyOut',
    initialState: {
      open: false,
      triggerElement: null
    },
    props: (initialState) => ({
      open: initialState.open,
      triggerElement: initialState.triggerElement
    }),
    mapStateToProps: (storeState) => ({
      open: storeState.plugins.ui.flyOut.moreFlyOut.open,
      triggerElement: storeState.plugins.ui.flyOut.moreFlyOut.triggerElement
    }),
    getChildContext: {
      variant: 'flyout'
    },
    slots: [
      { componentId: 'filePickerButton', priority: 0 }, 
      { componentId: 'downloadButton', priority: 1 }
    ]
  },
  leftPanel: {
    id: 'leftPanel',
    type: 'panel',
    initialState: {
      open: false,
      renderChild: null
    },
    props: (initialState) => ({
      open: initialState.open,
      renderChild: initialState.renderChild,
      location: 'left'
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.leftPanel.open,
      renderChild: storeState.plugins.ui.panel.leftPanel.renderChild
    }),
    slots: []
  },
  search: {
    id: 'search',
    type: 'custom',
    render: 'search'
  },
  zoom: {
    id: 'zoom',
    type: 'custom',
    render: 'zoom',
    initialState: {
      zoomLevel: 1
    },
    props: (initialState: any) => ({
      zoomLevel: initialState.zoomLevel
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      zoomLevel: storeState.plugins.zoom.currentZoomLevel
    })
  },
  rightPanel: {
    id: 'rightPanel',
    type: 'panel',
    initialState: {
      open: false,
      renderChild: null
    },
    props: (initialState) => ({
      open: initialState.open,
      renderChild: initialState.renderChild,
      location: 'right'
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.rightPanel.open,
      renderChild: storeState.plugins.ui.panel.rightPanel.renderChild
    }),
    slots: [
      { componentId: 'search', priority: 0 }
    ]
  }
};

// UIPlugin configuration
export const uiConfig: UIPluginConfig = {
  enabled: true,
  components
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
      <div className="flex flex-col h-full w-full">
        <EmbedPDF
          engine={engine}
          onInitialized={async (registry) => {
            const uiCapability = registry.getPlugin<UIPlugin>('ui')?.provides();

            if (uiCapability) {
              uiCapability.registerComponentRenderer('groupedItems', groupedItemsRenderer);
              uiCapability.registerComponentRenderer('toolButton', toolButtonRenderer);
              uiCapability.registerComponentRenderer('toggleButton', toggleButtonRenderer);
              uiCapability.registerComponentRenderer('header', headerRenderer);
              uiCapability.registerComponentRenderer('divider', dividerRenderer);
              uiCapability.registerComponentRenderer('flyOut', flyOutRenderer);
              uiCapability.registerComponentRenderer('actionTabs', actionTabsRenderer);
              uiCapability.registerComponentRenderer('panel', panelRenderer);
              uiCapability.registerComponentRenderer('search', searchRenderer);
              uiCapability.registerComponentRenderer('zoom', zoomRenderer);
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
            /*
            createPluginRegistration(SpreadPluginPackage, { 
              defaultSpreadMode: SpreadMode.None 
            }),
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
          <NavigationWrapper>
            <Viewport style={{ width: '100%', height: '100%', flexGrow: 1, backgroundColor: '#f1f3f5', overflow: 'auto' }}>
              <Scroller />
            </Viewport>
          </NavigationWrapper>
        </EmbedPDF>
      </div>
    </>
  );
}
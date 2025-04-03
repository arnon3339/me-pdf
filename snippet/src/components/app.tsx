import React, { useState, useEffect } from 'preact/compat';
import { h, Fragment } from 'preact';
import styles from '../styles/index.css';
import { EmbedPDF, Viewport } from '@embedpdf/core/preact';
import { createPluginRegistration, PluginRegistry } from '@embedpdf/core';
import { PdfiumEngine } from '@embedpdf/engines';
import { init as initPdfium } from '@embedpdf/pdfium';
import { PdfEngine } from '@embedpdf/models';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { PageManagerPluginPackage } from '@embedpdf/plugin-page-manager';
import { SpreadMode, SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { LayerPluginPackage, createLayerRegistration } from '@embedpdf/plugin-layer';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { RenderLayerPackage } from '@embedpdf/layer-render';
import { ZoomPluginPackage, ZoomMode } from '@embedpdf/plugin-zoom';
import { FlyOutComponent, HeaderComponent, UIComponentType, UIPlugin, UIPluginConfig, UIPluginPackage } from '@embedpdf/plugin-ui';
import { actionTabsRenderer, dividerRenderer, flyOutRenderer, groupedItemsRenderer, headerRenderer, toggleButtonRenderer, toolButtonRenderer } from './renderers';
import { NavigationWrapper } from '@embedpdf/plugin-ui/preact';

// **Configuration Interface**
export interface PDFViewerConfig {
  src: string;
  scrollStrategy?: string;
  zoomMode?: string;
}

// **Singleton Engine Instance**
let engineInstance: PdfEngine | null = null;

// **Initialize the Pdfium Engine**
async function initializeEngine(): Promise<PdfEngine> {
  if (engineInstance) return engineInstance;

  const response = await fetch('/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await initPdfium({ wasmBinary });
  engineInstance = new PdfiumEngine(wasmModule);
  return engineInstance;
}

// **Props for the PDFViewer Component**
interface PDFViewerProps {
  config: PDFViewerConfig;
}

// Define components
export const components: Record<string, UIComponentType> = {
  menuToggleButton: {
    type: 'toggleButton',
    id: 'menuToggleButton',
    props: {
      toggleElement: 'menuFlyOut',
      label: 'Menu',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbi10YWJsZXItbWVudSI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTQgOGwxNiAwIiAvPjxwYXRoIGQ9Ik00IDE2bDE2IDAiIC8+PC9zdmc+',
    },   
  },
  moreToggleButton: {
    type: 'toggleButton',
    id: 'moreToggleButton',
    props: {
      toggleElement: 'moreFlyOut',
      label: 'More',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNBNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZG90cy12ZXJ0aWNhbCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDEybS0xIDBhMSAxIDAgMSAwIDIgMGExIDEgMCAxIDAgLTIgMCIgLz48cGF0aCBkPSJNMTIgMTltLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiAvPjxwYXRoIGQ9Ik0xMiA1bS0xIDBhMSAxIDAgMSAwIDIgMGExIDEgMCAxIDAgLTIgMCIgLz48L3N2Zz4=',
    },
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
      { componentId: 'divider1', priority: 6 }
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
      { componentId: 'sidebarButton', priority: 2 }
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
      gap: 10,
      visible: false
    }
  },
  toolsHeader: {
    type: 'header',
    id: 'toolsHeader',
    props: {
      placement: 'top',
      style: {
        backgroundColor: '#f1f3f5',
        justifyContent: 'center'
      }
    },
    slots: [
      { componentId: 'annotationTools', priority: 0 }
    ],
    getChildContext: (props) => ({
      direction: props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical',
      visibleChild: props.visibleChild
    })
  },
  menuFlyOut: {
    id: 'menuFlyOut',
    type: 'flyOut',
    props: {
      open: false,
    },
    slots: [

    ]
  },
  moreFlyOut: {
    id: 'moreFlyOut',
    type: 'flyOut',
    props: {
      open: false,
    },
    getChildContext: {
      variant: 'flyout'
    },
    slots: [
      { componentId: 'filePickerButton', priority: 0 }, 
      { componentId: 'downloadButton', priority: 1 }
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
    initializeEngine().then(setEngine);
  }, []);

  if (!engine) return <div>Loading...</div>;

  // Map config values to plugin settings
  const scrollStrategy = config.scrollStrategy === 'horizontal' ? ScrollStrategy.Horizontal : ScrollStrategy.Vertical;
  const zoomMode = config.zoomMode === 'fitWidth' ? ZoomMode.FitWidth : ZoomMode.FitPage;

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
            }
          }}
          plugins={(viewportElement: HTMLElement) => [
            createPluginRegistration(UIPluginPackage, uiConfig),
            createPluginRegistration(LoaderPluginPackage, {
              loadingOptions: { 
                source: config.src, 
                id: 'pdf' 
              },
            }),
            createPluginRegistration(ViewportPluginPackage, {
              container: viewportElement,
              viewportGap: 10,
            }),
            createPluginRegistration(ScrollPluginPackage, {
              strategy: scrollStrategy,
            }),
            createPluginRegistration(PageManagerPluginPackage, { 
              pageGap: 10 
            }),
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
          ]}
        >
          <NavigationWrapper>
            <Viewport style={{ width: '100%', height: '100%', flexGrow: 1, backgroundColor: '#f1f3f5' }} />
          </NavigationWrapper>
        </EmbedPDF>
      </div>
    </>
  );
}
import { useRef } from 'react';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { createPluginRegistration } from '@embedpdf/core';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { ZoomMode, ZoomPluginPackage } from '@embedpdf/plugin-zoom';
import { TilingPluginPackage } from '@embedpdf/plugin-tiling';
import { RotatePluginPackage } from '@embedpdf/plugin-rotate';
import { SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { FullscreenPluginPackage } from '@embedpdf/plugin-fullscreen';
import { ExportPluginPackage } from '@embedpdf/plugin-export';
import { RenderPluginPackage } from '@embedpdf/plugin-render';
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager';
import { SelectionPluginPackage } from '@embedpdf/plugin-selection';
import { FilePicker } from '@embedpdf/plugin-loader/react';
import { ThumbnailPluginPackage } from '@embedpdf/plugin-thumbnail';
import { Viewport } from '@embedpdf/plugin-viewport/react';
import { Scroller } from '@embedpdf/plugin-scroll/react';
import { TilingLayer } from '@embedpdf/plugin-tiling/react';
import { Rotate } from '@embedpdf/plugin-rotate/react';
import { FullscreenProvider } from '@embedpdf/plugin-fullscreen/react';
import { Download } from '@embedpdf/plugin-export/react';
import { RenderLayer } from '@embedpdf/plugin-render/react';
import {
  GlobalPointerProvider,
  PagePointerProvider,
} from '@embedpdf/plugin-interaction-manager/react';
import { PanMode } from '@embedpdf/plugin-pan/react';
import { PanPluginPackage } from '@embedpdf/plugin-pan';
import { SelectionLayer } from '@embedpdf/plugin-selection/react';

export default function DocumentViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, isLoading, error } = usePdfiumEngine();

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading || !engine) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden" ref={containerRef}>
      <div className="flex flex-1 overflow-hidden">
        <EmbedPDF
          engine={engine}
          plugins={[
            createPluginRegistration(LoaderPluginPackage, {
              loadingOptions: {
                type: 'url',
                pdfFile: {
                  id: '1',
                  url: 'https://snippet.embedpdf.com/ebook.pdf',
                },
                options: {
                  mode: 'full-fetch',
                },
              },
            }),
            createPluginRegistration(ViewportPluginPackage, {
              viewportGap: 10,
            }),
            createPluginRegistration(ScrollPluginPackage, {
              strategy: ScrollStrategy.Vertical,
            }),
            createPluginRegistration(RenderPluginPackage),
            createPluginRegistration(TilingPluginPackage, {
              tileSize: 768,
              overlapPx: 2.5,
              extraRings: 0,
            }),
            createPluginRegistration(ZoomPluginPackage, {
              defaultZoomLevel: ZoomMode.FitPage,
            }),
            createPluginRegistration(RotatePluginPackage),
            createPluginRegistration(SpreadPluginPackage),
            createPluginRegistration(FullscreenPluginPackage),
            createPluginRegistration(ExportPluginPackage),
            createPluginRegistration(InteractionManagerPluginPackage),
            createPluginRegistration(SelectionPluginPackage),
            createPluginRegistration(PanPluginPackage),
            createPluginRegistration(ThumbnailPluginPackage),
          ]}
        >
          {({ pluginsReady }) => (
            <FullscreenProvider>
              <GlobalPointerProvider>
                <PanMode />
                <Viewport className="h-full w-full flex-1 select-none overflow-auto bg-gray-100">
                  {pluginsReady ? (
                    <Scroller
                      renderPage={({
                        pageIndex,
                        scale,
                        width,
                        height,
                        document,
                        rotation,
                        rotatedWidth,
                        rotatedHeight,
                      }) => (
                        <Rotate key={document?.id} pageSize={{ width, height }}>
                          <PagePointerProvider
                            rotation={rotation}
                            scale={scale}
                            pageWidth={rotatedWidth}
                            pageHeight={rotatedHeight}
                            pageIndex={pageIndex}
                            style={{
                              width,
                              height,
                            }}
                          >
                            <RenderLayer pageIndex={pageIndex} className="pointer-events-none" />
                            <TilingLayer
                              pageIndex={pageIndex}
                              scale={scale}
                              className="pointer-events-none"
                            />
                            <SelectionLayer pageIndex={pageIndex} scale={scale} />
                          </PagePointerProvider>
                        </Rotate>
                      )}
                    />
                  ) : (
                    <div>Loading plugins...</div>
                  )}
                </Viewport>
                <Download />
                <FilePicker />
              </GlobalPointerProvider>
            </FullscreenProvider>
          )}
        </EmbedPDF>
      </div>
    </div>
  );
}

import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { PdfEngine } from '@embedpdf/models';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/react';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/react';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { RenderPluginPackage } from '@embedpdf/plugin-render';
import { RenderLayer } from '@embedpdf/plugin-render/react';
import { TilingPluginPackage } from '@embedpdf/plugin-tiling';
import { TilingLayer } from '@embedpdf/plugin-tiling/react';
import { CircularProgress, Box } from '@mui/material';

interface AppProps {
  engine: PdfEngine;
}

function App({ engine }: AppProps) {
  return (
    <>
      <EmbedPDF
        engine={engine}
        onInitialized={async (initial) => {
          console.log('initial', initial);
        }}
        plugins={[
          createPluginRegistration(LoaderPluginPackage, {
            loadingOptions: {
              type: 'url',
              pdfFile: {
                id: 'pdf',
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
          createPluginRegistration(RenderPluginPackage, {}),
          createPluginRegistration(TilingPluginPackage, {
            tileSize: 768,
            overlapPx: 2.5,
            extraRings: 0,
          }),
        ]}
      >
        {({ pluginsReady }) => (
          <>
            <Viewport
              style={{
                width: '100%',
                height: '100%',
                flexGrow: 1,
                backgroundColor: '#f1f3f5',
                overflow: 'auto',
              }}
            >
              {!pluginsReady && <CircularProgress />}
              {pluginsReady && (
                <Scroller
                  renderPage={({ document, width, height, pageIndex, scale }) => (
                    <Box key={document?.id} sx={{ width, height, position: 'relative' }}>
                      <RenderLayer pageIndex={pageIndex} />
                      <TilingLayer pageIndex={pageIndex} scale={scale} />
                    </Box>
                  )}
                />
              )}
            </Viewport>
          </>
        )}
      </EmbedPDF>
    </>
  );
}

export default App;

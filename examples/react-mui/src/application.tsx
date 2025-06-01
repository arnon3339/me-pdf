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
import { CircularProgress } from '@mui/material';

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
            strategy: ScrollStrategy.Horizontal,
          }),
          createPluginRegistration(RenderPluginPackage, {}),
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
                  renderPage={({ document, width, height, pageIndex }) => (
                    <div key={document?.id} style={{ width, height }}>
                      <RenderLayer pageIndex={pageIndex} />
                    </div>
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

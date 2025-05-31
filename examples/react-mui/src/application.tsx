import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { PdfEngine } from '@embedpdf/models';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/react';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/react';
import { CircularProgress } from '@mui/material';

interface AppProps {
  engine: PdfEngine;
}

function App({ engine }: AppProps) {
  return (
    <>
      <EmbedPDF
        engine={engine}
        onInitialized={async () => {}}
        plugins={[
          createPluginRegistration(ViewportPluginPackage, {
            viewportGap: 10,
          }),
          createPluginRegistration(ScrollPluginPackage, {
            strategy: ScrollStrategy.Horizontal,
          }),
        ]}
      >
        {({ pluginsReady }) => (
          <>
            <Viewport>
              {!pluginsReady && <CircularProgress />}
              {pluginsReady && <Scroller renderPage={() => <div>Hello</div>} />}
            </Viewport>
          </>
        )}
      </EmbedPDF>
    </>
  );
}

export default App;

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
import { ZoomMode, ZoomPluginPackage } from '@embedpdf/plugin-zoom';

import { CircularProgress, Box, AppBar, Toolbar, IconButton, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import BackHandOutlinedIcon from '@mui/icons-material/BackHandOutlined';
import { PageSettingsIcon } from './icons';
import { ZoomControls } from './components/zoom';

interface AppProps {
  engine: PdfEngine;
}

function App({ engine }: AppProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
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
          createPluginRegistration(ZoomPluginPackage, {
            defaultZoomLevel: ZoomMode.FitPage,
          }),
        ]}
      >
        {({ pluginsReady }) => (
          <>
            <AppBar position="static">
              <Toolbar variant="dense" disableGutters sx={{ gap: 1.5, px: 1.5 }}>
                <IconButton edge="start" size="small" color="inherit" aria-label="menu">
                  <MenuIcon fontSize="small" />
                </IconButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ backgroundColor: 'white', my: 1.2, opacity: 0.5 }}
                />
                <IconButton edge="start" size="small" color="inherit" aria-label="menu">
                  <ViewSidebarOutlinedIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <IconButton edge="start" size="small" color="inherit" aria-label="menu">
                  <PageSettingsIcon fontSize="small" />
                </IconButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ backgroundColor: 'white', my: 1.2, opacity: 0.5 }}
                />
                <ZoomControls />
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ backgroundColor: 'white', my: 1.2, opacity: 0.5 }}
                />
                <IconButton edge="start" size="small" color="inherit" aria-label="menu">
                  <BackHandOutlinedIcon fontSize="small" />
                </IconButton>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton edge="start" size="small" color="inherit" aria-label="menu">
                  <SearchOutlinedIcon fontSize="small" />
                </IconButton>
              </Toolbar>
            </AppBar>
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
    </Box>
  );
}

export default App;

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
import { SearchPluginPackage } from '@embedpdf/plugin-search';

import { CircularProgress, Box, AppBar, Toolbar, IconButton, Divider, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import BackHandOutlinedIcon from '@mui/icons-material/BackHandOutlined';
import { useState } from 'react';

import { PageSettingsIcon } from './icons';
import { ZoomControls } from './components/zoom-controls';
import { PageControls } from './components/page-controls';
import { Search } from './components/search';
import { SearchLayer } from '@embedpdf/plugin-search/react';

interface AppProps {
  engine: PdfEngine;
}

const DRAWER_WIDTH = 280; // Width of the sidebars

const plugins = [
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
  createPluginRegistration(SearchPluginPackage, {}),
];

function App({ engine }: AppProps) {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  const toggleLeftDrawer = () => setLeftDrawerOpen(!leftDrawerOpen);
  const toggleRightDrawer = () => setRightDrawerOpen(!rightDrawerOpen);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <EmbedPDF
        engine={engine}
        onInitialized={async (initial) => {
          console.log('initial', initial);
        }}
        plugins={plugins}
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
                <IconButton
                  edge="start"
                  size="small"
                  color="inherit"
                  aria-label="toggle left sidebar"
                  onClick={toggleLeftDrawer}
                >
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
                <IconButton
                  edge="start"
                  size="small"
                  color="inherit"
                  aria-label="toggle search"
                  onClick={toggleRightDrawer}
                >
                  <SearchOutlinedIcon fontSize="small" />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Main content area with sidebars */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
              {/* Left Sidebar */}
              <Drawer
                variant="persistent"
                anchor="left"
                open={leftDrawerOpen}
                slotProps={{
                  paper: {
                    sx: {
                      width: DRAWER_WIDTH,
                      boxSizing: 'border-box',
                      position: 'relative',
                      height: '100%',
                      transition: 'none !important',
                    },
                  },
                }}
                sx={{
                  width: leftDrawerOpen ? DRAWER_WIDTH : 0,
                  flexShrink: 0,
                  transition: 'none',
                }}
              >
                <Box sx={{ p: 2 }}>
                  {/* Add your left sidebar content here */}
                  <h3>Left Sidebar</h3>
                </Box>
              </Drawer>

              {/* Main Viewport */}
              <Box
                sx={{
                  flex: '1 1 0', // grow / shrink, flex-basis 0
                  minWidth: 0, // allow shrinking inside flex row
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
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
                        <Box
                          key={document?.id}
                          sx={{ width, height, position: 'relative', backgroundColor: 'white' }}
                        >
                          <RenderLayer pageIndex={pageIndex} />
                          <TilingLayer pageIndex={pageIndex} scale={scale} />
                          <SearchLayer pageIndex={pageIndex} scale={scale} />
                        </Box>
                      )}
                    />
                  )}
                  <PageControls />
                </Viewport>
              </Box>

              {/* Right Sidebar */}
              <Drawer
                variant="persistent"
                anchor="right"
                open={rightDrawerOpen}
                slotProps={{
                  paper: {
                    sx: {
                      width: DRAWER_WIDTH,
                      boxSizing: 'border-box',
                      position: 'relative',
                      height: '100%',
                      transition: 'none !important',
                    },
                  },
                }}
                sx={{
                  width: rightDrawerOpen ? DRAWER_WIDTH : 0,
                  flexShrink: 0,
                  transition: 'none',
                }}
              >
                <Search />
              </Drawer>
            </Box>
          </>
        )}
      </EmbedPDF>
    </Box>
  );
}

export default App;

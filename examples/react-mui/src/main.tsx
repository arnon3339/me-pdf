import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { WebWorkerEngine } from '@embedpdf/engines/worker';

import App from './application';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

async function run() {
  const worker = new Worker(new URL('./webworker.ts', import.meta.url), { type: 'module' });
  const engine = new WebWorkerEngine(worker);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App engine={engine} />
      </ThemeProvider>
    </StrictMode>,
  );
}

run();

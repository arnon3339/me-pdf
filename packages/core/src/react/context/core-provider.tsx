import React, { createContext, useContext, ReactNode } from 'react';
import { PDFCore } from '../../lib/core';

interface PDFCoreContextValue {
  core: PDFCore;
}

const PDFCoreContext = createContext<PDFCoreContextValue | null>(null);

interface PDFCoreProviderProps {
  core: PDFCore;
  children: ReactNode;
}

export function PDFCoreProvider({ core, children }: PDFCoreProviderProps) {
  return (
    <PDFCoreContext.Provider value={{ core }}>
      {children}
    </PDFCoreContext.Provider>
  );
}

export function usePDFCore() {
  const context = useContext(PDFCoreContext);
  if (!context) {
    throw new Error('usePDFCore must be used within a PDFCoreProvider');
  }
  return context.core;
}
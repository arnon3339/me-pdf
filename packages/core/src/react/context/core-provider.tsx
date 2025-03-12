import React, { createContext, useContext, ReactNode } from 'react';

export function PDFCoreProvider({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}
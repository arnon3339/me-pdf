'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import EmbedPDF from "@embedpdf/snippet";

export default function PDFViewer() {
  const viewerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      EmbedPDF.init({
        type: 'container',
        target: node,
        src: '/ebook.pdf',
        wasmUrl: '/wasm/pdfium.wasm',
      })
    }
  }, []);

  return (
    <div id="pdf-viewer" style={{ height: '500px' }} ref={viewerRef} />
  )
}
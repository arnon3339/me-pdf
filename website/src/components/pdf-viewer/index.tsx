'use client'

import React, { useMemo, useState, useEffect, useRef } from "react";
import EmbedPDF from "@embedpdf/snippet";

export default function PDFViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<ReturnType<typeof EmbedPDF.init> | null>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    if (instance) return;

    const EPDFinstance = EmbedPDF.init({
      type: 'container',
      target: ref.current,
      src: '/ebook.pdf',
      wasmUrl: '/wasm/pdfium.wasm',
    }) 

    if(EPDFinstance) {
      setInstance(EPDFinstance);
    }
  }, []);

  return (
    <div id="pdf-viewer" style={{ height: '500px' }} ref={ref} />
  )
}
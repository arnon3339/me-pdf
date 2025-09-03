import { useEngine } from '@embedpdf/engines/react'
import { useEffect } from 'react'

export const PdfMetadataEditor = () => {
  const engine = useEngine()

  useEffect(() => {
    engine?.closeAllDocuments()
  }, [engine])

  return <div>PdfMetadataEditor</div>
}

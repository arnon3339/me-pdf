import { PdfMetadataEditorTool } from '@/components/tools/pdf-metadata-editor/pdf-metadata-editor-tool'

export const metadata = {
  title: 'PDF Metadata Editor - EmbedPDF Tools',
  description:
    'Edit PDF document properties and metadata directly in your browser.',
}

export default function PdfMetadataEditorPage() {
  return <PdfMetadataEditorTool />
}

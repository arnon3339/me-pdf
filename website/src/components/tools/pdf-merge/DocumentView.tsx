'use client'

import React, { useCallback } from 'react'
import { DocumentWithPages, DocumentPage } from './types'
import { VirtualScroller } from './VirtualScroller'
import { Button } from '../../button'
import { PdfEngine } from '@embedpdf/models'

interface DocumentViewProps {
  documents: Record<string, DocumentWithPages>
  onUpdatePages: (docId: string, updates: DocumentPage[]) => void
  onAddSelectedPages: () => void
  onCloseDocument: (docId: string) => void
  engine: PdfEngine
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  documents,
  onUpdatePages,
  onAddSelectedPages,
  onCloseDocument,
  engine
}) => {

  // Batch select/deselect all pages
  const handleBulkSelection = useCallback((docId: string, shouldSelect: boolean) => {
    const doc = documents[docId];
    if (!doc) return;

    // Create a single update with all pages
    const updatedPages = doc.pages.map(page => ({
      ...page,
      selected: shouldSelect
    }));

    // Send one batch update
    onUpdatePages(docId, updatedPages);
  }, [documents, onUpdatePages]);

  if (Object.keys(documents).length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-md bg-gray-50">
        <p className="text-gray-500">Upload PDFs to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(documents).map(([docId, { doc, pages }]) => (
        <div key={docId} className="border rounded-md p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                Document {docId.substring(0, 6)} ({pages.length} pages)
              </h3>
              <Button
                onClick={() => onCloseDocument(docId)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
                title="Close document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleBulkSelection(docId, true)}
                className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Select All
              </Button>
              <Button
                onClick={() => handleBulkSelection(docId, false)}
                className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Deselect All
              </Button>
            </div>
          </div>
          
          <VirtualScroller
            items={pages}
            onUpdatePages={(updatedPages) => onUpdatePages(docId, updatedPages)}
            engine={engine}
            doc={doc}
          />
          
          <div className="mt-3 flex justify-end">
            <Button
              onClick={onAddSelectedPages}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!pages.some(page => page.selected)}
            >
              Add Selected Pages
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
} 
'use client'

import React, { useEffect, useState } from 'react'
import { useEngine } from '@embedpdf/engines/react'
import { PdfDocumentObject, PdfMetadataObject, uuidV4 } from '@embedpdf/models'
import { ToolLayout } from '../shared/tool-layout'
import { FilePicker } from '../shared/file-picker'
import { LoadingState } from '../shared/loading-state'
import { MetadataForm } from './metadata-form'
import { MetadataResult } from './metadata-result'

interface DocumentWithMetadata {
  doc: PdfDocumentObject
  metadata: PdfMetadataObject
  fileName: string
}

export const PdfMetadataEditorTool = () => {
  const engine = useEngine()
  const [document, setDocument] = useState<DocumentWithMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [modifiedPdf, setModifiedPdf] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (engine) {
        engine.closeAllDocuments().wait(
          () => console.log('Documents closed successfully'),
          (error) => console.error('Error closing documents:', error),
        )
      }
    }
  }, [engine])

  const handleFileSelect = async (files: File[]) => {
    if (!engine || files.length === 0) return

    const file = files[0] // Only handle single file
    setIsLoading(true)
    setError(null)

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Load document
      const doc = await engine
        .openDocumentBuffer({
          id: uuidV4(),
          content: arrayBuffer,
        })
        .toPromise()

      // Get metadata
      const metadata = await engine.getMetadata(doc).toPromise()

      setDocument({
        doc,
        metadata,
        fileName: file.name,
      })
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMetadataUpdate = async (
    updatedMetadata: Partial<PdfMetadataObject>,
  ) => {
    if (!engine || !document) return

    setIsLoading(true)
    setError(null)

    try {
      // Update metadata
      await engine
        .setMetadata(document.doc, {
          ...document.metadata,
          modificationDate: new Date(),
        })
        .toPromise()

      // Save document
      const savedDoc = await engine.saveAsCopy(document.doc).toPromise()

      // Create download URL
      const blob = new Blob([savedDoc], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setModifiedPdf(url)

      // Update local metadata state
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              metadata: { ...prev.metadata, ...updatedMetadata },
            }
          : null,
      )
    } catch (err) {
      console.error('Error updating metadata:', err)
      setError('Failed to update metadata. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetTool = () => {
    if (engine && document) {
      engine.closeDocument(document.doc).wait(
        () => console.log('Document closed'),
        (error) => console.error('Error closing document:', error),
      )
    }

    setDocument(null)
    setModifiedPdf(null)
    setError(null)
  }

  return (
    <ToolLayout
      title="Edit PDF Metadata"
      subtitle="right in your browser"
      description="Securely edit PDF document properties and metadata - your files never leave your device."
      badgeText="PDF Metadata Editor"
      badgeColor="border-purple-200 bg-purple-50 text-purple-800"
    >
      {!engine ? (
        <LoadingState />
      ) : error ? (
        <div className="mb-12 text-center">
          <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      ) : modifiedPdf ? (
        <MetadataResult
          modifiedPdfUrl={modifiedPdf}
          fileName={document?.fileName || 'document'}
          onReset={resetTool}
        />
      ) : !document ? (
        <FilePicker
          onFileSelect={handleFileSelect}
          multiple={false}
          buttonText="Choose PDF File"
          helperText="Select a PDF file to view and edit its metadata."
          disabled={isLoading}
        />
      ) : (
        <MetadataForm
          metadata={document.metadata}
          fileName={document.fileName}
          onUpdate={handleMetadataUpdate}
          onReset={resetTool}
          isLoading={isLoading}
        />
      )}
    </ToolLayout>
  )
}

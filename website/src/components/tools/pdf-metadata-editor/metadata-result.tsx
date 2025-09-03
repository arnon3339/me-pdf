'use client'

import React from 'react'
import { Download, RotateCcw, CheckCircle } from 'lucide-react'

interface MetadataResultProps {
  modifiedPdfUrl: string
  fileName: string
  onReset: () => void
}

export const MetadataResult = ({
  modifiedPdfUrl,
  fileName,
  onReset,
}: MetadataResultProps) => {
  const downloadFileName = fileName.replace(/\.pdf$/i, '_metadata_updated.pdf')

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        Metadata Updated Successfully!
      </h2>

      <p className="mb-8 text-gray-600">
        Your PDF metadata has been updated. Download the modified file below.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <a
          href={modifiedPdfUrl}
          download={downloadFileName}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Updated PDF
        </a>

        <button
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 hover:bg-gray-50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Edit Another PDF
        </button>
      </div>
    </div>
  )
}

'use client'

import React from 'react'

interface MergeResultProps {
  mergedPdfUrl: string
  onReset: () => void
}

export const MergeResult: React.FC<MergeResultProps> = ({ 
  mergedPdfUrl, 
  onReset 
}) => {
  return (
    <div className="mb-6 p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">Your merged PDF is ready!</h2>
      <div className="flex space-x-4">
        <a
          href={mergedPdfUrl}
          download="merged-document.pdf"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Download PDF
        </a>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
        >
          Create Another
        </button>
      </div>
    </div>
  )
} 
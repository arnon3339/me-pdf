'use client'

import React, { useState } from 'react'
import { PdfMetadataObject } from '@embedpdf/models'

interface MetadataFormProps {
  metadata: PdfMetadataObject
  fileName: string
  onUpdate: (metadata: Partial<PdfMetadataObject>) => void
  onReset: () => void
  isLoading: boolean
}

export const MetadataForm = ({
  metadata,
  fileName,
  onUpdate,
  onReset,
  isLoading,
}: MetadataFormProps) => {
  const [formData, setFormData] = useState({
    title: metadata.title || '',
    author: metadata.author || '',
    subject: metadata.subject || '',
    keywords: metadata.keywords || '',
    creator: metadata.creator || '',
    producer: metadata.producer || '',
  })

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert empty strings to null for the API
    const updates: Partial<PdfMetadataObject> = {
      title: formData.title.trim() || null,
      author: formData.author.trim() || null,
      subject: formData.subject.trim() || null,
      keywords: formData.keywords.trim() || null,
      creator: formData.creator.trim() || null,
      producer: formData.producer.trim() || null,
    }

    onUpdate(updates)
  }

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleString() : 'Not set'
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-lg bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">Editing: {fileName}</h3>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Editable Fields */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Edit Metadata</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    handleInputChange(
                      key as keyof typeof formData,
                      e.target.value,
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Metadata'}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Start Over
              </button>
            </div>
          </form>
        </div>

        {/* Read-only Information */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold">Document Information</h3>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Creation Date:</span>
              <span className="ml-2 text-gray-600">
                {formatDate(metadata.creationDate)}
              </span>
            </div>
            <div>
              <span className="font-medium">Modification Date:</span>
              <span className="ml-2 text-gray-600">
                {formatDate(metadata.modificationDate)}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Producer:</span>
              <span className="ml-2 text-gray-600">
                {metadata.producer || 'Not set'}
              </span>
            </div>
            {metadata.trapped && (
              <div>
                <span className="font-medium">Trapped:</span>
                <span className="ml-2 text-gray-600">{metadata.trapped}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { PdfMetadataObject, PdfTrappedStatus } from '@embedpdf/models'

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

  const [trapped, setTrapped] = useState<PdfTrappedStatus | null>(
    metadata.trapped,
  )
  const [customFields, setCustomFields] = useState<
    Record<string, string | null>
  >(metadata.custom || {})
  const [newCustomKey, setNewCustomKey] = useState('')
  const [newCustomValue, setNewCustomValue] = useState('')

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const addCustomField = () => {
    if (
      newCustomKey.trim() &&
      !customFields.hasOwnProperty(newCustomKey.trim())
    ) {
      setCustomFields((prev) => ({
        ...prev,
        [newCustomKey.trim()]: newCustomValue,
      }))
      setNewCustomKey('')
      setNewCustomValue('')
    }
  }

  const removeCustomField = (key: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [key]: null, // Set to null instead of deleting the key
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
      trapped,
      custom: Object.fromEntries(
        Object.entries(customFields).map(([key, value]) => [
          key,
          value?.trim() || null,
        ]),
      ),
    }

    onUpdate(updates)
  }

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleString() : 'Not set'
  }

  const trappedOptions = [
    { value: PdfTrappedStatus.NotSet, label: 'Not set' },
    { value: PdfTrappedStatus.True, label: 'True' },
    { value: PdfTrappedStatus.False, label: 'False' },
    { value: PdfTrappedStatus.Unknown, label: 'Unknown' },
  ]

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
            {/* Standard fields */}
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

            {/* Trapped dropdown */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Trapped
              </label>
              <select
                value={trapped === null ? '' : trapped.toString()}
                onChange={(e) =>
                  setTrapped(
                    e.target.value === '' ? null : parseInt(e.target.value),
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {trappedOptions.map(({ value, label }) => (
                  <option
                    key={value === null ? 'null' : value.toString()}
                    value={value === null ? '' : value.toString()}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom fields */}
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">
                Custom Fields
              </h4>

              {/* Existing custom fields */}
              {Object.entries(customFields)
                .filter(([_, value]) => value !== null) // Only show non-null fields
                .map(([key, value]) => (
                  <div key={key} className="mb-3 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-gray-600">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) =>
                          handleCustomFieldChange(key, e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(key)}
                      className="whitespace-nowrap rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}

              {/* Add new custom field */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <h5 className="mb-2 text-xs font-medium text-gray-700">
                  Add Custom Field
                </h5>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomKey}
                      onChange={(e) => setNewCustomKey(e.target.value)}
                      placeholder="Field name"
                      className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newCustomValue}
                      onChange={(e) => setNewCustomValue(e.target.value)}
                      placeholder="Field value"
                      className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomField}
                    disabled={!newCustomKey.trim()}
                    className="w-full rounded-md bg-green-100 px-3 py-2 text-sm text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

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
          <h3 className="mb-4 text-lg font-semibold">
            Current Values (Live Preview)
          </h3>

          <div className="space-y-3 text-sm">
            {/* Standard fields */}
            {formData.title && (
              <div>
                <span className="font-medium">Title:</span>
                <span className="ml-2 text-gray-600">{formData.title}</span>
              </div>
            )}
            {formData.author && (
              <div>
                <span className="font-medium">Author:</span>
                <span className="ml-2 text-gray-600">{formData.author}</span>
              </div>
            )}
            {formData.subject && (
              <div>
                <span className="font-medium">Subject:</span>
                <span className="ml-2 text-gray-600">{formData.subject}</span>
              </div>
            )}
            {formData.keywords && (
              <div>
                <span className="font-medium">Keywords:</span>
                <span className="ml-2 text-gray-600">{formData.keywords}</span>
              </div>
            )}
            {formData.creator && (
              <div>
                <span className="font-medium">Creator:</span>
                <span className="ml-2 text-gray-600">{formData.creator}</span>
              </div>
            )}
            {formData.producer && (
              <div>
                <span className="font-medium">Producer:</span>
                <span className="ml-2 text-gray-600">{formData.producer}</span>
              </div>
            )}

            {/* Trapped status */}
            {trapped !== null && (
              <div>
                <span className="font-medium">Trapped Status:</span>
                <span className="ml-2 text-gray-600">
                  {trappedOptions.find((opt) => opt.value === trapped)?.label}
                </span>
              </div>
            )}

            {/* Date fields (read-only from metadata) */}
            {metadata.creationDate && (
              <div>
                <span className="font-medium">Creation Date:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(metadata.creationDate)}
                </span>
              </div>
            )}
            {metadata.modificationDate && (
              <div>
                <span className="font-medium">Modification Date:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(metadata.modificationDate)}
                </span>
              </div>
            )}

            {/* Custom fields (real-time) */}
            {Object.entries(customFields)
              .filter(([_, value]) => value !== null && value?.trim())
              .map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span>
                  <span className="ml-2 text-gray-600">{value}</span>
                </div>
              ))}

            {/* Show message if no fields have values */}
            {!formData.title &&
              !formData.author &&
              !formData.subject &&
              !formData.keywords &&
              !formData.creator &&
              !formData.producer &&
              trapped === null &&
              !metadata.creationDate &&
              !metadata.modificationDate &&
              Object.entries(customFields).filter(
                ([_, value]) => value !== null && value?.trim(),
              ).length === 0 && (
                <div className="italic text-gray-500">
                  No metadata fields have values
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

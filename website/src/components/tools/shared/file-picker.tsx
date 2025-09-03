'use client'

import React from 'react'

interface FilePickerProps {
  onFileSelect: (files: File[]) => void
  accept?: string
  multiple?: boolean
  buttonText?: string
  helperText?: string
  disabled?: boolean
}

export const FilePicker = ({
  onFileSelect,
  accept = '.pdf',
  multiple = false,
  buttonText = 'Choose PDF Files',
  helperText = 'All processing happens locally in your browser for complete privacy.',
  disabled = false,
}: FilePickerProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      onFileSelect(files)
    }
    // Reset the input
    event.target.value = ''
  }

  const inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mb-12 text-center">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
        disabled={disabled}
      />
      <button
        onClick={() => document.getElementById(inputId)?.click()}
        disabled={disabled}
        className="cursor-pointer rounded-full bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-3 text-sm font-medium text-white transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonText}
      </button>
      <p className="mt-6 text-sm text-gray-500">{helperText}</p>
    </div>
  )
}

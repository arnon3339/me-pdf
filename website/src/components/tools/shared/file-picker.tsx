'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PdfEngine, PdfDocumentObject, uuidV4 } from '@embedpdf/models'
import { Lock, Upload, AlertCircle } from 'lucide-react'

export interface DocumentWithFile {
  doc: PdfDocumentObject
  fileName: string
}

type PendingFile = {
  id: string
  file: File
  needsPassword: boolean
  password: string
  isValidated?: boolean
  hasFailedAttempt?: boolean
}

interface FilePickerProps {
  engine: PdfEngine | null
  onDocumentSelect: (docs: DocumentWithFile[]) => void
  accept?: string
  multiple?: boolean
  buttonText?: string
  helperText?: string
  disabled?: boolean
  gradientColor?: string
}

export const FilePicker = ({
  engine,
  onDocumentSelect,
  accept = '.pdf',
  multiple = false,
  buttonText = 'Choose PDF Files',
  helperText = 'All processing happens locally in your browser for complete privacy.',
  disabled = false,
  gradientColor = 'from-blue-600 to-teal-500',
}: FilePickerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [loadedDocuments, setLoadedDocuments] = useState<DocumentWithFile[]>([])

  // Refs that always hold latest state (for sequencing after async steps)
  const pendingRef = useRef(pendingFiles)
  const loadedRef = useRef(loadedDocuments)
  useEffect(() => {
    pendingRef.current = pendingFiles
  }, [pendingFiles])
  useEffect(() => {
    loadedRef.current = loadedDocuments
  }, [loadedDocuments])

  // Fire onDocumentSelect exactly once when everything is processed successfully
  const selectionComplete =
    pendingFiles.length === 0 && loadedDocuments.length > 0
  const hasFiredRef = useRef(false)
  useEffect(() => {
    if (selectionComplete && !hasFiredRef.current) {
      hasFiredRef.current = true
      onDocumentSelect(loadedRef.current)
    }
    if (!selectionComplete) {
      hasFiredRef.current = false
    }
  }, [selectionComplete, onDocumentSelect])

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Reset
    setError(null)
    setLoadedDocuments([])
    hasFiredRef.current = false

    // Initialize pending files with stable ids
    const initialPending: PendingFile[] = files.map((file) => ({
      id: uuidV4(),
      file,
      needsPassword: false,
      password: '',
      isValidated: false,
      hasFailedAttempt: false,
    }))
    setPendingFiles(initialPending)
    // >>> Add this line so processFiles can see them immediately
    pendingRef.current = initialPending

    // Start processing all
    await processFiles(initialPending.map((p) => p.id))

    // Reset the input
    event.target.value = ''
  }

  /**
   * Process a subset of pending files by id (can be one or many).
   * - Removes only the successfully processed files from pending.
   * - Marks password-needed ones without removing them.
   * - Does NOT overwrite unrelated pending entries.
   */
  const processFiles = async (pendingIds: string[]) => {
    if (!engine) {
      setError('PDF engine not initialized. Please wait and try again.')
      return
    }

    if (pendingIds.length === 0) return

    setIsLoading(true)

    const successes: {
      id: string
      fileName: string
      doc: PdfDocumentObject
    }[] = []
    const pwUpdates: Map<string, Partial<PendingFile>> = new Map()

    for (const id of pendingIds) {
      const item = pendingRef.current.find((p) => p.id === id)
      if (!item) continue

      try {
        const arrayBuffer = await item.file.arrayBuffer()
        const doc = await engine
          .openDocumentBuffer(
            { id: uuidV4(), content: arrayBuffer },
            { password: item.password || undefined },
          )
          .toPromise()

        successes.push({ id: item.id, fileName: item.file.name, doc })
      } catch (err: any) {
        console.error('Error loading PDF:', err)
        const reason = err?.reason || err

        // Pdfium password error code = 4
        if (reason?.code === 4) {
          // Mark as needing password; mark failed only if a password was supplied
          pwUpdates.set(item.id, {
            needsPassword: true,
            isValidated: false,
            hasFailedAttempt: Boolean(item.password?.trim()),
          })
          continue
        }

        // Other error — leave it in pending (so user can cancel + reselect)
        setError(
          `Failed to load "${item.file.name}": ${reason?.message || 'Unknown error'}`,
        )
        setIsLoading(false)
        return
      }
    }

    // Apply state updates in one go

    if (successes.length > 0) {
      setLoadedDocuments((prev) => [
        ...prev,
        ...successes.map((s) => ({ doc: s.doc, fileName: s.fileName })),
      ])
    }

    setPendingFiles((prev) => {
      // First apply password-needed updates
      let next = prev.map((p) => {
        const upd = pwUpdates.get(p.id)
        return upd ? { ...p, ...upd } : p
      })

      // Then remove successes (only those)
      if (successes.length > 0) {
        const successIds = new Set(successes.map((s) => s.id))
        next = next.filter((p) => !successIds.has(p.id))
      }

      return next
    })

    setIsLoading(false)
  }

  const handlePasswordChange = (id: string, password: string) => {
    setPendingFiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, password } : p)),
    )
  }

  const handlePasswordSubmit = async (id: string) => {
    const item = pendingRef.current.find((p) => p.id === id)
    if (!item || !item.password.trim()) return

    setLoadingFileId(id)
    await processFiles([id])
    setLoadingFileId(null)
  }

  const handleRetry = () => {
    setError(null)
    setPendingFiles([])
    setLoadedDocuments([])
    hasFiredRef.current = false
  }

  const inputId = useMemo(
    () => `file-input-${Math.random().toString(36).slice(2, 9)}`,
    [],
  )

  // UI: when any file needs password, show the unlock UI
  if (pendingFiles.some((f) => f.needsPassword)) {
    return (
      <div className="mb-12">
        <div className="mx-auto max-w-md space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Password Required
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {pendingFiles.filter((f) => f.needsPassword).length === 1
                ? 'This PDF is password protected. Please enter the password to continue.'
                : 'Some PDFs are password protected. Please enter the passwords to continue.'}
            </p>
          </div>

          {pendingFiles.map(
            (file) =>
              file.needsPassword && (
                <div
                  key={file.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Password for "{file.file.name}"
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={file.password}
                        onChange={(e) =>
                          handlePasswordChange(file.id, e.target.value)
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handlePasswordSubmit(file.id)
                        }
                        placeholder="Enter password..."
                        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                          file.isValidated
                            ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500'
                            : file.hasFailedAttempt
                              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        disabled={isLoading || file.isValidated}
                      />
                      {file.isValidated && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                          <svg
                            className="h-5 w-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {file.isValidated && (
                      <p className="mt-1 text-xs text-green-600">
                        Password correct ✓
                      </p>
                    )}
                    {file.hasFailedAttempt && !file.isValidated && (
                      <p className="mt-1 text-xs text-red-600">
                        Incorrect password
                      </p>
                    )}
                  </div>
                  {!file.isValidated && (
                    <button
                      onClick={() => handlePasswordSubmit(file.id)}
                      disabled={
                        isLoading ||
                        !file.password.trim() ||
                        loadingFileId === file.id
                      }
                      className={`w-full rounded-md bg-gradient-to-r ${gradientColor} px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {loadingFileId === file.id
                        ? 'Unlocking...'
                        : 'Unlock PDF'}
                    </button>
                  )}
                </div>
              ),
          )}

          <div className="text-center">
            <button
              onClick={handleRetry}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel and select different files
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
        <button
          onClick={handleRetry}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    )
  }

  // Main picker
  return (
    <div className="mb-12 text-center">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
        disabled={disabled || isLoading || !engine}
      />
      <button
        onClick={() => document.getElementById(inputId)?.click()}
        disabled={disabled || isLoading || !engine}
        className={`inline-flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r ${gradientColor} px-8 py-4 text-base font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Upload className="h-5 w-5" />
        {isLoading ? 'Loading...' : buttonText}
      </button>

      <p className="mt-6 text-sm text-gray-500">{helperText}</p>

      {!engine && (
        <p className="mt-2 text-xs text-amber-600">
          Initializing PDF engine...
        </p>
      )}
    </div>
  )
}

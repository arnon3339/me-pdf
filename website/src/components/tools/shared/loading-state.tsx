'use client'

import React from 'react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState = ({
  message = 'Loading PDF engine...',
}: LoadingStateProps) => {
  return (
    <div className="mb-12 text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

'use client'

import React, { ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  subtitle: string
  description: string
  badgeText: string
  badgeColor?: string
  children: ReactNode
}

export const ToolLayout = ({
  title,
  subtitle,
  description,
  badgeText,
  badgeColor = 'border-blue-200 bg-blue-50 text-blue-800',
  children,
}: ToolLayoutProps) => {
  return (
    <div className="py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section - Always visible */}
        <div className="mb-12 text-center">
          <div
            className={`mb-6 inline-block rounded-full border px-6 py-2 text-sm font-medium ${badgeColor}`}
          >
            {badgeText}
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-gray-900 md:text-5xl">
            {title}
            <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              {subtitle}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            {description}
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import {
  ArrowRight,
  MergeIcon,
  EditIcon,
  Shield,
  Github,
  Lock,
  Eye,
  Server,
  Cookie,
} from 'lucide-react'
import { Scribble3 } from './icons/scribble3'
import { PrivacyStatement } from './tools/shared/privacy-statement'
import Link from 'next/link'

const tools = [
  {
    title: 'PDF Merge Tool',
    description:
      'Combine multiple PDFs into a single document with custom page ordering',
    icon: <MergeIcon className="h-6 w-6 text-white" />,
    href: '/tools/pdf-merge',
    color: 'from-purple-600 to-blue-700',
  },
  {
    title: 'PDF Metadata Editor',
    description:
      'Edit PDF document properties, title, author, and other metadata fields',
    icon: <EditIcon className="h-6 w-6 text-white" />,
    href: '/tools/pdf-metadata-editor',
    color: 'from-purple-600 to-pink-700',
  },
  // Add more tools here as they are created
]

const privacyFeatures = [
  {
    icon: <Server className="h-5 w-5" />,
    title: 'No File Uploads',
    description:
      'All processing happens locally in your browser - files never leave your device',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Zero Tracking',
    description:
      'No analytics, no tracking scripts, no data collection whatsoever',
  },
  {
    icon: <Cookie className="h-5 w-5" />,
    title: 'No Cookies',
    description: "We don't store any cookies or persistent data on your device",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: 'Open Source',
    description:
      'Full transparency - inspect our code and verify our privacy claims',
  },
]

// Animated background component from documentation-overview
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="animate-blob absolute left-10 top-20 h-64 w-64 rounded-full bg-purple-500 opacity-10 mix-blend-multiply blur-3xl filter"></div>
      <div className="animate-blob animation-delay-2000 absolute right-10 top-40 h-72 w-72 rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-3xl filter"></div>
      <div className="animate-blob animation-delay-4000 absolute bottom-32 left-20 h-80 w-80 rounded-full bg-teal-500 opacity-10 mix-blend-multiply blur-3xl filter"></div>
      <div className="bg-grid-pattern opacity-3 absolute inset-0"></div>
    </div>
  )
}

// Privacy banner component
const PrivacyBanner = ({ className }: { className?: string }) => {
  return (
    <div
      className={`relative mb-16 overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 shadow-xl ${className}`}
    >
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-green-200 opacity-20"></div>
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-emerald-300 opacity-15"></div>

      <div className="relative">
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
            Your Privacy is Our Priority
          </h2>
          <p className="mb-8 text-lg text-gray-700">
            Complete privacy and transparency - that's our promise to you
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                <div className="text-green-600">{feature.icon}</div>
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4 text-green-600" />
            <span>100% Client-Side Processing</span>
          </div>
          <div className="hidden h-4 w-px bg-gray-300 sm:block"></div>
          <a
            href="https://github.com/embedpdf/embed-pdf-viewer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-gray-800"
          >
            <Github className="h-4 w-4" />
            <span>View Source Code</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ToolsOverview() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="pb-16 pt-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-16 text-center">
            <div className="mb-6 inline-block rounded-full border border-blue-200 bg-blue-50 px-6 py-2 text-sm font-medium text-blue-800">
              PDF Tools
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-gray-900 md:text-5xl">
              <span className="relative inline-block">
                <span className="relative z-10">Free browser-based tools</span>
                <div className="absolute bottom-1 left-0 right-0 -z-10 h-4 -rotate-1 transform opacity-50">
                  <Scribble3 color="#bedbff" />
                </div>
              </span>
              <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                for your PDF documents
              </span>
            </h1>
            <div className="mx-auto max-w-4xl">
              <p className="mb-4 text-xl text-gray-600">
                Simple and powerful tools to help you work with PDF files
                directly in your browser
              </p>
              <PrivacyStatement className="mt-6" />
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${tool.color} rounded-2xl opacity-10 blur transition duration-300 group-hover:opacity-30`}
                ></div>
                <Link href={tool.href} className="relative block">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-md">
                    <div
                      className={`h-12 w-12 rounded-lg bg-gradient-to-br ${tool.color} mb-4 flex items-center justify-center text-2xl`}
                    >
                      {tool.icon}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {tool.title}
                    </h3>
                    <p className="mb-6 text-gray-600">{tool.description}</p>
                    <div className="mt-auto">
                      <div
                        className={`inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 ${tool.color} text-sm font-medium text-white transition-shadow hover:shadow-md`}
                      >
                        Try Tool
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { ArrowRight, MergeIcon } from 'lucide-react'
import { Scribble3 } from './icons/scribble3'
import Link from 'next/link'

const tools = [
  {
    title: 'PDF Merge Tool',
    description: 'Combine multiple PDFs into a single document with custom page ordering',
    icon: <MergeIcon className="h-6 w-6 text-white" />,
    href: '/tools/pdf-merge',
    color: 'from-purple-600 to-blue-700',
  },
  // Add more tools here as they are created
]

// Animated background component from documentation-overview
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-32 left-20 w-80 h-80 bg-teal-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
    </div>
  )
}

export default function ToolsOverview() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="pt-20 pb-16 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-24">
            <div className="inline-block px-6 py-2 border border-blue-200 rounded-full bg-blue-50 text-blue-800 text-sm font-medium mb-6">
              PDF Tools
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              <span className="relative inline-block">
                <span className="relative z-10">Free browser-based tools</span>
                <div className="absolute bottom-1 left-0 right-0 h-4 opacity-50 -z-10 transform -rotate-1">
                  <Scribble3 color="#bedbff" />
                </div>
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                for your PDF documents
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple and powerful tools to help you work with PDF files directly in your browser
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <div key={index} className="group relative">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${tool.color} rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-300`}></div>
                <Link href={tool.href} className="relative block">
                  <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-md overflow-hidden p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-4`}>
                      {tool.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {tool.description}
                    </p>
                    <div className="mt-auto">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${tool.color} text-white font-medium text-sm hover:shadow-md transition-shadow`}>
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

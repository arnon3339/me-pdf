'use client'
import React, { useState, useEffect } from 'react'
import {
  ArrowRight,
  Menu,
  X,
  Code,
  ChevronDown,
  Download,
  ExternalLink,
  Github,
  ArrowDown,
  MousePointer2,
  Heart,
} from 'lucide-react'
import { JavaScript } from '@/components/icons/javascript'
import { Typescript } from '@/components/icons/typescript'
import { Scribble2 } from '@/components/icons/scribble2'
import Link from 'next/link'
import PDFViewer from './pdf-viewer'

// Animated blobs for the background
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Purple blob */}
      <div className="top-70 animate-blob absolute left-8 h-64 w-64 rounded-full bg-purple-500 opacity-10 mix-blend-multiply blur-3xl filter"></div>

      {/* Blue blob */}
      <div className="animate-blob animation-delay-2000 absolute -right-8 top-32 h-80 w-80 rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-3xl filter"></div>

      {/* Orange blob */}
      <div className="animate-blob animation-delay-4000 absolute bottom-24 left-20 h-72 w-72 rounded-full bg-orange-400 opacity-10 mix-blend-multiply blur-3xl filter"></div>

      {/* Subtle grid pattern */}
      <div className="bg-grid-pattern absolute inset-0 opacity-5"></div>
    </div>
  )
}

const HeaderAndHero = () => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="pb-16 pt-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-block rounded-full border border-purple-200 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-800">
                Open Source & Framework Agnostic
              </div>

              <h1 className="md:text-7xl text-5xl font-black leading-tight tracking-tight text-gray-900 sm:text-6xl">
                <span className="relative inline-block">
                  <span className="relative z-10">Embed PDF files</span>
                  <div className="absolute bottom-1 left-0 right-0 -z-10 h-4 -rotate-1 transform opacity-50">
                    <Scribble2 color="#765ba7" />
                  </div>
                </span>
                <br />
                <span className="">without the pain</span>
              </h1>

              <p className="relative mx-auto mt-8 max-w-2xl text-xl text-gray-600">
                A lightweight, customizable PDF viewer that works seamlessly
                with any JavaScript project. No dependencies, no hassle.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <Link
                  href="/docs"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-900 px-8 py-4 text-base font-medium text-white shadow-xl"
                >
                  <span className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 opacity-0 transition-opacity group-hover:opacity-100"></span>
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>

                <a
                  href="https://github.com/embedpdf/embed-pdf-viewer"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center px-5 py-3 text-base font-medium text-gray-700 transition-all hover:text-gray-900"
                >
                  <div className="flex items-center space-x-2 border-b border-dashed border-gray-300 group-hover:border-gray-600">
                    <Github />
                    <span>Source on GitHub</span>
                  </div>
                </a>
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center bg-white">
                    <JavaScript />
                  </div>
                  <div className="mt-2 text-sm font-medium">JavaScript</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center bg-white">
                    <Typescript />
                  </div>
                  <div className="mt-2 text-sm font-medium">TypeScript</div>
                </div>
              </div>

              {/* Feature cards */}
              <div className="mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="group relative">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 opacity-25 blur transition duration-200 group-hover:opacity-100"></div>
                  <div className="relative rounded-2xl bg-white p-6 shadow-lg">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#765ba7]">
                      <Heart size={24} className="text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">
                      Truly Open and Free
                    </h3>
                    <p className="text-gray-600">
                      MIT licensed, no paywalls, no limits. Skip overpriced SDKs
                      with full source access.
                    </p>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-orange-400 opacity-25 blur transition duration-200 group-hover:opacity-100"></div>
                  <div className="relative rounded-2xl bg-white p-6 shadow-lg">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#765ba7]">
                      <Code size={24} className="text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Customizable</h3>
                    <p className="text-gray-600">
                      Extensive API for complete control. Themes, annotations,
                      search, and more.
                    </p>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 opacity-25 blur transition duration-200 group-hover:opacity-100"></div>
                  <div className="relative rounded-2xl bg-white p-6 shadow-lg">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#765ba7]">
                      <ExternalLink size={24} className="text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Works Everywhere</h3>
                    <p className="text-gray-600">
                      Works with JavaScript or TypeScript projects. React, Vue,
                      Svelte, or vanilla.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-24">
          {/* Interactive Demo Section */}
          <div className="relative">
            {/* Header with arrow and call-to-action */}
            <div className="mb-8 text-center">
              <div className="relative inline-block">
                <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                  See it in action
                </h2>
              </div>
              <p className="mt-4 text-lg text-gray-600">
                Interact with our PDF viewer below - zoom, scroll, and navigate
                through pages
              </p>
            </div>
            {/* PDF Viewer with enhanced styling */}
            <div className="group relative">
              {/* Main viewer container */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <PDFViewer className="h-[700px] w-full rounded-lg" />
              </div>
            </div>
          </div>
          {/* Testimonial section */}
          <div className="relative mt-24">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform font-serif text-6xl text-gray-200">
              "
            </div>
            <div className="relative mx-auto max-w-2xl text-center">
              <p className="mb-4 text-xl italic text-gray-600">
                EmbedPDF saved us countless hours of development time. Our
                documents now load faster and look better than ever before.
              </p>
              <div className="flex items-center justify-center">
                <div className="h-14 w-14 rounded-full">
                  <img
                    src="/profile.jpeg"
                    alt="Bob Singor"
                    className="h-10 w-10 rounded-full"
                  />
                </div>
                <div className="ml-3 text-left">
                  <div className="font-medium">Bob Singor</div>
                  <div className="text-sm text-gray-500">
                    Lead Developer @ CloudPDF
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mt-14 overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-orange-400/20"></div>
            <div className="relative rounded-2xl p-8 md:p-12">
              <h2 className="mx-auto mb-4 max-w-2xl text-2xl font-bold md:text-3xl">
                Ready to transform your PDF experience?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-gray-600">
                Join thousands of developers who've simplified their PDF
                integration with EmbedPDF.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 font-medium text-white shadow-lg transition-colors hover:bg-gray-800"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeaderAndHero

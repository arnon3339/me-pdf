'use client'
import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Code, ChevronDown, Download, ExternalLink, Github } from 'lucide-react';
import { JavaScript } from '@/components/icons/javascript';
import { Typescript } from '@/components/icons/typescript';
import { Scribble } from '@/components/icons/scribble2';
import Link from 'next/link';

// Animated blobs for the background
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Purple blob */}
      <div className="absolute top-70 left-8 w-64 h-64 bg-purple-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      
      {/* Blue blob */}
      <div className="absolute top-32 -right-8 w-80 h-80 bg-blue-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      
      {/* Orange blob */}
      <div className="absolute bottom-24 left-20 w-72 h-72 bg-orange-400 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    </div>
  );
};

const HeaderAndHero = () => {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="pt-20 pb-16 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-6 py-2 border border-purple-200 rounded-full bg-purple-50 text-purple-800 text-sm font-medium mb-6">
                Open Source & Framework Agnostic
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
                <span className="relative inline-block">
                  <span className="relative z-10">Embed PDF files</span>
                  <div className="absolute bottom-1 left-0 right-0 h-4 -z-10 transform -rotate-1">
                    <Scribble color="#765ba7" />
                  </div>
                </span>
                <br />
                <span className="">
                  without the pain
                </span>
              </h1>
              
              <p className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto relative">
                A lightweight, customizable PDF viewer that works seamlessly with any JavaScript project. No dependencies, no hassle.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-5">
                <Link 
                  href="/docs/introduction"
                  className="group relative overflow-hidden inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full bg-gray-900 text-white shadow-xl"
                >
                  <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <a 
                  href="https://github.com/embedpdf/embed-pdf-viewer" 
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center px-5 py-3 text-base font-medium text-gray-700 hover:text-gray-900 transition-all"
                >
                  <div className="flex items-center space-x-2 border-b border-dashed border-gray-300 group-hover:border-gray-600">
                    <Github />
                    <span>Source on GitHub</span>
                  </div>
                </a>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white flex items-center justify-center">
                    <JavaScript />
                  </div>
                  <div className="mt-2 text-sm font-medium">JavaScript</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white flex items-center justify-center">
                    <Typescript />
                  </div>
                  <div className="mt-2 text-sm font-medium">TypeScript</div>
                </div>
              </div>
              
              {/* Feature cards */}
              <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative p-6 bg-white rounded-2xl shadow-lg">
                    <div className="w-12 h-12 rounded-lg bg-[#765ba7] flex items-center justify-center mb-4 mx-auto">
                      <Download size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Lightweight</h3>
                    <p className="text-gray-600">Only 3.2kb gzipped with zero dependencies. Won't slow down your application.</p>
                  </div>
                </div>
                
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative p-6 bg-white rounded-2xl shadow-lg">
                    <div className="w-12 h-12 rounded-lg bg-[#765ba7] flex items-center justify-center mb-4 mx-auto">
                      <Code size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Customizable</h3>
                    <p className="text-gray-600">Extensive API for complete control. Themes, annotations, search, and more.</p>
                  </div>
                </div>
                
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative p-6 bg-white rounded-2xl shadow-lg">
                    <div className="w-12 h-12 rounded-lg bg-[#765ba7] flex items-center justify-center mb-4 mx-auto">
                      <ExternalLink size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Framework Agnostic</h3>
                    <p className="text-gray-600">Works with React, Vue, Angular, Svelte, or vanilla JavaScript projects.</p>
                  </div>
                </div>
              </div>
              
              {/* Testimonial section */}
              <div className="mt-24 relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl text-gray-200 font-serif">"</div>
                <div className="max-w-2xl mx-auto text-center relative">
                  <p className="text-xl italic text-gray-600 mb-4">EmbedPDF saved us countless hours of development time. Our documents now load faster and look better than ever before.</p>
                  <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full">
                      <img src="/profile.jpeg" alt="Bob Singor" className="w-10 h-10 rounded-full" />
                    </div>
                    <div className="ml-3 text-left">
                      <div className="font-medium">Bob Singor</div>
                      <div className="text-sm text-gray-500">Lead Developer @ CloudPDF</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Call to action */}
              <div className="mt-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-orange-400/20 rounded-2xl"></div>
                <div className="relative p-8 md:p-12 rounded-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your PDF experience?</h2>
                  <p className="text-gray-600 mb-8 max-w-xl mx-auto">Join thousands of developers who've simplified their PDF integration with EmbedPDF.</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link 
                      href="/docs/introduction"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white font-medium rounded-full shadow-lg hover:bg-gray-800 transition-colors"
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
      </div>
    </div>
  );
};

export default HeaderAndHero;
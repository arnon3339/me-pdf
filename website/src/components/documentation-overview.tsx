'use client';

import React, { useState } from 'react';
import { ArrowRight, Book, Code, Package, Search, Terminal, Zap, FileText, Settings, Menu, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Scribble } from './icons/scribble';

// Mock documentation packages data
const packages = [
  {
    id: "pdfium",
    name: "@embedpdf/pdfium",
    description: "JavaScript API wrapper for PDFium rendering engine, providing low-level PDF manipulation capabilities.",
    icon: <FileText className="h-6 w-6 text-white" />,
    color: "from-purple-600 to-blue-700",
    tags: ["Core", "Rendering", "Low-level API"],
    sections: [
      { title: "Introduction", url: "/docs/pdfium/introduction" },
      { title: "Getting Started", url: "/docs/pdfium/getting-started" }
    ],
    url: "/docs/pdfium/introduction",
    latestVersion: "2.3.0",
    lastUpdated: "February 28, 2025"
  },
  /*
  {
    id: "engine",
    name: "@embedpdf/engine",
    description: "Pre-built rendering engine with higher-level abstractions for common PDF viewing and interaction needs.",
    icon: <Zap className="h-6 w-6 text-white" />,
    color: "from-blue-600 to-cyan-600",
    tags: ["Viewer", "High-level API", "UI Components"],
    sections: [
      { title: "Getting Started", url: "/docs/engine/getting-started" },
      { title: "Configuration", url: "/docs/engine/configuration" },
      { title: "Annotations", url: "/docs/engine/annotations" },
      { title: "Events", url: "/docs/engine/events" },
      { title: "Customization", url: "/docs/engine/customization" }
    ],
    latestVersion: "3.1.2",
    lastUpdated: "March 4, 2025"
  },
  {
    id: "react",
    name: "@embedpdf/react",
    description: "React components for seamlessly integrating PDF viewing capabilities into your React applications.",
    icon: <Code className="h-6 w-6 text-white" />,
    color: "from-cyan-600 to-teal-600",
    tags: ["React", "Components", "Hooks"],
    sections: [
      { title: "Installation", url: "/docs/react/installation" },
      { title: "Basic Usage", url: "/docs/react/basic-usage" },
      { title: "Props Reference", url: "/docs/react/props" },
      { title: "Hooks", url: "/docs/react/hooks" },
      { title: "Custom Rendering", url: "/docs/react/custom-rendering" }
    ],
    latestVersion: "2.2.0",
    lastUpdated: "February 15, 2025"
  },
  {
    id: "vue",
    name: "@embedpdf/vue",
    description: "Vue.js components for integrating PDF viewing capabilities into your Vue applications.",
    icon: <Code className="h-6 w-6 text-white" />,
    color: "from-teal-600 to-green-600",
    tags: ["Vue", "Components", "Composition API"],
    sections: [
      { title: "Installation", url: "/docs/vue/installation" },
      { title: "Basic Usage", url: "/docs/vue/basic-usage" },
      { title: "Props Reference", url: "/docs/vue/props" },
      { title: "Events", url: "/docs/vue/events" },
      { title: "Slots & Templates", url: "/docs/vue/slots" }
    ],
    latestVersion: "2.0.1",
    lastUpdated: "January 20, 2025"
  },
  {
    id: "annotations",
    name: "@embedpdf/annotations",
    description: "Advanced PDF annotation capabilities that can be used with any of the EmbedPDF packages.",
    icon: <Settings className="h-6 w-6 text-white" />,
    color: "from-green-600 to-yellow-500",
    tags: ["Annotations", "Markup", "Collaboration"],
    sections: [
      { title: "Overview", url: "/docs/annotations/overview" },
      { title: "Creating Annotations", url: "/docs/annotations/creating" },
      { title: "Styles & Formatting", url: "/docs/annotations/styles" },
      { title: "Persistence", url: "/docs/annotations/persistence" },
      { title: "Collaboration", url: "/docs/annotations/collaboration" }
    ],
    latestVersion: "1.4.0",
    lastUpdated: "March 1, 2025"
  },
  {
    id: "cli",
    name: "@embedpdf/cli",
    description: "Command-line tools for PDF processing, conversion, and optimization.",
    icon: <Terminal className="h-6 w-6 text-white" />,
    color: "from-yellow-500 to-orange-500",
    tags: ["CLI", "Tools", "Automation"],
    sections: [
      { title: "Installation", url: "/docs/cli/installation" },
      { title: "Commands", url: "/docs/cli/commands" },
      { title: "PDF Conversion", url: "/docs/cli/conversion" },
      { title: "Optimization", url: "/docs/cli/optimization" },
      { title: "Scripting", url: "/docs/cli/scripting" }
    ],
    latestVersion: "1.1.0",
    lastUpdated: "January 10, 2025"
  }*/
];

// Animated background
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Gradient circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-32 left-20 w-80 h-80 bg-teal-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* Documentation pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
    </div>
  );
};

// Package card
const PackageCard = ({ pkg }: { pkg: {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
  sections: { title: string; url: string }[];
  latestVersion: string;
  lastUpdated: string;
  url: string;
}}) => {
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${pkg.color} rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-300`}></div>
      <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${pkg.color} flex items-center justify-center`}>
              {pkg.icon}
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors font-mono">
            {pkg.name}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {pkg.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {pkg.tags.map((tag, index) => (
              <span key={index} className="inline-flex whitespace-nowrap items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          {/*<div className="flex items-center text-sm text-gray-500 mb-4">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">v{pkg.latestVersion}</span>
            <span className="mx-2">•</span>
            <span>Updated: {pkg.lastUpdated}</span>
          </div>*/}
          
          <div className="border-t border-gray-100 pt-4 mt-auto">
            <h4 className="font-medium text-gray-900 mb-2">Documentation:</h4>
            <ul className="space-y-1 mb-6">
              {pkg.sections.map((section: { title: string, url: string }, index: number) => (
                <li key={index}>
                  <Link 
                    href={section.url}
                    className="flex items-center text-gray-600 hover:text-blue-600 hover:pl-1 transition-all"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <Link 
            href={pkg.url}
            className={`inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${pkg.color} text-white font-medium text-sm hover:shadow-md transition-shadow`}
          >
            View Full Documentation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Getting started card
const GettingStartedCard = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white mb-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500 to-blue-500 opacity-30 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-teal-500 opacity-20 rounded-full transform -translate-x-1/2 translate-y-1/2 blur-xl"></div>
      
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="md:flex-1">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-4">
              New to EmbedPDF?
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Getting Started Guide
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Learn the fundamentals of integrating PDF viewing into your applications with our step-by-step introduction.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/docs/introduction"
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Book className="mr-2 h-5 w-5" />
                Read the Guide
              </Link>
              <Link 
                href="/docs/quickstart"
                className="inline-flex items-center px-5 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Zap className="mr-2 h-5 w-5" />
                Quick Start
              </Link>
            </div>
          </div>
          
          <div className="md:w-72 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gray-700 px-4 py-2 text-xs font-mono flex items-center text-gray-300">
              <span>Terminal</span>
            </div>
            <div className="p-4 font-mono text-sm text-gray-300">
              <p className="text-green-400">$ npm install @embedpdf/engine</p>
              <p className="text-gray-500 mt-2"># or with yarn</p>
              <p className="text-green-400">$ yarn add @embedpdf/engine</p>
              <p className="text-gray-400 mt-4">// Import in your project</p>
              <p className="text-blue-300">import {'{ PDFViewer }'} from <span className="text-orange-300">'@embedpdf/engine'</span>;</p>
              <p className="text-gray-400 mt-2">// Initialize the viewer</p>
              <p className="text-blue-300">const viewer = new PDFViewer({'{'}
                <br/>&nbsp;&nbsp;container: <span className="text-orange-300">'#pdf-container'</span>,
                <br/>&nbsp;&nbsp;url: <span className="text-orange-300">'./document.pdf'</span>
                <br/>{'}'});</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Documentation section
const DocSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => {
  return (
    <div className="mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
};

const DocsOverview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter packages based on search
  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="min-h-screen relative">
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.1); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 12s infinite alternate;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(24, 24, 100, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(24, 24, 100, 0.07) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      
      <AnimatedBackground />
      
      <div className="pt-20 pb-16 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Documentation Header */}
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-2 border border-blue-200 rounded-full bg-blue-50 text-blue-800 text-sm font-medium mb-6">
              Documentation
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              <span className="relative inline-block">
                <span className="relative z-10">Everything you need</span>
                <div className="absolute bottom-1 left-0 right-0 h-4 opacity-50 -z-10 transform -rotate-1">
                  <Scribble color="#bedbff" />
                </div>
                
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                to build amazing PDF experiences
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive documentation for all EmbedPDF packages, with guides, API references, and examples.
            </p>
          </div>
          
          {/* Search */}
          {/*<div className="relative max-w-xl mx-auto mb-12">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>*/}
          
          {/* Getting Started Section */}
          {/* <GettingStartedCard /> */}
          
          {/* Main Documentation */}
          <DocSection title="Available Packages" icon={<Package size={20} />}>
            {searchQuery && filteredPackages.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-400">No packages found</div>
                <p className="text-gray-500 mt-2">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPackages.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            )}
          </DocSection>
          
          {/* Examples Section */}
          {/* 
          <DocSection title="Quick Examples" icon={<Code size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <div className="font-medium text-gray-700">Basic Viewer</div>
                  <Link 
                    href="/examples/basic-viewer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Example <ExternalLink size={14} className="ml-1" />
                  </Link>
                </div>
                <div className="p-4">
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`import { PDFViewer } from '@embedpdf/engine';

// Initialize a basic viewer
const viewer = new PDFViewer({
  container: '#viewer',
  url: '/sample.pdf',
  height: '600px',
  zoom: 1.2
});

// Load the document
viewer.load();`}
                  </pre>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <div className="font-medium text-gray-700">React Component</div>
                  <Link 
                    href="/examples/react-component"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Example <ExternalLink size={14} className="ml-1" />
                  </Link>
                </div>
                <div className="p-4">
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`import { useState } from 'react';
import { PDFViewer } from '@embedpdf/react';

function MyPDFViewer() {
  const [zoom, setZoom] = useState(1);
  
  return (
    <div className="pdf-container">
      <PDFViewer
        url="/document.pdf"
        zoom={zoom}
        onDocumentLoaded={(doc) => 
          console.log('Loaded:', doc.numPages)}
      />
      <button onClick={() => setZoom(zoom + 0.2)}>
        Zoom In
      </button>
    </div>
  );
}`}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link
                href="/examples"
                className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All Examples
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </DocSection>
          */}

          {/* Resources Section */}
          {/*
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6 rounded-xl">
              <div className="mb-4 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Book size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">API Reference</h3>
              <p className="text-gray-600 mb-4">Complete API documentation for all EmbedPDF packages and modules.</p>
              <Link
                href="/api-reference"
                className="inline-flex items-center text-purple-700 font-medium hover:text-purple-900"
              >
                Browse API Docs
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-teal-500/10 p-6 rounded-xl">
              <div className="mb-4 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Code size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Code Samples</h3>
              <p className="text-gray-600 mb-4">Ready-to-use code examples for common PDF viewing use cases and scenarios.</p>
              <Link
                href="/code-samples"
                className="inline-flex items-center text-blue-700 font-medium hover:text-blue-900"
              >
                View Samples
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-teal-500/10 to-green-500/10 p-6 rounded-xl">
              <div className="mb-4 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <Terminal size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Tutorials</h3>
              <p className="text-gray-600 mb-4">Step-by-step guides to help you implement advanced PDF features.</p>
              <Link
                href="/tutorials"
                className="inline-flex items-center text-teal-700 font-medium hover:text-teal-900"
              >
                Start Learning
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>*/}
          
          {/* Community Support */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-8 relative mb-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="relative flex flex-col md:flex-row md:items-center gap-8">
              <div className="md:flex-1">
                <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
                <p className="text-gray-600 mb-6">Join our community for support, discussions, and to contribute to EmbedPDF's development.</p>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://github.com/embedpdf/embed-pdf-viewer/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    GitHub Discussions
                  </a>
                  {/*<a 
                    href="https://discord.gg/embedpdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Discord Community
                  </a>
                  <a 
                    href="https://stackoverflow.com/questions/tagged/embedpdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Stack Overflow
                  </a>*/}
                </div>
              </div>
              
              {/*<div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-medium mb-3">Popular Questions</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/docs/faq#custom-rendering" className="text-blue-600 hover:text-blue-800">
                      How to implement custom rendering?
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/faq#file-formats" className="text-blue-600 hover:text-blue-800">
                      What file formats are supported?
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/faq#performance" className="text-blue-600 hover:text-blue-800">
                      Tips for optimizing performance
                    </Link>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/docs/faq"
                    className="text-blue-700 font-medium hover:text-blue-900 flex items-center"
                  >
                    View all FAQs
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>*/}
            </div>
          </div>
          
          {/* Newsletter */}
          {/*<div className="text-center pb-8">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter for the latest documentation updates, new features, and best practices.
            </p>
            <div className="max-w-md mx-auto flex">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 min-w-0 block w-full px-4 py-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Subscribe
              </button>
            </div>
          </div>*/}
          
        </div>
      </div>
    </div>
  );
};

export default DocsOverview;
'use client'
import Link from 'next/link'
import { Menu, X, Github } from 'lucide-react';
import Logo from './logo'
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`nextra-navbar sticky top-0 z-20 w-full transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative w-16 h-16">
              <Logo />
            </div>
            <span className="font-bold text-xl">
              EmbedPDF
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* <a href="#features" className="group text-gray-600 transition-colors relative py-2">
              <span className="relative z-10">Features</span>
              <span className="absolute inset-0 bg-purple-100 rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </a> */}
            <Link href="/docs" className="group text-gray-600 transition-colors relative py-2 px-4">
              <span className="relative z-10">Documentation</span>
              <span className="absolute inset-0 bg-blue-100 rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </Link>
            <Link href="/blog" className="group text-gray-600 transition-colors relative py-2 px-4">
              <span className="relative z-10">Blog</span>
              <span className="absolute inset-0 bg-orange-100 rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </Link>
            {/* <a href="#examples" className="group text-gray-600 transition-colors relative py-2">
              <span className="relative z-10">Examples</span>
              <span className="absolute inset-0 bg-orange-100 rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </a> */}
            {/* <a href="#community" className="group text-gray-600 transition-colors relative py-2">
              <span className="relative z-10">Community</span>
              <span className="absolute inset-0 bg-red-100 rounded-full scale-0 group-hover:scale-100 transition-transform"></span>
            </a> */}
            <a 
              href="https://github.com/embedpdf/embed-pdf-viewer" 
              className="relative overflow-hidden inline-flex items-center space-x-2 bg-gray-900 text-white px-5 py-2 rounded-full group"
              target="_blank"
              rel="noreferrer"
            >
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <Github className="w-4 h-4 z-10" />
              <span className="relative z-10 text-sm font-medium">GitHub</span>
            </a>
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden relative z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-600 hover:text-purple-600 transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg shadow-lg border border-gray-100 rounded-lg mx-4 mt-2 overflow-hidden">
          <div className="py-2 space-y-1">
            {/*<a 
              href="#features" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
              <span>Features</span>
            </a>*/}
            <Link 
              href="/docs/introduction" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <span>Documentation</span>
            </Link>
            {/*<a 
              href="#examples" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-1 h-6 bg-orange-400 rounded-full"></div>
              <span>Examples</span>
            </a>*/}
            {/*<a 
              href="#community" 
              className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-red-500 hover:bg-red-50 flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-1 h-6 bg-red-500 rounded-full"></div>
              <span>Community</span>
            </a>*/}
            <a 
              href="https://github.com/embedpdf/embed-pdf-viewer"
              className="mx-4 my-3 flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsMenuOpen(false)}
            >
              <Github />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
} 
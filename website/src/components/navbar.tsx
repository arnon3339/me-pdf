import Link from 'next/link'
import Logo from './logo'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo /><strong className="text-xl">EmbedPDF</strong>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link 
                href="/docs"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-primary"
              >
                Documentation
              </Link>
            </div>
          </div>
          {/* Right side buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link
              href="/github"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 
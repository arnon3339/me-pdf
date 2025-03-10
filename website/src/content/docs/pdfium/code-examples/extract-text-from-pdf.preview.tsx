'use client';
import React, { useEffect, useState } from 'react';
import { loadPdfForTextExtraction } from './extract-text-from-pdf';
import { Preview } from '@/components/preview';

// Define the type for the PDF document
type PdfDocument = {
  hasPassword: boolean;
  pageCount: number;
  close: () => void;
  extractText: (pageIndex: number) => Promise<string>;
};

export default function ExtractTextFromPdfDemo() {
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load the PDF when the component mounts
  useEffect(() => {
    loadPdf();
    
    // Clean up resources when component unmounts
    return () => {
      if (pdfDocument) {
        pdfDocument.close();
      }
    };
  }, []);
  
  // When page changes, extract text from that page
  useEffect(() => {
    if (pdfDocument && currentPage >= 0 && currentPage < pageCount) {
      extractTextFromPage(currentPage);
    }
  }, [pdfDocument, currentPage]);
  
  const loadPdf = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Close any existing document to prevent memory leaks
      if (pdfDocument) {
        pdfDocument.close();
      }
      
      // Fetch the sample PDF
      const response = await fetch('/demo.pdf');
      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      // Load the PDF document for text extraction
      const doc = await loadPdfForTextExtraction(data);
      
      // Update state with document info
      setPageCount(doc.pageCount);
      setPdfDocument(doc);
      
      // Extract text from the first page
      if (doc.pageCount > 0) {
        setCurrentPage(0);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };
  
  const extractTextFromPage = async (pageIndex: number) => {
    if (!pdfDocument) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Extract text from the specified page
      const text = await pdfDocument.extractText(pageIndex);
      setExtractedText(text || 'No text found on this page.');
    } catch (err) {
      console.error('Error extracting text:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract text');
      setExtractedText('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < pageCount - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return (
    <Preview title="Extract Text from PDF">
      <div className="space-y-4">
        {/* Page navigation controls */}
        <div className="flex flex-wrap gap-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isLoading || pageCount === 0}
              className="px-3 py-1 bg-gray-100 border-r border-gray-300 hover:bg-gray-200 disabled:opacity-50"
              title="Previous page"
            >
              ←
            </button>
            <div className="px-3 py-1 bg-white">
              {pageCount > 0 ? `Page ${currentPage + 1} of ${pageCount}` : 'Loading...'}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === pageCount - 1 || isLoading || pageCount === 0}
              className="px-3 py-1 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 disabled:opacity-50"
              title="Next page"
            >
              →
            </button>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-violet-600 border-t-transparent rounded-full"></div>
              <span>Loading...</span>
            </div>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* Text display area */}
        <div className="border border-gray-300 rounded-md bg-white p-4 max-h-[400px] overflow-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Extracted Text:</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {extractedText || 'No text extracted yet.'}
          </pre>
        </div>
      </div>
    </Preview>
  );
} 
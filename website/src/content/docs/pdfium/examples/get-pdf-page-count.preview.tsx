'use client';
import React, { useState } from 'react';
import { getPdfPageCount } from './get-pdf-page-count';
import { Preview } from '@/components/preview';

export default function GetPdfPageCountDemo() {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/demo.pdf');
      const buffer = await response.arrayBuffer();
      const count = await getPdfPageCount(new Uint8Array(buffer));
      
      setPageCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Preview title="Get PDF Page Count">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 text-white bg-black rounded-full hover:bg-gray-800 disabled:bg-gray-400"
      >
        {isLoading ? 'Loading...' : 'Get PDF Page Count'}
      </button>

      {pageCount !== null && (
        <p className="text-green-600">
          The PDF has {pageCount} pages
        </p>
      )}

      {error && (
        <p className="text-red-500">
          Error: {error}
        </p>
      )}
    </Preview>
  );
} 
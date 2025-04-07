'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DocumentPage } from './types'
import { PdfDocumentObject, PdfEngine } from '@embedpdf/models'
import { generateThumbnail } from './pdf-engine'

interface VirtualScrollerProps {
  items: DocumentPage[]
  onUpdatePages: (pages: DocumentPage[]) => void
  visibleItems?: number
  engine: PdfEngine
  doc: PdfDocumentObject
}

interface LoadingThumbnail {
  docId: string;
  pageIndex: number;
  loading: boolean;
}

export const VirtualScroller: React.FC<VirtualScrollerProps> = ({ 
  items, 
  onUpdatePages, 
  visibleItems = 4,
  engine,
  doc
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [loadingThumbnails, setLoadingThumbnails] = useState<LoadingThumbnail[]>([])

  // Calculate item dimensions based on container width
  const itemDimensions = useMemo(() => {
    // Account for grid-cols-2 and gap-2
    const gridGap = 8 // 2rem
    const itemWidth = containerWidth ? (containerWidth - gridGap) / 2 : 0
    // Use standard A4 aspect ratio (1:1.414)
    const itemHeight = itemWidth * 1.414
    return { width: itemWidth, height: itemHeight }
  }, [containerWidth])

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for padding
        const padding = 16 // 2 * 8px (p-2)
        setContainerWidth(containerRef.current.clientWidth - padding)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculate visible range based on actual dimensions
  const visibleRange = useMemo(() => {
    if (!items.length || !itemDimensions.height) return { start: 0, end: 0 }
    
    const itemsPerRow = 2
    const rowHeight = itemDimensions.height
    const containerHeight = 400 // matches the container's h-[400px]
    
    const visibleRows = Math.ceil(containerHeight / rowHeight)
    const bufferRows = 1
    
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRows)
    const endRow = Math.min(
      Math.ceil(items.length / itemsPerRow),
      startRow + visibleRows + (bufferRows * 2)
    )
    
    return {
      start: startRow * itemsPerRow,
      end: Math.min(items.length, endRow * itemsPerRow)
    }
  }, [items.length, itemDimensions.height, scrollTop])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (!itemDimensions.height) return 0
    return Math.ceil(items.length / 2) * itemDimensions.height
  }, [items.length, itemDimensions.height])

  // Only render the visible items
  const visibleItems1 = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  // Batch thumbnail generation and updates
  useEffect(() => {
    const generateVisibleThumbnails = async () => {
      const pagesToGenerate = visibleItems1.filter(page => 
        !page.thumbnail && 
        !loadingThumbnails.some(lt => lt.docId === page.docId && lt.pageIndex === page.pageIndex)
      );

      if (pagesToGenerate.length === 0) return;

      setLoadingThumbnails(prev => [
        ...prev,
        ...pagesToGenerate.map(p => ({ docId: p.docId, pageIndex: p.pageIndex, loading: true }))
      ]);

      try {
        // Generate all thumbnails in parallel
        const thumbnailPromises = pagesToGenerate.map(page => 
          generateThumbnail(engine, doc, page.pageIndex)
            .then(thumbnail => ({ page, thumbnail }))
            .catch(error => {
              console.error('Error generating thumbnail for page', page.pageIndex, error);
              return null;
            })
        );

        const results = await Promise.all(thumbnailPromises);
        
        // Batch update all thumbnails at once
        const updatedPages = results
          .filter((result): result is { page: DocumentPage; thumbnail: string } => result !== null)
          .map(({ page, thumbnail }) => ({
            ...page,
            thumbnail
          }));

        if (updatedPages.length > 0) {
          onUpdatePages(updatedPages);
        }
      } finally {
        setLoadingThumbnails(prev => 
          prev.filter(p => !pagesToGenerate.some(page => 
            page.docId === p.docId && page.pageIndex === p.pageIndex
          ))
        );
      }
    };

    generateVisibleThumbnails();
  }, [visibleItems1, engine, doc, onUpdatePages]);

  // Handle page selection
  const handlePageClick = useCallback((page: DocumentPage) => {
    onUpdatePages([{
      ...page,
      selected: !page.selected
    }]);
  }, [onUpdatePages]);

  return (
    <div 
      ref={containerRef}
      className="h-[400px] overflow-auto border border-gray-200 rounded-md p-2 bg-[#f9fafb]"
      onScroll={handleScroll}
    >
      <div 
        className="relative w-full"
        style={{ height: `${totalHeight}px` }}
      >
        <div 
          className="absolute left-0 right-0 grid grid-cols-2 gap-2"
          style={{ 
            transform: `translateY(${Math.floor(visibleRange.start / 2) * itemDimensions.height}px)`,
          }}
        >
          {visibleItems1.map((page, idx) => (
            <div 
              key={`${page.docId}-${page.pageIndex}`} 
              className={`relative border ${page.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md p-2 cursor-pointer`}
              onClick={() => handlePageClick(page)}
              style={{
                // Force aspect ratio container
                aspectRatio: '1/1.414',
                width: '100%'
              }}
            >
              <div className="absolute top-2 right-4 z-10">
                <span className="text-xs bg-gray-200 px-1.5 rounded-full">
                  {page.pageIndex + 1}
                </span>
              </div>
              {page.thumbnail ? (
                <img 
                  src={page.thumbnail} 
                  alt={`Page ${page.pageIndex + 1}`}
                  className="w-full h-full object-contain bg-gray-500 p-2 rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-400">
                  Loading...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
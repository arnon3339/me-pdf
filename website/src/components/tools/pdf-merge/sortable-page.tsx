'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../button'
import { MergeDocPage } from './types'

interface SortablePageProps {
  page: MergeDocPage
  index: number
  isNew?: boolean
  onRemove?: (id: string) => void
}

export const SortablePage: React.FC<SortablePageProps> = ({ 
  page, 
  index, 
  isNew, 
  onRemove 
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition 
  } = useSortable({
    id: page.id,
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative border border-gray-200 rounded-md p-2 mb-2 cursor-move bg-white"
      {...attributes} 
      {...listeners}
    >
      <div className="absolute top-1 right-1 flex space-x-1">
        {onRemove && (
          <Button 
            onClick={() => onRemove(page.id)}
            className="text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
          >
            ×
          </Button>
        )}
        <span className="text-xs bg-gray-200 px-1.5 rounded-full">{index + 1}</span>
      </div>
      {page.thumbnail ? (
        <img 
          src={page.thumbnail} 
          alt={`Page ${index + 1}`} 
          className="w-full h-auto object-contain"
        />
      ) : (
        <div className="w-full aspect-[0.7] bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-400">
          Loading...
        </div>
      )}
    </div>
  )
} 
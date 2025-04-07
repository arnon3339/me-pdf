import React, { ReactNode } from 'react';
import cn from 'clsx';
import { EyeIcon } from 'lucide-react';

interface PreviewProps {
  title: string;
  children: ReactNode;
}

export function Preview({ title, children }: PreviewProps) {
  return (
    <div className="not-first:mt-6">
      <div
        className={cn(
          'px-4 text-xs text-gray-700 bg-gray-100 flex items-center h-12 gap-2 rounded-t-md border border-gray-300 contrast-more:border-gray-900 border-b-0'
        )}
      >
        <EyeIcon className="w-4 h-4" />
        <span className="text-xs text-gray-500 font-bold">PREVIEW:</span>
        <span className="truncate">{title}</span>
      </div>
      <div className="group gap-2 flex flex-col focus-visible:nextra-focus overflow-x-auto subpixel-antialiased text-[.9em] bg-white p-4 ring-1 ring-inset ring-gray-300 contrast-more:ring-gray-900 contrast-more:contrast-150 rounded-b-md not-prose">
        {children}
      </div>
    </div>
  );
} 
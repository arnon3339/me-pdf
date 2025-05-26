import { h } from 'preact';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingIndicator({
  size = 'md',
  className = '',
  text = 'Loading...',
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200`}
        />
        {/* Inner spinning ring with blue-500 */}
        <div
          className={`${sizeClasses[size]} absolute left-0 top-0 animate-spin rounded-full border-2 border-transparent border-r-blue-500 border-t-blue-500`}
        />
        {/* Center dot */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform ${
            size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'
          } animate-pulse rounded-full bg-blue-500`}
        />
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} animate-pulse font-medium text-gray-600`}>{text}</p>
      )}
    </div>
  );
}

// Alternative simpler spinner design
export function SimpleSpinner({
  size = 'md',
  className = '',
}: Omit<LoadingIndicatorProps, 'text'>) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-gray-200 border-t-blue-500 ${className}`}
    />
  );
}

// Full page loading overlay
export function LoadingOverlay({
  text = 'Loading...',
  className = '',
}: Pick<LoadingIndicatorProps, 'text' | 'className'>) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 ${className}`}
    >
      <LoadingIndicator size="lg" text={text} />
    </div>
  );
}

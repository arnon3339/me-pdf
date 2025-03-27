import { h } from 'preact';
import { ComponentChildren } from 'preact';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  tooltip?: string;
}

export function Button({ children, onClick, active = false, className = '', tooltip }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-auto min-w-[32px] h-[32px] p-[5px]
        flex items-center justify-center
        rounded-md transition-colors
        ${active 
          ? 'border-none shadow-[inset_0_0_0_1px_var(--blue-5)] text-[var(--blue-5)] bg-[var(--faded-component-background)]' 
          : 'hover:bg-gray-100'
        }
        ${className}
      `}
      title={tooltip}
    >
      {children}
    </button>
  );
} 
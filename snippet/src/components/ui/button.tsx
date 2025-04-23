import { h, ComponentChildren, Ref } from 'preact';

interface ButtonProps {
  id?: string;
  children: ComponentChildren;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  tooltip?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ id, children, onClick, active = false, className = '', tooltip, ref, ...props }: ButtonProps) {
  return (
    <button
      id={id}
      ref={ref}
      onClick={onClick}
      className={`
        w-auto min-w-[32px] h-[32px] p-[5px]
        flex items-center justify-center
        rounded-md transition-colors
        ${active 
          ? 'border-none shadow ring-1 ring-blue-500 text-blue-500 bg-blue-50' 
          : 'hover:bg-gray-100 hover:ring-1 hover:ring-[#1a466b]'
        }
        ${className}
      `}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
} 
import { h, ComponentChildren, Ref, JSX } from 'preact';

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  id?: string;
  children: ComponentChildren;
  onClick?: h.JSX.MouseEventHandler<HTMLButtonElement> | undefined;
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
        rounded-md transition-colors cursor-pointer
        ${active 
          ? 'border-none shadow ring ring-blue-500 text-blue-500 bg-blue-50' 
          : 'hover:bg-gray-100 hover:ring hover:ring-[#1a466b]'
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
import { h, ComponentChildren, Ref, JSX } from 'preact';

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  id?: string;
  children: ComponentChildren;
  onClick?: h.JSX.MouseEventHandler<HTMLButtonElement> | undefined;
  active?: boolean;
  className?: string;
  tooltip?: string;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  id,
  children,
  onClick,
  active = false,
  className = '',
  tooltip,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      id={id}
      ref={ref}
      onClick={onClick}
      className={`flex h-[32px] w-auto min-w-[32px] cursor-pointer items-center justify-center rounded-md p-[5px] transition-colors ${
        active
          ? 'border-none bg-blue-50 text-blue-500 shadow ring ring-blue-500'
          : 'hover:bg-gray-100 hover:ring hover:ring-[#1a466b]'
      } ${className} `}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}

/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { usePinch } from '../hooks';

type PinchWrapperProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  children: ComponentChildren;
  style?: JSX.CSSProperties;
};

export function PinchWrapper({ children, style, ...props }: PinchWrapperProps) {
  const { elementRef } = usePinch();

  return (
    <div
      ref={elementRef}
      {...props}
      style={{
        ...style,
        display: 'block',
        width: 'fit-content',
        overflow: 'visible',
        boxSizing: 'border-box',
        margin: '0px auto',
      }}
    >
      {children}
    </div>
  );
}

import { ReactNode } from 'react';

import { usePinch } from '../hooks';

type PinchWrapperProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  children: ReactNode;
  style?: React.CSSProperties;
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

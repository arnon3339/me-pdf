import { ReactNode, useEffect, useRef } from 'react';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability } from '../hooks';

interface GlobalPointerProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  style?: React.CSSProperties;
}

export const GlobalPointerProvider = ({
  children,
  style,
  ...props
}: GlobalPointerProviderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { provides: cap } = useInteractionManagerCapability();

  useEffect(() => {
    if (!cap || !ref.current) return;

    return createPointerProvider(cap, { type: 'global' }, ref.current);
  }, [cap]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

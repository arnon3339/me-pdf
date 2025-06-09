import { ReactNode, useEffect, useRef } from 'react';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability } from '../hooks';

interface GlobalPointerProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const GlobalPointerProvider = ({ children, ...props }: GlobalPointerProviderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { provides: cap } = useInteractionManagerCapability();

  useEffect(() => {
    if (!cap || !ref.current) return;

    return createPointerProvider(cap, { type: 'global' }, ref.current);
  }, [cap]);

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
};

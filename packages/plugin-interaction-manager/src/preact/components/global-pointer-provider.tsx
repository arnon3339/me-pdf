/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability } from '../hooks';

interface GlobalPointerProviderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
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

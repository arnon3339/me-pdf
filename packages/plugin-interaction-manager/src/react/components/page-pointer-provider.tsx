import { ReactNode, useEffect, useRef } from 'react';
import { Position } from '@embedpdf/models';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability, useIsPageExclusive } from '../hooks';

interface PagePointerProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  pageIndex: number;
  convertEventToPoint?: (event: PointerEvent, element: HTMLElement) => Position;
}

export const PagePointerProvider = ({
  pageIndex,
  children,
  convertEventToPoint,
  ...props
}: PagePointerProviderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { provides: cap } = useInteractionManagerCapability();
  const isPageExclusive = useIsPageExclusive();

  useEffect(() => {
    if (!cap || !ref.current) return;

    return createPointerProvider(
      cap,
      { type: 'page', pageIndex },
      ref.current,
      convertEventToPoint,
    );
  }, [cap, pageIndex, convertEventToPoint]);

  return (
    <div ref={ref} {...props}>
      {children}
      {isPageExclusive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      )}
    </div>
  );
};

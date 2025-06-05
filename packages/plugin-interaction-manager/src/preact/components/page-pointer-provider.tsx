/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Position } from '@embedpdf/models';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability } from '../hooks';

interface PagePointerProviderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
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
    </div>
  );
};

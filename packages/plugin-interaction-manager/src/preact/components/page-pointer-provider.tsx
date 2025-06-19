/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { Position, restorePosition } from '@embedpdf/models';
import { createPointerProvider } from '../../shared/utils';

import { useInteractionManagerCapability, useIsPageExclusive } from '../hooks';

interface PagePointerProviderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  scale: number;
  style?: JSX.CSSProperties;
  convertEventToPoint?: (event: PointerEvent, element: HTMLElement) => Position;
}

export const PagePointerProvider = ({
  pageIndex,
  children,
  pageWidth,
  pageHeight,
  rotation,
  scale,
  convertEventToPoint,
  style,
  ...props
}: PagePointerProviderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { provides: cap } = useInteractionManagerCapability();
  const isPageExclusive = useIsPageExclusive();

  const defaultConvertEventToPoint = useCallback(
    (event: PointerEvent, element: HTMLElement): Position => {
      const rect = element.getBoundingClientRect();
      const displayPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      return restorePosition(
        { width: pageWidth, height: pageHeight },
        displayPoint,
        rotation,
        scale,
      );
    },
    [pageWidth, pageHeight, rotation, scale],
  );

  useEffect(() => {
    if (!cap || !ref.current) return;

    return createPointerProvider(
      cap,
      { type: 'page', pageIndex },
      ref.current,
      convertEventToPoint || defaultConvertEventToPoint,
    );
  }, [cap, pageIndex, convertEventToPoint, defaultConvertEventToPoint]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'multiply',
        isolation: 'isolate',
        ...style,
      }}
      {...props}
    >
      {children}
      {isPageExclusive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      )}
    </div>
  );
};

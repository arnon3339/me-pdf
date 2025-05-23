/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useRotateCapability } from '../hooks';
import { Size } from '@embedpdf/models';

type RotateProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: ComponentChildren;
  pageSize: Size;
};

export function Rotate({ children, pageSize, ...props }: RotateProps) {
  const { provides: rotate } = useRotateCapability();
  const matrix =
    (rotate?.getMatrix({
      w: pageSize.width,
      h: pageSize.height,
    }) as string) || 'matrix(1, 0, 0, 1, 0, 0)';

  return (
    <div
      {...props}
      style={{
        position: 'absolute',
        transformOrigin: '0 0',
        transform: matrix,
      }}
    >
      {children}
    </div>
  );
}

export {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  JSX,
} from 'react';
export type { ReactNode, HTMLAttributes, CSSProperties, MouseEvent, PointerEvent } from 'react';

export const mapDoubleClick = (handler: any) => (handler ? { onDoubleClick: handler } : {});

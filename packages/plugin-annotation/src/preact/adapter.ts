import { JSX, Fragment } from 'preact';
export { useEffect, useRef, useState, useCallback, useMemo } from 'preact/hooks';
export type { ComponentChildren as ReactNode, JSX } from 'preact';

export { Fragment };
export type CSSProperties = import('preact').JSX.CSSProperties;
export type HTMLAttributes<T = any> = import('preact').JSX.HTMLAttributes<
  T extends EventTarget ? T : never
>;
export type MouseEvent<T = Element> = JSX.TargetedMouseEvent<T extends EventTarget ? T : never>;
export type PointerEvent<T = Element> = JSX.TargetedPointerEvent<T extends EventTarget ? T : never>;

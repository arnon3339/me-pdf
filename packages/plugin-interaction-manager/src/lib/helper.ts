import { PointerEventHandlers } from './types';

export function mergeHandlers(list: PointerEventHandlers[]): PointerEventHandlers {
  const keys: (keyof PointerEventHandlers)[] = [
    'onPointerDown',
    'onPointerUp',
    'onPointerMove',
    'onPointerEnter',
    'onPointerLeave',
    'onPointerCancel',
  ];
  const out: Partial<PointerEventHandlers> = {};
  for (const k of keys) {
    out[k] = (evt: any, nativeEvt: any, modeId: string) => {
      for (const h of list) h[k]?.(evt, nativeEvt, modeId);
    };
  }
  return out as PointerEventHandlers;
}

export type Listener<T> = (value: T) => void;
export type Unsubscribe = () => void;

/** A function that registers a listener and returns an unsubscribe handle. */
export type EventHook<T>   = (listener: Listener<T>) => Unsubscribe;

export interface Emitter<T> {
  emit(value: T): void;
  on(listener: Listener<T>): Unsubscribe;
  off(listener: Listener<T>): void;
  clear(): void;            // <‑‑ new
}

export function createEmitter<T>(): Emitter<T> {
  const listeners = new Set<Listener<T>>();

  function on(listener: Listener<T>): Unsubscribe {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    emit:  (v) => listeners.forEach(l => l(v)),
    on,
    off:   (l) => listeners.delete(l),
    clear: ()   => listeners.clear(),
  };
}

/** Remembers the last value and replays it for new listeners */
export function createBehaviorEmitter<T>(initial?: T): Emitter<T> & { value?: T } {
  const e = createEmitter<T>() as ReturnType<typeof createEmitter<T>> & { value?: T };
  e.value = initial;
  const baseEmit = e.emit;
  e.emit = (v: T) => { e.value = v; baseEmit(v); };
  const baseOn  = e.on;
  e.on   = (l: Listener<T>) => {
    if (e.value !== undefined) l(e.value);
    return baseOn(l);
  };
  return e;
}
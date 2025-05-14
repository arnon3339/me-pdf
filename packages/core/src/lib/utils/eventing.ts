import { arePropsEqual } from './math';

/* ------------------------------------------------------------------ */
/* basic types                                                        */
/* ------------------------------------------------------------------ */
export type Listener<T = any>    = (value: T) => void;
export type Unsubscribe    = () => void;
/** A function that registers a listener and returns an unsubscribe handle */
export type EventHook<T = any>   = (listener: Listener<T>) => Unsubscribe;

/* ------------------------------------------------------------------ */
/* minimal “dumb” emitter (no value cache, no equality)               */
/* ------------------------------------------------------------------ */
export interface Emitter<T = any> {
  emit(value?: T): void;
  on(listener: Listener<T>): Unsubscribe;
  off(listener: Listener<T>): void;
  clear(): void;
}

export function createEmitter<T = any>(): Emitter<T> {
  const listeners = new Set<Listener<T>>();

  const on: EventHook<T> = (l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    emit: (v = undefined as T) => listeners.forEach(l => l(v)),
    on,
    off: (l) => listeners.delete(l),
    clear: () => listeners.clear(),
  };
}

/* ------------------------------------------------------------------ */
/* Behaviour emitter with                                             
     – cached last value                                              
     – distinct‑until‑changed semantics                               
     – lightweight `.select()` for derived streams                    */
/* ------------------------------------------------------------------ */
export interface BehaviorEmitter<T = any> extends Emitter<T> {
  /** Last value that was emitted ( `undefined` until the first emit). */
  readonly value?: T;

  /**
   * Build a *derived* event hook.  
   * `selector` maps the source value; the listener is called **only when**
   * the mapped value is truly different (as judged by `equality`).
   *
   * No extra emitter is created – it's just a thin wrapper around `on`.
   */
  select<U = any>(
    selector : (v: T) => U,
    equality?: (a: U, b: U) => boolean
  ): EventHook<U>;
}

export function createBehaviorEmitter<T = any>(
  initial?: T,
  equality: (a: T, b: T) => boolean = arePropsEqual
): BehaviorEmitter<T> {
  const listeners = new Set<Listener<T>>();
  let _value = initial;                    // cached value

  /* -------- helpers ------------------------------------------------ */
  const notify = (v: T) => listeners.forEach(l => l(v));

  const baseOn: EventHook<T> = (listener) => {
    if (_value !== undefined) listener(_value);  // replay last value
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  /* -------- public object ------------------------------------------ */
  return {
    /* Emitter methods ------------------------------------------------ */
    get value() { return _value; },

    emit(v = undefined as T) {
      if (_value === undefined || !equality(_value, v)) {
        _value = v;
        notify(v);
      }
    },

    on : baseOn,
    off: (l) => listeners.delete(l),
    clear() { listeners.clear(); },

    /* Derived hook --------------------------------------------------- */
    select<U = any>(
      selector : (v: T) => U,
      eq:        (a: U, b: U) => boolean = arePropsEqual
    ): EventHook<U> {
      return (listener) => {
        let prev: U | undefined;

        /* fire immediately if we already have a value */
        if (_value !== undefined) {
          const mapped = selector(_value);
          prev = mapped;
          listener(mapped);
        }

        /* subscribe to parent stream */
        return baseOn((next) => {
          const mapped = selector(next);
          if (prev === undefined || !eq(prev, mapped)) {
            prev = mapped;
            listener(mapped);
          }
        });
      };
    },
  };
}
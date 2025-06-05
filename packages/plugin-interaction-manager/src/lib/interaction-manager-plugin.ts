import { BasePlugin, createEmitter, PluginRegistry } from '@embedpdf/core';

import {
  InteractionManagerCapability,
  InteractionManagerPluginConfig,
  InteractionManagerState,
  InteractionMode,
  InteractionScope,
  PointerEventHandlers,
  RegisterAlwaysOptions,
  RegisterHandlersOptions,
} from './types';
import { activateMode, setCursor } from './actions';
import { mergeHandlers } from './helper';

interface CursorClaim {
  cursor: string;
  priority: number;
}

type HandlerSet = Set<PointerEventHandlers>;
type PageHandlerMap = Map<number /*pageIdx*/, HandlerSet>;

interface ModeBuckets {
  /** handlers that listen on the global wrapper (only once per viewer) */
  global: HandlerSet;
  /** handlers that listen on a *specific* page wrapper */
  page: PageHandlerMap;
}

export class InteractionManagerPlugin extends BasePlugin<
  InteractionManagerPluginConfig,
  InteractionManagerCapability,
  InteractionManagerState
> {
  static readonly id = 'interaction-manager' as const;

  private modes = new Map<string, InteractionMode>();
  private cursorClaims = new Map<string, CursorClaim>();
  private buckets = new Map<string, ModeBuckets>();

  private alwaysGlobal = new Set<PointerEventHandlers>();
  private alwaysPage = new Map<number, Set<PointerEventHandlers>>();

  private readonly onModeChange$ = createEmitter<InteractionManagerState>();
  private readonly onHandlerChange$ = createEmitter<InteractionManagerState>();
  private readonly onCursorChange$ = createEmitter<string>();

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);

    this.registerMode({
      id: 'default',
      scope: 'page',
      exclusive: false,
      cursor: 'auto',
    });
  }

  async initialize(_: InteractionManagerPluginConfig): Promise<void> {}

  protected buildCapability(): InteractionManagerCapability {
    return {
      activate: (modeId: string) => this.activate(modeId),
      onModeChange: this.onModeChange$.on,
      onCursorChange: this.onCursorChange$.on,
      onHandlerChange: this.onHandlerChange$.on,
      getActiveMode: () => this.state.activeMode,
      getActiveInteractionMode: () => this.getActiveInteractionMode(),
      finish: () => this.activate('default'),
      registerMode: (mode: InteractionMode) => this.registerMode(mode),
      registerHandlers: (options: RegisterHandlersOptions) => this.registerHandlers(options),
      registerAlways: (options: RegisterAlwaysOptions) => this.registerAlways(options),
      setCursor: (token: string, cursor: string, priority = 0) =>
        this.setCursor(token, cursor, priority),
      removeCursor: (token: string) => this.removeCursor(token),
      getCurrentCursor: () => this.state.cursor,
      getHandlersForScope: (scope: InteractionScope) => this.getHandlersForScope(scope),
      activeModeIsExclusive: () => this.activeModeIsExclusive(),
    };
  }

  private activate(mode: string) {
    if (!this.modes.has(mode)) {
      throw new Error(`[interaction] unknown mode '${mode}'`);
    }
    if (mode === this.state.activeMode) return;

    this.cursorClaims.clear(); // prevent cursor leaks

    this.dispatch(activateMode(mode));
    this.emitCursor();
    this.onModeChange$.emit({ ...this.state, activeMode: mode });
  }

  private registerMode(mode: InteractionMode) {
    this.modes.set(mode.id, mode);
    if (!this.buckets.has(mode.id)) {
      this.buckets.set(mode.id, { global: new Set(), page: new Map() });
    }
  }

  /** ---------- pointer-handler handling ------------ */
  private registerHandlers({
    modeId,
    handlers,
    pageIndex,
  }: {
    modeId: string;
    handlers: PointerEventHandlers;
    pageIndex?: number;
  }): () => void {
    const bucket = this.buckets.get(modeId);
    if (!bucket) throw new Error(`unknown mode '${modeId}'`);
    if (pageIndex == null) {
      bucket.global.add(handlers);
      this.onHandlerChange$.emit({ ...this.state });
      return () => bucket.global.delete(handlers);
    }
    const set = bucket.page.get(pageIndex) ?? new Set();
    set.add(handlers);
    bucket.page.set(pageIndex, set);
    this.onHandlerChange$.emit({ ...this.state });
    return () => {
      set.delete(handlers);
      this.onHandlerChange$.emit({ ...this.state });
    };
  }

  public registerAlways({ scope, handlers }: RegisterAlwaysOptions): () => void {
    if (scope.type === 'global') {
      this.alwaysGlobal.add(handlers);
      this.onHandlerChange$.emit({ ...this.state });
      return () => this.alwaysGlobal.delete(handlers);
    }
    const set = this.alwaysPage.get(scope.pageIndex) ?? new Set();
    set.add(handlers);
    this.alwaysPage.set(scope.pageIndex, set);
    this.onHandlerChange$.emit({ ...this.state });
    return () => {
      set.delete(handlers);
      this.onHandlerChange$.emit({ ...this.state });
    };
  }

  /** Returns the *merged* handler set that should be active for the given
   *  provider (`global` wrapper or a single page wrapper).
   *  – `alwaysGlobal` / `alwaysPage` are **always** active.
   *  – Handlers that belong to the current mode are added on top **iff**
   *    the mode’s own scope matches the provider’s scope.            */
  private getHandlersForScope(scope: InteractionScope): PointerEventHandlers | null {
    const mode = this.modes.get(this.state.activeMode);
    if (!mode) return null;

    const bucket = this.buckets.get(mode.id);
    if (!bucket) return null;

    /** helper – merge two handler sets into one object (or `null` if both are empty) */
    const mergeSets = (a: HandlerSet, b: HandlerSet) =>
      a.size || b.size ? mergeHandlers([...a, ...b]) : null;

    /* ─────────────────────  GLOBAL PROVIDER  ─────────────────────── */
    if (scope.type === 'global') {
      const modeSpecific =
        mode.scope === 'global' // only include mode handlers if the
          ? bucket.global // mode itself is global-scoped
          : new Set<PointerEventHandlers>();
      return mergeSets(this.alwaysGlobal, modeSpecific);
    }

    /* ───────────────────────  PAGE PROVIDER  ──────────────────────── */
    const alwaysPageSet = this.alwaysPage.get(scope.pageIndex) ?? new Set<PointerEventHandlers>();
    const modePageSet =
      mode.scope === 'page'
        ? (bucket.page.get(scope.pageIndex) ?? new Set<PointerEventHandlers>())
        : new Set<PointerEventHandlers>(); // global-scoped mode → ignore page buckets

    return mergeSets(alwaysPageSet, modePageSet);
  }

  /** ---------- cursor handling --------------------- */
  private setCursor(token: string, cursor: string, priority = 0) {
    this.cursorClaims.set(token, { cursor, priority });
    this.emitCursor();
  }
  private removeCursor(token: string) {
    this.cursorClaims.delete(token);
    this.emitCursor();
  }

  private emitCursor() {
    /* pick highest priority claim, else mode baseline */
    const top = [...this.cursorClaims.values()].sort((a, b) => b.priority - a.priority)[0] ?? {
      cursor: this.modes.get(this.state.activeMode)?.cursor ?? 'auto',
    };

    if (top.cursor !== this.state.cursor) {
      this.dispatch(setCursor(top.cursor));
      this.onCursorChange$.emit(top.cursor);
    }
  }

  private activeModeIsExclusive(): boolean {
    const mode = this.modes.get(this.state.activeMode);
    return !!mode?.exclusive;
  }

  private getActiveInteractionMode(): InteractionMode | null {
    return this.modes.get(this.state.activeMode) ?? null;
  }

  // keep emitter clean
  async destroy(): Promise<void> {
    this.onModeChange$.clear();
    this.onCursorChange$.clear();
    await super.destroy();
  }
}

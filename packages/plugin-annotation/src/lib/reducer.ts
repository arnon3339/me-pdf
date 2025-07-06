import { Reducer } from '@embedpdf/core';
import { PdfAnnotationSubtype } from '@embedpdf/models';
import {
  ADD_COLOR_PRESET,
  COMMIT_PENDING_CHANGES,
  CREATE_ANNOTATION,
  DESELECT_ANNOTATION,
  PATCH_ANNOTATION,
  DELETE_ANNOTATION,
  REDO,
  SELECT_ANNOTATION,
  SET_ANNOTATION_MODE,
  SET_ANNOTATIONS,
  UNDO,
  UPDATE_TOOL_DEFAULTS,
  AnnotationAction,
} from './actions';
import {
  AnnotationPluginConfig,
  AnnotationState,
  HistorySnapshot,
  TrackedAnnotation,
} from './types';
import { makeUid } from './utils';

/* ─────────── util helpers ─────────── */
const DEFAULT_COLORS = [
  '#E44234',
  '#FF8D00',
  '#FFCD45',
  '#5CC96E',
  '#25D2D1',
  '#597CE2',
  '#C544CE',
  '#7D2E25',
];
const clonePages = (p: Record<number, string[]>) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [...v]]));

/* push snapshot (copy-on-write for pages, strip pdfId) */
const push = (s: AnnotationState): AnnotationState => {
  const byUidPatch: HistorySnapshot['byUidPatch'] = {};
  for (const uid in s.byUid) {
    const { commitState, object } = s.byUid[uid];
    byUidPatch[uid] = { commitState, object }; // no pdfId
  }
  return { ...s, past: [...s.past, { pages: clonePages(s.pages), byUidPatch }], future: [] };
};

const snapshotOf = (s: AnnotationState): HistorySnapshot => {
  const byUidPatch: HistorySnapshot['byUidPatch'] = {};
  for (const uid in s.byUid) {
    const { commitState, object } = s.byUid[uid];
    byUidPatch[uid] = { commitState, object };
  }
  return { pages: clonePages(s.pages), byUidPatch };
};

/* pop snapshot and merge back pdfId */
const pop = (s: AnnotationState, src: 'past' | 'future'): AnnotationState => {
  const stack = src === 'past' ? s.past : s.future;
  if (!stack.length) return s;

  const snap = stack[stack.length - 1];
  const cur = snapshotOf(s);

  /* rebuild current annotation map, preserving pdfId */
  const rebuild: Record<string, TrackedAnnotation> = {};
  for (const uid of Object.keys(s.byUid)) rebuild[uid] = { ...s.byUid[uid] };
  for (const [uid, patch] of Object.entries(snap.byUidPatch)) {
    rebuild[uid] = {
      pdfId: rebuild[uid]?.pdfId,
      commitState: patch.commitState,
      object: patch.object,
    };
  }

  const newPast = src === 'past' ? stack.slice(0, -1) : [...s.past, cur];
  const newFuture = src === 'past' ? [...s.future, cur] : stack.slice(0, -1);

  return { ...s, pages: snap.pages, byUid: rebuild, past: newPast, future: newFuture };
};

/* helper to immutably replace one annotation (preserving pdfId) */
const patchAnno = (
  state: AnnotationState,
  uid: string,
  patch: Partial<TrackedAnnotation['object']>,
): AnnotationState => {
  const prev = state.byUid[uid];
  if (!prev) return state;
  return {
    ...state,
    byUid: {
      ...state.byUid,
      [uid]: {
        ...prev,
        commitState: prev.commitState === 'synced' ? 'dirty' : prev.commitState,
        object: { ...prev.object, ...patch },
      } as TrackedAnnotation,
    },
    hasPendingChanges: true,
  };
};

/* ─────────── initialState ─────────── */
export const initialState = (cfg: AnnotationPluginConfig): AnnotationState => ({
  pages: {},
  byUid: {},
  selectedUid: null,
  annotationMode: null,

  toolDefaults: {
    [PdfAnnotationSubtype.HIGHLIGHT]: {
      name: 'Highlight',
      color: '#FFCD45',
      opacity: 1,
      interaction: { mode: 'highlight', exclusive: false },
      textSelection: true,
    },
    [PdfAnnotationSubtype.UNDERLINE]: {
      name: 'Underline',
      color: '#E44234',
      opacity: 1,
      interaction: { mode: 'underline', exclusive: false },
      textSelection: true,
    },
    [PdfAnnotationSubtype.STRIKEOUT]: {
      name: 'Strikeout',
      color: '#E44234',
      opacity: 1,
      interaction: { mode: 'strikeout', exclusive: false },
      textSelection: true,
    },
    [PdfAnnotationSubtype.SQUIGGLY]: {
      name: 'Squiggly',
      color: '#E44234',
      opacity: 1,
      interaction: { mode: 'squiggly', exclusive: false },
      textSelection: true,
    },
    ...cfg.toolDefaults,
  },
  colorPresets: cfg.colorPresets ?? DEFAULT_COLORS,

  past: [],
  future: [],
  hasPendingChanges: false,
});

/* ─────────── reducer ─────────── */
export const reducer: Reducer<AnnotationState, AnnotationAction> = (state, action) => {
  switch (action.type) {
    /* ───── bulk load from engine ───── */
    case SET_ANNOTATIONS: {
      const pages: AnnotationState['pages'] = {};
      const byUid: AnnotationState['byUid'] = {};
      for (const [pgStr, list] of Object.entries(action.payload)) {
        const page = Number(pgStr);
        pages[page] = list.map((a) => {
          const uid = makeUid(page, a.id);
          byUid[uid] = { pdfId: a.id, commitState: 'synced', object: a };
          return uid;
        });
      }
      return { ...state, pages, byUid, selectedUid: null, past: [], future: [] };
    }

    /* ───── GUI bits ───── */
    case SET_ANNOTATION_MODE:
      return { ...state, annotationMode: action.payload };
    case SELECT_ANNOTATION:
      return {
        ...state,
        selectedUid: makeUid(action.payload.pageIndex, action.payload.annotationId),
      };
    case DESELECT_ANNOTATION:
      return { ...state, selectedUid: null };

    case ADD_COLOR_PRESET:
      return state.colorPresets.includes(action.payload)
        ? state
        : { ...state, colorPresets: [...state.colorPresets, action.payload] };

    case UPDATE_TOOL_DEFAULTS: {
      const { subtype, patch } = action.payload;
      return {
        ...state,
        toolDefaults: {
          ...state.toolDefaults,
          [subtype]: { ...state.toolDefaults[subtype], ...patch },
        },
      };
    }

    /* ───── create ───── */
    case CREATE_ANNOTATION: {
      const { pageIndex, annotation } = action.payload;
      const uid = makeUid(pageIndex, annotation.id);
      const after = push(state);
      return {
        ...after,
        pages: { ...after.pages, [pageIndex]: [...(after.pages[pageIndex] ?? []), uid] },
        byUid: {
          ...after.byUid,
          [uid]: { pdfId: undefined, commitState: 'new', object: annotation },
        },
        hasPendingChanges: true,
      };
    }

    /* ───── delete ───── */
    case DELETE_ANNOTATION: {
      const { pageIndex, annotationId } = action.payload;
      const uid = makeUid(pageIndex, annotationId);
      if (!state.byUid[uid]) return state;

      const after = push(state);
      const { [uid]: _gone, ...rest } = after.byUid;
      return {
        ...after,
        pages: {
          ...after.pages,
          [pageIndex]: (after.pages[pageIndex] ?? []).filter((u) => u !== uid),
        },
        byUid: rest,
        hasPendingChanges: true,
      };
    }

    /* ───── field edits ───── */
    case PATCH_ANNOTATION: {
      const uid = makeUid(action.payload.pageIndex, action.payload.annotationId);
      return patchAnno(push(state), uid, action.payload.patch);
    }

    /* ───── undo / redo ───── */
    case UNDO:
      return pop(state, 'past');
    case REDO:
      return pop(state, 'future');

    /* ───── commit bookkeeping ───── */
    case COMMIT_PENDING_CHANGES: {
      const cleaned: AnnotationState['byUid'] = {};
      for (const [uid, ta] of Object.entries(state.byUid)) {
        cleaned[uid] = {
          ...ta,
          commitState:
            ta.commitState === 'dirty' || ta.commitState === 'new' ? 'synced' : ta.commitState,
        };
      }
      return { ...state, byUid: cleaned, hasPendingChanges: false };
    }

    default:
      return state;
  }
};

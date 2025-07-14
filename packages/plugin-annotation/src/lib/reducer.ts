import { Reducer } from '@embedpdf/core';
import { PdfAnnotationSubtype } from '@embedpdf/models';
import {
  ADD_COLOR_PRESET,
  COMMIT_PENDING_CHANGES,
  CREATE_ANNOTATION,
  DESELECT_ANNOTATION,
  PATCH_ANNOTATION,
  DELETE_ANNOTATION,
  SELECT_ANNOTATION,
  SET_ANNOTATION_MODE,
  SET_ANNOTATIONS,
  UPDATE_TOOL_DEFAULTS,
  AnnotationAction,
  PURGE_ANNOTATION,
  STORE_PDF_ID,
  REINDEX_PAGE_ANNOTATIONS,
} from './actions';
import { AnnotationPluginConfig, AnnotationState, TrackedAnnotation } from './types';
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
    [PdfAnnotationSubtype.INK]: {
      name: 'Ink',
      color: '#E44234',
      opacity: 1,
      strokeWidth: 11,
      interaction: { mode: 'ink', exclusive: true, cursor: 'crosshair' },
      textSelection: false,
    },
    ...cfg.toolDefaults,
  },
  colorPresets: cfg.colorPresets ?? DEFAULT_COLORS,
  hasPendingChanges: false,
});

/* ─────────── reducer ─────────── */
export const reducer: Reducer<AnnotationState, AnnotationAction> = (state, action) => {
  switch (action.type) {
    /* ───── bulk load from engine ───── */
    case SET_ANNOTATIONS: {
      const newPages = { ...state.pages };
      const newByUid = { ...state.byUid };
      for (const [pgStr, list] of Object.entries(action.payload)) {
        const pageIndex = Number(pgStr);
        const oldUidsOnPage = state.pages[pageIndex] || [];
        for (const uid of oldUidsOnPage) {
          delete newByUid[uid];
        }
        const newUidsOnPage = list.map((a, index) => {
          const localId = Date.now() + Math.random() + index;
          const uid = makeUid(pageIndex, localId);
          newByUid[uid] = { localId, pdfId: a.id, commitState: 'synced', object: a };
          return uid;
        });
        newPages[pageIndex] = newUidsOnPage;
      }
      return { ...state, pages: newPages, byUid: newByUid };
    }

    /* ───── GUI bits ───── */
    case SET_ANNOTATION_MODE:
      return { ...state, annotationMode: action.payload };
    case SELECT_ANNOTATION:
      return {
        ...state,
        selectedUid: makeUid(action.payload.pageIndex, action.payload.localId),
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
      const { pageIndex, localId, annotation } = action.payload;
      const uid = makeUid(pageIndex, localId);

      return {
        ...state,
        pages: { ...state.pages, [pageIndex]: [...(state.pages[pageIndex] ?? []), uid] },
        byUid: {
          ...state.byUid,
          [uid]: { localId, pdfId: undefined, commitState: 'new', object: annotation },
        },
        hasPendingChanges: true,
      };
    }

    /* ───── delete ───── */
    case DELETE_ANNOTATION: {
      const { pageIndex, localId } = action.payload;
      const uid = makeUid(pageIndex, localId);
      if (!state.byUid[uid]) return state;

      /* keep the object but mark it as deleted */
      return {
        ...state,
        pages: {
          ...state.pages,
          [pageIndex]: (state.pages[pageIndex] ?? []).filter((u) => u !== uid),
        },
        byUid: {
          ...state.byUid,
          [uid]: { ...state.byUid[uid], commitState: 'deleted' },
        },
        hasPendingChanges: true,
      };
    }

    /* ───── field edits ───── */
    case PATCH_ANNOTATION: {
      const uid = makeUid(action.payload.pageIndex, action.payload.localId);
      return patchAnno(state, uid, action.payload.patch);
    }

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

    case REINDEX_PAGE_ANNOTATIONS: {
      const { pageIndex } = action.payload;
      const newByUid = { ...state.byUid };

      const uidsOnPage = state.pages[pageIndex] || [];
      const annosOnPage = uidsOnPage
        .map((uid) => state.byUid[uid])
        .filter((ta) => ta && ta.commitState !== 'deleted'); // Filter out annotations pending deletion

      // CORRECTED: Sort by the existing pdfId to maintain relative order.
      annosOnPage.sort((a, b) => (a.pdfId ?? Infinity) - (b.pdfId ?? Infinity));

      // Update the pdfId for each annotation based on its new sorted index
      annosOnPage.forEach((ta, newPdfId) => {
        const uid = makeUid(pageIndex, ta.localId);
        newByUid[uid] = { ...newByUid[uid], pdfId: newPdfId };
      });

      return { ...state, byUid: newByUid };
    }

    case STORE_PDF_ID: {
      const { uid, pdfId } = action.payload;

      const ta = state.byUid[uid];
      if (!ta) return state;
      return {
        ...state,
        byUid: {
          ...state.byUid,
          [uid]: { ...ta, pdfId, commitState: 'synced' },
        },
      };
    }

    case PURGE_ANNOTATION: {
      const { uid } = action.payload;
      const { [uid]: _gone, ...rest } = state.byUid;
      return { ...state, byUid: rest };
    }

    default:
      return state;
  }
};

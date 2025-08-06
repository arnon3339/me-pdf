import { AnnotationDefaults, AnnotationState, SelectedAnnotation } from './types';
import { parseUid, makeUid } from './utils';
import { makeVariantKey } from './variant-key';

/* ─────────── public selectors ─────────── */

/** All annotations _objects_ on a single page (order preserved). */
export const getAnnotationsByPageIndex = (s: AnnotationState, page: number) =>
  (s.pages[page] ?? []).map((uid) => s.byUid[uid]);

/** Shortcut: every page → list of annotation objects. */
export const getAnnotations = (s: AnnotationState) => {
  const out: Record<number, ReturnType<typeof getAnnotationsByPageIndex>> = {};
  for (const p of Object.keys(s.pages).map(Number)) out[p] = getAnnotationsByPageIndex(s, p);
  return out;
};

/** The full `TrackedAnnotation` for the current selection. */
export const getSelectedAnnotation = (s: AnnotationState) =>
  s.selectedUid ? s.byUid[s.selectedUid] : null;

export const getSelectedAnnotationWithPageIndex = (
  s: AnnotationState,
): SelectedAnnotation | null => {
  if (!s.selectedUid) return null;
  const { pageIndex, id } = parseUid(s.selectedUid);
  return { pageIndex, id, annotation: s.byUid[s.selectedUid].object };
};

export const getSelectedAnnotationByPageIndex = (s: AnnotationState, pageIndex: number) => {
  if (!s.selectedUid) return null;

  const pageUids = s.pages[pageIndex] ?? [];

  // Check if the selected UID is on the requested page
  if (pageUids.includes(s.selectedUid)) {
    return s.byUid[s.selectedUid];
  }

  return null;
};

export const isInAnnotationVariant = (s: AnnotationState) => s.activeVariant !== null;
export const getSelectedAnnotationVariant = (s: AnnotationState) => s.activeVariant;

/** Check if a given anno on a page is the current selection. */
export const isAnnotationSelected = (s: AnnotationState, page: number, id: string) =>
  s.selectedUid === makeUid(page, id);

/**
 * Return the tool-defaults for a given subtype and (optionally) intent.
 * If the exact variant (subtype + intent) is not present, it gracefully
 * falls back to the plain subtype variant.
 *
 * The return type is inferred so that you always get the concrete default
 * interface for the supplied subtype (e.g. `InkDefaults` for `INK`,
 * `CircleDefaults` for `CIRCLE`, …).
 */
export function getToolDefaultsBySubtypeAndIntent<
  S extends AnnotationState,
  TSub extends AnnotationDefaults['subtype'],
>(state: S, subtype: TSub, intent?: string | null): Extract<AnnotationDefaults, { subtype: TSub }> {
  // Build keys
  const variantKey = makeVariantKey(subtype, intent ?? undefined);
  const fallbackKey = makeVariantKey(subtype);

  // Try exact match first, otherwise fall back to plain subtype
  const defaults = state.toolDefaults[variantKey] ?? state.toolDefaults[fallbackKey];

  if (!defaults) {
    throw new Error(
      `No tool defaults found for subtype ${subtype}${intent ? ` and intent ${intent}` : ''}`,
    );
  }

  // Cast is safe because we narrow the union by subtype
  return defaults as Extract<AnnotationDefaults, { subtype: TSub }>;
}

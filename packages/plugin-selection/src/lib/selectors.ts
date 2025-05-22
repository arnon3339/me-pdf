import { Rect, boundingRect } from "@embedpdf/models";
import { SelectionState } from "./types";

export function selectRectsForPage(state: SelectionState, page: number) {
  return state.rects[page] ?? [];
}

export function selectBoundingRectForPage(state: SelectionState, page: number) {
  return boundingRect(selectRectsForPage(state, page));
}

export function selectBoundingRectsForAllPages(state: SelectionState) {
  const out: { page: number; rect: Rect }[] = [];
  const rectMap = state.rects;

  for (const key in rectMap) {
    const page  = Number(key);
    const bRect = boundingRect(rectMap[page]);
    if (bRect) out.push({ page, rect: bRect });
  }
  return out;
}
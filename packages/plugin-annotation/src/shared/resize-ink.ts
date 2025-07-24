import {
  PdfAnnotationObject,
  PdfAnnotationSubtype,
  PdfInkAnnoObject,
  Rect,
} from '@embedpdf/models';
import { ResizeDirection } from './types';

/**
 * Computes a patch for resizing an ink annotation.
 * - Scales all points in inkList to fit the new rect.
 * - Scales strokeWidth proportionally (using average scale factor).
 * - Handles non-uniform scaling (stretch).
 * - Optionally preserves aspect ratio (set uniform=true).
 *
 * @param original The original ink annotation object.
 * @param newRect The new bounding rect after resize.
 * @param direction The resize handle direction (affects origin adjustments if needed).
 * @param uniform If true, constrains to uniform scaling (uses min scale factor).
 * @returns Partial patch { rect, inkList, strokeWidth } to apply.
 */
export function resizeInkAnnotation(
  original: PdfAnnotationObject, // Assumes type=INK
  newRect: Rect,
  direction: ResizeDirection,
  uniform: boolean = false,
): Partial<PdfInkAnnoObject> {
  if (original.type !== PdfAnnotationSubtype.INK) {
    throw new Error('resizeInkAnnotation: original is not an ink annotation');
  }

  const oldRect = original.rect;
  let scaleX = newRect.size.width / oldRect.size.width;
  let scaleY = newRect.size.height / oldRect.size.height;

  // Enforce minimum size to avoid collapse
  const minSize = 10; // Arbitrary PDF units; adjust as needed
  if (newRect.size.width < minSize || newRect.size.height < minSize) {
    // Return empty patch or throw; for now, clamp
    scaleX = Math.max(scaleX, minSize / oldRect.size.width);
    scaleY = Math.max(scaleY, minSize / oldRect.size.height);
    newRect = {
      origin: newRect.origin,
      size: {
        width: oldRect.size.width * scaleX,
        height: oldRect.size.height * scaleY,
      },
    };
  }

  // Optional: Uniform scaling (preserve aspect ratio)
  if (uniform) {
    const minScale = Math.min(scaleX, scaleY);
    scaleX = minScale;
    scaleY = minScale;
    // Adjust newRect size accordingly (keep origin the same)
    newRect.size = {
      width: oldRect.size.width * minScale,
      height: oldRect.size.height * minScale,
    };
  }

  // Scale points: Normalize relative to old origin, scale, then add new origin
  const newInkList = original.inkList.map((stroke) => ({
    points: stroke.points.map((p) => ({
      x: newRect.origin.x + (p.x - oldRect.origin.x) * scaleX,
      y: newRect.origin.y + (p.y - oldRect.origin.y) * scaleY,
    })),
  }));

  // Scale strokeWidth: Use average scale (preserves "thickness feel")
  // Alternatives: Math.min(scaleX, scaleY) for conservative, or sqrt(scaleX * scaleY) for area-preserving
  const avgScale = (scaleX + scaleY) / 2;
  const newStrokeWidth = Math.round(original.strokeWidth * avgScale);

  // Optional: Adjust based on direction (e.g., if resizing from top-left, points might need flip/recalc, but usually not needed as scaling handles it)

  return {
    rect: newRect,
    inkList: newInkList,
    strokeWidth: newStrokeWidth,
  };
}

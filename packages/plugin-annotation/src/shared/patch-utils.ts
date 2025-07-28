import { Rect, Position, LineEndings, PdfAnnotationLineEnding } from '@embedpdf/models';

/** Minimum-sized rect that encloses the given points */
export function rectFromPoints(pts: readonly Position[]): Rect {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    origin: { x: Math.min(...xs), y: Math.min(...ys) },
    size: {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    },
  };
}

/** Grow a rect by *pad* on all four sides */
export function expandRect(r: Rect, pad: number): Rect {
  return {
    origin: { x: r.origin.x - pad, y: r.origin.y - pad },
    size: { width: r.size.width + pad * 2, height: r.size.height + pad * 2 },
  };
}

/**
 * Calculates the local-space vertices of an ending shape, centered at (0,0).
 * The shape is oriented to point along the positive X-axis.
 * @param ending The type of line ending.
 * @param strokeWidth The width of the line stroke.
 * @returns An array of {x, y} positions for the shape's vertices.
 */
function getEndingLocalPoints(ending: PdfAnnotationLineEnding, strokeWidth: number): Position[] {
  const sw = strokeWidth;
  switch (ending) {
    case PdfAnnotationLineEnding.OpenArrow:
    case PdfAnnotationLineEnding.ClosedArrow:
    case PdfAnnotationLineEnding.ROpenArrow:
    case PdfAnnotationLineEnding.RClosedArrow: {
      const len = sw * 9;
      const a = Math.PI / 6; // 30 degrees half-angle
      const x = -len * Math.cos(a);
      const y = len * Math.sin(a);
      // Tip at (0,0), wings in negative-x half-plane, so it points along positive-x.
      return [
        { x: 0, y: 0 },
        { x, y },
        { x, y: -y },
      ];
    }
    case PdfAnnotationLineEnding.Circle: {
      const r = (sw * 5) / 2;
      // Bounding box of the circle is sufficient.
      return [
        { x: -r, y: -r },
        { x: r, y: r },
      ];
    }
    case PdfAnnotationLineEnding.Square: {
      const h = (sw * 6) / 2;
      return [
        { x: -h, y: -h },
        { x: h, y: h },
      ];
    }
    case PdfAnnotationLineEnding.Diamond: {
      const h = (sw * 6) / 2;
      return [
        { x: 0, y: -h },
        { x: h, y: 0 },
        { x: 0, y: h },
        { x: -h, y: 0 },
      ];
    }
    case PdfAnnotationLineEnding.Butt: {
      const l = (sw * 6) / 2;
      return [
        { x: -l, y: 0 },
        { x: l, y: 0 },
      ];
    }
    case PdfAnnotationLineEnding.Slash: {
      const l = (sw * 18) / 2;
      return [
        { x: -l, y: 0 },
        { x: l, y: 0 },
      ];
    }
    default:
      return [];
  }
}

/**
 * Applies rotation and translation to a point.
 * @param p The point to transform.
 * @param angleRad The rotation angle in radians.
 * @param translate The translation vector.
 * @returns The transformed point.
 */
function transformPoint(p: Position, angleRad: number, translate: Position): Position {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const newX = p.x * cos - p.y * sin;
  const newY = p.x * sin + p.y * cos;
  return {
    x: newX + translate.x,
    y: newY + translate.y,
  };
}

/**
 * Computes the exact bounding box for a line or polyline, including its endings and stroke width.
 * @param vertices The vertices of the line/polyline.
 * @param strokeWidth The width of the stroke in PDF units.
 * @param endings The optional start and end caps for the line.
 * @returns The computed bounding `Rect`.
 */
export function lineRectWithEndings(
  vertices: Position[],
  strokeWidth: number,
  endings: LineEndings | undefined,
): Rect {
  if (!vertices || vertices.length === 0) {
    return { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
  }

  // Start with all the vertices of the line itself.
  const allPoints: Position[] = [...vertices];

  const toAngle = (a: Position, b: Position) => Math.atan2(b.y - a.y, b.x - a.x);

  // Helper to process a line ending.
  const processEnding = (
    endingType: PdfAnnotationLineEnding | undefined,
    tipPos: Position,
    segmentAngle: number,
  ) => {
    if (!endingType) return;

    const localPts = getEndingLocalPoints(endingType, strokeWidth);
    let rotationAngle = 0; // Default for non-rotating shapes

    // Determine the correct final rotation angle, mirroring the logic in `createEnding`.
    switch (endingType) {
      case PdfAnnotationLineEnding.OpenArrow:
      case PdfAnnotationLineEnding.ClosedArrow:
        rotationAngle = segmentAngle;
        break;
      case PdfAnnotationLineEnding.ROpenArrow:
      case PdfAnnotationLineEnding.RClosedArrow:
        rotationAngle = segmentAngle + Math.PI;
        break;
      case PdfAnnotationLineEnding.Butt:
        rotationAngle = segmentAngle + Math.PI / 2; // Perpendicular
        break;
      case PdfAnnotationLineEnding.Slash:
        rotationAngle = segmentAngle + Math.PI / 1.5;
        break;
      // Circle, Square, Diamond use default rotationAngle = 0 as they are not rotated relative to the line.
    }

    const transformedPts = localPts.map((p) => transformPoint(p, rotationAngle, tipPos));
    allPoints.push(...transformedPts);
  };

  // Handle start and end endings if the line has at least one segment.
  if (vertices.length >= 2) {
    // Process start ending. Angle points from the second vertex INTO the first.
    const startAngle = toAngle(vertices[1], vertices[0]);
    processEnding(endings?.start, vertices[0], startAngle);

    // Process end ending. Angle points from the second-to-last vertex INTO the last.
    const lastIdx = vertices.length - 1;
    const endAngle = toAngle(vertices[lastIdx - 1], vertices[lastIdx]);
    processEnding(endings?.end, vertices[lastIdx], endAngle);
  }

  // If there's only one point (e.g., from an unfinished polyline), create a small box.
  if (allPoints.length <= 1) {
    const point = vertices[0];
    const pad = strokeWidth;
    return {
      origin: { x: point.x - pad, y: point.y - pad },
      size: { width: pad * 2, height: pad * 2 },
    };
  }

  // Calculate the bounding box from all collected points.
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const baseRect: Rect = {
    origin: { x: minX, y: minY },
    size: { width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) },
  };

  // Expand the final rect to account for the stroke width of the line segments and endings.
  const pad = strokeWidth / 2;
  return {
    origin: { x: baseRect.origin.x - pad, y: baseRect.origin.y - pad },
    size: { width: baseRect.size.width + pad * 2, height: baseRect.size.height + pad * 2 },
  };
}

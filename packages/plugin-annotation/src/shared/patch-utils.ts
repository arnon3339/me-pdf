import { Rect, Position, LineEndings, PdfAnnotationLineEnding } from '@embedpdf/models';
import { LINE_ENDING_HANDLERS } from './line-ending-handlers';

/** Minimum-sized rect that encloses the given points */
export function rectFromPoints(pts: readonly Position[]): Rect {
  if (pts.length === 0) {
    return { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
  }
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    origin: { x: minX, y: minY },
    size: {
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
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
 * This function uses the central `LINE_ENDING_HANDLERS` to ensure calculations are
 * perfectly in sync with the rendering logic.
 */
export function lineRectWithEndings(
  vertices: Position[],
  strokeWidth: number,
  endings: LineEndings | undefined,
): Rect {
  if (!vertices || vertices.length === 0) {
    return { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
  }

  const allPoints: Position[] = [...vertices];
  const toAngle = (a: Position, b: Position) => Math.atan2(b.y - a.y, b.x - a.x);

  const processEnding = (
    endingType: PdfAnnotationLineEnding | undefined,
    tipPos: Position,
    segmentAngle: number,
  ) => {
    if (!endingType) return;

    const handler = LINE_ENDING_HANDLERS[endingType];
    if (!handler) return;

    const localPts = handler.getLocalPoints(strokeWidth);
    const rotationAngle = handler.getRotation(segmentAngle);

    const transformedPts = localPts.map((p) => transformPoint(p, rotationAngle, tipPos));
    allPoints.push(...transformedPts);
  };

  if (vertices.length >= 2) {
    // Process start ending. Angle points from the second vertex INTO the first.
    const startAngle = toAngle(vertices[1], vertices[0]);
    processEnding(endings?.start, vertices[0], startAngle);

    // Process end ending. Angle points from the second-to-last vertex INTO the last.
    const lastIdx = vertices.length - 1;
    const endAngle = toAngle(vertices[lastIdx - 1], vertices[lastIdx]);
    processEnding(endings?.end, vertices[lastIdx], endAngle);
  }

  if (allPoints.length <= 1) {
    const point = vertices[0] || { x: 0, y: 0 };
    const pad = strokeWidth;
    return {
      origin: { x: point.x - pad, y: point.y - pad },
      size: { width: pad * 2, height: pad * 2 },
    };
  }

  const baseRect = rectFromPoints(allPoints);
  const pad = strokeWidth / 2;
  return expandRect(baseRect, pad);
}

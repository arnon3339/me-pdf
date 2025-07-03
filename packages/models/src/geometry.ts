/**
 * Clockwise direction
 * @public
 */
export enum Rotation {
  Degree0 = 0,
  Degree90 = 1,
  Degree180 = 2,
  Degree270 = 3,
}

/** Clamp a Position to device-pixel integers (floor) */
export function toIntPos(p: Position): Position {
  return { x: Math.floor(p.x), y: Math.floor(p.y) };
}

/** Clamp a Size so it never truncates right / bottom (ceil) */
export function toIntSize(s: Size): Size {
  return { width: Math.ceil(s.width), height: Math.ceil(s.height) };
}

/** Apply both rules to a Rect */
export function toIntRect(r: Rect): Rect {
  return {
    origin: toIntPos(r.origin),
    size: toIntSize(r.size),
  };
}

/**
 * Calculate degree that match the rotation type
 * @param rotation - type of rotation
 * @returns rotated degree
 *
 * @public
 */
export function calculateDegree(rotation: Rotation) {
  switch (rotation) {
    case Rotation.Degree0:
      return 0;
    case Rotation.Degree90:
      return 90;
    case Rotation.Degree180:
      return 180;
    case Rotation.Degree270:
      return 270;
  }
}

/**
 * Calculate angle that match the rotation type
 * @param rotation - type of rotation
 * @returns rotated angle
 *
 * @public
 */
export function calculateAngle(rotation: Rotation) {
  return (calculateDegree(rotation) * Math.PI) / 180;
}

/**
 * Represent the size of object
 *
 * @public
 */
export interface Size {
  /**
   * width of the object
   */
  width: number;

  /**
   * height of the object
   */
  height: number;
}

/**
 * Represents a rectangle defined by its left, top, right, and bottom edges
 *
 * @public
 */
export interface Box {
  /**
   * The x-coordinate of the left edge
   */
  left: number;

  /**
   * The y-coordinate of the top edge
   */
  top: number;

  /**
   * The x-coordinate of the right edge
   */
  right: number;

  /**
   * The y-coordinate of the bottom edge
   */
  bottom: number;
}

/**
 * Swap the width and height of the size object
 * @param size - the original size
 * @returns swapped size
 *
 * @public
 */
export function swap(size: Size): Size {
  const { width, height } = size;

  return {
    width: height,
    height: width,
  };
}

/**
 * Transform size with specified rotation angle and scale factor
 * @param size - orignal size of rect
 * @param rotation - rotation angle
 * @param scaleFactor - - scale factor
 * @returns size that has been transformed
 *
 * @public
 */
export function transformSize(size: Size, rotation: Rotation, scaleFactor: number): Size {
  size = rotation % 2 === 0 ? size : swap(size);

  return {
    width: size.width * scaleFactor,
    height: size.height * scaleFactor,
  };
}

/**
 * position of point
 *
 * @public
 */
export interface Position {
  /**
   * x coordinate
   */
  x: number;

  /**
   * y coordinate
   */
  y: number;
}

/**
 * Quadrilateral
 *
 * @public
 */
export interface Quad {
  p1: Position;
  p2: Position;
  p3: Position;
  p4: Position;
}

/**
 * Convert quadrilateral to rectangle
 * @param q - quadrilateral
 * @returns rectangle
 *
 * @public
 */
export function quadToRect(q: Quad): Rect {
  const xs = [q.p1.x, q.p2.x, q.p3.x, q.p4.x];
  const ys = [q.p1.y, q.p2.y, q.p3.y, q.p4.y];

  return {
    origin: { x: Math.min(...xs), y: Math.min(...ys) },
    size: {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    },
  };
}

/**
 * Convert rectangle to quadrilateral
 * @param r - rectangle
 * @returns quadrilateral
 *
 * @public
 */
export function rectToQuad(r: Rect): Quad {
  return {
    p1: { x: r.origin.x, y: r.origin.y },
    p2: { x: r.origin.x + r.size.width, y: r.origin.y },
    p3: { x: r.origin.x + r.size.width, y: r.origin.y + r.size.height },
    p4: { x: r.origin.x, y: r.origin.y + r.size.height },
  };
}

/**
 * Rotate the container and calculate the new position for a point
 * in specified position
 * @param containerSize - size of the container
 * @param position - position of the point
 * @param rotation - rotated angle
 * @returns new position of the point
 *
 * @public
 */
export function rotatePosition(
  containerSize: Size,
  position: Position,
  rotation: Rotation,
): Position {
  let x = position.x;
  let y = position.y;

  switch (rotation) {
    case Rotation.Degree0:
      x = position.x;
      y = position.y;
      break;
    case Rotation.Degree90:
      x = containerSize.height - position.y;
      y = position.x;
      break;
    case Rotation.Degree180:
      x = containerSize.width - position.x;
      y = containerSize.height - position.y;
      break;
    case Rotation.Degree270:
      x = position.y;
      y = containerSize.width - position.x;
      break;
  }

  return {
    x,
    y,
  };
}

/**
 * Calculate the position of point by scaling the container
 * @param position - position of the point
 * @param scaleFactor - factor of scaling
 * @returns new position of point
 *
 * @public
 */
export function scalePosition(position: Position, scaleFactor: number): Position {
  return {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor,
  };
}

/**
 * Calculate the position of the point by applying the specified transformation
 * @param containerSize - size of container
 * @param position - position of the point
 * @param rotation - rotated angle
 * @param scaleFactor - factor of scaling
 * @returns new position of point
 *
 * @public
 */
export function transformPosition(
  containerSize: Size,
  position: Position,
  rotation: Rotation,
  scaleFactor: number,
): Position {
  return scalePosition(rotatePosition(containerSize, position, rotation), scaleFactor);
}

/**
 * Restore the position in a transformed cotainer
 * @param containerSize - size of the container
 * @param position - position of the point
 * @param rotation - rotated angle
 * @param scaleFactor - factor of scaling
 * @returns the original position of the point
 *
 * @public
 */
export function restorePosition(
  containerSize: Size,
  position: Position,
  rotation: Rotation,
  scaleFactor: number,
): Position {
  return scalePosition(
    rotatePosition(containerSize, position, (4 - rotation) % 4),
    1 / scaleFactor,
  );
}

/**
 * representation of rectangle
 *
 * @public
 */
export interface Rect {
  /**
   * origin of the rectangle
   */
  origin: Position;

  /**
   * size of the rectangle
   */
  size: Size;
}

/**
 * Calculate the rect after rotated the container
 * @param containerSize - size of container
 * @param rect - target rect
 * @param rotation - rotation angle
 * @returns rotated rect
 *
 * @public
 */
export function rotateRect(containerSize: Size, rect: Rect, rotation: Rotation): Rect {
  let x = rect.origin.x;
  let y = rect.origin.y;
  let size = rect.size;

  switch (rotation) {
    case Rotation.Degree0:
      break;
    case Rotation.Degree90:
      x = containerSize.height - rect.origin.y - rect.size.height;
      y = rect.origin.x;
      size = swap(rect.size);
      break;
    case Rotation.Degree180:
      x = containerSize.width - rect.origin.x - rect.size.width;
      y = containerSize.height - rect.origin.y - rect.size.height;
      break;
    case Rotation.Degree270:
      x = rect.origin.y;
      y = containerSize.width - rect.origin.x - rect.size.width;
      size = swap(rect.size);
      break;
  }

  return {
    origin: {
      x,
      y,
    },
    size: {
      width: size.width,
      height: size.height,
    },
  };
}

/**
 * Scale the rectangle
 * @param rect - rectangle
 * @param scaleFactor - factor of scaling
 * @returns new rectangle
 *
 * @public
 */
export function scaleRect(rect: Rect, scaleFactor: number): Rect {
  return {
    origin: {
      x: rect.origin.x * scaleFactor,
      y: rect.origin.y * scaleFactor,
    },
    size: {
      width: rect.size.width * scaleFactor,
      height: rect.size.height * scaleFactor,
    },
  };
}

/**
 * Calculate new rectangle after transforming the container
 * @param containerSize - size of the container
 * @param rect - the target rectangle
 * @param rotation - rotated angle
 * @param scaleFactor - factor of scaling
 * @returns new rectangle after transformation
 *
 * @public
 */
export function transformRect(
  containerSize: Size,
  rect: Rect,
  rotation: Rotation,
  scaleFactor: number,
): Rect {
  return scaleRect(rotateRect(containerSize, rect, rotation), scaleFactor);
}

/**
 * Calculate new rectangle before transforming the container
 * @param containerSize - size of the container
 * @param rect - the target rectangle
 * @param rotation - rotated angle
 * @param scaleFactor - factor of scaling
 * @returns original rectangle before transformation
 *
 * @public
 */
export function restoreRect(
  containerSize: Size,
  rect: Rect,
  rotation: Rotation,
  scaleFactor: number,
): Rect {
  return scaleRect(rotateRect(containerSize, rect, (4 - rotation) % 4), 1 / scaleFactor);
}

/**
 * Calculate the original offset in a transformed container
 * @param offset - position of the point
 * @param rotation - rotated angle
 * @param scaleFactor - factor of scaling
 * @returns original position of the point
 *
 * @public
 */
export function restoreOffset(offset: Position, rotation: Rotation, scaleFactor: number): Position {
  let offsetX = offset.x;
  let offsetY = offset.y;
  switch (rotation) {
    case Rotation.Degree0:
      offsetX = offset.x / scaleFactor;
      offsetY = offset.y / scaleFactor;
      break;
    case Rotation.Degree90:
      offsetX = offset.y / scaleFactor;
      offsetY = -offset.x / scaleFactor;
      break;
    case Rotation.Degree180:
      offsetX = -offset.x / scaleFactor;
      offsetY = -offset.y / scaleFactor;
      break;
    case Rotation.Degree270:
      offsetX = -offset.y / scaleFactor;
      offsetY = offset.x / scaleFactor;
      break;
  }

  return {
    x: offsetX,
    y: offsetY,
  };
}

/**
 * Return the smallest rectangle that encloses *all* `rects`.
 * If the array is empty, returns `null`.
 *
 * @param rects - array of rectangles
 * @returns smallest rectangle that encloses all the rectangles
 *
 * @public
 */
export function boundingRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = rects[0].origin.x,
    minY = rects[0].origin.y,
    maxX = rects[0].origin.x + rects[0].size.width,
    maxY = rects[0].origin.y + rects[0].size.height;

  for (const r of rects) {
    minX = Math.min(minX, r.origin.x);
    minY = Math.min(minY, r.origin.y);
    maxX = Math.max(maxX, r.origin.x + r.size.width);
    maxY = Math.max(maxY, r.origin.y + r.size.height);
  }

  return {
    origin: {
      x: minX,
      y: minY,
    },
    size: {
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

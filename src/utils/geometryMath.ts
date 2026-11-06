/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calculates the area of an arbitrary 2D polygon using the Shoelace formula.
 * Points must be ordered (clockwise or counter-clockwise).
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Number((Math.abs(area) / 2).toFixed(2));
}

/**
 * Checks if a point (x,y) is inside a polygon using ray casting algorithm.
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Converts a standard rectangular box (x, y, width, depth) into 4 polygon vertices.
 */
export function boxToPolygon(x: number, y: number, width: number, depth: number): Point2D[] {
  return [
    { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) },
    { x: Number((x + width).toFixed(2)), y: Number(y.toFixed(2)) },
    { x: Number((x + width).toFixed(2)), y: Number((y + depth).toFixed(2)) },
    { x: Number(x.toFixed(2)), y: Number((y + depth).toFixed(2)) },
  ];
}

/**
 * Computes bounding box for arbitrary polygon points.
 */
export function getPolygonBounds(points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; depth: number } {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, depth: 0 };
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX: Number(minX.toFixed(2)),
    minY: Number(minY.toFixed(2)),
    maxX: Number(maxX.toFixed(2)),
    maxY: Number(maxY.toFixed(2)),
    width: Number((maxX - minX).toFixed(2)),
    depth: Number((maxY - minY).toFixed(2)),
  };
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ResizeResult {
  x: number;
  y: number;
  width: number;
  depth: number;
}

/**
 * Performs bidirectional resizing on a rectangular object.
 * Mode A: Fixed Opposite Edge.
 * Mode B: Symmetrical Center-Based Resize.
 */
export function calculateBidirectionalResize(
  initial: { x: number; y: number; width: number; depth: number },
  handle: ResizeHandleType,
  deltaX: number,
  deltaY: number,
  mode: 'fixed-opposite' | 'center-based' = 'fixed-opposite',
  minDimension = 0.8
): ResizeResult {
  let { x, y, width, depth } = initial;

  if (mode === 'center-based') {
    // Symmetrical resizing from center
    const centerX = initial.x + initial.width / 2;
    const centerY = initial.y + initial.depth / 2;

    let newWidth = initial.width;
    let newDepth = initial.depth;

    if (handle.includes('e')) newWidth = Math.max(minDimension, initial.width + deltaX * 2);
    if (handle.includes('w')) newWidth = Math.max(minDimension, initial.width - deltaX * 2);
    if (handle.includes('s')) newDepth = Math.max(minDimension, initial.depth + deltaY * 2);
    if (handle.includes('n')) newDepth = Math.max(minDimension, initial.depth - deltaY * 2);

    return {
      x: Number((centerX - newWidth / 2).toFixed(2)),
      y: Number((centerY - newDepth / 2).toFixed(2)),
      width: Number(newWidth.toFixed(2)),
      depth: Number(newDepth.toFixed(2)),
    };
  }

  // Mode A: Fixed Opposite Edge
  switch (handle) {
    case 'e': {
      width = Math.max(minDimension, initial.width + deltaX);
      break;
    }
    case 'w': {
      const targetWidth = initial.width - deltaX;
      if (targetWidth >= minDimension) {
        width = targetWidth;
        x = initial.x + deltaX;
      } else {
        width = minDimension;
        x = initial.x + (initial.width - minDimension);
      }
      break;
    }
    case 's': {
      depth = Math.max(minDimension, initial.depth + deltaY);
      break;
    }
    case 'n': {
      const targetDepth = initial.depth - deltaY;
      if (targetDepth >= minDimension) {
        depth = targetDepth;
        y = initial.y + deltaY;
      } else {
        depth = minDimension;
        y = initial.y + (initial.depth - minDimension);
      }
      break;
    }
    case 'se': {
      width = Math.max(minDimension, initial.width + deltaX);
      depth = Math.max(minDimension, initial.depth + deltaY);
      break;
    }
    case 'ne': {
      width = Math.max(minDimension, initial.width + deltaX);
      const targetDepth = initial.depth - deltaY;
      if (targetDepth >= minDimension) {
        depth = targetDepth;
        y = initial.y + deltaY;
      } else {
        depth = minDimension;
        y = initial.y + (initial.depth - minDimension);
      }
      break;
    }
    case 'sw': {
      depth = Math.max(minDimension, initial.depth + deltaY);
      const targetWidth = initial.width - deltaX;
      if (targetWidth >= minDimension) {
        width = targetWidth;
        x = initial.x + deltaX;
      } else {
        width = minDimension;
        x = initial.x + (initial.width - minDimension);
      }
      break;
    }
    case 'nw': {
      const targetWidth = initial.width - deltaX;
      if (targetWidth >= minDimension) {
        width = targetWidth;
        x = initial.x + deltaX;
      } else {
        width = minDimension;
        x = initial.x + (initial.width - minDimension);
      }
      const targetDepth = initial.depth - deltaY;
      if (targetDepth >= minDimension) {
        depth = targetDepth;
        y = initial.y + deltaY;
      } else {
        depth = minDimension;
        y = initial.y + (initial.depth - minDimension);
      }
      break;
    }
  }

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    width: Number(width.toFixed(2)),
    depth: Number(depth.toFixed(2)),
  };
}

/**
 * Safely deletes a vertex from a polygon and reconnects adjacent vertices.
 * Prevents polygon corruption if fewer than 3 vertices would remain.
 */
export function deletePolygonVertex(
  points: Point2D[],
  index: number
): { success: boolean; points: Point2D[]; message?: string } {
  if (!points || points.length <= 3) {
    return {
      success: false,
      points: points || [],
      message: 'Penghapusan dibatalkan: Poligon ruangan minimal harus memiliki 3 titik sudut untuk membentuk bidang tertutup.',
    };
  }

  if (index < 0 || index >= points.length) {
    return {
      success: false,
      points,
      message: 'Indeks titik sudut tidak valid.',
    };
  }

  const remaining = points.filter((_, idx) => idx !== index);
  const newArea = calculatePolygonArea(remaining);

  if (newArea <= 0.1) {
    return {
      success: false,
      points,
      message: 'Penghapusan dibatalkan: Bentuk ruangan yang dihasilkan memiliki luas mendekati nol atau garis kolinier.',
    };
  }

  return {
    success: true,
    points: remaining,
  };
}

/**
 * Inserts a new vertex between two existing vertices.
 */
export function insertPolygonVertex(
  points: Point2D[],
  afterIndex: number,
  newPoint?: Point2D
): Point2D[] {
  if (!points || points.length < 2) return points;
  const idx = Math.max(0, Math.min(points.length - 1, afterIndex));
  const nextIdx = (idx + 1) % points.length;

  const pointToInsert = newPoint || {
    x: Number(((points[idx].x + points[nextIdx].x) / 2).toFixed(2)),
    y: Number(((points[idx].y + points[nextIdx].y) / 2).toFixed(2)),
  };

  const updated = [...points];
  updated.splice(idx + 1, 0, pointToInsert);
  return updated;
}

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical' | 'midpoint' | 'perpendicular';
  line: { x1: number; y1: number; x2: number; y2: number };
  snappedPoint: Point2D;
  label: string;
}

/**
 * Calculates SketchUp-like inference guides (horizontal, vertical, midpoint, 90-degree)
 * for high-precision vertex positioning.
 */
export function getVertexAlignmentGuides(
  point: Point2D,
  referencePoints: Point2D[],
  options = {
    tolerance: 0.15, // meters
    snapAxis: true,
    snapEndpoints: true,
    snapMidpoints: true,
  }
): { snappedPoint: Point2D; guides: AlignmentGuide[] } {
  const guides: AlignmentGuide[] = [];
  let snappedX = point.x;
  let snappedY = point.y;
  let hasSnappedX = false;
  let hasSnappedY = false;

  // 1. Check endpoints & axis alignment against all reference vertices
  if (options.snapAxis || options.snapEndpoints) {
    for (const ref of referencePoints) {
      // Horizontal alignment (same Y)
      if (!hasSnappedY && Math.abs(point.y - ref.y) <= options.tolerance) {
        snappedY = ref.y;
        hasSnappedY = true;
        guides.push({
          id: `h-align-${ref.y}`,
          type: 'horizontal',
          line: { x1: 0, y1: ref.y, x2: 9.0, y2: ref.y },
          snappedPoint: { x: snappedX, y: ref.y },
          label: `Sejajar Horizontal (Y = ${ref.y.toFixed(2)}m)`,
        });
      }

      // Vertical alignment (same X)
      if (!hasSnappedX && Math.abs(point.x - ref.x) <= options.tolerance) {
        snappedX = ref.x;
        hasSnappedX = true;
        guides.push({
          id: `v-align-${ref.x}`,
          type: 'vertical',
          line: { x1: ref.x, y1: 0, x2: ref.x, y2: 11.0 },
          snappedPoint: { x: ref.x, y: snappedY },
          label: `Sejajar Vertikal (X = ${ref.x.toFixed(2)}m)`,
        });
      }
    }
  }

  // 2. Check Midpoints between consecutive pairs of reference points
  if (options.snapMidpoints && referencePoints.length >= 2) {
    for (let i = 0; i < referencePoints.length; i++) {
      const p1 = referencePoints[i];
      const p2 = referencePoints[(i + 1) % referencePoints.length];
      const mid = {
        x: Number(((p1.x + p2.x) / 2).toFixed(2)),
        y: Number(((p1.y + p2.y) / 2).toFixed(2)),
      };

      const dist = Math.hypot(point.x - mid.x, point.y - mid.y);
      if (dist <= options.tolerance) {
        snappedX = mid.x;
        snappedY = mid.y;
        guides.push({
          id: `midpoint-${i}`,
          type: 'midpoint',
          line: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y },
          snappedPoint: mid,
          label: `Titik Tengah Sisi (${mid.x.toFixed(2)}m, ${mid.y.toFixed(2)}m)`,
        });
        break;
      }
    }
  }

  return {
    snappedPoint: {
      x: Number(snappedX.toFixed(2)),
      y: Number(snappedY.toFixed(2)),
    },
    guides,
  };
}

/**
 * Calculates edge length in meters and orientation angle in degrees between two points.
 */
export function calculateEdgeLengthAndAngle(p1: Point2D, p2: Point2D): { length: number; angleDegrees: number } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Number(Math.hypot(dx, dy).toFixed(2));
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return {
    length,
    angleDegrees: Number(angle.toFixed(1)),
  };
}

/**
 * Validates polygon geometry: checks minimum vertices, self-intersection, and zero-length edges.
 */
export function validatePolygon(points: Point2D[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  area: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!points || points.length < 3) {
    errors.push('Poligon harus memiliki minimal 3 titik sudut.');
    return { isValid: false, errors, warnings, area: 0 };
  }

  const n = points.length;
  // Check duplicate consecutive vertices / zero-length edges
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dist = Math.hypot(points[next].x - points[i].x, points[next].y - points[i].y);
    if (dist < 0.05) {
      warnings.push(`Terdapat sisi berjarak sangat pendek (< 5 cm) antara titik ${i + 1} dan ${next + 1}.`);
    }
  }

  // Check self-intersections (simple 2D segment intersection)
  const segmentsIntersect = (a: Point2D, b: Point2D, c: Point2D, d: Point2D): boolean => {
    const ccw = (p1: Point2D, p2: Point2D, p3: Point2D) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  };

  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // adjacent edge
      const c = points[j];
      const d = points[(j + 1) % n];
      if (segmentsIntersect(a, b, c, d)) {
        errors.push(`Garis poligon saling berpotongan (self-intersecting) antara sisi [${i + 1}-${(i + 1) % n + 1}] dan [${j + 1}-${(j + 1) % n + 1}].`);
        break;
      }
    }
  }

  const area = calculatePolygonArea(points);
  if (area <= 0.1) {
    errors.push('Luas poligon tidak valid (mendekati nol).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    area,
  };
}

/**
 * Updates a vertex to exact coordinates and recalculates polygon geometry.
 */
export function setPolygonVertexCoordinates(
  points: Point2D[],
  vertexIndex: number,
  newX: number,
  newY: number
): Point2D[] {
  if (!points || vertexIndex < 0 || vertexIndex >= points.length) return points;
  const updated = [...points];
  updated[vertexIndex] = {
    x: Number(newX.toFixed(2)),
    y: Number(newY.toFixed(2)),
  };
  return updated;
}

/**
 * Numerically adjusts the length of the edge connected to the given vertex.
 * For example: keep adjacent wall exactly 1.80m long.
 */
export function setPolygonEdgeLength(
  points: Point2D[],
  vertexIndex: number,
  targetLengthMeters: number,
  referencePoint: 'previous' | 'next' = 'previous'
): Point2D[] {
  if (!points || points.length < 3 || vertexIndex < 0 || vertexIndex >= points.length) return points;
  const n = points.length;
  const current = points[vertexIndex];
  const refIndex = referencePoint === 'previous' ? (vertexIndex - 1 + n) % n : (vertexIndex + 1) % n;
  const ref = points[refIndex];

  const dx = current.x - ref.x;
  const dy = current.y - ref.y;
  const currentDist = Math.hypot(dx, dy);

  if (currentDist === 0) {
    // If overlapping, extend along X axis
    const updated = [...points];
    updated[vertexIndex] = {
      x: Number((ref.x + targetLengthMeters).toFixed(2)),
      y: Number(ref.y.toFixed(2)),
    };
    return updated;
  }

  // Scale along the existing direction vector
  const factor = targetLengthMeters / currentDist;
  const updated = [...points];
  updated[vertexIndex] = {
    x: Number((ref.x + dx * factor).toFixed(2)),
    y: Number((ref.y + dy * factor).toFixed(2)),
  };
  return updated;
}


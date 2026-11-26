/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type Rectangle from '../../geometry/Rectangle.js';
import type CellState from '../../cell/CellState.js';
import Point from '../../geometry/Point.js';
import type { PerimeterFunction } from '../../../types.js';

/**
 * Describes a rectangular perimeter for the given bounds.
 *
 * This perimeter is registered under `rectanglePerimeter` in {@link PerimeterRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const RectanglePerimeter: PerimeterFunction = (
  bounds: Rectangle,
  _vertex: CellState,
  next: Point,
  orthogonal = false
): Point => {
  const cx = bounds.getCenterX();
  const cy = bounds.getCenterY();
  const dx = next.x - cx;
  const dy = next.y - cy;
  const alpha = Math.atan2(dy, dx);
  const p = new Point(0, 0);
  const pi = Math.PI;
  const pi2 = Math.PI / 2;
  const beta = pi2 - alpha;
  const t = Math.atan2(bounds.height, bounds.width);

  if (alpha < -pi + t || alpha > pi - t) {
    // Left edge
    p.x = bounds.x;
    p.y = cy - (bounds.width * Math.tan(alpha)) / 2;
  } else if (alpha < -t) {
    // Top Edge
    p.y = bounds.y;
    p.x = cx - (bounds.height * Math.tan(beta)) / 2;
  } else if (alpha < t) {
    // Right Edge
    p.x = bounds.x + bounds.width;
    p.y = cy + (bounds.width * Math.tan(alpha)) / 2;
  } else {
    // Bottom Edge
    p.y = bounds.y + bounds.height;
    p.x = cx + (bounds.height * Math.tan(beta)) / 2;
  }

  if (orthogonal) {
    if (next.x >= bounds.x && next.x <= bounds.x + bounds.width) {
      p.x = next.x;
    } else if (next.y >= bounds.y && next.y <= bounds.y + bounds.height) {
      p.y = next.y;
    }
    if (next.x < bounds.x) {
      p.x = bounds.x;
    } else if (next.x > bounds.x + bounds.width) {
      p.x = bounds.x + bounds.width;
    }
    if (next.y < bounds.y) {
      p.y = bounds.y;
    } else if (next.y > bounds.y + bounds.height) {
      p.y = bounds.y + bounds.height;
    }
  }

  return p;
};

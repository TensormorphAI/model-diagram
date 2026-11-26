/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type Rectangle from '../../geometry/Rectangle.js';
import type CellState from '../../cell/CellState.js';
import Point from '../../geometry/Point.js';
import type { PerimeterFunction } from '../../../types.js';
import { intersection } from '../../../util/mathUtils.js';

/**
 * This perimeter is registered under `rhombusPerimeter` in {@link PerimeterRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const RhombusPerimeter: PerimeterFunction = (
  bounds: Rectangle,
  _vertex: CellState,
  next: Point,
  orthogonal = false
): Point | null => {
  const { x } = bounds;
  const { y } = bounds;
  const w = bounds.width;
  const h = bounds.height;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const px = next.x;
  const py = next.y;

  // Special case for intersecting the diamond's corners
  if (cx === px) {
    if (cy > py) {
      return new Point(cx, y); // top
    }
    return new Point(cx, y + h); // bottom
  }
  if (cy === py) {
    if (cx > px) {
      return new Point(x, cy); // left
    }
    return new Point(x + w, cy); // right
  }

  let tx = cx;
  let ty = cy;

  if (orthogonal) {
    if (px >= x && px <= x + w) {
      tx = px;
    } else if (py >= y && py <= y + h) {
      ty = py;
    }
  }

  // In which quadrant will the intersection be?
  // set the slope and offset of the border line accordingly
  if (px < cx) {
    if (py < cy) {
      return intersection(px, py, tx, ty, cx, y, x, cy);
    }
    return intersection(px, py, tx, ty, cx, y + h, x, cy);
  }
  if (py < cy) {
    return intersection(px, py, tx, ty, cx, y, x + w, cy);
  }
  return intersection(px, py, tx, ty, cx, y + h, x + w, cy);
};

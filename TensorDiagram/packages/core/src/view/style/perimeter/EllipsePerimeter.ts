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
 * This perimeter is registered under `ellipsePerimeter` in {@link PerimeterRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const EllipsePerimeter: PerimeterFunction = (
  bounds: Rectangle,
  _vertex: CellState,
  next: Point,
  orthogonal = false
): Point => {
  const { x } = bounds;
  const { y } = bounds;
  const a = bounds.width / 2;
  const b = bounds.height / 2;
  const cx = x + a;
  const cy = y + b;
  const px = next.x;
  const py = next.y;

  // Calculates straight line equation through
  // point and ellipse center y = d * x + h
  const dx = Number.parseInt(String(px - cx));
  const dy = Number.parseInt(String(py - cy));

  if (dx === 0 && dy !== 0) {
    return new Point(cx, cy + (b * dy) / Math.abs(dy));
  }
  if (dx === 0 && dy === 0) {
    return new Point(px, py);
  }

  if (orthogonal) {
    if (py >= y && py <= y + bounds.height) {
      const ty = py - cy;
      let tx = Math.sqrt(a * a * (1 - (ty * ty) / (b * b))) || 0;

      if (px <= x) {
        tx = -tx;
      }

      return new Point(cx + tx, py);
    }

    if (px >= x && px <= x + bounds.width) {
      const tx = px - cx;
      let ty = Math.sqrt(b * b * (1 - (tx * tx) / (a * a))) || 0;

      if (py <= y) {
        ty = -ty;
      }

      return new Point(px, cy + ty);
    }
  }

  // Calculates intersection
  const d = dy / dx;
  const h = cy - d * cx;
  const e = a * a * d * d + b * b;
  const f = -2 * cx * e;
  const g = a * a * d * d * cx * cx + b * b * cx * cx - a * a * b * b;
  const det = Math.sqrt(f * f - 4 * e * g);

  // Two solutions (perimeter points)
  const xout1 = (-f + det) / (2 * e);
  const xout2 = (-f - det) / (2 * e);
  const yout1 = d * xout1 + h;
  const yout2 = d * xout2 + h;
  const dist1 = Math.sqrt(Math.pow(xout1 - px, 2) + Math.pow(yout1 - py, 2));
  const dist2 = Math.sqrt(Math.pow(xout2 - px, 2) + Math.pow(yout2 - py, 2));

  // Correct solution
  let xout: number;
  let yout: number;

  if (dist1 < dist2) {
    xout = xout1;
    yout = yout1;
  } else {
    xout = xout2;
    yout = yout2;
  }

  return new Point(xout, yout);
};

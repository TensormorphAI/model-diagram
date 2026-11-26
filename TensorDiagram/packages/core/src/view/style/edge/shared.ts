/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Point from '../../geometry/Point.js';
import type CellState from '../../cell/CellState.js';

/**
 * Scales an array of {@link Point}
 *
 * @param points array of {@link Point} to scale
 * @param scale the scaling to divide by
 * @private
 * @internal
 */
export function scalePointArray(points: Point[], scale: number): (Point | null)[] | null {
  let result: (Point | null)[] | null = [];

  if (points != null) {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i] != null) {
        result[i] = new Point(
          Math.round((points[i].x / scale) * 10) / 10,
          Math.round((points[i].y / scale) * 10) / 10
        );
      } else {
        result[i] = null;
      }
    }
  } else {
    result = null;
  }

  return result;
}

/**
 * Scales an {@link CellState}.
 *
 * @param state {@link CellState} to scale
 * @param scale the scaling to divide by
 */
export function scaleCellState(state: CellState | null, scale: number): CellState | null {
  let result = null;

  if (state != null) {
    result = state.clone();
    result.setRect(
      Math.round((state.x / scale) * 10) / 10,
      Math.round((state.y / scale) * 10) / 10,
      Math.round((state.width / scale) * 10) / 10,
      Math.round((state.height / scale) * 10) / 10
    );
  }

  return result;
}

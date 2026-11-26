/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import { SideToSide } from './SideToSide.js';
import { TopToBottom } from './TopToBottom.js';
import CellState from '../../cell/CellState.js';
import Point from '../../geometry/Point.js';

import type { EdgeStyleFunction } from '../../../types.js';

/**
 * Uses either {@link SideToSide} or {@link TopToBottom} depending on the horizontal flag in the cell style.
 * {@link SideToSide} is used if horizontal is `true` or unspecified.
 *
 * This EdgeStyle is registered under `elbowEdgeStyle` in {@link EdgeStyleRegistry} when using {@link Graph} or calling {@link registerDefaultEdgeStyles}.
 *
 * To register it on its own (e.g. with {@link BaseGraph}), prefer the dedicated {@link registerElbowEdgeStyle} helper, which sets the correct metadata for you.
 *
 * **IMPORTANT**: When registering it manually in {@link EdgeStyleRegistry}, the following metadata must be used:
 * - handlerKind: 'elbow'
 * - isOrthogonal: true
 */
export const ElbowConnector: EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  target: CellState | null,
  points: Point[],
  result: Point[]
): void => {
  let pt = points != null && points.length > 0 ? points[0] : null;

  let vertical = false;
  let horizontal = false;

  if (source != null && target != null) {
    if (pt != null) {
      const left = Math.min(source.x, target.x);
      const right = Math.max(source.x + source.width, target.x + target.width);

      const top = Math.min(source.y, target.y);
      const bottom = Math.max(source.y + source.height, target.y + target.height);

      pt = state.view.transformControlPoint(state, pt)!;
      vertical = pt.y < top || pt.y > bottom;
      horizontal = pt.x < left || pt.x > right;
    } else {
      const left = Math.max(source.x, target.x);
      const right = Math.min(source.x + source.width, target.x + target.width);

      vertical = left === right;
      if (!vertical) {
        const top = Math.max(source.y, target.y);
        const bottom = Math.min(source.y + source.height, target.y + target.height);

        horizontal = top === bottom;
      }
    }
  }

  if (!horizontal && (vertical || state.style.elbow === 'vertical')) {
    TopToBottom(state, source, target, points, result);
  } else {
    SideToSide(state, source, target, points, result);
  }
};

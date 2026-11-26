/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import { AbstractPathShape } from './AbstractPathShape.js';
import Point from '../../geometry/Point.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';

/**
 * Implementation of the hexagon shape.
 *
 * This shape is registered under `hexagon` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class HexagonShape extends AbstractPathShape {
  /**
   * Draws the path for this shape.
   */
  override redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const arcSize = this.getBaseArcSize();

    this.addPoints(
      c,
      [
        new Point(0.25 * w, 0),
        new Point(0.75 * w, 0),
        new Point(w, 0.5 * h),
        new Point(0.75 * w, h),
        new Point(0.25 * w, h),
        new Point(0, 0.5 * h),
      ],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default HexagonShape;

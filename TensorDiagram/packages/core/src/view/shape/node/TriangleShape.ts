/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Point from '../../geometry/Point.js';
import { AbstractPathShape } from './AbstractPathShape.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';

/**
 * Implementation of the triangle shape.
 *
 * This shape is registered under `triangle` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class TriangleShape extends AbstractPathShape {
  /**
   * Adds roundable support.
   * @returns {boolean}
   */
  override isRoundable() {
    return true;
  }

  /**
   * Draws the path for this shape.
   */
  override redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const arcSize = this.getBaseArcSize();

    this.addPoints(
      c,
      [new Point(0, 0), new Point(w, 0.5 * h), new Point(0, h)],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default TriangleShape;

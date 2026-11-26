/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Shape from '../Shape.js';
import Point from '../../geometry/Point.js';
import Rectangle from '../../geometry/Rectangle.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';

/**
 * Extends {@link Shape} to implement a rhombus (aka diamond) shape.
 *
 * This shape is registered under `rhombus` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class RhombusShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokewidth;
  }

  /**
   * Adds roundable support.
   */
  // isRoundable(): boolean;
  override isRoundable(): boolean {
    return true;
  }

  /**
   * Generic painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const hw = w / 2;
    const hh = h / 2;

    const arcSize = this.getBaseArcSize();

    c.begin();
    this.addPoints(
      c,
      [
        new Point(x + hw, y),
        new Point(x + w, y + hh),
        new Point(x + hw, y + h),
        new Point(x, y + hh),
      ],
      this.isRounded,
      arcSize,
      true
    );
    c.fillAndStroke();
  }
}

export default RhombusShape;

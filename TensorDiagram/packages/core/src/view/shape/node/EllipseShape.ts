/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Shape from '../Shape.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import Rectangle from '../../geometry/Rectangle.js';

/**
 * Extends {@link Shape} to implement an ellipse shape.
 *
 * This shape is registered under `ellipse` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class EllipseShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Paints the ellipse shape.
   */
  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.ellipse(x, y, w, h);
    c.fillAndStroke();
  }
}

export default EllipseShape;

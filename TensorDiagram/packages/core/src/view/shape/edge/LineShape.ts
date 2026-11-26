/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Shape from '../Shape.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import Rectangle from '../../geometry/Rectangle.js';
import { ColorValue } from '../../../types.js';

/**
 * Extends {@link Shape} to implement a horizontal line shape.
 *
 * The shape is used to represent edges, not vertices.
 *
 * This shape is registered under `line` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Edge Shapes
 */
class LineShape extends Shape {
  constructor(bounds: Rectangle, stroke: ColorValue, strokeWidth = 1, vertical = false) {
    super();
    this.bounds = bounds;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.vertical = vertical;
  }

  /**
   * Whether to paint a vertical line.
   */
  vertical: boolean;

  /**
   * Redirects to redrawPath for subclasses to work.
   * @param {AbstractCanvas2D} c
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
    c.begin();

    if (this.vertical) {
      const mid = x + w / 2;
      c.moveTo(mid, y);
      c.lineTo(mid, y + h);
    } else {
      const mid = y + h / 2;
      c.moveTo(x, mid);
      c.lineTo(x + w, mid);
    }

    c.stroke();
  }
}

export default LineShape;

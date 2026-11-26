/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Rectangle from '../../geometry/Rectangle.js';
import Shape from '../Shape.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';

/**
 * Extends {@link Shape} to implement a double ellipse shape.
 *
 * This shape is registered under `doubleEllipse` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * If a custom shape is needed to only fill the inner ellipse, then this shape's {@link paintVertexShape} method should be overridden
 * like in the following example:
 *
 * ```typescript
 * class SampleShape extends DoubleEllipseShape {
 *   paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
 *     c.ellipse(x, y, w, h);
 *     c.stroke();
 *
 *     const inset = this.style.margin ?? Math.min(3 + this.strokewidth, Math.min(w / 5, h / 5));
 *     x += inset;
 *     y += inset;
 *     w -= 2 * inset;
 *     h -= 2 * inset;
 *
 *     if (w > 0 && h > 0) {
 *       c.ellipse(x, y, w, h);
 *     }
 *
 *     c.fillAndStroke();
 *   }
 * }
 * ```
 *
 * @category Vertex Shapes
 */
class DoubleEllipseShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Paints the background.
   */
  override paintBackground(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.ellipse(x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Paints the foreground.
   */
  override paintForeground(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (!this.outline) {
      const margin =
        this.style?.margin ?? Math.min(3 + this.strokeWidth, Math.min(w / 5, h / 5));

      x += margin;
      y += margin;
      w -= 2 * margin;
      h -= 2 * margin;

      // FIXME: Rounding issues in IE8 standards mode (not in 1.x)
      if (w > 0 && h > 0) {
        c.ellipse(x, y, w, h);
      }

      c.stroke();
    }
  }

  /**
   * @returns the bounds for the label.
   */
  override getLabelBounds(rect: Rectangle) {
    const margin =
      this.style?.margin ??
      Math.min(
        3 + this.strokeWidth,
        Math.min(rect.width / 5 / this.scale, rect.height / 5 / this.scale)
      ) * this.scale;

    return new Rectangle(
      rect.x + margin,
      rect.y + margin,
      rect.width - 2 * margin,
      rect.height - 2 * margin
    );
  }
}

export default DoubleEllipseShape;

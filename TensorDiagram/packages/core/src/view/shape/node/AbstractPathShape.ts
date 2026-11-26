/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type Rectangle from '../../geometry/Rectangle.js';
import Shape from '../Shape.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import type { ColorValue } from '../../../types.js';
import { NONE } from '../../../util/Constants.js';

/**
 * Base {@link Shape} for vertex shapes rendered from a single path.
 *
 * It implements {@link paintVertexShape} once, so a subclass only declares the path itself, in {@link redrawPath}:
 *
 * ```typescript
 * class SampleShape extends AbstractPathShape {
 *   override redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
 *     c.moveTo(0, 0);
 *     c.lineTo(w, h);
 *     // ...
 *     c.close();
 *   }
 * }
 * ```
 *
 * {@link ActorShape}, {@link CloudShape}, {@link HexagonShape} and {@link TriangleShape} are built on it. When the
 * shape also needs a stroke only overlay path, extend {@link CylinderShape} instead.
 *
 * @since 0.25.0
 * @category Vertex Shapes
 */
export abstract class AbstractPathShape extends Shape {
  /**
   * The renderer never uses this signature: {@link CellRenderer.createShape} instantiates a registered shape with
   * `new shapeConstructor()`, then populates it from the cell style. It only applies to a shape built by hand.
   *
   * @param bounds the bounds of the shape, stored in {@link Shape.bounds}.
   * @param fill the fill color, stored in {@link Shape.fill}.
   * @param stroke the stroke color, stored in {@link Shape.stroke}.
   * @param strokeWidth the stroke width, stored in {@link Shape.strokeWidth}.
   */
  constructor(
    bounds: Rectangle | null = null,
    fill: ColorValue = NONE,
    stroke: ColorValue = NONE,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Translates the canvas to the top left corner of the shape, opens a path, delegates its content to
   * {@link redrawPath}, then fills and strokes it.
   *
   * It replaces the {@link Shape.paintBackground} and {@link Shape.paintForeground} pair that {@link Shape} calls, so
   * overriding either of them in a subclass has no effect. Override {@link redrawPath} instead.
   */
  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.translate(x, y);
    c.begin();
    this.redrawPath(c, x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Draws the path of the shape.
   *
   * The canvas is already translated to the top left corner of the shape, so the path is expressed relatively to
   * `(0, 0)` and the built-in implementations ignore `x` and `y`. {@link paintVertexShape} opens the path before this
   * call, then fills and strokes it, so an implementation only issues the drawing operations.
   *
   * @param c the canvas to draw the path on.
   * @param x the x coordinate of the top left corner of the shape.
   * @param y the y coordinate of the top left corner of the shape.
   * @param w the width of the shape.
   * @param h the height of the shape.
   */
  abstract redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void;
}

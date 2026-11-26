/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import { AbstractPathShape } from './AbstractPathShape.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';

/**
 * Path-based actor vertex shape built on {@link AbstractPathShape}.
 *
 * This shape is registered under `actor` in {@link ShapeRegistry} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class ActorShape extends AbstractPathShape {
  /**
   * Draws the path for this shape.
   */
  override redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const width = w / 3;
    c.moveTo(0, h);
    c.curveTo(0, (3 * h) / 5, 0, (2 * h) / 5, w / 2, (2 * h) / 5);
    c.curveTo(w / 2 - width, (2 * h) / 5, w / 2 - width, 0, w / 2, 0);
    c.curveTo(w / 2 + width, 0, w / 2 + width, (2 * h) / 5, w / 2, (2 * h) / 5);
    c.curveTo(w, (2 * h) / 5, w, (3 * h) / 5, w, h);
    c.close();
  }
}

export default ActorShape;

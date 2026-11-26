/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import Point from '../geometry/Point.js';

/**
 * Defines an object that contains the constraints about how to connect one side of an edge to its terminal.
 */
class ConnectionConstraint {
  /**
   * {@link Point} that specifies the fixed location of the connection point.
   */
  point: Point | null;

  /**
   * Boolean that specifies if the point should be projected onto the perimeter
   * of the terminal.
   */
  perimeter = true;

  /**
   * Optional string that specifies the name of the constraint.
   */
  name: string | null = null;

  /**
   * Optional float that specifies the horizontal offset of the constraint.
   */
  dx = 0;

  /**
   * Optional float that specifies the vertical offset of the constraint.
   */
  dy = 0;

  constructor(
    point: Point | null,
    perimeter = true,
    name: string | null = null,
    dx = 0,
    dy = 0
  ) {
    this.point = point;
    this.perimeter = perimeter;
    this.name = name;
    this.dx = dx;
    this.dy = dy;
  }
}

export default ConnectionConstraint;

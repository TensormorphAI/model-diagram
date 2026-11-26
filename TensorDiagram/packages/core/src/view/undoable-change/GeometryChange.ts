/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import Geometry from '../geometry/Geometry.js';
import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a cell's geometry in a model.
 *
 * @category Change
 */
class GeometryChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  geometry: Geometry | null;
  previous: Geometry | null;

  constructor(model: GraphDataModel, cell: Cell, geometry: Geometry | null) {
    this.model = model;
    this.cell = cell;
    this.geometry = geometry;
    this.previous = geometry;
  }

  /**
   * Changes the geometry of {@link cell} to {@link previous} using{@link GraphDataModel.geometryForCellChanged}.
   */
  execute() {
    this.geometry = this.previous;
    this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
  }
}

export default GeometryChange;

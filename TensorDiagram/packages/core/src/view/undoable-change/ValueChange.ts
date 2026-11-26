/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a user object in a model.
 *
 * @category Change
 */
class ValueChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  value: unknown;
  previous: unknown;

  constructor(model: GraphDataModel, cell: Cell, value: unknown) {
    this.model = model;
    this.cell = cell;
    this.value = value;
    this.previous = value;
  }

  /**
   * Changes the value of {@link cell} to {@link previous} using {@link GraphDataModel.valueForCellChanged}.
   */
  execute() {
    this.value = this.previous;
    this.previous = this.model.valueForCellChanged(this.cell, this.previous);
  }
}

export default ValueChange;

/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a cell's visible state in a model.
 *
 * @category Change
 */
class VisibleChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  visible: boolean;
  previous: boolean;

  constructor(model: GraphDataModel, cell: Cell, visible: boolean) {
    this.model = model;
    this.cell = cell;
    this.visible = visible;
    this.previous = visible;
  }

  /**
   * Changes the visible state of {@link cell} to {@link previous} using {@link GraphDataModel.visibleStateForCellChanged}.
   */
  execute() {
    this.visible = this.previous;
    this.previous = this.model.visibleStateForCellChanged(this.cell, this.previous);
  }
}

export default VisibleChange;

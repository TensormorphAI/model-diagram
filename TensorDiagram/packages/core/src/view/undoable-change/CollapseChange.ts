/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a cell's collapsed state in a model.
 *
 * @category Change
 */
class CollapseChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  collapsed: boolean;
  previous: boolean;

  constructor(model: GraphDataModel, cell: Cell, collapsed: boolean) {
    this.model = model;
    this.cell = cell;
    this.collapsed = collapsed;
    this.previous = collapsed;
  }

  /**
   * Changes the collapsed state of {@link cell} to {@link previous} using {@link GraphDataModel.collapsedStateForCellChanged}.
   */
  execute() {
    this.collapsed = this.previous;
    this.previous = this.model.collapsedStateForCellChanged(this.cell, this.previous);
  }
}

export default CollapseChange;

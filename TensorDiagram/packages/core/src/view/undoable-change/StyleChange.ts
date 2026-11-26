/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { CellStyle, UndoableChange } from '../../types.js';

/**
 * Action to change a cell's style in a model.
 *
 * @category Change
 */
class StyleChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  style: CellStyle;
  previous: CellStyle;

  constructor(model: GraphDataModel, cell: Cell, style: CellStyle) {
    this.model = model;
    this.cell = cell;
    this.style = style;
    this.previous = style;
  }

  /**
   * Changes the style of {@link cell} to {@link previous} using {@link GraphDataModel.styleForCellChanged}.
   */
  execute() {
    this.style = this.previous;
    this.previous = this.model.styleForCellChanged(this.cell, this.previous);
  }
}

export default StyleChange;

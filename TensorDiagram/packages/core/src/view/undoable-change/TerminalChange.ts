/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a terminal in a model.
 *
 * @category Change
 */
export class TerminalChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  terminal: Cell | null;
  previous: Cell | null;
  source: boolean;

  constructor(model: GraphDataModel, cell: Cell, terminal: Cell | null, source: boolean) {
    this.model = model;
    this.cell = cell;
    this.terminal = terminal;
    this.previous = terminal;
    this.source = source;
  }

  /**
   * Changes the terminal of {@link cell} to {@link previous} using {@link GraphDataModel.terminalForCellChanged}.
   */
  execute() {
    this.terminal = this.previous;
    this.previous = this.model.terminalForCellChanged(
      this.cell,
      this.previous,
      this.source
    );
  }
}

export default TerminalChange;

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import GraphDataModel from '../GraphDataModel.js';
import Cell from '../cell/Cell.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to add or remove a child in a model.
 *
 * @category Change
 */
export class ChildChange implements UndoableChange {
  model: GraphDataModel;
  parent: Cell | null;
  child: Cell;
  previous: Cell | null;
  index: number;
  previousIndex: number;

  constructor(model: GraphDataModel, parent: Cell | null, child: Cell, index = 0) {
    this.model = model;
    this.parent = parent;
    this.previous = parent;
    this.child = child;
    this.index = index;
    this.previousIndex = index;
  }

  /**
   * Changes the parent of {@link child} using {@link GraphDataModel.parentForCellChanged} and removes or restores the cell's connections.
   */
  execute() {
    let tmp = this.child.getParent();
    const tmp2 = tmp ? tmp.getIndex(this.child) : 0;

    if (!this.previous) {
      this.connect(this.child, false);
    }

    tmp = this.model.parentForCellChanged(this.child, this.previous, this.previousIndex);

    if (this.previous) {
      this.connect(this.child, true);
    }

    this.parent = this.previous;
    this.previous = tmp;
    this.index = this.previousIndex;
    this.previousIndex = tmp2;
  }

  /**
   * Connects the source and the target of the given cell.
   *
   * If {@link isConnect} is true, the source and target terminals are referenced  as such in the model. Otherwise, they are removed.
   */
  connect(cell: Cell, isConnect = true) {
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    if (source) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, source, true);
      } else {
        this.model.terminalForCellChanged(cell, null, true);
      }
    }

    if (target) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, target, false);
      } else {
        this.model.terminalForCellChanged(cell, null, false);
      }
    }

    cell.setTerminal(source, true);
    cell.setTerminal(target, false);

    // Keep it outside the loop to have a single call to getChildCount for performance reasons.
    // Subclassers may override getChildCount to return a different value than the actual number of children, and this retrieval could be expensive.
    // Keeping it outside the loop also avoids calling getChildCount multiple times for the same cell.
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.connect(cell.getChildAt(i), isConnect);
    }
  }
}

export default ChildChange;

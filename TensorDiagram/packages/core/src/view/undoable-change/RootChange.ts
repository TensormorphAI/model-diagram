/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change the root in a model.
 *
 * @category Change
 */
export class RootChange implements UndoableChange {
  model: GraphDataModel;
  root: Cell | null;
  previous: Cell | null;

  constructor(model: GraphDataModel, root: Cell | null) {
    this.model = model;
    this.root = root;
    this.previous = root;
  }

  /**
   * Carries out a change of the root using {@link GraphDataModel.rootChanged}.
   */
  execute() {
    this.root = this.previous;
    this.previous = this.model.rootChanged(this.previous);
  }
}

export default RootChange;

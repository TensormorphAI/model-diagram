/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, jest, test } from '@jest/globals';
import UndoManager from '../../../src/view/undoable-change/UndoManager';
import type UndoableEdit from '../../../src/view/undoable-change/UndoableEdit';

const createEdit = (): UndoableEdit => ({ die: jest.fn() }) as unknown as UndoableEdit;

test('trim makes every removed edit die', () => {
  const undoManager = new UndoManager();
  const keptEdit = createEdit();
  const removedEdits = [createEdit(), createEdit()];
  undoManager.history = [keptEdit, ...removedEdits];
  undoManager.indexOfNextAdd = 1;

  undoManager.trim();

  expect(undoManager.history).toEqual([keptEdit]);
  expect(keptEdit.die).not.toHaveBeenCalled();
  for (const removedEdit of removedEdits) {
    expect(removedEdit.die).toHaveBeenCalledTimes(1);
  }
});

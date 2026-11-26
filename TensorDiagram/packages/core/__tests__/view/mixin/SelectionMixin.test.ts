/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import {
  type Cell,
  type EventObject,
  InternalEvent,
  type UndoableChange,
} from '../../../src';

test('getSelectionCellsForChanges returns the cell of every change', () => {
  const graph = createGraphWithoutPlugins();
  const model = graph.getDataModel();
  let changes: UndoableChange[] = [];
  model.addListener(InternalEvent.CHANGE, (_sender: unknown, evt: EventObject) => {
    changes = evt.getProperty('edit').changes;
  });
  const cells: Cell[] = [];
  model.batchUpdate(() => {
    cells.push(
      graph.insertVertex({ value: 'first' }),
      graph.insertVertex({ value: 'last' })
    );
  });

  expect(graph.getSelectionCellsForChanges(changes)).toEqual(cells);
});

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { CellOverlay, type EventObject, ImageBox, InternalEvent } from '../../../src';

test('removeCellOverlays fires an event for every removed overlay', () => {
  const graph = createGraphWithoutPlugins();
  const cell = graph.insertVertex({ value: 'vertex' });
  const overlays = [
    graph.addCellOverlay(cell, new CellOverlay(new ImageBox('first.png', 16, 16))),
    graph.addCellOverlay(cell, new CellOverlay(new ImageBox('last.png', 16, 16))),
  ];
  const removedOverlays: CellOverlay[] = [];
  graph.addListener(
    InternalEvent.REMOVE_OVERLAY,
    (_sender: unknown, evt: EventObject) => {
      removedOverlays.push(evt.getProperty('overlay'));
    }
  );

  graph.removeCellOverlays(cell);

  expect(removedOverlays).toEqual(overlays);
});

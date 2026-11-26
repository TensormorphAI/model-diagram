/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { beforeEach, expect, test } from '@jest/globals';
import { BaseGraph, type CellState, Point, Rectangle } from '../../../src';
import Guide from '../../../src/view/other/Guide';
import { createBaseGraph } from '../../utils';

let graph: BaseGraph;

beforeEach(() => {
  graph = createBaseGraph();
});

test.each([
  ['the first state', 1, -1],
  ['the last state', 299, 1],
])('move snaps the bounds to %s', (_description, boundsX, expectedDeltaX) => {
  const states = [
    graph.insertVertex({ position: [0, 0], size: [40, 40] }),
    graph.insertVertex({ position: [300, 300], size: [40, 40] }),
  ].map((cell) => graph.view.getState(cell)!);
  const guide = new Guide(graph, states as CellState[]);

  const delta = guide.move(new Rectangle(boundsX, 150, 40, 40), new Point(0, 0));

  expect(delta.x).toBe(expectedDeltaX);
});

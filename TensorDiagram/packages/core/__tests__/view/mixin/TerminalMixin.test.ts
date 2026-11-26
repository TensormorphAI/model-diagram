/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';

test('getOpposites returns the opposite terminal of every edge', () => {
  const graph = createGraphWithoutPlugins();
  const terminal = graph.insertVertex({ value: 'terminal' });
  const opposites = [
    graph.insertVertex({ value: 'A' }),
    graph.insertVertex({ value: 'B' }),
  ];
  const edges = opposites.map((opposite) =>
    graph.insertEdge({ source: terminal, target: opposite })
  );

  expect(graph.getOpposites(edges, terminal)).toEqual(opposites);
});

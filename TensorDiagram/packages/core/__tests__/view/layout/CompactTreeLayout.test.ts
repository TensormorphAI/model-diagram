/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { CompactTreeLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('lays out every vertex of the tree, and routes every edge', () => {
    const graph = createGraphWithoutContainer();
    insertCells(graph, 'rabcd', ['ra', 'rb', 'ac', 'ad']);

    graph.batchUpdate(() => {
      new CompactTreeLayout(graph).execute(graph.getDefaultParent());
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      r: [0, 75], a: [70, 30], b: [70, 120], c: [140, 0], d: [140, 60],
      ra: [[40, 80], [44, 80], [44, 40]],
      rb: [[40, 90], [48, 90], [48, 130]],
      ac: [[110, 35], [114, 35], [114, 10]],
      ad: [[110, 45], [118, 45], [118, 70]],
    });
  });
});

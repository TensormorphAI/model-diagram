/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { RadialTreeLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('places each level of the tree on its own circle', () => {
    const graph = createGraphWithoutContainer();
    const vertices = insertCells(graph, 'rabcdef', ['ra', 'rb', 'ac', 'ad', 'be', 'bf']);

    graph.batchUpdate(() => {
      new RadialTreeLayout(graph).execute(graph.getDefaultParent(), vertices.get('r'));
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      r: [90, 0],
      a: [43.65, 142.66], b: [43.65, -142.66],
      c: [182.71, 285.32], d: [-152.71, 176.34], e: [-152.71, -176.34], f: [182.71, -285.32],
      ra: null, rb: null, ac: null, ad: null, be: null, bf: null,
    });
  });
});

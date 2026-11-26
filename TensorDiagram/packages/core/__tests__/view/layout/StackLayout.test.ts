/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { StackLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('stacks every child of the parent', () => {
    const graph = createGraphWithoutContainer();
    insertCells(graph, 'abc', []);

    graph.batchUpdate(() => {
      new StackLayout(graph).execute(graph.getDefaultParent());
    });

    expect(getPositions(graph)).toEqual({ a: [0, 0], b: [40, 0], c: [80, 0] });
  });
});

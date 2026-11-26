/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { FastOrganicLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('moves every vertex according to the forces of its edges', () => {
    const graph = createGraphWithoutContainer();
    const vertices = insertCells(graph, 'abcd', ['ab', 'ac', 'bc', 'cd']);
    // The layout moves vertices sharing a coordinate by a random distance
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    graph.batchUpdate(() => {
      graph.moveCells([vertices.get('b')!], 30, 40);
      graph.moveCells([vertices.get('c')!], 60, 0);
      graph.moveCells([vertices.get('d')!], 90, 40);
    });

    graph.batchUpdate(() => {
      new FastOrganicLayout(graph).execute(graph.getDefaultParent());
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      a: [1, 61], b: [11, 1], c: [61, 41], d: [131, 51],
      ab: null, ac: null, bc: null, cd: null,
    });
  });
});

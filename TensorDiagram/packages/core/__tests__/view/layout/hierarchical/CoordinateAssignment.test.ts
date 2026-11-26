/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import {
  Cell,
  CoordinateAssignment,
  GraphHierarchyEdge,
  GraphHierarchyNode,
  HierarchicalLayout,
} from '../../../../src';
import { createGraphWithoutContainer } from '../../../utils';

test.each([
  ['a vertex', () => new GraphHierarchyNode(new Cell()), 1 + 2 + 2],
  ['an edge', () => new GraphHierarchyEdge([]), 2 + 8 + 8],
])(
  'calculatedWeightedValue of %s sums the weight of every connected cell',
  (_kind, createCell, expectedWeight) => {
    const coordinateAssignment = new CoordinateAssignment(
      new HierarchicalLayout(createGraphWithoutContainer()),
      30,
      100,
      'north',
      0
    );
    const connectedCells = [
      new GraphHierarchyNode(new Cell()),
      new GraphHierarchyEdge([]),
      new GraphHierarchyEdge([]),
    ];

    const weight = coordinateAssignment.calculatedWeightedValue(
      createCell(),
      connectedCells
    );

    expect(weight).toBe(expectedWeight);
  }
);

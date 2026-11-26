/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { Cell, GraphHierarchyEdge, ObjectIdentity } from '../../../../src';

test('stores the identity of every edge it represents', () => {
  const edges = [new Cell(), new Cell(), new Cell()];

  const hierarchyEdge = new GraphHierarchyEdge(edges);

  expect(hierarchyEdge.ids).toEqual(edges.map((edge) => ObjectIdentity.get(edge)));
});

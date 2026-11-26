/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, jest, test } from '@jest/globals';
import { type CellState, EdgeLabelLayout, Rectangle } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

const createEdgeStateWithLabel = () =>
  ({ text: { boundingBox: new Rectangle(0, 0, 10, 10) } }) as unknown as CellState;

describe('placeLabels', () => {
  test('moves the label of every edge away from every vertex', () => {
    const layout = new EdgeLabelLayout(createGraphWithoutContainer(), 0);
    const avoidSpy = jest.spyOn(layout, 'avoid').mockImplementation(() => {});
    const vertices = [{} as CellState, {} as CellState];
    const edges = [createEdgeStateWithLabel(), createEdgeStateWithLabel()];

    layout.placeLabels(vertices, edges);

    expect(avoidSpy.mock.calls).toEqual([
      [edges[0], vertices[0]],
      [edges[0], vertices[1]],
      [edges[1], vertices[0]],
      [edges[1], vertices[1]],
    ]);
  });
});

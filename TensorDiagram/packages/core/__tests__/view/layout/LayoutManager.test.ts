/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, jest, test } from '@jest/globals';
import { GraphLayout, LayoutManager } from '../../../src';
import { createBaseGraph, createContainer } from '../../utils';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const graph = createBaseGraph();
    const manager = new LayoutManager(graph);
    manager.addListener('testEvent', () => {});
    expect(manager.eventListeners.length).toBeGreaterThan(0);

    manager.destroy();

    expect(manager.eventListeners).toHaveLength(0);
  });
});

describe('cellsMoved', () => {
  test('lets the layout of the parent of every cell move it to the mouse location', () => {
    const graph = createBaseGraph({ container: createContainer({}) });
    const cells = [
      graph.insertVertex({ value: 'a' }),
      graph.insertVertex({ value: 'b' }),
      graph.insertVertex({ value: 'c' }),
    ];
    const layout = new GraphLayout(graph);
    const moveCellSpy = jest.spyOn(layout, 'moveCell');
    const manager = new LayoutManager(graph);
    manager.getLayout = () => layout;

    manager.cellsMoved(cells, new MouseEvent('mouseup', { clientX: 10, clientY: 20 }));

    expect(moveCellSpy.mock.calls).toEqual(cells.map((cell) => [cell, 10, 20]));
  });
});

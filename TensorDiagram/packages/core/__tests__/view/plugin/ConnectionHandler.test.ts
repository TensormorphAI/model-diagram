/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { beforeEach, describe, expect, test } from '@jest/globals';

import ConnectionHandler from '../../../src/view/plugin/ConnectionHandler';
import { type AbstractGraph, Point } from '../../../src';
import { createBaseGraph } from '../../utils';

let graph: AbstractGraph;
let plugin: ConnectionHandler;

beforeEach(() => {
  graph = createBaseGraph({ plugins: [ConnectionHandler] });
  plugin = graph.getPlugin<ConnectionHandler>('ConnectionHandler')!;
});

describe('connect', () => {
  test('store the waypoints in the edge geometry, unscaled and untranslated', () => {
    const source = graph.insertVertex({ position: [0, 0], size: [10, 10] });
    const target = graph.insertVertex({ position: [100, 100], size: [10, 10] });
    graph.view.scale = 2;
    graph.view.translate = new Point(5, 10);
    plugin.waypoints = [new Point(30, 40), new Point(50, 60)];

    plugin.connect(source, target, new MouseEvent('mouseup'));

    const edge = source.getEdgeAt(0);
    expect(edge.getTerminal(false)).toBe(target);
    expect(edge.getGeometry()!.points).toEqual([new Point(10, 10), new Point(20, 20)]);
  });
});

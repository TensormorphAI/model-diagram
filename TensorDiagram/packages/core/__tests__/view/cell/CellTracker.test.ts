/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { CellTracker } from '../../../src';
import { createBaseGraph } from '../../utils';

describe('destroy', () => {
  test('sets destroyed flag', () => {
    const graph = createBaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    expect(tracker.destroyed).toBe(false);

    tracker.destroy();

    expect(tracker.destroyed).toBe(true);
  });

  test('removes mouse listener from graph', () => {
    const graph = createBaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    expect(graph.mouseListeners).toContain(tracker);

    tracker.destroy();

    expect(graph.mouseListeners).not.toContain(tracker);
  });

  test('clears eventListeners', () => {
    const graph = createBaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');
    tracker.addListener('testEvent', () => {});
    expect(tracker.eventListeners.length).toBeGreaterThan(0);

    tracker.destroy();

    expect(tracker.eventListeners).toHaveLength(0);
  });

  test('is idempotent', () => {
    const graph = createBaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    tracker.destroy();
    tracker.destroy();

    expect(tracker.destroyed).toBe(true);
    expect(graph.mouseListeners).not.toContain(tracker);
  });
});

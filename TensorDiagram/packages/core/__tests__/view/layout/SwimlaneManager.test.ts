/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { SwimlaneManager } from '../../../src';
import { createBaseGraph } from '../../utils';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const graph = createBaseGraph();
    const manager = new SwimlaneManager(graph);
    manager.addListener('testEvent', () => {});
    expect(manager.eventListeners.length).toBeGreaterThan(0);

    manager.destroy();

    expect(manager.eventListeners).toHaveLength(0);
  });
});

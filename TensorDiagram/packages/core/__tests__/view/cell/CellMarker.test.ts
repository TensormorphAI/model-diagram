/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { CellMarker } from '../../../src';
import { createBaseGraph } from '../../utils';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const graph = createBaseGraph();
    const marker = new CellMarker(graph);
    marker.addListener('testEvent', () => {});
    expect(marker.eventListeners.length).toBeGreaterThan(0);

    marker.destroy();

    expect(marker.eventListeners).toHaveLength(0);
  });
});

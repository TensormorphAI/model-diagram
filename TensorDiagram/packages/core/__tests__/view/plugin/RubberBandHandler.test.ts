/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { RubberBandHandler } from '../../../src';
import { createBaseGraph, hasListener } from '../../utils';

describe('onDestroy', () => {
  test('removes all graph listeners registered in constructor', () => {
    const graph = createBaseGraph({ plugins: [RubberBandHandler] });
    const handler = graph.getPlugin<RubberBandHandler>('RubberBandHandler')!;

    expect(hasListener(graph.eventListeners, handler.forceRubberbandHandler)).toBe(true);
    expect(hasListener(graph.eventListeners, handler.panHandler)).toBe(true);
    expect(hasListener(graph.eventListeners, handler.gestureHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.eventListeners, handler.forceRubberbandHandler)).toBe(false);
    expect(hasListener(graph.eventListeners, handler.panHandler)).toBe(false);
    expect(hasListener(graph.eventListeners, handler.gestureHandler)).toBe(false);
  });
});

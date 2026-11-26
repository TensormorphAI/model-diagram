/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { PanningHandler } from '../../../src';
import { createBaseGraph } from '../../utils';

describe('onDestroy', () => {
  test('PanningManager.destroy() is called when PanningHandler is destroyed', () => {
    const graph = createBaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    const destroyMock = jest.fn(panningHandler.panningManager.destroy);
    panningHandler.panningManager.destroy = destroyMock;

    panningHandler.onDestroy();

    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  test('clears eventListeners', () => {
    const graph = createBaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    panningHandler.addListener('testEvent', () => {});
    expect(panningHandler.eventListeners.length).toBeGreaterThan(0);

    panningHandler.onDestroy();

    expect(panningHandler.eventListeners).toHaveLength(0);
  });

  test('PanningManager.stop() is called during destroy to clear interval timer', () => {
    const graph = createBaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    const stopMock = jest.fn(panningHandler.panningManager.stop);
    panningHandler.panningManager.stop = stopMock;

    panningHandler.onDestroy();

    expect(stopMock).toHaveBeenCalledTimes(1);
  });
});

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { MaxToolbar } from '../../src';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const container = document.createElement('div');
    const toolbar = new MaxToolbar(container);
    toolbar.addListener('testEvent', () => {});
    expect(toolbar.eventListeners.length).toBeGreaterThan(0);

    toolbar.destroy();

    expect(toolbar.eventListeners).toHaveLength(0);
  });
});

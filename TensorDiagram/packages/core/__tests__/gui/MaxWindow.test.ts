/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import MaxWindow from '../../src/gui/MaxWindow';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const content = document.createElement('div');
    document.body.appendChild(content);
    const win = new MaxWindow('Test', content, 0, 0, 100, 100);
    win.addListener('testEvent', () => {});
    expect(win.eventListeners.length).toBeGreaterThan(0);

    win.destroy();

    expect(win.eventListeners).toHaveLength(0);
  });
});

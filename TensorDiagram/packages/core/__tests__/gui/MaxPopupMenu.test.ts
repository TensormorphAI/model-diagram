/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { MaxPopupMenu } from '../../src';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const menu = new MaxPopupMenu();
    menu.addListener('testEvent', () => {});
    expect(menu.eventListeners.length).toBeGreaterThan(0);

    menu.destroy();

    expect(menu.eventListeners).toHaveLength(0);
  });
});

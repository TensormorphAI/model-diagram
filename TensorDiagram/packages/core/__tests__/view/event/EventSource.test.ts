/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import EventSource from '../../../src/view/event/EventSource';

describe('destroy', () => {
  test('clears all registered event listeners', () => {
    const eventSource = new EventSource();
    eventSource.addListener('event1', () => {});
    eventSource.addListener('event2', () => {});
    expect(eventSource.eventListeners).toHaveLength(2);

    eventSource.destroy();

    expect(eventSource.eventListeners).toHaveLength(0);
  });
});

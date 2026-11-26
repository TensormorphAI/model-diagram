/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { removeDuplicates } from '../../src/util/arrayUtils';

describe('removeDuplicates', () => {
  test('keep the first occurrence of each value, in the original order', () => {
    expect(removeDuplicates([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  test('compare objects by reference', () => {
    const object1 = { id: 1 };
    const object2 = { id: 1 };

    expect(removeDuplicates([object1, object2, object1])).toEqual([object1, object2]);
  });

  test('return an empty array for an empty array', () => {
    expect(removeDuplicates([])).toEqual([]);
  });
});

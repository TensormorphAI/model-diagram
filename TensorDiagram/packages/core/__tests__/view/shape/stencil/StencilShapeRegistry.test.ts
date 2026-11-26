/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { StencilShapeRegistry } from '../../../../src';

describe('get', () => {
  test.each([null, undefined, 'unknown'])('pass %s, return undefined', (name) => {
    expect(StencilShapeRegistry.get(name)).toBeNull();
  });
});

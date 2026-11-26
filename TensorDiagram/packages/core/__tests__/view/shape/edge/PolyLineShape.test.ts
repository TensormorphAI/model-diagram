/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, expect } from '@jest/globals';
import PolylineShape from '../../../../src/view/shape/edge/PolylineShape';
import AbstractCanvas2D from '../../../../src/view/canvas/AbstractCanvas2D';

afterEach(() => {
  jest.clearAllMocks();
});

test('paintLine uses correct arc size', () => {
  const polylineShape = new PolylineShape([], 'red');
  const addPoints = jest.spyOn(polylineShape, 'addPoints');
  // Mock only the methods used by PolylineShape.paintLine
  const canvas2D = {
    begin: jest.fn(),
    stroke: jest.fn(),
  } as unknown as AbstractCanvas2D;

  polylineShape.paintLine(canvas2D, [], true);

  const expectedUsedArcSize = 10; // no style set, so the value is derived from the default
  expect(addPoints).toHaveBeenCalledWith(canvas2D, [], true, expectedUsedArcSize, false);
});

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { Geometry, Point } from '../../../src';

const createGeometryWithPoints = (): Geometry => {
  const geometry = new Geometry();
  geometry.relative = true;
  geometry.points = [new Point(10, 20), new Point(30, 40)];
  return geometry;
};

describe('transform every control point', () => {
  test.each([
    [
      'rotate',
      (geometry: Geometry) => geometry.rotate(90, new Point(0, 0)),
      [new Point(-20, 10), new Point(-40, 30)],
    ],
    [
      'translate',
      (geometry: Geometry) => geometry.translate(5, 10),
      [new Point(15, 30), new Point(35, 50)],
    ],
    [
      'scale',
      (geometry: Geometry) => geometry.scale(2, 3, false),
      [new Point(20, 60), new Point(60, 120)],
    ],
  ])('%s', (_method, transform, expectedPoints) => {
    const geometry = createGeometryWithPoints();

    transform(geometry);

    expect(geometry.points).toEqual(expectedPoints);
  });
});

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { beforeEach, describe, expect, test } from '@jest/globals';
import SwimlaneShape from '../../../../src/view/shape/node/SwimlaneShape';

describe('getSwimlaneArcSize', () => {
  let shape: SwimlaneShape;

  beforeEach(() => {
    // the values passed to the constructor are not used in this test
    shape = new SwimlaneShape(null!, null!, null!);
  });

  describe('absoluteArcSize: true', () => {
    const ignoredStartParameter: number = null!;

    test('height is smaller than width', () => {
      shape.style = { absoluteArcSize: true, arcSize: 20 };
      expect(shape.getSwimlaneArcSize(100, 50, ignoredStartParameter)).toBe(10);
    });

    test('width is smaller than height', () => {
      shape.style = { absoluteArcSize: true, arcSize: 13 };
      expect(shape.getSwimlaneArcSize(50, 100, ignoredStartParameter)).toBe(6.5);
    });

    test('width and height are equal', () => {
      shape.style = { absoluteArcSize: true, arcSize: 30 };
      expect(shape.getSwimlaneArcSize(50, 50, ignoredStartParameter)).toBe(15);
    });

    test('arcSize is zero', () => {
      shape.style = { absoluteArcSize: true, arcSize: 0 };
      expect(shape.getSwimlaneArcSize(100, 50, ignoredStartParameter)).toBe(0);
    });

    test('width and height are zero', () => {
      shape.style = { absoluteArcSize: true, arcSize: 60 };
      expect(shape.getSwimlaneArcSize(0, 0, ignoredStartParameter)).toBe(0);
    });

    test('arcSize is not set, large dimensions', () => {
      shape.style = { absoluteArcSize: true };
      expect(shape.getSwimlaneArcSize(170, 90, ignoredStartParameter)).toBe(10);
    });

    test('arcSize is not set, small dimensions', () => {
      shape.style = { absoluteArcSize: true };
      expect(shape.getSwimlaneArcSize(10, 17, ignoredStartParameter)).toBe(5);
    });
  });

  test.each([false, undefined])('absoluteArcSize: %s', (absoluteArcSize?: boolean) => {
    shape.style = { absoluteArcSize, arcSize: 40 };
    expect(shape.getSwimlaneArcSize(400, 350, 7)).toBe(8.4);
  });

  describe('style is not set', () => {
    test('height is smaller than width', () => {
      shape.style = null;
      expect(shape.getSwimlaneArcSize(400, 350, 40)).toBe(18);
    });

    test('width is smaller than height', () => {
      shape.style = null;
      expect(shape.getSwimlaneArcSize(40, 60, 20)).toBe(9);
    });

    test('large dimensions', () => {
      shape.style = null;
      expect(shape.getSwimlaneArcSize(200, 468, 15)).toBe(6.75);
    });

    test('width and height are equal', () => {
      shape.style = null;
      expect(shape.getSwimlaneArcSize(85, 85, 19)).toBe(8.55);
    });
  });
});

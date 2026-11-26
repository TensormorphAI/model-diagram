/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { DIRECTION_MASK, FONT_STYLE_MASK } from '../../src/util/Constants';
import { isNullish, matchBinaryMask } from '../../src/internal/utils';

describe('isNullish', () => {
  test.each([null, undefined])('returns true for %s', (value) => {
    expect(isNullish(value)).toBeTruthy();
  });

  test.each([0, false, '', Number.NaN, {}, [], 12, 'hello', { property: 'value' }])(
    'returns false for %s',
    (value) => {
      expect(isNullish(value)).toBeFalsy();
    }
  );
});

describe('matchBinaryMask', () => {
  test('match self', () => {
    expect(
      matchBinaryMask(FONT_STYLE_MASK.STRIKETHROUGH, FONT_STYLE_MASK.STRIKETHROUGH)
    ).toBeTruthy();
  });
  test('match', () => {
    expect(matchBinaryMask(9465, FONT_STYLE_MASK.BOLD)).toBeTruthy();
    expect(9465 & FONT_STYLE_MASK.BOLD).toBeTruthy(); // equivalent implementation returning a number (matchBinaryMask returns a boolean)
  });
  test('match another', () => {
    expect(matchBinaryMask(19484, FONT_STYLE_MASK.UNDERLINE)).toBeTruthy();
  });
  test('no match', () => {
    expect(matchBinaryMask(46413, FONT_STYLE_MASK.ITALIC)).toBeFalsy();
    expect(46413 & FONT_STYLE_MASK.ITALIC).toBeFalsy(); // equivalent implementation returning a number (matchBinaryMask returns a boolean)
  });

  test.each([null, undefined])('no match when value is nullish: %s', (value) => {
    expect(matchBinaryMask(value, DIRECTION_MASK.EAST)).toBeFalsy();
  });
  test.each([null, undefined])('match for zero when value is nullish: %s', (value) => {
    expect(matchBinaryMask(value, 0)).toBeTruthy();
  });
});

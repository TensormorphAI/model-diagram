/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { SvgCanvas2D, constants } from '../../../src';

function createSvgCanvas2D() {
  return new SvgCanvas2D(document.createElementNS(constants.NS_SVG, 'svg'), true);
}

describe('SvgCanvas2D.convertHtml', () => {
  test.each([
    ['plain text unchanged if not valid HTML', 'plain text', 'plain text'],
    ['HTML with body tag', '<html><body><p>foo</p></body></html>', '<p>foo</p>'],
    [
      'HTML with attributes on body',
      '<html><body style="color:red"><span>bar</span></body></html>',
      '<span>bar</span>',
    ],
    ['empty string for empty input', '', ''],
    [
      'nested HTML',
      '<div><div><span>deep</span></div></div>',
      '<div><div><span>deep</span></div></div>',
    ],
    ['malformed HTML gracefully', '<div><b>broken', '<div><b>broken</b></div>'],
    [
      'HTML with whitespace, trim only leading whitespace',
      '   <div> spaced </div>   ',
      '<div> spaced </div>   ',
    ],
  ])('%s', (_description, input, expected) => {
    const canvas = createSvgCanvas2D();
    expect(canvas.convertHtml(input)).toBe(expected);
  });
});

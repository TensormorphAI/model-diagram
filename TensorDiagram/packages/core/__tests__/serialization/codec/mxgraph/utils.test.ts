/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { convertStyleFromString } from '../../../../src/serialization/codec/mxGraph/utils';
import type { CellStyle } from '../../../../src';

describe('convertStyleFromString', () => {
  test('Basic', () => {
    // adapted from https://github.com/TensorDiagram/TensorDiagram/issues/221
    expect(
      convertStyleFromString(
        'rounded=0;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=27'
      )
    ).toEqual({
      rounded: 0, // FIX should be true
      whiteSpace: 'wrap',
      fillColor: '#dae8fc',
      strokeColor: '#6c8ebf',
      fontStyle: 1,
      fontSize: 27,
    });
  });

  test('With leading ;', () => {
    expect(convertStyleFromString(';arcSize=4;endSize=5;')).toEqual(<CellStyle>{
      arcSize: 4,
      endSize: 5,
      ignoreDefaultStyle: true,
    });
  });

  test('With trailing ;', () => {
    // from https://github.com/TensorDiagram/TensorDiagram/issues/102#issuecomment-1225577772
    expect(
      convertStyleFromString(
        'rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;dashed=1;'
      )
    ).toEqual({
      rounded: 0, // FIX should be true
      whiteSpace: 'wrap',
      html: 1, // custom draw.io
      fillColor: '#E6E6E6',
      dashed: 1,
    });
  });

  // manage base name style (no = at the begining and in the middle)
  test('With base name style', () => {
    expect(
      convertStyleFromString(
        'rectangle;fontColor=yellow;customRectangle;gradientColor=white;'
      )
    ).toEqual(<CellStyle>{
      baseStyleNames: ['rectangle', 'customRectangle'],
      fontColor: 'yellow',
      gradientColor: 'white',
    });
  });

  // renamed properties (see migration guide)
  test('With renamed properties', () => {
    // @ts-ignore
    expect(convertStyleFromString('autosize=1')).toEqual(<CellStyle>{
      autoSize: 1, // FIX should be true
    });
  });
});

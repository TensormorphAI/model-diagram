/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { isNumeric } from '../../../util/mathUtils.js';
import type { CellStyle } from '../../../types.js';

// from mxGraph to TensorDiagram
const fieldMapping = new Map<string, string>([['autosize', 'autoSize']]);

export function convertStyleFromString(input: string) {
  const style: CellStyle = {};
  input.startsWith(';') && (style.ignoreDefaultStyle = true);

  const elements = input
    .split(';')
    // filter empty key
    .filter(([k]) => k);
  for (const element of elements) {
    if (!element.includes('=')) {
      !style.baseStyleNames && (style.baseStyleNames = []);
      style.baseStyleNames.push(element);
    } else {
      const [key, value] = element.split('=');
      // @ts-ignore
      style[fieldMapping.get(key) ?? key] = convertToNumericIfNeeded(value);
    }
  }

  return style;
}

function convertToNumericIfNeeded(value: string): string | number {
  // Adapted from ObjectCodec.convertAttributeFromXml
  if (!isNumeric(value)) {
    return value;
  }

  let numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    numericValue = 0;
  }
  return numericValue;
}

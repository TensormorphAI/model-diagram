/*
Copyright 2022-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { CellOverlay, Point } from '../../../src';

test('Constructor set all parameters', () => {
  const cellOverlay = new CellOverlay(
    // @ts-ignore
    null,
    'my tooltip',
    'left',
    'middle',
    new Point(10, 20),
    'custom'
  );

  expect(cellOverlay).toEqual(
    expect.objectContaining({
      align: 'left',
      cursor: 'custom',
      offset: new Point(10, 20),
      tooltip: 'my tooltip',
      verticalAlign: 'middle',
    })
  );
});

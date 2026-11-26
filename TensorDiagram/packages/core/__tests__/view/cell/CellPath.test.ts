/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { Cell } from '../../../src';
import CellPath from '../../../src/view/cell/CellPath';

const createCellWithChildren = (childCount: number): Cell => {
  const cell = new Cell();
  for (let index = 0; index < childCount; index++) {
    cell.insert(new Cell());
  }
  return cell;
};

test('resolve follows every index of the path', () => {
  const root = createCellWithChildren(2);
  const firstChild = root.getChildAt(0);
  firstChild.insert(new Cell());
  const grandChild = new Cell();
  firstChild.insert(grandChild);

  expect(CellPath.resolve(root, '0.1')).toBe(grandChild);
});

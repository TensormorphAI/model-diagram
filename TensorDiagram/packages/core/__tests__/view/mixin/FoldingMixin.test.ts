/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { createCellWithStyle, createGraphWithoutPlugins } from '../../utils';
import { Cell, type CellStateStyle } from '../../../src';

const ignoredFoldableParameter = false;

function createCellWithChildren(style?: CellStateStyle): Cell {
  const cell = createCellWithStyle(style ?? {});
  cell.children.push(new Cell());
  return cell;
}

describe('isCellFoldable', () => {
  test('Using defaults, Cell without children', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(new Cell(), ignoredFoldableParameter)
    ).toBeFalsy();
  });

  test('Using defaults, Cell with children', () => {
    const cell = createCellWithChildren();
    expect(
      createGraphWithoutPlugins().isCellFoldable(cell, ignoredFoldableParameter)
    ).toBeTruthy();
  });

  test('Using Cell with the "foldable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(
        createCellWithChildren({ foldable: true }),
        ignoredFoldableParameter
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "foldable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(
        createCellWithChildren({ foldable: false }),
        ignoredFoldableParameter
      )
    ).toBeFalsy();
  });
});

describe('cellsFolded', () => {
  test('collapse every given cell', () => {
    const graph = createGraphWithoutPlugins();
    const groups = [
      graph.insertVertex({ value: 'group 1', size: [100, 100] }),
      graph.insertVertex({ value: 'group 2', size: [100, 100] }),
    ];

    graph.cellsFolded(groups, true, false);

    expect(groups.map((group) => group.isCollapsed())).toEqual([true, true]);
  });
});

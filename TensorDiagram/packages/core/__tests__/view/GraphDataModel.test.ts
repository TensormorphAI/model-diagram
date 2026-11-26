/*
Copyright 2022-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { Cell, GraphDataModel } from '../../src';
import { createGraphWithoutPlugins } from '../utils';

describe('filterCells', () => {
  const model: GraphDataModel = new GraphDataModel();

  test('Filter cells with a valid filter function', () => {
    const cell1 = new Cell();
    const cells = [cell1, new Cell()];
    const filter = (cell: Cell) => cell === cell1;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([cell1]);
  });

  test('Filter cells with an empty array', () => {
    const cells: Cell[] = [];
    const filter = (_cell: Cell) => true;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([]);
  });

  test('Filter cells with a filter function that returns false for all cells', () => {
    const cells = [new Cell(), new Cell()];
    const filter = (_cell: Cell) => false;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([]);
  });
});

describe('isLayer', () => {
  const model: GraphDataModel = new GraphDataModel();
  const root: Cell = new Cell();
  model.setRoot(root);

  test('Child is null', () => {
    expect(model.isLayer(null)).toBe(false);
  });

  test('Child is not null and is not layer', () => {
    expect(model.isLayer(new Cell())).toBe(false);
  });

  test('Child is not null and is layer', () => {
    const child = new Cell();
    root.children.push(child);
    child.setParent(root);
    expect(model.isLayer(child)).toBeTruthy();
  });
});

describe('updateEdgeParents', () => {
  test('move every connected edge to the nearest common ancestor of its terminals', () => {
    const graph = createGraphWithoutPlugins();
    const model = graph.getDataModel();
    const group = graph.insertVertex({ value: 'group' });
    const source = graph.insertVertex({ parent: group, value: 'source' });
    const target = graph.insertVertex({ parent: group, value: 'target' });
    model.maintainEdgeParent = false;
    const edges = [
      graph.insertEdge({ source, target }),
      graph.insertEdge({ source, target }),
    ];
    model.maintainEdgeParent = true;

    model.updateEdgeParents(source);

    expect(edges.map((edge) => edge.getParent())).toEqual([group, group]);
  });
});

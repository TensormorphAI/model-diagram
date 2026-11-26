/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { BaseGraph, CellState, type CellStyle } from '@tensormorph/tensordiagramcore';

// These tests are only provided to demonstrate that they can run with ts-jest using commonjs

test('BaseGraph.isOrthogonal', () => {
  const graph = new BaseGraph();
  expect(graph.isOrthogonal(new CellState())).toBeFalsy();
});

test('BaseGraph.setCellStyles on vertex', () => {
  const graph = new BaseGraph();

  const style: CellStyle = { align: 'right', fillColor: 'red' };
  const cell = graph.insertVertex({ value: 'a value', style });
  expect(cell.style).toStrictEqual(style);

  graph.setCellStyles('fillColor', 'chartreuse', [cell]);
  expect(cell.style.fillColor).toBe('chartreuse');
  expect(graph.getView().getState(cell)?.style?.fillColor).toBe('chartreuse');
});

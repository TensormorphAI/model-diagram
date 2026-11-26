/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type { Cell, Graph } from '../../../src';

/**
 * Inserts a vertex for each letter of `vertexValues`, and an edge for each value of
 * `edgeValues`, going from the vertex of its first letter to the vertex of its second one.
 * The characters after the second one are ignored, they only make the values of parallel edges unique.
 */
export const insertCells = (
  graph: Graph,
  vertexValues: string,
  edgeValues: string[],
  parent?: Cell
) => {
  const vertices = new Map(
    vertexValues
      .split('')
      .map((value) => [value, graph.insertVertex({ parent, value, size: [40, 20] })])
  );
  for (const value of edgeValues) {
    const [source, target] = value.split('');
    graph.insertEdge({
      parent,
      value,
      source: vertices.get(source),
      target: vertices.get(target),
    });
  }
  return vertices;
};

export const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Returns the position of every vertex and the points of every edge, by cell value, including the cells nested in the
 * vertices.
 */
export const getPositions = (
  graph: Graph,
  parent = graph.getDefaultParent()
): Record<string, number[] | number[][] | null> =>
  Object.fromEntries(
    parent.children.flatMap((cell) =>
      cell.isVertex()
        ? [
            [cell.value, [round(cell.geometry!.x), round(cell.geometry!.y)]],
            ...Object.entries(getPositions(graph, cell)),
          ]
        : [
            [
              cell.value,
              cell.geometry!.points?.map((point) => [round(point.x), round(point.y)]) ??
                null,
            ],
          ]
    )
  );

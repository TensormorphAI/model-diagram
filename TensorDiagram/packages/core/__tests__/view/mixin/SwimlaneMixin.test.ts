/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import type { Cell, Graph } from '../../../src';

const insertDropTarget = (graph: Graph): Cell => {
  const dropTarget = graph.insertVertex({ value: 'target', size: [200, 200] });
  graph.insertVertex({ parent: dropTarget, value: 'child', size: [10, 10] });
  return dropTarget;
};

test.each([
  ['no swimlane', [false, false], false],
  ['a swimlane first', [true, false], true],
  ['a swimlane last', [false, true], true],
])(
  'getDropTarget without swimlane nesting, moving %s',
  (_description, swimlaneFlags, expectNoDropTarget) => {
    const graph = createGraphWithoutPlugins();
    graph.swimlaneNesting = false;
    const dropTarget = insertDropTarget(graph);
    const movedCells = swimlaneFlags.map((isSwimlane) =>
      graph.insertVertex({
        value: 'moved',
        position: [500, 500],
        size: [10, 10],
        style: isSwimlane ? { shape: 'swimlane' } : {},
      })
    );

    const result = graph.getDropTarget(movedCells, new MouseEvent('mouseup'), dropTarget);

    expect(result).toBe(expectNoDropTarget ? null : dropTarget);
  }
);

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import {
  type GraphHierarchyModel,
  HierarchicalLayout,
  MedianHybridCrossingReduction,
} from '../../../../src';
import { createGraphWithoutContainer } from '../../../utils';

// The placement stage turns the positions of the cells in their rank into coordinates, so it
// is skipped to keep the ranks as the crossing reduction leaves them
class HierarchicalLayoutWithoutPlacement extends HierarchicalLayout {
  override placementStage(initialX: number): number {
    return initialX;
  }
}

test('calculateCrossings counts every crossing between two ranks', () => {
  const graph = createGraphWithoutContainer();
  const layout = new HierarchicalLayoutWithoutPlacement(graph);
  const sources = ['a', 'b', 'c'].map((value) => graph.insertVertex({ value }));
  const targets = ['d', 'e', 'f'].map((value) => graph.insertVertex({ value }));
  // A common root keeps the cells in a single hierarchy, on top of the sources
  const root = graph.insertVertex({ value: 'root' });
  sources.forEach((source, index) => {
    graph.insertEdge({ source: root, target: source });
    graph.insertEdge({ source, target: targets[index] });
  });
  graph.batchUpdate(() => {
    layout.execute(graph.getDefaultParent());
  });
  // The targets are put in the reverse order of their sources, so that every edge crosses
  // the 2 others. The sources are on rank 1, the targets on rank 0
  const model = layout.getDataModel() as GraphHierarchyModel;
  sources.forEach((source, index) =>
    model.vertexMapper.get(source)!.setGeneralPurposeVariable(1, index)
  );
  targets.forEach((target, index) =>
    model.vertexMapper.get(target)!.setGeneralPurposeVariable(0, 2 - index)
  );

  const crossings = new MedianHybridCrossingReduction(layout).calculateCrossings(model);

  expect(crossings).toBe(3);
});

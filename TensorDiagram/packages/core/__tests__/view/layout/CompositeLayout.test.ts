/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, jest, test } from '@jest/globals';
import { CompositeLayout, GraphLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

describe('execute', () => {
  test('executes every layout on the parent', () => {
    const graph = createGraphWithoutContainer();
    const layouts = [
      new GraphLayout(graph),
      new GraphLayout(graph),
      new GraphLayout(graph),
    ];
    const executeSpies = layouts.map((layout) => jest.spyOn(layout, 'execute'));
    const parent = graph.getDefaultParent();

    new CompositeLayout(graph, layouts).execute(parent);

    for (const executeSpy of executeSpies) {
      expect(executeSpy.mock.calls).toEqual([[parent]]);
    }
  });
});

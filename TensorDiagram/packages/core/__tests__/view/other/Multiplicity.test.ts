/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { beforeEach, expect, test } from '@jest/globals';
import { BaseGraph } from '../../../src';
import Multiplicity from '../../../src/view/other/Multiplicity';
import { createBaseGraph } from '../../utils';

let graph: BaseGraph;

beforeEach(() => {
  graph = createBaseGraph();
});

test.each([
  ['the first valid neighbor', 'first', true],
  ['the last valid neighbor', 'last', true],
  ['no valid neighbor', 'other', false],
])('checkNeighbors with a target matching %s', (_description, targetValue, expected) => {
  const multiplicity = new Multiplicity(
    true,
    'source',
    null,
    null,
    0,
    1,
    ['first', 'last'],
    null,
    null
  );
  const source = graph.insertVertex({ value: 'source' });
  const target = graph.insertVertex({ value: targetValue });
  const edge = graph.insertEdge({ source, target });

  expect(multiplicity.checkNeighbors(graph, edge, source, target)).toBe(expected);
});

// The type of the rule is checked on the terminal: checkTerminal used to receive the edge in place of the terminal
test.each([
  ['matches the type of the rule, invalid neighbor', 'source', 'other', 'COUNT\nTYPE\n'],
  ['matches the type of the rule, valid neighbor', 'source', 'target', 'COUNT\n'],
  ['does not match the type of the rule', 'other', 'other', null],
])('check when the source %s', (_description, sourceValue, targetValue, expected) => {
  const multiplicity = new Multiplicity(
    true,
    'source',
    null,
    null,
    0,
    0,
    ['target'],
    'COUNT',
    'TYPE'
  );
  const source = graph.insertVertex({ value: sourceValue });
  const target = graph.insertVertex({ value: targetValue });
  const edge = graph.insertEdge({ source, target });

  expect(multiplicity.check(graph, edge, source, target, 1, 1)).toBe(expected);
});

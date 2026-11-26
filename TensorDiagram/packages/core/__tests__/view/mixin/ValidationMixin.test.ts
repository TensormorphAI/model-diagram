/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Multiplicity } from '../../../src';

const createRuleAllowingNoOutgoingEdge = (countError: string): Multiplicity =>
  new Multiplicity(true, 'Task', null, null, 0, 0, null, countError, null);

test('getCellValidationError reports the error of every violated multiplicity', () => {
  const graph = createGraphWithoutPlugins();
  graph.multiplicities = [
    createRuleAllowingNoOutgoingEdge('first rule'),
    createRuleAllowingNoOutgoingEdge('last rule'),
  ];
  const source = graph.insertVertex({ value: document.createElement('Task') });
  graph.insertEdge({ source, target: graph.insertVertex({ value: 'target' }) });

  expect(graph.getCellValidationError(source)).toBe('first rule\nlast rule\n');
});

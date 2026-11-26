/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { beforeEach, expect, jest, test } from '@jest/globals';
import {
  BaseGraph,
  ConnectionConstraint,
  ConstraintHandler,
  type ImageShape,
  InternalMouseEvent,
  Point,
} from '../../../src';
import { createBaseGraph } from '../../utils';

let graph: BaseGraph;
let constraintHandler: ConstraintHandler;

beforeEach(() => {
  graph = createBaseGraph();
  constraintHandler = new ConstraintHandler(graph);
});

const createIconStubs = (): ImageShape[] =>
  [{ destroy: jest.fn() }, { destroy: jest.fn() }] as unknown as ImageShape[];

test.each(['reset', 'destroyIcons'] as const)(
  '%s destroys every focus icon',
  (method) => {
    const icons = createIconStubs();
    constraintHandler.focusIcons = icons;

    constraintHandler[method]();

    for (const icon of icons) {
      expect(icon.destroy).toHaveBeenCalledTimes(1);
    }
  }
);

test('setFocus replaces the focus icons by one icon for every constraint', () => {
  const previousIcons = createIconStubs();
  constraintHandler.focusIcons = previousIcons;
  const cell = graph.insertVertex({ position: [0, 0], size: [40, 20] });
  graph.getAllConnectionConstraints = () => [
    new ConnectionConstraint(new Point(0, 0.5), false),
    new ConnectionConstraint(new Point(1, 0.5), false),
  ];

  constraintHandler.setFocus(
    new InternalMouseEvent(new MouseEvent('mousemove')),
    graph.view.getState(cell)!,
    true
  );

  for (const icon of previousIcons) {
    expect(icon.destroy).toHaveBeenCalledTimes(1);
  }
  expect(constraintHandler.focusPoints).toEqual([new Point(0, 10), new Point(40, 10)]);
  expect(constraintHandler.focusIcons).toHaveLength(2);
});

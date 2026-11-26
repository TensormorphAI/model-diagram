/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  CellState,
  EdgeStyle,
  type EdgeStyleFunction,
  type GraphPlugin,
  registerDefaultEdgeStyles,
  unregisterAllEdgeStyles,
} from '../../src';
import { describeNoGlobalStateForMixinProperties } from './no-global-state-for-mixin-properties';
import { createBaseGraph } from '../utils';

const customEdgeStyle: EdgeStyleFunction = () => {
  // do nothing, we just need a custom implementation that is not registered by default
};

beforeEach(() => {
  unregisterAllEdgeStyles();
});
afterAll(() => {
  unregisterAllEdgeStyles();
});

describe('isOrthogonal', () => {
  test('Style of the CellState, orthogonal: true', () => {
    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, { orthogonal: true });
    expect(graph.isOrthogonal(cellState)).toBeTruthy();
  });

  test('No style in the CellState', () => {
    const graph = createBaseGraph();
    expect(graph.isOrthogonal(new CellState())).toBeFalsy();
  });

  test.each([undefined, null])('Style of the CellState, orthogonal: %s', (orthogonal) => {
    const graph = createBaseGraph();
    const cellState = new CellState(graph.view, null, { orthogonal });
    expect(graph.isOrthogonal(cellState)).toBeFalsy();
  });

  describe('Default builtin styles registered', () => {
    beforeEach(() => {
      registerDefaultEdgeStyles();
    });

    test.each([
      ['EntityRelation', EdgeStyle.EntityRelation],
      ['ElbowConnector', EdgeStyle.ElbowConnector],
      ['ManhattanConnector', EdgeStyle.ManhattanConnector],
      ['OrthogonalConnector', EdgeStyle.OrthConnector],
      ['SegmentConnector', EdgeStyle.SegmentConnector],
      ['SideToSide', EdgeStyle.SideToSide],
      ['TopToBottom', EdgeStyle.TopToBottom],
    ])('Style of the CellState, edgeStyle: %s', (_name, edgeStyle) => {
      const graph = createBaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeTruthy();
    });

    test.each([
      ['custom', customEdgeStyle],
      ['Loop', EdgeStyle.Loop],
      ['null', null],
      ['undefined', undefined],
    ])('Style of the CellState, edgeStyle: %s', (_name, edgeStyle) => {
      const graph = createBaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeFalsy();
    });
  });

  test.each([
    ['custom', customEdgeStyle],
    ['EntityRelation', EdgeStyle.EntityRelation],
    ['ElbowConnector', EdgeStyle.ElbowConnector],
    ['Loop', EdgeStyle.Loop],
    ['ManhattanConnector', EdgeStyle.ManhattanConnector],
    ['OrthogonalConnector', EdgeStyle.OrthConnector],
    ['SegmentConnector', EdgeStyle.SegmentConnector],
    ['SideToSide', EdgeStyle.SideToSide],
    ['TopToBottom', EdgeStyle.TopToBottom],
    ['null', null],
    ['undefined', undefined],
  ])(
    'Default builtin styles NOT registered - Style of the CellState, edgeStyle: %s',
    (_name, edgeStyle) => {
      const graph = createBaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeFalsy();
    }
  );
});

describe('destroy', () => {
  test('calls onDestroy on registered plugins', () => {
    const onDestroyMock = jest.fn();

    class CustomPlugin implements GraphPlugin {
      static readonly pluginId = 'CustomPlugin';
      onDestroy = onDestroyMock;
    }

    const graph = createBaseGraph({
      plugins: [CustomPlugin],
    });

    graph.destroy();

    expect(onDestroyMock).toHaveBeenCalledTimes(1);
  });

  test('nulls container reference', () => {
    const graph = createBaseGraph({});
    expect(graph.container).not.toBeNull();

    graph.destroy();

    expect(graph.container).toBeNull();
  });

  test('clears eventListeners', () => {
    const graph = createBaseGraph({});
    graph.addListener('testEvent', () => {});
    expect(graph.eventListeners.length).toBeGreaterThan(0);

    graph.destroy();

    expect(graph.eventListeners).toHaveLength(0);
  });
});

describeNoGlobalStateForMixinProperties(() => createBaseGraph());

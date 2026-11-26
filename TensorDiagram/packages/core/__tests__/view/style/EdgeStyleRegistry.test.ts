/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  EdgeStyle,
  type EdgeStyleFunction,
  EdgeStyleRegistry,
  unregisterAllEdgeStyles,
} from '../../../src';

// WARNING the tests here involved global state, so they must not be run in parallel of other tests to prevent side effects
describe('registry', () => {
  // Prevents side effects between tests
  beforeEach(() => {
    unregisterAllEdgeStyles();
  });
  afterAll(() => {
    unregisterAllEdgeStyles();
  });

  const customEdgeStyle: EdgeStyleFunction = () => {
    // empty on purpose, we only need the reference to this function in the tests
  };

  test('verify registration', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle, {
      isOrthogonal: true,
      handlerKind: 'customHandler',
      allowIntermediateHandles: false,
    });

    expect(EdgeStyleRegistry.get('custom')).toBe(customEdgeStyle);
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('customHandler');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeTruthy();
    expect(EdgeStyleRegistry.allowsIntermediateHandles(customEdgeStyle)).toBeFalsy();
  });

  test.each([null, undefined])('retrieve with nullish: %s', (value) => {
    expect(EdgeStyleRegistry.get(value)).toBeNull();
    expect(EdgeStyleRegistry.getHandlerKind(value)).toEqual('default');
    expect(EdgeStyleRegistry.isOrthogonal(value)).toBeFalsy();
    expect(EdgeStyleRegistry.allowsIntermediateHandles(value)).toBeTruthy();
  });

  test('verify registration - no meta data', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle);

    expect(EdgeStyleRegistry.get('custom')).toBe(customEdgeStyle);
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('default');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeFalsy();
    expect(EdgeStyleRegistry.allowsIntermediateHandles(customEdgeStyle)).toBeTruthy();
  });

  test('clear', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle, {
      isOrthogonal: false,
      handlerKind: 'customHandler',
      allowIntermediateHandles: false,
    });
    expect(EdgeStyleRegistry.get('custom')).toBeDefined();

    EdgeStyleRegistry.clear();

    expect(EdgeStyleRegistry.get('custom')).toBeNull();
    // the edge style function is no longer registered, so returns default values
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('default');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeFalsy();
    expect(EdgeStyleRegistry.allowsIntermediateHandles(customEdgeStyle)).toBeTruthy();
  });

  describe('getName', () => {
    test('no element registered', () => {
      expect(EdgeStyleRegistry.getName(customEdgeStyle)).toBeNull();
      expect(EdgeStyleRegistry.getName(null)).toBeNull();
    });

    test('elements registered', () => {
      EdgeStyleRegistry.add('element1', EdgeStyle.OrthConnector);
      EdgeStyleRegistry.add('element2', customEdgeStyle);
      EdgeStyleRegistry.add('match', EdgeStyle.SegmentConnector);
      EdgeStyleRegistry.add('element3', EdgeStyle.ManhattanConnector);

      expect(EdgeStyleRegistry.getName(EdgeStyle.SegmentConnector)).toBe('match');
      expect(EdgeStyleRegistry.getName(null)).toBeNull();
    });
  });
});

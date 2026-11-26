/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import {
  EdgeHandlerConfig,
  HandleConfig,
  resetEdgeHandlerConfig,
  resetHandleConfig,
  resetVertexHandlerConfig,
  VertexHandlerConfig,
} from '../../../src';

test('resetEdgeHandlerConfig', () => {
  // Keep track of original default values
  const originalEdgeHandlerConfig = { ...EdgeHandlerConfig };

  // Change some values
  EdgeHandlerConfig.connectFillColor = 'red';
  EdgeHandlerConfig.selectionStrokeWidth = 4;

  resetEdgeHandlerConfig();

  // Ensure that the values have correctly been reset
  expect(EdgeHandlerConfig.connectFillColor).toBe('#0000FF');
  expect(EdgeHandlerConfig.selectionStrokeWidth).toBe(1);
  expect(EdgeHandlerConfig).toStrictEqual(originalEdgeHandlerConfig);
});

test('resetHandleConfig', () => {
  // Keep track of original default values
  const originalHandleConfig = { ...HandleConfig };

  // Change some values
  HandleConfig.labelSize = 12;
  HandleConfig.strokeColor = 'chartreuse';

  resetHandleConfig();

  // Ensure that the values have correctly been reset
  expect(HandleConfig.labelSize).toBe(4);
  expect(HandleConfig.strokeColor).toBe('black');
  expect(HandleConfig).toStrictEqual(originalHandleConfig);
});

test('resetVertexHandlerConfig', () => {
  // Keep track of original default values
  const originalVertexHandlerConfig = { ...VertexHandlerConfig };

  // Change some values
  VertexHandlerConfig.rotationEnabled = true;
  VertexHandlerConfig.selectionColor = 'chartreuse';

  resetVertexHandlerConfig();

  // Ensure that the values have correctly been reset
  expect(VertexHandlerConfig.rotationEnabled).toBe(false);
  expect(VertexHandlerConfig.selectionColor).toBe('#00FF00');
  expect(VertexHandlerConfig).toStrictEqual(originalVertexHandlerConfig);
});

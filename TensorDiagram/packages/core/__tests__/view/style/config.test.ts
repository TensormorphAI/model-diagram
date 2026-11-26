/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import {
  ManhattanConnectorConfig,
  OrthogonalConnectorConfig,
  resetManhattanConnectorConfig,
  resetOrthogonalConnectorConfig,
} from '../../../src';

test('resetOrthogonalConnectorConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...OrthogonalConnectorConfig };

  // Change some values
  OrthogonalConnectorConfig.buffer = 18;
  OrthogonalConnectorConfig.pointsFallback = false;

  resetOrthogonalConnectorConfig();

  // Ensure that the values have correctly been reset
  expect(OrthogonalConnectorConfig.buffer).toBe(10);
  expect(OrthogonalConnectorConfig.pointsFallback).toBeTruthy();
  expect(OrthogonalConnectorConfig).toStrictEqual(originalConfig);
});

describe('resetManhattanConnectorConfig', () => {
  test('simple values', () => {
    // Keep track of original default values
    const originalConfig = { ...ManhattanConnectorConfig };

    // Change some values
    ManhattanConnectorConfig.maxLoops = 100;
    ManhattanConnectorConfig.step = 60;

    resetManhattanConnectorConfig();

    // Ensure that the values have correctly been reset
    expect(ManhattanConnectorConfig.maxLoops).toBe(2000);
    expect(ManhattanConnectorConfig.step).toBe(12);
    expect(ManhattanConnectorConfig).toStrictEqual(originalConfig);
  });
  test('original direction arrays are kept untouched', () => {
    const originalEndDirections = [...ManhattanConnectorConfig.endDirections];
    const originalStartDirections = [...ManhattanConnectorConfig.startDirections];

    // Change some values
    ManhattanConnectorConfig.endDirections = ['north', 'south'];
    ManhattanConnectorConfig.startDirections.push('north', 'south');

    resetManhattanConnectorConfig();

    expect(ManhattanConnectorConfig.endDirections).toEqual(originalEndDirections);
    expect(ManhattanConnectorConfig.startDirections).toEqual(originalStartDirections);
  });
});

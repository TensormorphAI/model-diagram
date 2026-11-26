/*
Copyright 2022-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { describe, expect, test } from '@jest/globals';
import { getDefaultPlugins } from '../../../src';

describe('getDefaultPlugins', () => {
  test('returns a new array each time it is called', () => {
    const plugins1 = getDefaultPlugins();
    const plugins2 = getDefaultPlugins();
    expect(plugins1).not.toBe(plugins2);
    expect(plugins1).toEqual(plugins2);
  });

  test('returns an array with the correct length', () => {
    const plugins = getDefaultPlugins();
    // detect any changes in default plugins, order does not matter
    // This number is documented in the tree-shaking page, see the table listing what `Graph` loads in
    // packages/website/docs/usage/tree-shaking.md. Update that table when adding or removing a default plugin.
    expect(plugins).toHaveLength(9);
  });

  test('returns an array containing only functions', () => {
    const plugins = getDefaultPlugins();
    plugins.forEach((plugin) => {
      expect(typeof plugin).toBe('function');
    });
  });
});

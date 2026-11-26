/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  EdgeMarkerRegistry,
  EdgeStyleRegistry,
  PerimeterRegistry,
  registerDefaultStyleElements,
  ShapeRegistry,
  unregisterAllEdgeMarkers,
  unregisterAllEdgeStylesAndPerimeters,
  unregisterAllShapes,
} from '../../src';

const unregisterAll = (): void => {
  unregisterAllEdgeMarkers();
  unregisterAllEdgeStylesAndPerimeters();
  unregisterAllShapes();
};

beforeEach(unregisterAll);
afterEach(() => {
  unregisterAll();
  // Restore here rather than at the end of each test, so that a spy is removed even when the test throws before it.
  jest.restoreAllMocks();
});

describe('registerDefaultStyleElements', () => {
  test.each([
    ['edge marker', EdgeMarkerRegistry, 'classic'],
    ['edge style', EdgeStyleRegistry, 'orthogonalEdgeStyle'],
    ['perimeter', PerimeterRegistry, 'ellipsePerimeter'],
    ['shape', ShapeRegistry, 'ellipse'],
  ])('registers the builtin %s elements', (_name, registry, key) => {
    expect(registry.get(key)).toBeNull();

    registerDefaultStyleElements();

    expect(registry.get(key)).not.toBeNull();
  });

  // The number of builtin elements is documented in the tree-shaking page, see the table listing what `Graph` loads in
  // packages/website/docs/usage/tree-shaking.md. Update that table when adding or removing a builtin element.
  test.each([
    ['edge marker', EdgeMarkerRegistry, 9],
    ['edge style', EdgeStyleRegistry, 8],
    ['perimeter', PerimeterRegistry, 5],
    ['shape', ShapeRegistry, 16],
  ])('registers all builtin %s elements', (_name, registry, expectedCount) => {
    const addSpy = jest.spyOn(registry, 'add');

    registerDefaultStyleElements();

    expect(addSpy).toHaveBeenCalledTimes(expectedCount);
  });

  test('is idempotent', () => {
    registerDefaultStyleElements();
    const shape = ShapeRegistry.get('ellipse');

    registerDefaultStyleElements();

    expect(ShapeRegistry.get('ellipse')).toBe(shape);
  });
});

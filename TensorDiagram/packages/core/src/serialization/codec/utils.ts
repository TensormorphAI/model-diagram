/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { EdgeStyleRegistry } from '../../view/style/edge/EdgeStyleRegistry.js';
import { PerimeterRegistry } from '../../view/style/perimeter/PerimeterRegistry.js';

const registries = [EdgeStyleRegistry, PerimeterRegistry];

/**
 * @since 0.20.0
 */
export const getNameFromRegistries = (value: any) => {
  for (const registry of registries) {
    const name = registry.getName(value);
    if (name) {
      return name;
    }
  }
  return null;
};

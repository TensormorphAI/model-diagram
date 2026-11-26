/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type { Registry } from '../types.js';

/**
 * Base implementation for all registries storing "style" configuration.
 * @private
 * @since 0.20.0
 */
export class BaseRegistry<V> implements Registry<V> {
  protected readonly values = new Map<string, V>();

  add(name: string, value: V): void {
    this.values.set(name, value);
  }

  get(name: string | null | undefined): V | null {
    return this.values.get(name!) ?? null;
  }

  getName(value: V | null): string | null {
    // Currently, the code performs a linear search through all entries.
    // This implementation is straightforward and works well for small registries, but could become a performance bottleneck if the registry grows large.
    // For the current use case of style registries, this is likely acceptable since the number of registered styles is typically small.
    // If performance becomes an issue, consider maintaining a reverse lookup map.
    for (const [name, style] of this.values.entries()) {
      if (style === value) {
        return name;
      }
    }
    return null;
  }

  clear(): void {
    this.values.clear();
  }
}

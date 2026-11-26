/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type { GraphPlugin } from '../../types.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type ImageBundle from '../image/ImageBundle.js';

/**
 * A plugin that manages {@link ImageBundle} instances for the graph.
 *
 * Image bundles map keys to image URLs (or data URIs). The keys can then be referenced in any cell style
 * via {@link CellStateStyle.image}.
 *
 * {@link AbstractGraph.postProcessCellStyle} (defined in `CellsMixin`) delegates bundle key resolution to this
 * plugin: when registered, a `style.image` that matches a bundle key is replaced with the underlying
 * URL/data URI; when this plugin is NOT registered (for instance on a {@link BaseGraph} without explicit
 * opt-in), the bundle lookup is silently skipped and the raw `style.image` key is used as the image path.
 *
 * @since 0.24.0
 * @category Plugin
 */
export class ImageBundlePlugin implements GraphPlugin {
  static readonly pluginId = 'image-bundle';

  /**
   * The registered {@link ImageBundle} instances. Bundles are consulted in insertion order; the first match wins.
   * @default [] (empty array)
   */
  private imageBundles: ImageBundle[] = [];

  /**
   * Constructs the plugin that manages image bundles.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph}. Accepted to conform with the
   *   {@link GraphPluginConstructor} contract; not retained because this plugin does not interact
   *   with the graph directly.
   */
  constructor(graph: AbstractGraph) {}

  /**
   * Adds the specified {@link ImageBundle}.
   */
  addImageBundle(bundle: ImageBundle): void {
    this.imageBundles.push(bundle);
  }

  /**
   * Removes all occurrences of the specified {@link ImageBundle}.
   */
  removeImageBundle(bundle: ImageBundle): void {
    this.imageBundles = this.imageBundles.filter((b) => b !== bundle);
  }

  /**
   * Searches all {@link imageBundles} for the specified key and returns the value for the first match or
   * `null` if the key is not found.
   */
  getImageFromBundles(key: string): string | null {
    if (key) {
      for (const bundle of this.imageBundles) {
        const image = bundle.getImage(key);
        if (image) {
          return image;
        }
      }
    }
    return null;
  }

  /** Releases the registered bundles to help garbage collection. */
  onDestroy(): void {
    this.imageBundles = [];
  }
}

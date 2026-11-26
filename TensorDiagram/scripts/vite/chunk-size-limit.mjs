/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { Buffer } from 'node:buffer';

/**
 * Vite plugin that fails the build when an emitted chunk is larger than `limitInKB`.
 *
 * `build.chunkSizeWarningLimit` is warn only: Vite passes it to its native reporter, which logs the oversized chunks
 * and lets the build exit 0. A bundle regression then produces a single line in a CI log that nobody reads. See
 * https://github.com/vitejs/vite/issues/18496 for the upstream feature request.
 *
 * Pass the same value to `build.chunkSizeWarningLimit` and to this plugin, so the two thresholds cannot be set to
 * different values. Sizes are computed in kB (1000 bytes) from the generated code, which matches what
 * `scripts/build-all-examples.bash` prints.
 *
 * @param {number} limitInKB the maximum size, in kB, allowed for a single chunk.
 * @returns {import('vite').Plugin} the plugin to add to the `plugins` of a Vite configuration.
 */
export function failOnChunkSizeExceeded(limitInKB) {
  return {
    name: 'tensordiagram:fail-on-chunk-size-exceeded',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }
        const sizeInKB = Buffer.byteLength(output.code) / 1000;
        if (sizeInKB > limitInKB) {
          this.error(
            `Chunk "${fileName}" is ${sizeInKB.toFixed(2)} kB, above the ${limitInKB} kB limit.`
          );
        }
      }
    },
  };
}

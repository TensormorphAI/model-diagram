/*
Copyright (c) Tensormorph. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, posix, sep } from 'node:path';

/**
 * Same behavior as Vite's `normalizePath`, on node builtins only.
 *
 * Importing it from 'vite' works, but 'vite' is a dependency of each example package and not of the repository root, so
 * resolving it from here relies on the bundled configuration being written to the example's `node_modules/.vite-temp`
 * directory, and rolldown reports UNRESOLVED_IMPORT on every build.
 *
 * Backslashes are converted only on Windows, where they are the path separator, because a backslash is a legal
 * character in a POSIX file name.
 */
function normalizePath(id) {
  return posix.normalize(sep === '\\' ? id.replaceAll('\\', '/') : id);
}

// Vite resolves symlinks to their real path, so the module ids of @tensordiagram/core point to the workspace directory
// instead of node_modules. Matching the resolved package directory keeps the chunk correct in both setups.
// Both sides are normalized because realpathSync returns native separators on Windows, and the trailing separator
// prevents matching a sibling directory whose name merely starts with 'core'.
const tensordiagramCoreDirectory = `${normalizePath(
  realpathSync(
    dirname(createRequire(import.meta.url).resolve('@tensordiagram/core/package.json'))
  )
)}/`;

/**
 * Code splitting that puts the @tensordiagram/core code in a dedicated 'tensordiagram' chunk. It makes the size that TensorDiagram
 * takes in an external application visible, and shows whether tree shaking works.
 *
 * @returns {{ groups: Array<{ name: string, test: (moduleId: string) => boolean }> }} the value to set on
 * `build.rolldownOptions.output.codeSplitting` of a Vite configuration.
 */
export function tensordiagramCodeSplitting() {
  return {
    groups: [
      {
        name: 'tensordiagram',
        test: (moduleId) => normalizePath(moduleId).startsWith(tensordiagramCoreDirectory),
      },
    ],
  };
}

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { defineConfig } from 'vite';

import { bundleAnalysisOrSizeLimit } from '../../scripts/vite/bundle-analysis.mjs';
import { tensordiagramCodeSplitting } from '../../scripts/vite/tensordiagram-chunk.mjs';

// The maximum size of the tensordiagram chunk, in kB. Declared once and passed to both the Vite warning and the blocking
// check, so they cannot drift apart.
const chunkSizeLimitInKB = 427;

export default defineConfig(({ mode }) => {
  // The analysis only runs when explicitly asked for, see 'build:analyze' and the documentation of the helper
  const { plugins, sourcemap } = bundleAnalysisOrSizeLimit(mode, chunkSizeLimitInKB);

  return {
    plugins,
    build: {
      sourcemap,
      rolldownOptions: {
        output: {
          codeSplitting: tensordiagramCodeSplitting(),
        },
      },
      chunkSizeWarningLimit: chunkSizeLimitInKB,
    },
  };
});

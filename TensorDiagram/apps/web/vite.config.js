import { defineConfig } from 'vite';

import { bundleAnalysisOrSizeLimit } from '../../scripts/vite/bundle-analysis.mjs';
import { tensordiagramCodeSplitting } from '../../scripts/vite/tensordiagram-chunk.mjs';

// The maximum size of the tensordiagram chunk, in kB, see .claude/rules/tooling/bundle-size-budgets.md
const chunkSizeLimitInKB = 548;

export default defineConfig(({ mode }) => {
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
    preview: { port: 4173, strictPort: true },
  };
});

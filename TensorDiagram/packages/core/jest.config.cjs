/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

// The type provided here could provide more guidance if it included types from @swc/jest
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageReporters: ['lcov', 'text-summary'],
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'jsdom', // need to access to the browser objects
  // Destroys the graphs built by the helpers of __tests__/utils.ts after each test, see that file for why
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
          },
          target: 'es2020',
        },
      },
    ],
  },
  // TensorDiagram imports include a "js" extension which makes jest unable to resolve the imports
  // So use this workaround to remove the ".js" extension from the module names
  // Taken from https://github.com/swc-project/jest/issues/64#issuecomment-1029753225
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

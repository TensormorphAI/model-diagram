/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'jsdom', // need to access to the browser objects
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
};

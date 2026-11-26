/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach } from '@jest/globals';
import { destroyCreatedGraphs } from './utils';

// Runs before every test file, see `setupFilesAfterEnv` in jest.config.cjs. Tearing the graphs down here rather than in
// each file means a test never inherits the graphs of the ones that ran before it.
//
// This assumes the tests of a file run one after the other, which is what Jest does unless a test opts out with
// `test.concurrent`. The registry this hook drains is module state shared by the whole file, so with concurrent tests
// it would destroy a graph another test is still using. Running test *files* in parallel is fine, each worker gets its
// own module registry and its own jsdom, so the `--runInBand` of the `test` script in package.json is not what keeps
// this correct: it was added for the cost of running `tsc` in every worker back when the suite used `ts-jest`, and
// dropping it would not break the teardown. See .claude/rules/testing/conventions.md.
afterEach(destroyCreatedGraphs);

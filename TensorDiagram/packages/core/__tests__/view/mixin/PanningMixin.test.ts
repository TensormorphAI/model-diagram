/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';

test('The "PanningHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  graph.setPanning(true);
});

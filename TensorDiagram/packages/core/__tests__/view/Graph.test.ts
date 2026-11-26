/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { test } from '@jest/globals';
import { createGraphWithoutContainer, createGraphWithoutPlugins } from '../utils';
import { describeNoGlobalStateForMixinProperties } from './no-global-state-for-mixin-properties';

test('setTooltips - the "TooltipHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  // just validate there is no error in this case
  graph.setTooltips(true);
});

describeNoGlobalStateForMixinProperties(() => createGraphWithoutContainer());

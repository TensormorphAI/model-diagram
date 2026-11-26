/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Cell, CellState, TooltipHandler } from '../../../src';

// ensure that no error occurs in this case
test('Call getTooltip when the "SelectionCellsHandler" plugin is not available', () => {
  const tooltipHandler = new TooltipHandler(createGraphWithoutPlugins());
  // just validate there is no error in this case
  tooltipHandler.getTooltip(new CellState(null, new Cell()), null!, 0, 0);
});

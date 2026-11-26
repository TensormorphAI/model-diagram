/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  CellState,
  constants,
  Graph,
  InternalEvent,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';

const version = constants.VERSION;

// Creates the graph inside the given container
const container = document.getElementById('graph-container')!;
// Disables the built-in context menu
InternalEvent.disableContextMenu(container);

const graph = new Graph(container);
graph.setPanning(true); // Use mouse right button for panning

const rubberBandHandler = graph.getPlugin<RubberBandHandler>('RubberBandHandler');
if (rubberBandHandler) {
  rubberBandHandler.defaultOpacity = 50;
  rubberBandHandler.fadeOut = true;
}

// call methods and properties defined in mixins to ensure that interface augmentation is correctly defined
graph.getAllConnectionConstraints(new CellState(), true);
graph.cellsEditable = false;
graph.getFoldingImage(new CellState());

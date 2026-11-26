/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { type Cell, Graph } from '@tensormorph/tensordiagramcore';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Misc/Thread',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
This example shows how to dynamically set overlays on graph cells using a timed function.
<br>
The overlay alternates between two cells at regular intervals, and a tooltip appears when hovering over the overlay.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  // Displays the tooltip of the overlay
  graph.setTooltips(true);
  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();
  let v1: Cell;
  let v2: Cell;

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
    });
    v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
    });
    graph.insertEdge({ parent, source: v1, target: v2 });
  });

  // Function to switch the overlay periodically
  const switchOverlay = () => {
    const overlays = graph.getCellOverlays(v1);

    if (overlays.length == 0) {
      graph.removeCellOverlays(v2);
      graph.setCellWarning(v1, '<b>Warning on Cell 1</b>');
    } else {
      graph.removeCellOverlays(v1);
      graph.setCellWarning(v2, '<b>Warning on Cell 2</b>');
    }
  };

  window.setInterval(switchOverlay, 7_000);
  switchOverlay();

  return div;
};

export const Default = Template.bind({});

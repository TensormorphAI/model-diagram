/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { Graph } from '@tensormorph/tensordiagramcore';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Labels/LabelPosition',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Defines the common part of all cell styles as a string-prefix
  const prefix = { shape: 'image', image: 'images/icons48/keys.png' };

  // Adds cells to the model in a single step and set the vertex
  // label positions using the label position styles. Vertical
  // and horizontal label position styles can be combined.
  // Note: Alternatively, vertex labels can be set be overriding
  // CellRenderer.getLabelBounds.
  graph.batchUpdate(() => {
    graph.insertVertex(parent, null, 'Bottom', 60, 60, 60, 60, {
      ...prefix,
      verticalLabelPosition: 'bottom',
      verticalAlign: 'top',
    });
    graph.insertVertex(parent, null, 'Top', 140, 60, 60, 60, {
      ...prefix,
      verticalLabelPosition: 'top',
      verticalAlign: 'bottom',
    });
    graph.insertVertex(parent, null, 'Left', 60, 160, 60, 60, {
      ...prefix,
      labelPosition: 'left',
      align: 'right',
    });
    graph.insertVertex(parent, null, 'Right', 140, 160, 60, 60, {
      ...prefix,
      labelPosition: 'right',
      align: 'left',
    });
  });

  return container;
};

export const Default = Template.bind({});

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  getDefaultPlugins,
  Graph,
  InternalEvent,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'Basic/HelloWorld',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...contextMenuValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);

  // Add cells to the model in a single step
  graph.batchUpdate(() => {
    const vertex1 = graph.insertVertex({
      value: 'Hello',
      position: [20, 20],
      size: [80, 30],
      relative: false,
    });

    const vertex2 = graph.insertVertex({
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      relative: false,
    });

    graph.insertEdge({
      source: vertex1,
      target: vertex2,
    });
  });

  return container;
};

export const Default = Template.bind({});

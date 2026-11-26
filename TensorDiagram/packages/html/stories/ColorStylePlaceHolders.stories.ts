/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { Graph } from '@tensormorph/tensordiagramcore';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Styles/ColorStylePlaceHolders',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables global features
  graph.cellsSelectable = false;
  graph.cellsLocked = true;

  // Sets global styles
  const defaultVertexStyle = graph.getStylesheet().getDefaultVertexStyle();
  defaultVertexStyle.foldable = false;

  graph.getStylesheet().putCellStyle('swimlane', {
    shape: 'swimlane',
    startSize: 30,
    fillColor: '#ffffff',
    strokeColor: 'red',
    swimlaneLine: true,
    swimlaneFillColor: '#ffffff',
  });

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const swimlane = graph.insertVertex(parent, null, 'swimlane', 0, 0, 640, 400, {
      baseStyleNames: ['swimlane'],
    });

    const parentInSwimlane = graph.insertVertex({
      parent: swimlane,
      value: 'Parent in swimlane',
      position: [20, 80],
      size: [400, 230],
      style: { fillColor: '#e8dbdb', strokeColor: 'black' },
    });

    graph.insertVertex({
      parent: parentInSwimlane,
      value: 'child with none stroke color',
      position: [10, 10],
      size: [180, 30],
      style: { strokeColor: 'none' },
    });

    graph.insertVertex({
      parent: parentInSwimlane,
      value: 'child with swimlane stroke color',
      position: [205, 60],
      size: [180, 30],
      style: { strokeColor: 'swimlane' },
    });
    graph.insertVertex({
      parent: parentInSwimlane,
      value: 'child with swimlane fill color',
      position: [10, 60],
      size: [180, 30],
      style: { fillColor: 'swimlane' },
    });

    graph.insertVertex({
      parent: parentInSwimlane,
      value: 'child with inherit stroke color',
      position: [10, 160],
      size: [180, 30],
      style: { strokeColor: 'inherit' },
    });
    graph.insertVertex({
      parent: parentInSwimlane,
      value: 'child with inherit fill color',
      position: [205, 160],
      size: [180, 30],
      style: { fillColor: 'inherit' },
    });

    graph.insertVertex({
      // parent: swimlane,
      value: 'vertex with none fill color',
      position: [10, 410],
      size: [180, 30],
      style: { fillColor: 'none' },
    });
  });

  return container;
};

export const Default = Template.bind({});

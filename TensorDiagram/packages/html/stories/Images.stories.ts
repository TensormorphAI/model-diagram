/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  Graph,
  cloneUtils,
  ImageBox,
  Rectangle,
  CellStateStyle,
} from '@tensormorph/tensordiagramcore';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Icon_Images/Images',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const container = createGraphContainer(args);
  container.style.background = ''; // no grid

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Sets a background image and restricts child movement to its bounds
  graph.setBackgroundImage(new ImageBox('images/gradient_background.jpg', 360, 200));
  graph.maximumGraphBounds = new Rectangle(0, 0, 360, 200);

  // Resizes the container but never make it bigger than the background
  graph.minimumContainerSize = new Rectangle(0, 0, 360, 200);
  graph.setResizeContainer(true);

  // Disables basic selection and cell handling
  // graph.setEnabled(false);
  configureStylesheet(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 20, 10, 80, 100, {
      baseStyleNames: ['bottom'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 130, 10, 80, 100, {
      baseStyleNames: ['top'],
    });
    graph.insertVertex(parent, null, '', 230, 10, 100, 100, {
      baseStyleNames: ['image'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 20, 130, 140, 60, {
      baseStyleNames: ['right'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 180, 130, 140, 60, {
      baseStyleNames: ['left'],
    });
  });

  function configureStylesheet(graph: Graph) {
    let style: CellStateStyle = {};
    style.shape = 'image';
    style.image = 'images/icons48/keys.png';
    style.fontColor = '#FFFFFF';
    graph.getStylesheet().putCellStyle('image', style);

    style = cloneUtils.clone(style);
    style.shape = 'label';
    style.strokeColor = '#000000';
    style.align = 'center';
    style.verticalAlign = 'top';
    style.imageAlign = 'center';
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    // style.imageVerticalAlign = 'top';
    style.image = 'images/icons48/gear.png';
    style.imageWidth = 48;
    style.imageHeight = 48;
    style.spacingTop = 56;
    style.spacing = 8;
    graph.getStylesheet().putCellStyle('bottom', style);

    style = cloneUtils.clone(style);
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    // style.imageVerticalAlign = 'bottom';
    style.image = 'images/icons48/server.png';
    delete style.spacingTop;
    graph.getStylesheet().putCellStyle('top', style);

    style = cloneUtils.clone(style);
    style.align = 'left';
    style.verticalAlign = 'middle';
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    // style.imageVerticalAlign = 'middle';
    style.image = 'images/icons48/earth.png';
    style.spacingLeft = 55;
    style.spacing = 4;
    graph.getStylesheet().putCellStyle('right', style);

    style = cloneUtils.clone(style);
    style.align = 'right';
    style.imageAlign = 'right';
    delete style.spacingLeft;
    style.spacingRight = 55;
    graph.getStylesheet().putCellStyle('left', style);
  }

  return container;
};

export const Default = Template.bind({});

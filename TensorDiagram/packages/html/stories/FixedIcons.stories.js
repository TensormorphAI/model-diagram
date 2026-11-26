/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  Graph,
  RubberBandHandler,
  Rectangle,
  LabelShape,
  StyleDefaultsConfig,
} from '@tensormorph/tensordiagramcore';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'Icon_Images/FixedIcons',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Overrides the image bounds code to change the position
  LabelShape.prototype.getImageBounds = function (x, y, w, h) {
    const iw = this.style.imageWidth ?? StyleDefaultsConfig.imageSize;
    const ih = this.style.imageHeight ?? StyleDefaultsConfig.imageSize;

    // Places the icon
    const ix = (w - iw) / 2;
    const iy = h - ih;

    return new Rectangle(x + ix, y + iy, iw, ih);
  };

  // Makes the shadow brighter
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Fixed icon', 20, 20, 80, 50, {
      shape: 'label',
      image: 'images/plus.png',
      imageWidth: 16,
      imageHeight: 16,
      spacingBottom: 10,
      fillColor: '#adc5ff',
      gradientColor: '#7d85df',
      glass: true,
      rounded: true,
      shadow: true,
    });
  });

  return container;
};

export const Default = Template.bind({});

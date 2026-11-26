/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  type Cell,
  type CellStyle,
  Graph,
  Rectangle,
} from '@tensormorph/tensordiagramcore';

import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Layouts/Collapse',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  const graph = new Graph(container);
  const parent = graph.getDefaultParent();

  // Extends Cell.getStyle to show an image when collapsed
  const getStyle = function (this: Cell): CellStyle {
    if (!this.isCollapsed()) {
      return this.style;
    }
    return {
      // Need to create a copy the original style as we don't want to change the original style stored in the Cell
      // Otherwise, when expanding the cell, the style will be incorrect
      ...this.style,
      shape: 'image',
      image: './images/package.png',
      noLabel: true,
      imageBackground: '#e7e9ef',
      imageBorder: '#6482B9',
    };
  };

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Container',
      position: [20, 20],
      size: [200, 200],
      style: { shape: 'swimlane', startSize: 20 },
    });
    v1.geometry!.alternateBounds = new Rectangle(0, 0, 110, 70);
    v1.getStyle = getStyle;

    const v11 = graph.insertVertex({
      parent: v1,
      value: 'Hello,',
      position: [10, 40],
      size: [120, 80],
    });
    v11.getStyle = getStyle;
  });

  return container;
};

export const Default = Template.bind({});

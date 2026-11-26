/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { type CellStyle, Graph, Point } from '@tensormorph/tensordiagramcore';

import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// required by the custom code (see the end of the Story)
import './css/animation.css';

export default {
  title: 'Effects/Animation',
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
  graph.setEnabled(false);
  const parent = graph.getDefaultParent();

  const vertexStyle: CellStyle = {
    shape: 'cylinder',
    strokeWidth: 2,
    fillColor: '#ffffff',
    strokeColor: 'black',
    gradientColor: '#a0a0a0',
    fontColor: 'black',
    fontStyle: 1,
    spacingTop: 14,
  };

  let e1;
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Pump',
      position: [20, 20],
      size: [60, 60],
      style: vertexStyle,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Tank',
      position: [200, 150],
      size: [60, 60],
      style: vertexStyle,
    });
    e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
      style: {
        strokeWidth: 3,
        endArrow: 'block',
        endSize: 2,
        endFill: true,
        strokeColor: 'black',
        rounded: true,
      },
    });
    e1.geometry && (e1.geometry.points = [new Point(230, 50)]);
    graph.orderCells(true, [e1]);
  });

  // Adds animation to edge shape and makes "pipe" visible
  const state = graph.view.getState(e1!);
  state?.shape?.node.getElementsByTagName('path')[0].removeAttribute('visibility');
  state?.shape?.node.getElementsByTagName('path')[0].setAttribute('stroke-width', '6');
  state?.shape?.node.getElementsByTagName('path')[0].setAttribute('stroke', 'lightGray');
  state?.shape?.node.getElementsByTagName('path')[1].setAttribute('class', 'flow');

  return container;
};

export const Default = Template.bind({});

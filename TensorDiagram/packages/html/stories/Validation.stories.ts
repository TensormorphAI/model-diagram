/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  Graph,
  RubberBandHandler,
  xmlUtils,
  Multiplicity,
  KeyHandler,
  InternalEvent,
  getDefaultPlugins,
} from '@tensormorph/tensordiagramcore';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';
// style required by RubberBand
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'Misc/Validation',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
  This example demonstrates using multiplicities for automatically validating a graph. 
  The graph is validated after each change and displays an error message if the graph is not valid.
  <br>You can also remove cells by selecting them and pressing the [DELETE] key.
  `);

  const container = createGraphContainer(args, { captureKeystrokes: true });
  div.appendChild(container);

  const xmlDocument = xmlUtils.createXmlDocument();
  const sourceNode = xmlDocument.createElement('Source');
  const targetNode = xmlDocument.createElement('Target');
  const subtargetNode = xmlDocument.createElement('Subtarget');

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);
  graph.setConnectable(true);
  graph.setTooltips(true);
  graph.setAllowDanglingEdges(false);
  graph.setMultigraph(false);

  // Source node needs 1..2 connected Targets
  graph.multiplicities.push(
    new Multiplicity(
      true,
      'Source',
      null,
      null,
      1,
      2,
      ['Target'],
      'Source Must Have 1 or 2 Targets',
      'Source Must Connect to Target'
    )
  );

  // Source node does not want any incoming connections
  graph.multiplicities.push(
    new Multiplicity(
      false,
      'Source',
      null,
      null,
      0,
      0,
      null,
      'Source Must Have No Incoming Edge',
      null
    )
  ); // Type does not matter

  // Target needs exactly one incoming connection from Source
  graph.multiplicities.push(
    new Multiplicity(
      false,
      'Target',
      null,
      null,
      1,
      1,
      ['Source'],
      'Target Must Have 1 Source',
      'Target Must Connect From Source'
    )
  );

  // Removes cells when [DELETE] is pressed
  const keyHandler = new KeyHandler(graph);
  keyHandler.bindKey(46, function () {
    if (graph.isEnabled()) {
      graph.removeCells();
    }
  });

  // Installs automatic validation (use editor.validation = true if you are using an Editor instance)
  const listener = function () {
    graph.validateGraph();
  };
  graph.getDataModel().addListener(InternalEvent.CHANGE, listener);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      value: sourceNode,
      x: 20,
      y: 20,
      width: 80,
      height: 30,
    });
    const v2 = graph.insertVertex({
      value: targetNode,
      x: 200,
      y: 20,
      width: 80,
      height: 30,
    });
    const v3 = graph.insertVertex({
      value: targetNode.cloneNode(true),
      position: [200, 80],
      size: [80, 30],
    });
    const v4 = graph.insertVertex({
      value: targetNode.cloneNode(true),
      x: 200,
      y: 140,
      width: 80,
      height: 30,
    });
    graph.insertVertex({
      value: subtargetNode,
      x: 200,
      y: 200,
      width: 80,
      height: 30,
    });
    const v6 = graph.insertVertex({
      value: sourceNode.cloneNode(true),
      x: 20,
      y: 140,
      width: 80,
      height: 30,
    });
    graph.insertEdge({ source: v1, target: v2 });
    graph.insertEdge({ source: v1, target: v3 });
    graph.insertEdge({ source: v6, target: v4 });
  });

  return div;
};

export const Default = Template.bind({});

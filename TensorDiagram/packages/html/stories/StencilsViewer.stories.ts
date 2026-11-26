/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  BaseGraph,
  DomHelpers,
  FitPlugin,
  InternalEvent,
  PanningHandler,
  StencilShape,
  StencilShapeRegistry,
  xmlUtils,
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
import { isElement } from './shared/utils.ts';
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'Shapes/StencilsViewer',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
  },
};

// In the future, it will be possible to edit the stencil in a textarea provided by the story.
// The design could be similar to the screenshot provided in https://github.com/TensorDiagram/TensorDiagram/issues/786
// The XML content could be validated against the XSD schema (stencils.xsd), and the user could be notified if there are any errors.

const stencil = `<!-- Taken from https://github.com/TensorDiagram/TensorDiagram/issues/786 to demonstrate usage of "arc" -->
  <shape aspect="fixed" h="100" name="WebServerUrlInfo" strokewidth="inherit" w="100">
    <connections />
    <foreground>
      <ellipse h="100" w="100" x="0" y="0" />
      <fillstroke />
      <path />
      <fillstroke />
      <path>
        <move x="50" y="0" />
        <line x="50" y="100" />
        <move x="100" y="50" />
        <line x="0" y="50" />
        <move x="50" y="0" />
        <arc large-arc-flag="0" rx="60" ry="60" sweep-flag="1" x="50" x-axis-rotation="0" y="100" />
        <arc large-arc-flag="0" rx="60" ry="60" sweep-flag="1" x="50" x-axis-rotation="0" y="0" />
        <close />
        <move x="15" y="85" />
        <arc large-arc-flag="0" rx="60" ry="60" sweep-flag="1" x="85" x-axis-rotation="0" y="85" />
        <move x="15" y="15" />
        <arc large-arc-flag="0" rx="60" ry="60" sweep-flag="0" x="85" x-axis-rotation="0" y="15" />
      </path>
      <stroke />
    </foreground>
  </shape>`;

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Loads the stencils into the registry
  const doc = xmlUtils.parseXml(stencil);
  // For a more robust solution, ensure the first node is named "shape"
  const shape = doc.documentElement;

  if (isElement(shape)) {
    const name = shape.getAttribute('name')!; // the "name" attribute is always set
    StencilShapeRegistry.add(name, new StencilShape(shape));
  }

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new BaseGraph({ container, plugins: [FitPlugin, PanningHandler] });
  graph.setPanning(true);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    graph.insertVertex({
      position: [200, 20],
      size: [200, 200],
      style: {
        shape: 'WebServerUrlInfo', // for a more robust solution, use the "name" attribute
      },
    });
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Fit Center', function () {
      graph.getPlugin<FitPlugin>('fit')?.fitCenter();
    })
  );

  for (let i = 0; i < 4; i++) {
    buttons.appendChild(document.createTextNode('\u00a0'));
  }

  buttons.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );
  buttons.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});

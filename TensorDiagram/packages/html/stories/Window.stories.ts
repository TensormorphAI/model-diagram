/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  Graph,
  MaxWindow,
  KeyHandler,
  RubberBandHandler,
  InternalEvent,
  MaxLog,
  domUtils,
  GlobalConfig,
  MaxLogAsLogger,
  getDefaultPlugins,
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
import '@tensormorph/tensordiagramcore/css/common.css'; // style required by RubberBand and MaxWindow/MaxLog

export default {
  title: 'Windows/Windows',
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

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args, { captureKeystrokes: true });

  GlobalConfig.logger = new MaxLogAsLogger();
  GlobalConfig.logger.info('Starting the Window story...');

  // Note that we're using the container scrollbars for the graph so that the
  // container extends to the parent div inside the window
  let wnd = new MaxWindow(
    'Scrollable, resizable, given height',
    container,
    50,
    50,
    220,
    224,
    true,
    true
  );

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);

  graph.setTooltips(true);
  graph.setPanning(true);

  // No key is bound, this instance is still needed: KeyHandler is what calls graph.escape() when Escape is pressed,
  // which cancels a move, a resize or a bend in progress. Escape during label editing is handled by the cell editor, without it.
  new KeyHandler(graph);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    graph.insertEdge(parent, null, '', v1, v2);
  });

  wnd.setMaximizable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);
  wnd.setClosable(true);

  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipisici elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ';
  let content = document.createElement('div');
  domUtils.write(content, lorem + lorem + lorem);

  wnd = new MaxWindow(
    'Scrollable, resizable, auto height',
    content,
    300,
    50,
    200,
    null,
    true,
    true
  );
  wnd.setMaximizable(true);
  wnd.setScrollable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);
  wnd.setClosable(true);

  content = content.cloneNode(true) as HTMLDivElement;
  content.style.width = '400px';

  wnd = new MaxWindow(
    'Scrollable, resizable, fixed content',
    content,
    520,
    50,
    220,
    200,
    true,
    true
  );
  wnd.setMaximizable(true);
  wnd.setScrollable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);
  wnd.setClosable(true);

  MaxLog.show();
  GlobalConfig.logger.info('MaxLog show done!');

  return container;
};

export const Default = Template.bind({});

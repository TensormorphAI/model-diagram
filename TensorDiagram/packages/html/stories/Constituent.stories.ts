/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  type Cell,
  CellEditorHandler,
  type CellStateStyle,
  ConnectionHandler,
  Graph,
  InternalEvent,
  InternalMouseEvent,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@tensormorph/tensordiagramcore';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Layouts/Constituent',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const isNullish = (v: any): v is null | undefined => v === null || v === undefined;

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(
    `This example demonstrates using cells as parts of other cells.`
  );

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  class MyCustomSelectionHandler extends SelectionHandler {
    /**
     * Redirects start drag to parent.
     */
    override getInitialCellForEvent(me: InternalMouseEvent) {
      let cell = super.getInitialCellForEvent(me);
      if ((this.graph as MyCustomGraph).isPart(cell)) {
        cell = cell?.getParent() ?? null;
      }
      return cell;
    }
  }

  type CustomCellStateStyle = CellStateStyle & {
    constituent: boolean;
  };

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement) {
      super(container, undefined, [
        // part of getDefaultPlugins
        CellEditorHandler,
        SelectionCellsHandler,
        ConnectionHandler,
        MyCustomSelectionHandler, // replaces SelectionHandler
        // additional plugin for rubber band selection
        RubberBandHandler,
      ]);
      this.options.foldingEnabled = false;
      this.recursiveResize = true;
    }

    // Helper method to mark parts with constituent in the Cell style
    isPart(cell: Cell | null): boolean {
      return (
        !isNullish(cell) &&
        (this.getCurrentCellStyle(cell) as CustomCellStateStyle).constituent
      );
    }

    // Redirects selection to parent
    override selectCellForEvent = (cell: Cell, evt: MouseEvent) => {
      if (this.isPart(cell)) {
        const parent = cell.getParent();
        !isNullish(parent) && (cell = parent);
      }
      super.selectCellForEvent(cell, evt);
    };
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent: graph.getDefaultParent(),
      position: [20, 20],
      size: [120, 70],
    });
    graph.insertVertex({
      parent: v1,
      value: 'Constituent',
      position: [20, 20],
      size: [80, 30],
      style: {
        constituent: true,
      } as CustomCellStateStyle,
    });
  });

  return div;
};

export const Default = Template.bind({});

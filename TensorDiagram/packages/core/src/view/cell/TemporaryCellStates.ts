/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import Rectangle from '../geometry/Rectangle.js';
import type GraphView from '../GraphView.js';
import type Cell from './Cell.js';
import type CellState from './CellState.js';
import type Shape from '../shape/Shape.js';

/**
 * Creates a temporary set of cell states.
 */
class TemporaryCellStates {
  oldValidateCellState: (cell: Cell | null, recurse?: boolean) => CellState | null;

  oldDoRedrawShape: (state: CellState) => void;

  view: GraphView;

  /**
   * Holds the states of the rectangle.
   */
  oldStates: Map<Cell, CellState>;

  /**
   * Holds the bounds of the rectangle.
   */
  oldBounds: Rectangle;

  /**
   * Holds the scale of the rectangle.
   */
  oldScale: number;

  constructor(
    view: GraphView,
    scale = 1,
    cells: Cell[],
    isCellVisibleFn: Function | null = null,
    getLinkForCellState: Function | null = null
  ) {
    this.view = view;

    // Stores the previous state
    this.oldValidateCellState = view.validateCellState;
    this.oldBounds = view.getGraphBounds();
    this.oldStates = view.getStates();
    this.oldScale = view.getScale();
    this.oldDoRedrawShape = view.graph.cellRenderer.doRedrawShape;

    // Overrides doRedrawShape and paint shape to add links on shapes
    if (getLinkForCellState != null) {
      view.graph.cellRenderer.doRedrawShape = (state: CellState) => {
        const shape = <Shape>state?.shape;
        const oldPaint = shape.paint;

        shape.paint = (c) => {
          const link = getLinkForCellState(state);
          if (link != null) {
            c.setLink(link);
          }
          oldPaint.apply(shape, [c]);
          if (link != null) {
            c.setLink(null);
          }
        };

        this.oldDoRedrawShape.apply(view.graph.cellRenderer, [state]);
        shape.paint = oldPaint;
      };
    }

    // Overrides validateCellState to ignore invisible cells
    view.validateCellState = (cell, recurse) => {
      if (cell == null || isCellVisibleFn == null || isCellVisibleFn(cell)) {
        return this.oldValidateCellState.apply(view, [cell, recurse]);
      }
      return null;
    };

    // Creates space for new states
    view.setStates(new Map());
    view.setScale(scale);

    view.resetValidationState();
    let bbox = null;

    // Validates the vertices and edges without adding them to
    // the model so that the original cells are not modified
    for (const cell of cells) {
      const bounds = view.getBoundingBox(
        view.validateCellState(<Cell>view.validateCell(<Cell>cell))
      );
      if (bbox == null) {
        bbox = bounds;
      } else {
        bbox.add(<Rectangle>bounds);
      }
    }
    view.setGraphBounds(bbox || new Rectangle());
  }

  destroy(): void {
    const view = this.view;
    view.setScale(this.oldScale);
    view.setStates(this.oldStates);
    view.setGraphBounds(this.oldBounds);
    view.validateCellState = this.oldValidateCellState;
    view.graph.cellRenderer.doRedrawShape = this.oldDoRedrawShape;
  }
}

export default TemporaryCellStates;

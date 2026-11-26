/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import CellMarker from './CellMarker.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type Cell from './Cell.js';
import EventSource from '../event/EventSource.js';
import type { ColorValue, MouseListenerSet } from '../../types.js';

/**
 * Event handler that highlights cells
 *
 * ```javascript
 * new CellTracker(graph, '#00FF00');
 * ```
 *
 * For detecting `dragEnter`, `dragOver` and `dragLeave` on cells, the following code can be used:
 * ```javascript
 * graph.addMouseListener(
 * {
 *   cell: null,
 *   mouseDown: function(sender, me) {},
 *   mouseMove: function(sender, me) {
 *     const tmp = me.getCell();
 *
 *     if (tmp != this.cell) {
 *       if (this.cell) {
 *         this.dragLeave(me.getEvent(), this.cell);
 *       }
 *
 *       this.cell = tmp;
 *       if (this.cell) {
 *         this.dragEnter(me.getEvent(), this.cell);
 *       }
 *     }
 *
 *     if (this.cell) {
 *       this.dragOver(me.getEvent(), this.cell);
 *     }
 *   },
 *   mouseUp: function(sender, me) {},
 *   dragEnter: function(evt, cell) {
 *     GlobalConfig.logger.debug('dragEnter', cell.value);
 *   },
 *   dragOver: function(evt, cell) {
 *     GlobalConfig.logger.debug('dragOver', cell.value);
 *   },
 *   dragLeave: function(evt, cell) {
 *     GlobalConfig.logger.debug('dragLeave', cell.value);
 *   }
 * });
 * ```
 */
class CellTracker extends CellMarker implements MouseListenerSet {
  constructor(
    graph: AbstractGraph,
    color: ColorValue,
    funct: ((me: InternalMouseEvent) => Cell) | null = null
  ) {
    super(graph, color);

    this.graph.addMouseListener(this);

    if (funct) {
      this.getCell = funct;
    }
  }

  destroyed = false;

  /**
   * Ignores the event. The event is not consumed.
   */
  mouseDown() {
    return;
  }

  /**
   * Handles the event by highlighting the cell under the mouse pointer if it is over the hotspot region of the cell.
   */
  mouseMove(_sender: EventSource, me: InternalMouseEvent) {
    if (this.isEnabled()) {
      this.process(me);
    }
  }

  /**
   * Handles the event by resetting the highlight.
   */
  mouseUp() {
    // do nothing
  }

  /**
   * Destroys the object and all its resources and DOM nodes. This doesn't normally need to be called.
   * It is called automatically when the window unloads.
   */
  override destroy() {
    if (!this.destroyed) {
      this.destroyed = true;

      this.graph.removeMouseListener(this);
      super.destroy();
    }
  }
}

export default CellTracker;

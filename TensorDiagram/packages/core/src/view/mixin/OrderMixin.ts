/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { sortCells } from '../../util/styleUtils.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type Cell from '../cell/Cell.js';

type PartialGraph = Pick<
  AbstractGraph,
  'fireEvent' | 'batchUpdate' | 'getDataModel' | 'getSelectionCells'
>;
type PartialOrder = Pick<AbstractGraph, 'orderCells' | 'cellsOrdered'>;
type PartialType = PartialGraph & PartialOrder;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const OrderMixin: PartialType = {
  orderCells(back = false, cells) {
    if (!cells) cells = this.getSelectionCells();
    if (!cells) {
      cells = sortCells(this.getSelectionCells(), true);
    }

    this.batchUpdate(() => {
      this.cellsOrdered(<Cell[]>cells, back);
      const event = new EventObject(
        InternalEvent.ORDER_CELLS,
        'back',
        back,
        'cells',
        cells
      );
      this.fireEvent(event);
    });

    return cells;
  },

  cellsOrdered(cells, back = false) {
    this.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const parent = cells[i].getParent();

        if (back) {
          this.getDataModel().add(parent, cells[i], i);
        } else {
          this.getDataModel().add(
            parent,
            cells[i],
            parent ? parent.getChildCount() - 1 : 0
          );
        }
      }

      this.fireEvent(new EventObject(InternalEvent.CELLS_ORDERED, { back, cells }));
    });
  },
};

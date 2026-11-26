/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { isMultiTouchEvent } from '../../util/EventUtils.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type CellEditorHandler from '../plugin/CellEditorHandler.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'convertValueToString'
  | 'batchUpdate'
  | 'getDataModel'
  | 'getSelectionCell'
  | 'fireEvent'
  | 'isAutoSizeCell'
  | 'cellSizeUpdated'
  | 'getCurrentCellStyle'
  | 'isCellLocked'
  | 'getPlugin'
>;
type PartialEditing = Pick<
  AbstractGraph,
  | 'cellsEditable'
  | 'startEditing'
  | 'startEditingAtCell'
  | 'getEditingValue'
  | 'stopEditing'
  | 'labelChanged'
  | 'cellLabelChanged'
  | 'isEditing'
  | 'isCellEditable'
  | 'isCellsEditable'
  | 'setCellsEditable'
>;
type PartialType = PartialGraph & PartialEditing;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const EditingMixin: PartialType = {
  cellsEditable: true,

  /*****************************************************************************
   * Group: Cell in-place editing
   *****************************************************************************/

  startEditing(evt) {
    this.startEditingAtCell(null, evt);
  },

  startEditingAtCell(cell = null, evt) {
    if (!evt || !isMultiTouchEvent(evt)) {
      if (!cell) {
        cell = this.getSelectionCell();

        if (cell && !this.isCellEditable(cell)) {
          cell = null;
        }
      }

      if (cell) {
        this.fireEvent(
          new EventObject(InternalEvent.START_EDITING, { cell, event: evt })
        );

        const cellEditorHandler = this.getPlugin<CellEditorHandler>('CellEditorHandler');
        cellEditorHandler?.startEditing(cell, evt);

        this.fireEvent(
          new EventObject(InternalEvent.EDITING_STARTED, { cell, event: evt })
        );
      }
    }
  },

  getEditingValue(cell, evt) {
    return this.convertValueToString(cell);
  },

  stopEditing(cancel = false) {
    const cellEditorHandler = this.getPlugin<CellEditorHandler>('CellEditorHandler');
    cellEditorHandler?.stopEditing(cancel);
    this.fireEvent(new EventObject(InternalEvent.EDITING_STOPPED, { cancel }));
  },

  labelChanged(cell, value, evt) {
    this.batchUpdate(() => {
      const old = cell.value;
      this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
      this.fireEvent(
        new EventObject(InternalEvent.LABEL_CHANGED, {
          cell: cell,
          value: value,
          old: old,
          event: evt,
        })
      );
    });
    return cell;
  },

  cellLabelChanged(cell, value, autoSize = false) {
    this.batchUpdate(() => {
      this.getDataModel().setValue(cell, value);

      if (autoSize) {
        this.cellSizeUpdated(cell, false);
      }
    });
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  isEditing(cell = null) {
    const cellEditorHandler = this.getPlugin<CellEditorHandler>('CellEditorHandler');
    const editingCell = cellEditorHandler?.getEditingCell();
    return !cell ? !!editingCell : cell === editingCell;
  },

  isCellEditable(cell): boolean {
    return (
      this.isCellsEditable() &&
      !this.isCellLocked(cell) &&
      (this.getCurrentCellStyle(cell).editable ?? true)
    );
  },

  isCellsEditable() {
    return this.cellsEditable;
  },

  setCellsEditable(value) {
    this.cellsEditable = value;
  },
};

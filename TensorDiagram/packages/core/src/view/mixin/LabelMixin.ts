/*
Copyright 2021-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import type { AbstractGraph } from '../AbstractGraph.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'convertValueToString'
  | 'getCurrentCellStyle'
  | 'isCellLocked'
  | 'isEdgeLabelsMovable'
  | 'isVertexLabelsMovable'
>;
type PartialLabel = Pick<
  AbstractGraph,
  | 'labelsVisible'
  | 'htmlLabels'
  | 'getLabel'
  | 'isHtmlLabel'
  | 'isLabelsVisible'
  | 'isHtmlLabels'
  | 'setHtmlLabels'
  | 'isWrapping'
  | 'isLabelClipped'
  | 'isLabelMovable'
>;
type PartialType = PartialGraph & PartialLabel;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const LabelMixin: PartialType = {
  getLabel(cell) {
    let result: string | null = '';

    if (this.isLabelsVisible() && cell) {
      const style = this.getCurrentCellStyle(cell);

      if (!(style.noLabel ?? false)) {
        result = this.convertValueToString(cell);
      }
    }

    return result;
  },

  isHtmlLabel(_cell) {
    return this.isHtmlLabels();
  },

  labelsVisible: true,

  isLabelsVisible() {
    return this.labelsVisible;
  },

  htmlLabels: false,

  isHtmlLabels() {
    return this.htmlLabels;
  },

  setHtmlLabels(value: boolean) {
    this.htmlLabels = value;
  },

  isWrapping(cell) {
    return this.getCurrentCellStyle(cell).whiteSpace === 'wrap';
  },

  isLabelClipped(cell) {
    return this.getCurrentCellStyle(cell).overflow === 'hidden';
  },

  isLabelMovable(cell) {
    return (
      !this.isCellLocked(cell) &&
      ((cell.isEdge() && this.isEdgeLabelsMovable()) ||
        (cell.isVertex() && this.isVertexLabelsMovable()))
    );
  },
};

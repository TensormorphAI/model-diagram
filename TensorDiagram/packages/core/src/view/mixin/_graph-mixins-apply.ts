/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { mixInto } from '../../internal/utils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import { CellsMixin } from './CellsMixin.js';
import { ConnectionsMixin } from './ConnectionsMixin.js';
import { DragDropMixin } from './DragDropMixin.js';
import { EdgeMixin } from './EdgeMixin.js';
import { EditingMixin } from './EditingMixin.js';
import { EventsMixin } from './EventsMixin.js';
import { FoldingMixin } from './FoldingMixin.js';
import { GroupingMixin } from './GroupingMixin.js';
import { LabelMixin } from './LabelMixin.js';
import { OrderMixin } from './OrderMixin.js';
import { OverlaysMixin } from './OverlaysMixin.js';
import { PageBreaksMixin } from './PageBreaksMixin.js';
import { PanningMixin } from './PanningMixin.js';
import { PortsMixin } from './PortsMixin.js';
import { SelectionMixin } from './SelectionMixin.js';
import { SnapMixin } from './SnapMixin.js';
import { SwimlaneMixin } from './SwimlaneMixin.js';
import { TerminalMixin } from './TerminalMixin.js';
import { ValidationMixin } from './ValidationMixin.js';
import { VertexMixin } from './VertexMixin.js';
import { ZoomMixin } from './ZoomMixin.js';

export const applyGraphMixins = (target: typeof AbstractGraph) => {
  const mixIntoGraph = mixInto(target);

  // Apply the mixins in alphabetic order to ease maintenance.
  // The order should have no influence of the resulting Graph prototype.
  for (const mixin of [
    CellsMixin,
    ConnectionsMixin,
    DragDropMixin,
    EdgeMixin,
    EditingMixin,
    EventsMixin,
    FoldingMixin,
    GroupingMixin,
    LabelMixin,
    OrderMixin,
    PageBreaksMixin,
    OverlaysMixin,
    PanningMixin,
    PortsMixin,
    SelectionMixin,
    SnapMixin,
    SwimlaneMixin,
    TerminalMixin,
    ValidationMixin,
    VertexMixin,
    ZoomMixin,
  ]) {
    mixIntoGraph(mixin);
  }
};

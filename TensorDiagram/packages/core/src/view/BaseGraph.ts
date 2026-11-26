/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type { GraphCollaboratorsOptions } from '../types.js';
import { AbstractGraph } from './AbstractGraph.js';
import GraphDataModel from './GraphDataModel.js';
import CellRenderer from './cell/CellRenderer.js';
import { Stylesheet } from './style/Stylesheet.js';
import GraphSelectionModel from './GraphSelectionModel.js';
import GraphView from './GraphView.js';

/**
 * An implementation of {@link AbstractGraph} that does not load any default built-ins (plugins, style elements).
 *
 * This class is optimized for production environments by enabling efficient tree-shaking.
 *
 * For evaluation and prototyping purposes, consider using {@link Graph}, which requires less configuration.
 *
 * @category Graph
 */
export class BaseGraph extends AbstractGraph {
  protected override initializeCollaborators(options?: GraphCollaboratorsOptions): void {
    this.cellRenderer = options?.cellRenderer ?? new CellRenderer();
    this.model = options?.model ?? new GraphDataModel();
    this.setSelectionModel(
      options?.selectionModel?.(this) ?? new GraphSelectionModel(this)
    );
    this.setStylesheet(options?.stylesheet ?? new Stylesheet());
    this.view = options?.view?.(this) ?? new GraphView(this);
  }
}

/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type { GraphCollaboratorsOptions, GraphPluginConstructor } from '../types.js';
import { AbstractGraph } from './AbstractGraph.js';
import GraphView from './GraphView.js';
import CellRenderer from './cell/CellRenderer.js';
import GraphDataModel from './GraphDataModel.js';
import { Stylesheet } from './style/Stylesheet.js';
import GraphSelectionModel from './GraphSelectionModel.js';
import { registerDefaultStyleElements } from './register-style-elements.js';
import { getDefaultPlugins } from './plugin/index.js';

/**
 * An implementation of {@link AbstractGraph} that automatically loads some default built-ins (plugins, style elements).
 *
 * Good for evaluation and prototyping, but not recommended for production use. Use {@link BaseGraph} instead.
 *
 * @category Graph
 */
export class Graph extends AbstractGraph {
  /**
   * Creates a new {@link CellRenderer} to be used in this graph.
   */
  createCellRenderer(): CellRenderer {
    return new CellRenderer();
  }

  /**
   * Creates a new {@link GraphDataModel} to be used in this graph.
   */
  createGraphDataModel(): GraphDataModel {
    return new GraphDataModel();
  }

  /**
   * Creates a new {@link GraphView} to be used in this graph.
   */
  createGraphView(): GraphView {
    return new GraphView(this);
  }

  /**
   * Creates a new {@link GraphSelectionModel} to be used in this graph.
   */
  createSelectionModel() {
    return new GraphSelectionModel(this);
  }

  /**
   * Creates a new {@link Stylesheet} to be used in this graph.
   */
  createStylesheet(): Stylesheet {
    return new Stylesheet();
  }

  // Register all builtins provided by TensorDiagram
  protected override registerDefaults(): void {
    registerDefaultStyleElements();
  }

  // Build cellRenderer/selectionModel/view via the factory methods so subclasses can customize them
  // by overriding. Only `model` and `stylesheet` are accepted from options because Graph's positional
  // constructor doesn't expose the others.
  protected override initializeCollaborators(options?: GraphCollaboratorsOptions): void {
    this.cellRenderer = this.createCellRenderer();
    this.model = options?.model ?? this.createGraphDataModel();
    this.setSelectionModel(this.createSelectionModel());
    this.setStylesheet(options?.stylesheet ?? this.createStylesheet());
    this.view = this.createGraphView();
  }

  constructor(
    container?: HTMLElement,
    model?: GraphDataModel,
    plugins: GraphPluginConstructor[] = getDefaultPlugins(),
    stylesheet?: Stylesheet | null
  ) {
    super({ container, model, plugins, stylesheet: stylesheet ?? undefined });
  }
}

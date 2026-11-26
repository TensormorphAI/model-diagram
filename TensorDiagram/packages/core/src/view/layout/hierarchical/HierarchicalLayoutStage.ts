/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

/**
 * The specific layout interface for hierarchical layouts. It adds a {@link execute}
 * method for the hierarchical layout model that is shared between the layout stages.
 *
 * @category Layout
 */
abstract class HierarchicalLayoutStage {
  /**
   * Takes the graph detail and configuration information within the facade
   * and creates the resulting laid out graph within that facade for further
   * use.
   */
  abstract execute(parent: any): void;
}

export default HierarchicalLayoutStage;

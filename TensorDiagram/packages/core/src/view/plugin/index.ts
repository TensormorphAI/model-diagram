/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import type { GraphPluginConstructor } from '../../types.js';
import CellEditorHandler from './CellEditorHandler.js';
import TooltipHandler from './TooltipHandler.js';
import SelectionCellsHandler from './SelectionCellsHandler.js';
import PopupMenuHandler from './PopupMenuHandler.js';
import ConnectionHandler from './ConnectionHandler.js';
import SelectionHandler from './SelectionHandler.js';
import PanningHandler from './PanningHandler.js';
import { FitPlugin } from './FitPlugin.js';
import { ImageBundlePlugin } from './ImageBundlePlugin.js';

// Export all plugins and types to have them in the root barrel file
export { default as CellEditorHandler } from './CellEditorHandler.js';
export { default as ConnectionHandler } from './ConnectionHandler.js';
export * from './FitPlugin.js';
export * from './ImageBundlePlugin.js';
export { default as PanningHandler } from './PanningHandler.js';
export { default as PopupMenuHandler } from './PopupMenuHandler.js';
export { default as RubberBandHandler } from './RubberBandHandler.js';
export { default as SelectionCellsHandler } from './SelectionCellsHandler.js';
export { default as SelectionHandler } from './SelectionHandler.js';
export { default as TooltipHandler } from './TooltipHandler.js';

/**
 * Returns the list of plugins used by default in `TensorDiagram`.
 *
 * The function returns a new array each time it is called.
 *
 * @category Plugin
 * @since 0.13.0
 */
export const getDefaultPlugins = (): GraphPluginConstructor[] => [
  CellEditorHandler,
  TooltipHandler,
  SelectionCellsHandler,
  PopupMenuHandler,
  ConnectionHandler,
  SelectionHandler,
  PanningHandler,
  FitPlugin,
  ImageBundlePlugin,
];

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { registerDefaultShapes } from './shape/register-shapes.js';
import {
  registerDefaultEdgeMarkers,
  registerDefaultEdgeStyles,
  registerDefaultPerimeters,
} from './style/register.js';

/**
 * Register all default builtin style elements provided by `TensorDiagram`, by calling:
 * - {@link registerDefaultEdgeMarkers}
 * - {@link registerDefaultEdgeStyles}
 * - {@link registerDefaultPerimeters}
 * - {@link registerDefaultShapes}
 *
 * This is exactly what {@link Graph} registers when it is instantiated. {@link BaseGraph} registers nothing, so this
 * function is the way to get all builtins at once without subclassing it.
 *
 * Registering everything defeats tree-shaking: all builtin shapes, edge styles, perimeters and edge markers end up in
 * the application bundle, whether they are used or not. Prefer registering only the elements used by the application.
 * See the tree-shaking documentation for guidance.
 *
 * @category Configuration
 * @category Style
 * @since 0.25.0
 */
export const registerDefaultStyleElements = (): void => {
  registerDefaultEdgeMarkers();
  registerDefaultEdgeStyles();
  registerDefaultPerimeters();
  registerDefaultShapes();
};

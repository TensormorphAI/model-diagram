/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { StencilShapeRegistry } from './StencilShapeRegistry.js';

/**
 * Unregister all {@link StencilShape}s from {@link StencilShapeRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export function unregisterAllStencilShapes() {
  StencilShapeRegistry.clear();
}

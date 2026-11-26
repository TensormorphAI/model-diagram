/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type { Registry, ShapeConstructor } from '../../types.js';
import { BaseRegistry } from '../../internal/BaseRegistry.js';

/**
 * A registry that stores the {@link ShapeConstructor}s and their configuration.
 *
 * For adding new shapes you should use {@link ShapeRegistry.add}.
 *
 * Names generally used to register the built-in shapes:
 * - actor
 * - arrow
 * - arrow connector (for edges)
 * - cloud
 * - connector (for edges)
 * - cylinder
 * - double ellipse
 * - ellipse
 * - hexagon
 * - image
 * - label
 * - line (for edges)
 * - rectangle
 * - rhombus
 * - swimlane
 * - triangle
 *
 * @since 0.20.0
 * @category Configuration
 * @category Shape
 */
export const ShapeRegistry: Registry<ShapeConstructor> = new BaseRegistry();

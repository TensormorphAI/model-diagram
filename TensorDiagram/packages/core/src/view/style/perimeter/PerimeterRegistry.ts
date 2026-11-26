/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { BaseRegistry } from '../../../internal/BaseRegistry.js';
import type { PerimeterFunction, Registry } from '../../../types.js';

/**
 * A registry that stores the {@link PerimeterFunction}s.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export const PerimeterRegistry: Registry<PerimeterFunction> = new BaseRegistry();

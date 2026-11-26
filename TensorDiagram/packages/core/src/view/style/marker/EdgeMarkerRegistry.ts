/*
Copyright 2021-present The TensorDiagram project Contributors
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

import type {
  EdgeMarkerRegistryInterface,
  MarkerFactoryFunction,
  MarkerFunction,
  StyleArrowValue,
} from '../../../types.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import type Point from '../../geometry/Point.js';
import type Shape from '../../shape/Shape.js';
import { BaseRegistry } from '../../../internal/BaseRegistry.js';

class EdgeMarkerRegistryImpl
  extends BaseRegistry<MarkerFactoryFunction>
  implements EdgeMarkerRegistryInterface
{
  createMarker(
    canvas: AbstractCanvas2D,
    shape: Shape,
    type: StyleArrowValue,
    pe: Point,
    unitX: number,
    unitY: number,
    size: number,
    source: boolean,
    sw: number,
    filled: boolean
  ): MarkerFunction | null {
    const markerFunction = this.get(type);
    return markerFunction
      ? markerFunction(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : null;
  }
}

/**
 * A registry that stores the {@link MarkerFactoryFunction}s and their configuration to let generate {@link MarkerFunction}.
 *
 * The name used to register the marker is the marker type. It is then used to create the marker with {@link createMarker}.
 *
 * @category Configuration
 * @category Style
 * @since 0.20.0
 */
export const EdgeMarkerRegistry: EdgeMarkerRegistryInterface =
  new EdgeMarkerRegistryImpl();

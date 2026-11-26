/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { ShapeRegistry } from './ShapeRegistry.js';
import type { ShapeConstructor, ShapeValue } from '../../types.js';
import RectangleShape from './node/RectangleShape.js';
import EllipseShape from './node/EllipseShape.js';
import RhombusShape from './node/RhombusShape.js';
import CylinderShape from './node/CylinderShape.js';
import ConnectorShape from './edge/ConnectorShape.js';
import ActorShape from './node/ActorShape.js';
import TriangleShape from './node/TriangleShape.js';
import HexagonShape from './node/HexagonShape.js';
import CloudShape from './node/CloudShape.js';
import LineShape from './edge/LineShape.js';
import ArrowShape from './edge/ArrowShape.js';
import ArrowConnectorShape from './edge/ArrowConnectorShape.js';
import DoubleEllipseShape from './node/DoubleEllipseShape.js';
import SwimlaneShape from './node/SwimlaneShape.js';
import ImageShape from './node/ImageShape.js';
import LabelShape from './node/LabelShape.js';

let isDefaultElementsRegistered = false;

/**
 * Register default builtin shapes into {@link ShapeRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export function registerDefaultShapes() {
  if (!isDefaultElementsRegistered) {
    const shapesToRegister: [ShapeValue, ShapeConstructor][] = [
      ['actor', ActorShape],
      ['arrow', ArrowShape],
      ['arrowConnector', ArrowConnectorShape],
      ['cloud', CloudShape],
      ['connector', ConnectorShape],
      ['cylinder', CylinderShape],
      ['doubleEllipse', DoubleEllipseShape],
      ['ellipse', EllipseShape],
      ['hexagon', HexagonShape],
      ['image', ImageShape],
      ['label', LabelShape],
      ['line', LineShape],
      ['rectangle', RectangleShape],
      ['rhombus', RhombusShape],
      ['swimlane', SwimlaneShape],
      ['triangle', TriangleShape],
    ];
    for (const [shapeName, shapeClass] of shapesToRegister) {
      ShapeRegistry.add(shapeName, shapeClass);
    }

    isDefaultElementsRegistered = true;
  }
}

/**
 * Unregister all shapes from {@link ShapeRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export function unregisterAllShapes() {
  ShapeRegistry.clear();
  isDefaultElementsRegistered = false;
}

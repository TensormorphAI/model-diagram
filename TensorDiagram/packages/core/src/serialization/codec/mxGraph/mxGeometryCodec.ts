/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type Codec from '../../Codec.js';
import ObjectCodec from '../../ObjectCodec.js';
import Geometry from '../../../view/geometry/Geometry.js';
import Point from '../../../view/geometry/Point.js';

/**
 * Add support for the legacy `mxGraph` format of {@link Geometry}.
 *
 * @category Serialization with Codecs
 */
export class mxGeometryCodec extends ObjectCodec {
  override getName(): string {
    return 'mxGeometry';
  }

  constructor() {
    super(new Geometry());
  }

  override afterDecode(dec: Codec, node: Element | null, obj?: any): any {
    // Convert points to the right form
    // input: [ { x: 420, y: 60 }, ... ]
    // output: [ Point { _x: 420, _y: 60 }, ... ]
    //
    // In mxGraph XML, the points are modeled as Object, so there is no way to create an alias to do the decoding with a custom Codec.
    // Then, it is easier to convert the values to Point objects after the whole decoding of the geometry
    // <Array as="points">
    //   <Object x="420" y="60"/>
    // </Array>

    const originalPoints = (obj as Geometry).points;
    if (originalPoints) {
      const points: Array<Point> = [];
      for (const pointInput of originalPoints) {
        const rawPoint = pointInput as { x: number; y: number };
        points.push(new Point(rawPoint.x, rawPoint.y));
      }
      (obj as Geometry).points = points;
    }

    return obj;
  }
}

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import CodecRegistry from './CodecRegistry.js';
import {
  CellCodec,
  ModelCodec,
  mxCellCodec,
  mxGeometryCodec,
} from './codec/_model-codecs.js';
import Geometry from '../view/geometry/Geometry.js';
import Point from '../view/geometry/Point.js';
import {
  CodecRegistrationStates,
  createObjectCodec,
  registerBaseCodecs,
} from './register-shared.js';

/**
 * Register model codecs i.e. codecs used to import/export the Graph Model, see {@link GraphDataModel}.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.10.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const registerModelCodecs = (force = false) => {
  if (!CodecRegistrationStates.model || force) {
    CodecRegistry.register(new CellCodec());
    CodecRegistry.register(new ModelCodec());

    // To support decode/import executed before encode/export (see https://github.com/TensorDiagram/TensorDiagram/issues/178)
    // Codecs are currently only registered automatically during encode/export
    CodecRegistry.register(createObjectCodec(new Geometry(), 'Geometry'));
    CodecRegistry.register(createObjectCodec(new Point(), 'Point'));
    registerBaseCodecs(force);

    // mxGraph support
    CodecRegistry.addAlias('mxGraphModel', 'GraphDataModel');
    CodecRegistry.addAlias('mxPoint', 'Point');
    CodecRegistry.register(new mxCellCodec(), false);
    CodecRegistry.register(new mxGeometryCodec(), false);

    CodecRegistrationStates.model = true;
  }
};

/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

// The elements in this file are private and are not intended to be exported by the npm package

import CodecRegistry from './CodecRegistry.js';
import ObjectCodec from './ObjectCodec.js';

/**
 * @private
 */
export const CodecRegistrationStates: Record<string, boolean> = {
  base: false,
  core: false,
  editor: false,
  model: false,
};

/**
 * @private
 */
export const registerBaseCodecs = (force = false) => {
  if (!CodecRegistrationStates.base || force) {
    CodecRegistry.register(createObjectCodec({}, 'Object'));
    CodecRegistry.register(createObjectCodec([], 'Array'));

    CodecRegistrationStates.base = true;
  }
};

export const createObjectCodec = (template: any, name: string): ObjectCodec => {
  const objectCodec = new ObjectCodec(template);
  objectCodec.setName(name);
  return objectCodec;
};

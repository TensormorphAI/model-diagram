/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

// This is needed to create a DOM environment for Node.js, required when importing from TensorDiagram ESM
// Must be placed before importing any TensorDiagram code
import 'jsdom-global/register.js';
// import directly from ESM to ensure everything works. See https://github.com/TensorDiagram/TensorDiagram/issues/827
// the shared code in the _shared.js file is CommonJS, so it is not able to detect errors in the ESM code
import { constants } from '@tensormorph/tensordiagramcore';
import { createGraphAndExport } from './_shared.js';

console.info(
  `TensorDiagram example with Node.js using ESM of TensorDiagram ${constants.VERSION}`
);
createGraphAndExport('ESM', 'esm');

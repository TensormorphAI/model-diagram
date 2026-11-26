/*
Copyright (c) Tensormorph. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// This is needed to create a DOM environment for Node.js, required when importing from TensorDiagram ESM
// Must be placed before importing any TensorDiagram code
import 'jsdom-global/register.js';
// import directly from ESM to ensure everything works. See https://github.com/TensorDiagram/TensorDiagram/issues/827
// the shared code in the _shared.js file is CommonJS, so it is not able to detect errors in the ESM code
import { constants } from '@tensordiagram/core';
import { createGraphAndExport } from './_shared.js';

console.info(`TensorDiagram example with Node.js using ESM of TensorDiagram ${constants.VERSION}`);
createGraphAndExport('ESM', 'esm');

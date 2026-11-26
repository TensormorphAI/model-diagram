/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { writeFileSync } from 'node:fs';

const writeJsonContentToFile = (path, obj) => {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
};

console.info('Writing package.json file for CommonJS...');

const path = 'lib/cjs/package.json';
const packageJson = { type: 'commonjs' };
writeJsonContentToFile(path, packageJson);

console.info('package.json file for CommonJS written to', path);

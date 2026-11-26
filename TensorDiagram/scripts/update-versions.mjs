/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

// IMPORTANT: this script is intended to run as part of a GitHub workflow which is not installing the dependencies of the project.
// So please, do not import code that is not provided by the node runtime. Otherwise, update the GitHub workflow definition
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// run from the root of the repository: node scripts/update-versions.mjs 0.12.0.alpha-1
const newVersion = process.argv[2];

console.info('Updating version in various files, version:', newVersion);
updateVersionInCorePackageJsonFile(newVersion);
updateVersionInSourceFile(newVersion);
// bun.lock records the version of each workspace, refresh it from the updated package.json
execSync('bun install', { stdio: 'inherit' });
console.info('Files have been updated');

function updateVersionInCorePackageJsonFile(newVersion) {
  const path = 'packages/core/package.json';
  console.info('Updating', path);
  const fileContent = readFileContent(path);
  const packageJson = JSON.parse(fileContent);
  packageJson.version = newVersion;
  writeJsonContentToFile(path, packageJson);
}

function updateVersionInSourceFile(newVersion) {
  const path = 'packages/core/src/util/Constants.ts';
  console.info('Updating', path);
  const content = readFileContent(path);
  // replace the 1st occurrence, this is OK as the constant appears only once in the file
  const updatedContent = content.replace(
    /const VERSION =.*/,
    `const VERSION = '${newVersion}';`
  );
  writeFileSync(path, updatedContent);
}

function readFileContent(path) {
  return readFileSync(path, 'utf8').toString();
}

function writeJsonContentToFile(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

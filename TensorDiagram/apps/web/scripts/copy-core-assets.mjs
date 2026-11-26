// Core loads its images (folding icons, connection points, warnings) and its i18n resources by URL at runtime, so
// they must be served next to the page. They are copied from the installed package rather than committed, to always
// match the version in use.
import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreDir = dirname(
  createRequire(import.meta.url).resolve('@tensormorph/tensordiagramcore/package.json')
);
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

for (const name of ['images', 'i18n']) {
  const target = join(publicDir, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(coreDir, name), target, { recursive: true });
}
console.info(`Copied the images and i18n resources of ${coreDir} to ${publicDir}`);

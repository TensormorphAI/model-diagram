/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/html-vite';
const require = createRequire(import.meta.url);
const config: StorybookConfig = {
  stories: [
    '../stories/**/Introduction.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/**/*.mdx',
  ],

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
    enableCrashReports: false,
  },

  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-docs'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/html-vite'),
    options: {},
  },
};
export default config;

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

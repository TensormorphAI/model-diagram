/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import {
  ConsoleLogger,
  GlobalConfig,
  resetGlobalConfig,
  resetStyleDefaultsConfig,
  StyleDefaultsConfig,
  TranslationsAsI18n,
} from '../../src';

test('resetGlobalConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...GlobalConfig };
  const originalLogger = GlobalConfig.logger;
  const originalI18n = GlobalConfig.i18n;

  // Change some values
  GlobalConfig.logger = new ConsoleLogger();
  GlobalConfig.i18n = new TranslationsAsI18n();

  expect(GlobalConfig.logger).not.toBe(originalLogger);
  expect(GlobalConfig.i18n).not.toBe(originalI18n);

  resetGlobalConfig();

  // Ensure that the values are correctly reset
  expect(GlobalConfig.logger).toBe(originalLogger);
  expect(GlobalConfig.i18n).toBe(originalI18n);
  expect(GlobalConfig).toStrictEqual(originalConfig);
});

test('resetStyleDefaultsConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...StyleDefaultsConfig };

  // Change some values
  StyleDefaultsConfig.shadowColor = 'pink';
  StyleDefaultsConfig.shadowOffsetX = 20;

  resetStyleDefaultsConfig();

  // Ensure that the values are correctly reset
  expect(StyleDefaultsConfig.shadowColor).toBe('gray');
  expect(StyleDefaultsConfig.shadowOffsetX).toBe(2);
  expect(StyleDefaultsConfig).toStrictEqual(originalConfig);
});

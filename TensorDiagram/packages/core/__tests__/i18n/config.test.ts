/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { expect, test } from '@jest/globals';
import { TranslationsConfig, resetTranslationsConfig } from '../../src';

function getTranslationsConfigValues() {
  return {
    defaultLanguage: TranslationsConfig.getDefaultLanguage(),
    language: TranslationsConfig.getLanguage(),
    languages: TranslationsConfig.getLanguages(),
  };
}

test('resetTranslationsConfig', () => {
  // Keep track of original default values
  const originalConfigValues = getTranslationsConfigValues();

  // Change some values
  TranslationsConfig.setDefaultLanguage('ja');
  TranslationsConfig.setLanguage('se');
  TranslationsConfig.setLanguages(['es', 'it', 'fr']);

  resetTranslationsConfig();

  // Ensure that the values have correctly been reset
  const newConfigValues = getTranslationsConfigValues();
  expect(newConfigValues).toStrictEqual(originalConfigValues);
});

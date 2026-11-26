/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { isNullish } from '../internal/utils.js';
import { shallowCopy } from '../internal/clone-utils.js';

function getNavigatorLanguage() {
  return typeof window !== 'undefined' ? navigator.language : 'en';
}

interface TranslationsConfigValuesType {
  defaultLanguage: string;
  language: string;
  languages: string[];
}

const values: TranslationsConfigValuesType = {
  defaultLanguage: 'en',
  language: getNavigatorLanguage(),
  languages: [],
};

// @ts-ignore the properties will be added dynamically when calling shallowCopy
const originalValues: TranslationsConfigValuesType = {};
shallowCopy(values, originalValues);

/**
 * Resets {@link TranslationsConfig} to default values.
 *
 * @experimental Subject to change or removal. TensorDiagram's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category I18n
 */
export const resetTranslationsConfig = (): void => {
  shallowCopy(originalValues, values);
};

/**
 * Global configuration for {@link Translations}.
 *
 * @experimental subject to change or removal. TensorDiagram's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category I18n
 */
export const TranslationsConfig = {
  /**
   * Returns whether internationalization is enabled.
   */
  isEnabled(): boolean {
    return this.getLanguage() !== 'none';
  },

  /**
   * @see setLanguage
   */
  getLanguage(): string {
    return values.language;
  },

  /**
   * Defines the language of the client, e.g. `en` for english, `de` for german etc.
   *
   * The special value `none` will disable all built-in internationalization and resource loading.
   * See {@link Translations.getSpecialBundle} for handling identifiers with and without a dash.
   *
   * If internationalization is disabled, then the following variables should be overridden to reflect the current language of the system.
   * These variables are cleared when i18n is disabled (the list may not be exhaustive):
   * - {@link Editor.askZoomResource}
   * - {@link Editor.currentFileResource}
   * - {@link Editor.helpResource}
   * - {@link Editor.lastSavedResource}
   * - {@link Editor.outlineResource}
   * - {@link Editor.propertiesResource}
   * - {@link Editor.tasksResource}
   * - {@link ElbowEdgeHandler.doubleClickOrientationResource}
   * - {@link AbstractGraph.alreadyConnectedResource}.
   * - {@link AbstractGraph.collapseExpandResource}
   * - {@link AbstractGraph.containsValidationErrorsResource} and
   * - {@link GraphSelectionModel.doneResource}
   * - {@link GraphSelectionModel.updatingSelectionResource}
   * - {@link GraphView.doneResource}
   * - {@link GraphView.updatingDocumentResource}
   * - {@link GuiConfig.closeResource}
   * - {@link GuiConfig.errorResource}
   *
   * @param value The language to set. If `null` or `undefined`, use the preferred language of the navigator or 'en' as default.
   */
  setLanguage(value: string | undefined | null): void {
    values.language = !isNullish(value) ? value : getNavigatorLanguage();
  },

  /**
   * @see setLanguages
   */
  getLanguages(): string[] {
    return values.languages;
  },

  /**
   * Defines the optional array of all supported language extensions.
   * The default language does not have to be part of this list. See {@link Translations.isLanguageSupported}.
   *
   * This is used to avoid unnecessary requests to language files, i.e. if a 404 will be returned.
   * @default empty array
   */
  setLanguages(value: string[] | null | undefined): void {
    if (value) {
      values.languages = value;
    }
  },

  /**
   * @see setDefaultLanguage
   */
  getDefaultLanguage(): string {
    return values.defaultLanguage;
  },

  /**
   * Defines the default language which is used in the common resource files.
   * Any resources for this language will only load the common resource file, but not the language-specific resource file.
   * @default 'en'
   */
  setDefaultLanguage(value: string | undefined | null): void {
    values.defaultLanguage = !isNullish(value) ? value : 'en';
  },
};

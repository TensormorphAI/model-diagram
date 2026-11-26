import {
  Client,
  GlobalConfig,
  NoOpLogger,
  ObjectCodec,
  resetEdgeHandlerConfig,
  resetEntityRelationConnectorConfig,
  resetGlobalConfig,
  resetHandleConfig,
  resetManhattanConnectorConfig,
  resetOrthogonalConnectorConfig,
  resetStencilShapeConfig,
  resetStyleDefaultsConfig,
  resetTranslationsConfig,
  resetVertexHandlerConfig,
  StylesheetCodec,
  Translations,
  TranslationsAsI18n,
  unregisterAllCodecs,
  unregisterAllEdgeMarkers,
  unregisterAllEdgeStylesAndPerimeters,
  unregisterAllShapes,
  unregisterAllStencilShapes,
} from '@tensormorph/tensordiagramcore';

// Same reset as the Storybook decorator of packages/html: a demo may change a global configuration or registry, which
// must not leak into the next one.
const logger = new NoOpLogger();
const i18n = new TranslationsAsI18n();
const allowEval = {
  objectCodec: ObjectCodec.allowEval,
  stylesheetCodec: StylesheetCodec.allowEval,
};

/** Resolves once the i18n resources of the graph are loaded, so that the first demo shows translated messages. */
export const loadTranslations = (): Promise<void> =>
  new Promise((resolve) => {
    Translations.add(`${Client.basePath}/i18n/graph`, null, () => resolve());
  });

export const resetGlobalState = (): void => {
  resetGlobalConfig();
  GlobalConfig.i18n = i18n;
  GlobalConfig.logger = logger;
  // Served from public/images, see scripts/copy-core-assets.mjs
  Client.setImageBasePath('./images');

  resetEdgeHandlerConfig();
  resetEntityRelationConnectorConfig();
  resetHandleConfig();
  resetManhattanConnectorConfig();
  resetOrthogonalConnectorConfig();
  resetStyleDefaultsConfig();
  resetTranslationsConfig();
  resetVertexHandlerConfig();

  unregisterAllCodecs();
  ObjectCodec.allowEval = allowEval.objectCodec;
  StylesheetCodec.allowEval = allowEval.stylesheetCodec;

  unregisterAllEdgeMarkers();
  unregisterAllEdgeStylesAndPerimeters();
  unregisterAllShapes();
  unregisterAllStencilShapes();
  resetStencilShapeConfig();

  // Popup menus, tooltips and windows are appended to the body and outlive the graph, see TensorDiagram issue #400
  document
    .querySelectorAll('.mxPopupMenu,.mxTooltip,.mxWindow')
    .forEach((e) => e.remove());
};

---
sidebar_position: 3
---

# Demos and Examples
[//]: # (extract of <rootdir>/README.md)


:::tip

The documentation does not cover all the features available in `TensorDiagram`. However, `TensorDiagram` does provide numerous examples. These examples show how to use the features and how `TensorDiagram` can be extended to meet new needs.

This page includes links to the examples and demos available in the `TensorDiagram` [GitHub organization](https://github.com/TensorDiagram).

:::

For more comprehensive examples than the [“Getting started” example](./getting-started.mdx), this page provides a list of demos and examples to help you understand how to use `TensorDiagram` and integrate it into your projects.

Note that they are based on `TensorDiagram` features, which require the use of [CSS and images](./usage/css-and-images.md) provided in the npm package.


## Interactive Demos
- the [storybook stories](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/html/stories) demonstrate various features of TensorDiagram.
  - The stories were originally written in `JavaScript` and are being progressively migrated to `TypeScript`.
  - A live instance is available on the [TensorDiagram website](https://tensordiagram.github.io/TensorDiagram/demo).

## TypeScript Examples
- the [ts-example](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/ts-example) project/application demonstrates how to define and use custom `Shapes` with `TensorDiagram`. It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).
- the [ts-example-jest-commonjs](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/ts-example-jest-commonjs) project that demonstrates how to run jest tests involving `TensorDiagram` with ts-jest, using CommonJS.
- the [ts-example-selected-features](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/ts-example-selected-features) project/application that demonstrates the same use case as in `ts-example` but which only loads the features and configuration required by the application for efficient [tree-shaking](./usage/tree-shaking.md). It draws the same diagram, but without the custom shape classes: the appearance they painted is reproduced with plain style properties such as `fillColor`, `strokeColor` and `strokeWidth`. It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).
- the [ts-example-without-defaults](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/ts-example-without-defaults) project/application demonstrates how to not use default plugins and style defaults (shapes, perimeters, ...). It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).

## JavaScript Examples
- the [js-example](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/js-example) project/application demonstrates how to import and export the `TensorDiagram` model with XML data. It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).
- the [js-example-nodejs](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/js-example-nodejs) project that demonstrates how to use `TensorDiagram` in a headless environment with Node.js.
- the [js-example-selected-features](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/js-example-selected-features) project/application that demonstrates the same use case as in `js-example` but which only loads the features and configuration required by the application for efficient [tree-shaking](./usage/tree-shaking.md). It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).
- the [js-example-without-defaults](https://github.com/TensorDiagram/TensorDiagram/tree/main/packages/js-example-without-defaults) project/application demonstrates how to not use default plugins and style defaults (shapes, perimeters, ...). It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).

## Framework Integration and Bundlers
- the [tensordiagram-integration-examples](https://github.com/TensorDiagram/tensordiagram-integration-examples) repository shows how to integrate `TensorDiagram` with different frameworks and build tools.

[//]: # (END OF 'extract of <rootdir>/README.md')

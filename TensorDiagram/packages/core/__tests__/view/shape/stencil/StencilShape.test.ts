/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { describe, expect, jest, test } from '@jest/globals';
import {
  type AbstractCanvas2D,
  Point,
  Rectangle,
  resetStencilShapeConfig,
  Shape,
  StencilShape,
  StencilShapeConfig,
} from '../../../../src';
import { parseXml } from '../../../../src/util/xmlUtils';

const createStencil = (innerXml: string): StencilShape =>
  new StencilShape(parseXml(`<shape>${innerXml}</shape>`).documentElement);

const drawSingleNode = (
  stencil: StencilShape,
  canvas: unknown,
  scale: Rectangle
): void => {
  const node = stencil.desc.getElementsByTagName('foreground')[0].firstElementChild!;
  stencil.drawNode(canvas as AbstractCanvas2D, new Shape(), node, scale, false, true);
};

test('resetStencilShapeConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...StencilShapeConfig };

  // Change some values
  StencilShapeConfig.allowEval = true;
  StencilShapeConfig.defaultLocalized = true;

  resetStencilShapeConfig();

  // Ensure that the values are correctly reset
  expect(StencilShapeConfig.allowEval).toBeFalsy();
  expect(StencilShapeConfig).toStrictEqual(originalConfig);
});

test('parseConstraints reads every constraint', () => {
  const stencil = createStencil(
    '<connections><constraint x="0" y="0.5" perimeter="1"/><constraint x="1" y="0.5" perimeter="0"/></connections>'
  );

  expect(stencil.constraints.map((constraint) => constraint.point)).toEqual([
    new Point(0, 0.5),
    new Point(1, 0.5),
  ]);
});

describe('drawNode', () => {
  test('add the points of every segment of a rounded path', () => {
    const stencil = createStencil(
      '<foreground><path rounded="1" arcSize="10"><move x="0" y="0"/><line x="10" y="0"/><move x="0" y="20"/><line x="10" y="20"/></path></foreground>'
    );
    const addPoints = jest.spyOn(stencil, 'addPoints').mockImplementation(() => {});

    drawSingleNode(stencil, { begin: () => {} }, new Rectangle(0, 0, 1, 1));

    expect(addPoints.mock.calls.map((call) => call[1])).toEqual([
      [new Point(0, 0), new Point(10, 0)],
      [new Point(0, 20), new Point(10, 20)],
    ]);
  });

  test('scale every value of the dash pattern and skip the empty ones', () => {
    const stencil = createStencil(
      '<foreground><dashpattern pattern="2  4 6"/></foreground>'
    );
    const setDashPattern = jest.fn();

    drawSingleNode(stencil, { setDashPattern }, new Rectangle(0, 0, 2, 3));

    expect(setDashPattern).toHaveBeenCalledWith('4 8 12');
  });
});

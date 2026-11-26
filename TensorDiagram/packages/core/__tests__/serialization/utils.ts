/*
Copyright 2024-present The TensorDiagram project Contributors

See LICENSE in the project root for license information.
*/

import { expect } from '@jest/globals';
import type { Cell, CellStyle, Geometry, GraphDataModel } from '../../src';

interface ExpectCellProperties {
  geometry?: Geometry;
  style?: CellStyle;
}

type NullableStringOrObject = string | object | null;

/**
 * Utility class to check the content of GraphDataModel.
 */
export class ModelChecker {
  constructor(private model: GraphDataModel) {}

  checkRootCells() {
    const cell0 = this.model.getCell('0');
    expect(cell0).toBeDefined();
    expect(cell0).not.toBeNull();
    expect(cell0?.parent).toBeNull();

    const cell1 = this.model.getCell('1');
    expect(cell1).toBeDefined();
    expect(cell1).not.toBeNull();
    expect(cell1?.parent).toBe(cell0);
  }

  checkCellsCount(count: number) {
    const cellIds = Object.getOwnPropertyNames(this.model.cells);
    expect(cellIds).toHaveLength(count);
  }

  expectIsVertex(
    cell: Cell | null,
    value: NullableStringOrObject,
    properties?: ExpectCellProperties
  ) {
    this.checkCellBaseProperties(cell, value, properties);
    if (!cell) return; // cannot occur, this is enforced by checkCellBaseProperties
    expect(cell.edge).toEqual(false);
    expect(cell.isEdge()).toBeFalsy();
    expect(cell.vertex).toEqual(1); // FIX should be set to true
    expect(cell.isVertex()).toBeTruthy();
  }

  expectIsEdge(
    cell: Cell | null,
    value: NullableStringOrObject = null,
    properties?: ExpectCellProperties
  ) {
    this.checkCellBaseProperties(cell, value, properties);
    if (!cell) return; // cannot occur, this is enforced by checkCellBaseProperties
    expect(cell.edge).toEqual(1); // FIX should be set to true
    expect(cell.isEdge()).toBeTruthy();
    expect(cell.vertex).toEqual(false);
    expect(cell.isVertex()).toBeFalsy();
  }

  private checkCellBaseProperties(
    cell: Cell | null,
    value: NullableStringOrObject,
    properties?: ExpectCellProperties
  ) {
    expect(cell).toBeDefined();
    expect(cell).not.toBeNull();
    if (!cell) return; // cannot occur, see above

    expect(cell.value).toEqual(value);
    expect(cell.getParent()?.id).toEqual('1'); // default parent id

    expect(cell.geometry).toEqual(properties?.geometry ?? null);
    expect(cell.style).toEqual(properties?.style ?? {});
  }
}

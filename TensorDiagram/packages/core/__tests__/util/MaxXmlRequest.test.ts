/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import { afterEach, describe, expect, jest, test } from '@jest/globals';
import MaxXmlRequest from '../../src/util/MaxXmlRequest';

describe('simulate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const simulateAndGetSubmittedFields = (request: MaxXmlRequest): [string, string][] => {
    let fields: [string, string][] = [];
    jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (
      this: HTMLFormElement
    ) {
      fields = Array.from(this.querySelectorAll('textarea')).map((textarea) => [
        textarea.name,
        textarea.value,
      ]);
    });

    request.simulate(document);

    return fields;
  };

  test('submit one field per parameter separated by &', () => {
    const request = new MaxXmlRequest('https://example.com', 'first=1&second=a%20b');

    expect(simulateAndGetSubmittedFields(request)).toEqual([
      ['first', '1'],
      ['second', 'a%20b'],
    ]);
  });

  test('submit one field per parameter separated by spaces, skipping the ones without a name', () => {
    const request = new MaxXmlRequest(
      'https://example.com',
      'first=1 =2 noValue second=a%20b'
    );
    request.decodeSimulateValues = true;

    expect(simulateAndGetSubmittedFields(request)).toEqual([
      ['first', '1'],
      ['second', 'a b'],
    ]);
  });
});

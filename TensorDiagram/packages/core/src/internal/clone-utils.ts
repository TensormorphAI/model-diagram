/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

/**
 * Shallow copies properties from the source object to the target object.
 *
 * **WARNING**: This function performs only a **shallow** copy i.e. there is no deep copy of the properties that are objects, expect for arrays.
 *
 * @template T The type of the objects.
 *
 * @param source The source object from which properties will be copied.
 * @param target The target object to which properties will be copied.
 *
 * @private not part of the public API, can be removed or changed without prior notice
 * @since 0.14.0
 */
export const shallowCopy = <T extends object>(source: T, target: T): void => {
  for (const key in source) {
    // attempt to prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      if (Array.isArray(sourceValue)) {
        // TypeScript cannot infer that the key in target will also be an array when source and target are of the same type
        (target[key] as unknown[]) = [...sourceValue];
      } else {
        target[key] = sourceValue;
      }
    }
  }
};

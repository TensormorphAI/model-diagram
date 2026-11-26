/*
Copyright (c) Tensormorph. All rights reserved.
Copyright (c) 2006-2015, Gaudenz Alder

See LICENSE in the project root for license information.
*/

/**
 * Encapsulates the URL, width and height of an image.
 */
class ImageBox {
  constructor(src: string, width: number, height: number) {
    this.src = src;
    this.width = width;
    this.height = height;
  }

  /**
   * String that specifies the URL of the image.
   */
  src: string;

  /**
   * Integer that specifies the width of the image.
   */
  width: number;

  /**
   * Integer that specifies the height of the image.
   */
  height: number;
}

export default ImageBox;

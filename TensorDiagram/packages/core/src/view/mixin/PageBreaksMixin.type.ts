/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import type Shape from '../shape/Shape.js';

declare module '../AbstractGraph.js' {
  interface AbstractGraph {
    /** @default null */
    horizontalPageBreaks: Shape[] | null;

    /** @default null */
    verticalPageBreaks: Shape[] | null;

    /**
     * Invokes from {@link sizeDidChange} to redraw the page breaks.
     *
     * @param visible Boolean that specifies if page breaks should be shown.
     * @param width Specifies the width of the container in pixels.
     * @param height Specifies the height of the container in pixels.
     */
    updatePageBreaks: (visible: boolean, width: number, height: number) => void;
  }
}

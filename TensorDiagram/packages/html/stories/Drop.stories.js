/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import {
  Graph,
  RubberBandHandler,
  styleUtils,
  eventUtils,
  InternalEvent,
  xmlUtils,
} from '@tensormorph/tensordiagramcore';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@tensormorph/tensordiagramcore/css/common.css';

export default {
  title: 'DnD_CopyPaste/Drop',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');
  div.innerHTML = 'Drag & drop your images below:<br>';
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given this.el
  const graph = new Graph(container);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  InternalEvent.addListener(container, 'dragover', function (evt) {
    if (graph.isEnabled()) {
      evt.stopPropagation();
      evt.preventDefault();
    }
  });

  InternalEvent.addListener(container, 'drop', (evt) => {
    if (graph.isEnabled()) {
      evt.stopPropagation();
      evt.preventDefault();

      // Gets drop location point for vertex
      const pt = styleUtils.convertPoint(
        graph.container,
        eventUtils.getClientX(evt),
        eventUtils.getClientY(evt)
      );
      const tr = graph.view.translate;
      const { scale } = graph.view;
      const x = pt.x / scale - tr.x;
      const y = pt.y / scale - tr.y;

      // Converts local images to data urls
      const filesArray = evt.dataTransfer.files;

      for (let i = 0; i < filesArray.length; i++) {
        handleDrop(graph, filesArray[i], x + i * 10, y + i * 10);
      }
    }
  });

  return div;
};

function handleDrop(graph, file, x, y) {
  // Handles each file as a separate insert for simplicity.
  // Use barrier to handle multiple files as a single insert.

  if (file.type.substring(0, 5) === 'image') {
    const reader = new FileReader();

    reader.onload = function (e) {
      // Gets size of image for vertex
      let data = e.target.result;

      // SVG needs special handling to add viewbox if missing and
      // find initial size from SVG attributes (only for IE11)
      if (file.type.substring(0, 9) === 'image/svg') {
        const comma = data.indexOf(',');
        const svgText = atob(data.substring(comma + 1));
        const root = xmlUtils.parseXml(svgText);

        // Parses SVG to find width and height
        if (root != null) {
          const svgs = root.getElementsByTagName('svg');

          if (svgs.length > 0) {
            const svgRoot = svgs[0];
            let w = parseFloat(svgRoot.getAttribute('width'));
            let h = parseFloat(svgRoot.getAttribute('height'));

            // Check if viewBox attribute already exists
            const vb = svgRoot.getAttribute('viewBox');

            if (vb == null || vb.length === 0) {
              svgRoot.setAttribute('viewBox', `0 0 ${w} ${h}`);
            }
            // Uses width and height from viewbox for
            // missing width and height attributes
            else if (Number.isNaN(w) || Number.isNaN(h)) {
              const tokens = vb.split(' ');

              if (tokens.length > 3) {
                w = parseFloat(tokens[2]);
                h = parseFloat(tokens[3]);
              }
            }

            w = Math.max(1, Math.round(w));
            h = Math.max(1, Math.round(h));

            data = `data:image/svg+xml,${btoa(xmlUtils.getXml(svgs[0], '\n'))}`;
            graph.insertVertex({
              position: [x, y],
              size: [w, h],
              style: {
                shape: 'image',
                image: data,
              },
            });
          }
        }
      } else {
        const img = new Image();

        img.onload = () => {
          const w = Math.max(1, img.width);
          const h = Math.max(1, img.height);

          // Converts format of data url to cell style value for use in vertex
          const semi = data.indexOf(';');

          if (semi > 0) {
            data = data.substring(0, semi) + data.substring(data.indexOf(',', semi + 1));
          }

          graph.insertVertex({
            position: [x, y],
            size: [w, h],
            style: { shape: 'image', image: data },
          });
        };

        img.src = data;
      }
    };

    reader.readAsDataURL(file);
  }
}

export const Default = Template.bind({});

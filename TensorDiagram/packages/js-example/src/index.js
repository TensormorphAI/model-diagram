/*
Copyright (c) Tensormorph. All rights reserved.

See LICENSE in the project root for license information.
*/

import '@tensormorph/tensordiagramcore/css/common.css'; // required by RubberBandHandler
import './style.css';
import {
  constants,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  ModelXmlSerializer,
  RubberBandHandler,
} from '@tensormorph/tensordiagramcore';

const xmlWithVerticesAndEdges = `<GraphDataModel>
    <root>
      <Cell id="0">
        <Object as="style" />
      </Cell>
      <Cell id="1" parent="0">
        <Object as="style" />
      </Cell>
      <Cell id="v1" value="vertex 1" vertex="1" parent="1">
        <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry" />
        <Object fillColor="green" strokeWidth="4" as="style" />
      </Cell>
      <Cell id="v2" value="vertex 2" vertex="1" parent="1">
        <Geometry _x="0" _y="0" _width="100" _height="80" as="geometry" />
        <Object bendable="0" rounded="1" fontColor="yellow" as="style" />
      </Cell>
      <Cell id="e1" edge="1" parent="1" source="v1" target="v2">
        <Geometry as="geometry">
          <Array as="points">
            <Point _x="240" _y="100" />
            <Point _x="210" _y="80" />
            <Point _x="140" _y="80" />
          </Array>
        </Geometry>
        <Object as="style" />
      </Cell>
    </root>
  </GraphDataModel>
`;

const initializeGraph = (container) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new Graph(container, undefined, [
    ...getDefaultPlugins(),
    RubberBandHandler, // Enables rubber band selection
  ]);
  graph.setPanning(true); // Use mouse right button for panning

  const modelXmlSerializer = new ModelXmlSerializer(graph.model);
  modelXmlSerializer.import(xmlWithVerticesAndEdges);

  return graph;
};

// display the TensorDiagram version in the footer
const footer = document.querySelector('footer');
footer.innerText = `Built with TensorDiagram ${constants.VERSION}`;

// Creates the graph inside the given container
const container = document.querySelector('#graph-container');
const graph = initializeGraph(container);

// poor way to display the XML
const popup = (content) => {
  window.alert(content);
};

// Control buttons
document.getElementById('view-original-xml').addEventListener('click', () => {
  popup(xmlWithVerticesAndEdges);
});
document.getElementById('export-xml').addEventListener('click', () => {
  const xml = new ModelXmlSerializer(graph.model).export();
  popup(xml);
});

// Shared by the scenario files. `page` is a Playwright page showing the showcase.

/** Clicks the toolbar button of the current demo carrying `data-action="<action>"`. */
export const click = (page, action) => page.locator(`[data-action="${action}"]`).click();

/** Runs `fn(graph)` in the page, with the graph of the current demo. `fn` must be self-contained. */
export const withGraph = (page, fn, arg) =>
  page.evaluate(
    ([source, value]) =>
      new Function('graph', 'arg', `return (${source})(graph, arg)`)(
        window.__showcase.graph,
        value
      ),
    [fn.toString(), arg]
  );

/** Number of children of the default parent: vertices and edges of the top level. */
export const cellCount = (page) =>
  withGraph(page, (graph) => graph.getDefaultParent().getChildCount());

/** Geometries of the children of the default parent, as a string to compare before and after an action. */
export const geometries = (page) =>
  withGraph(page, (graph) =>
    graph
      .getDefaultParent()
      .children.map((cell) => {
        const g = cell.getGeometry();
        return g ? `${g.x},${g.y},${g.width},${g.height}` : '-';
      })
      .join(';')
  );

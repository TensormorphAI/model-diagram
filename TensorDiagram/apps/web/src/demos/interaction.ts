import {
  type Cell,
  CellOverlay,
  type CellState,
  CellTracker,
  Client,
  getDefaultPlugins,
  Graph,
  ImageBox,
  InternalEvent,
  type InternalMouseEvent,
  type PopupMenuHandler,
  RubberBandHandler,
  type TooltipHandler,
} from '@tensormorph/tensordiagramcore';
import type { Demo } from '../types.js';

const svgIcon = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">${body}</svg>`)}`;
const duplicateIcon = svgIcon(
  '<rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="#fff" stroke="#2563eb"/><rect x="5.5" y="5.5" width="9" height="9" rx="1" fill="#dbeafe" stroke="#2563eb"/>'
);
const deleteIcon = svgIcon(
  '<circle cx="8" cy="8" r="7" fill="#fee2e2" stroke="#dc2626"/><path d="M5 5l6 6M11 5l-6 6" stroke="#dc2626" stroke-width="1.6"/>'
);

export const interaction: Demo = {
  id: 'interaction',
  title: 'Overlays, menus, tooltips',
  group: 'Interaction',
  description:
    'Clickable cell overlays, tooltips computed per cell, a context menu built on each right click, icons shown while hovering a vertex and a highlight following the mouse.',
  hints: [
    'Click the warning icon of a vertex, right-click a vertex to toggle it',
    'Right-click a cell or the background to open the context menu',
    'Hover a vertex to show its duplicate and delete icons, and wait on a cell for its tooltip',
  ],
  mount(ctx) {
    const graph = ctx.useGraph(
      new Graph(ctx.container, undefined, [...getDefaultPlugins(), RubberBandHandler])
    );
    graph.setTooltips(true);
    graph.setConnectable(true);

    const label = (cell: Cell | null) => (cell ? graph.convertValueToString(cell) : '');

    const toggleWarning = (cell: Cell) => {
      if (graph.getCellOverlays(cell).length > 0) {
        graph.removeCellOverlays(cell);
        return ctx.log(`Warning removed from "${label(cell)}"`);
      }
      const overlay = new CellOverlay(
        new ImageBox(`${Client.imageBasePath}/warning.gif`, 16, 16),
        `"${label(cell)}" needs attention, click for details`
      );
      overlay.addListener(InternalEvent.CLICK, () =>
        ctx.log(`Overlay clicked: "${label(cell)}" has 1 open issue`)
      );
      graph.addCellOverlay(cell, overlay);
      ctx.log(`Warning added to "${label(cell)}"`);
    };

    let count = 0;
    const addVertex = (x: number, y: number) =>
      graph.insertVertex({ value: `Node ${++count}`, position: [x, y], size: [100, 40] });

    // Tooltips: on the plugin instance, never on the prototype
    const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler');
    if (tooltipHandler) {
      tooltipHandler.getTooltipForCell = (cell) =>
        cell.isEdge()
          ? `Edge from "${label(cell.getTerminal(true))}" to "${label(cell.getTerminal(false))}"`
          : `"${label(cell)}": ${cell.getEdgeCount()} edge(s)`;
    }

    // Context menu: built again on each right click by the factory method
    const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');
    if (popupMenuHandler) {
      popupMenuHandler.factoryMethod = (menu, cell, evt) => {
        if (cell) {
          menu.addItem('Toggle warning', null, () => toggleWarning(cell));
          menu.addItem('Duplicate', null, () => {
            graph.setSelectionCells(graph.moveCells([cell], 20, 20, true));
            ctx.log(`Menu: duplicated "${label(cell)}"`);
          });
          menu.addSeparator();
          menu.addItem('Delete', null, () => {
            graph.removeCells([cell]);
            ctx.log(`Menu: deleted "${label(cell)}"`);
          });
        } else {
          const point = graph.getPointForEvent(evt);
          menu.addItem('Add vertex here', null, () => {
            graph.setSelectionCell(addVertex(point.x, point.y));
            ctx.log('Menu: vertex added');
          });
          menu.addItem('Select all', null, () => {
            graph.selectAll();
            ctx.log('Menu: all selected');
          });
        }
      };
    }

    // Highlights the cell under the mouse
    ctx.dispose(new CellTracker(graph, '#22c55e'));

    // Hover icons, shown next to the vertex under the mouse
    let icons: HTMLImageElement[] = [];
    let hovered: CellState | null = null;
    const hideIcons = () => {
      for (const icon of icons) icon.remove();
      icons = [];
      hovered = null;
    };
    const createIcon = (
      src: string,
      title: string,
      x: number,
      y: number,
      action: () => void
    ) => {
      const icon = document.createElement('img');
      Object.assign(icon, { src, title });
      icon.className = 'hover-icon';
      icon.dataset.icon = title.toLowerCase();
      Object.assign(icon.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        cursor: 'pointer',
      });
      // consumed, so that the graph does not start a rubber band or a move
      InternalEvent.addGestureListeners(icon, (evt) => InternalEvent.consume(evt));
      icon.addEventListener('click', (evt) => {
        action();
        hideIcons();
        InternalEvent.consume(evt);
      });
      graph.container.append(icon);
      icons.push(icon);
    };
    const showIcons = (state: CellState) => {
      hovered = state;
      const cell = state.cell;
      createIcon(
        duplicateIcon,
        'Duplicate',
        state.x + state.width + 2,
        state.y + state.height - 16,
        () => {
          graph.setSelectionCells(graph.moveCells([cell], 20, 20, true));
          ctx.log(`Hover icon: duplicated "${label(cell)}"`);
        }
      );
      createIcon(deleteIcon, 'Delete', state.x + state.width + 2, state.y - 16, () => {
        graph.removeCells([cell]);
        ctx.log(`Hover icon: deleted "${label(cell)}"`);
      });
    };
    const tolerance = 20;
    graph.addMouseListener({
      mouseDown: () => hideIcons(),
      mouseMove: (_sender: unknown, me: InternalMouseEvent) => {
        // keep the icons while the mouse travels from the vertex to them
        if (hovered && (me.getState() === hovered || !me.getState())) {
          const x = me.getGraphX();
          const y = me.getGraphY();
          const { x: sx, y: sy, width, height } = hovered;
          if (
            x > sx - tolerance &&
            x < sx + width + tolerance &&
            y > sy - tolerance &&
            y < sy + height + tolerance
          ) {
            return;
          }
        }
        const state = graph.isMouseDown ? null : me.getState();
        const vertexState = state?.cell.isVertex() ? state : null;
        if (vertexState !== hovered) {
          hideIcons();
          if (vertexState) showIcons(vertexState);
        }
      },
      mouseUp: () => {},
    });

    graph.batchUpdate(() => {
      const web = graph.insertVertex({
        value: 'Web',
        position: [60, 60],
        size: [100, 40],
      });
      const api = graph.insertVertex({
        value: 'API',
        position: [300, 60],
        size: [100, 40],
        style: { fillColor: '#dbeafe', strokeColor: '#2563eb' },
      });
      const db = graph.insertVertex({
        value: 'Database',
        position: [300, 220],
        size: [100, 60],
        style: { shape: 'cylinder', fillColor: '#fef3c7' },
      });
      graph.insertEdge({ value: 'HTTP', source: web, target: api });
      graph.insertEdge({ value: 'SQL', source: api, target: db });
      toggleWarning(db);
    });

    ctx.button(
      'Toggle warning on selection',
      () => graph.getSelectionCells().forEach(toggleWarning),
      'toggle-warning'
    );
    ctx.button(
      'Remove all overlays',
      () => {
        for (const cell of graph.getDefaultParent().getChildren())
          graph.removeCellOverlays(cell);
        ctx.log('All overlays removed');
      },
      'remove-overlays'
    );
  },
};

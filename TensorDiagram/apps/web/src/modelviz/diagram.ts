// DiagramSpec -> TensorDiagram cells, see apps/web/MASTER_ARCHITECTURE.md §6.
// Style and geometry constants are those of template/render.py (template/DESIGN.md §4 and §5.2).
import {
  type AbstractGraph,
  type Cell,
  type CellStyle,
  Point,
} from '@tensormorph/tensordiagramcore';
import type { Arch, Box, Cat, DiagramSpec, Item, Op, Panel } from './spec.js';

const FILL: Record<Cat, string> = {
  emb: '#fadbde',
  norm: '#f1f4c2',
  attn: '#fde1b9',
  ff: '#c5e7f6',
  lin: '#dadcf1',
  soft: '#cbe8d4',
  plain: '#ffffff',
  group: '#f2f2f2',
  dots: 'none',
};
const ARCH: Record<Arch, { light: string; dark: string; accent: string }> = {
  Dense: { light: '#dfe2fa', dark: '#9aa2e8', accent: '#4652c8' },
  MoE: { light: '#d4ecfa', dark: '#6db7e6', accent: '#1677c2' },
  Hybrid: { light: '#ffe8cc', dark: '#f3a95e', accent: '#d4690f' },
  Recurrent: { light: '#d6f0de', dark: '#77c690', accent: '#1f8a52' },
};
const FONT = 'Segoe UI, Helvetica, Arial, sans-serif';
const MONO = 'Consolas, Menlo, monospace';
const INK = '#111';
const MUTED = '#555';
const LINK = '#2b2b2b';

const CALLOUT_X = 30;
const FRAME = [240, 672];
const BLOCK = [326, 636];
const CX = 488;
const BOX_W = 206;
const G = 18;
const RES_X = 350;
const LANES1 = [686, 700, 714, 728, 742, 756];
const GRID_X = 790;
const COL_GAP = 84;
const TOP = 128;
// panel engine, DESIGN.md §5.5
const COL = 116;
const PBW = 102;
const CHAIN_W = 170;
const PAD = 14;
const ROW_GAP = 22;

const isOp = (item: Item): item is Op => 'op' in item;
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const zoomIds = (item: Item): string[] =>
  isOp(item) || !item.zoom ? [] : [item.zoom].flat();

const text = (extra: CellStyle = {}): CellStyle => ({
  fillColor: 'none',
  strokeColor: 'none',
  fontFamily: FONT,
  fontColor: INK,
  whiteSpace: 'wrap',
  ...extra,
});
const boxValue = (b: Box, capSize: number) =>
  escape(b.label) +
  (b.cap
    ? `<br><span style="font-size:${capSize}px;color:${MUTED}">${escape(b.cap)}</span>`
    : '');
const boxStyle = (b: Box, fontSize: number): CellStyle =>
  b.cat === 'dots'
    ? text({ fontSize: 16, fontStyle: 1 })
    : {
        rounded: true,
        absoluteArcSize: true,
        arcSize: 14,
        fillColor: FILL[b.cat] ?? '#fff',
        strokeColor: INK,
        strokeWidth: 1.5,
        shadow: true,
        fontFamily: FONT,
        fontSize,
        fontColor: INK,
        whiteSpace: 'wrap',
        foldable: false,
      };
const OP_STYLE: CellStyle = {
  shape: 'ellipse',
  perimeter: 'ellipsePerimeter',
  fillColor: '#fff',
  strokeColor: INK,
  strokeWidth: 1.8,
  shadow: true,
  fontSize: 15,
  fontStyle: 1,
  fontColor: INK,
  editable: false,
};
const DOT_STYLE: CellStyle = {
  shape: 'ellipse',
  perimeter: 'ellipsePerimeter',
  fillColor: INK,
  strokeColor: INK,
  editable: false,
  resizable: false,
};
const FLOW: CellStyle = {
  strokeColor: INK,
  strokeWidth: 1.8,
  endArrow: 'block',
  endSize: 5,
};
const ZOOM: CellStyle = {
  strokeColor: LINK,
  strokeWidth: 2.2,
  dashed: true,
  dashPattern: '1 5',
  endArrow: 'block',
  endSize: 4,
};

type XY = [number, number];
interface LinkOptions {
  exit?: XY;
  entry?: XY;
  points?: XY[];
  /** dangling ends, in absolute coordinates */
  from?: XY;
  to?: XY;
}

/** Draws the diagram into the default parent. Call it inside a batchUpdate, on an empty graph. */
export const drawDiagram = (graph: AbstractGraph, d: DiagramSpec): void => {
  const accent = ARCH[d.arch[0]]?.accent ?? ARCH.Dense.accent;
  const origins = new Map<Cell, XY>();
  const originOf = (parent?: Cell): XY => (parent ? origins.get(parent)! : [0, 0]);
  const rel = ([x, y]: XY, parent?: Cell) => {
    const [ox, oy] = originOf(parent);
    return new Point(x - ox, y - oy);
  };

  /** Inserts a vertex at absolute coordinates, whatever its parent. */
  const vertex = (
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    style: CellStyle,
    parent?: Cell
  ) => {
    const [ox, oy] = originOf(parent);
    const cell = graph.insertVertex({
      parent,
      value,
      position: [x - ox, y - oy],
      size: [w, h],
      style,
    });
    origins.set(cell, [x, y]);
    return cell;
  };

  const link = (
    source: Cell | undefined,
    target: Cell | undefined,
    style: CellStyle,
    o: LinkOptions = {}
  ) => {
    // a dangling end belongs to its only terminal, so that it moves along with that terminal's container
    const parent =
      (source && target
        ? source.parent === target.parent
          ? source.parent
          : undefined
        : (source ?? target)?.parent) ?? undefined;
    const edge = graph.insertEdge({
      parent,
      source,
      target,
      style: {
        ...style,
        ...(o.exit && { exitX: o.exit[0], exitY: o.exit[1], exitPerimeter: false }),
        ...(o.entry && { entryX: o.entry[0], entryY: o.entry[1], entryPerimeter: false }),
      },
    });
    const geometry = edge.getGeometry()!;
    if (o.points) geometry.points = o.points.map((p) => rel(p, parent));
    if (o.from) geometry.setTerminalPoint(rel(o.from, parent), true);
    if (o.to) geometry.setTerminalPoint(rel(o.to, parent), false);
    return edge;
  };

  /** Vertical arrow from `lower` up to `upper`, both centered on the same x. */
  const up = (lower: Cell, upper: Cell, style = FLOW) =>
    link(lower, upper, style, { exit: [0.5, 0], entry: [0.5, 1] });

  // ---------------------------------------------------------------- header
  const params = d.params ? ` (${d.params})` : '';
  vertex(
    escape(d.title + params),
    CALLOUT_X,
    20,
    1000,
    50,
    text({ fontSize: 40, fontStyle: 1, fontColor: accent, align: 'left' })
  );
  let chipX = CALLOUT_X;
  const chip = (label: string, style: CellStyle) => {
    const w = Math.round(label.length * 7.6 + 26);
    vertex(escape(label), chipX, 82, w, 26, {
      rounded: true,
      arcSize: 50,
      strokeColor: '#2a2a2a',
      fontFamily: FONT,
      fontSize: 13,
      fontColor: INK,
      ...style,
    });
    chipX += w + 8;
  };
  for (const arch of d.arch)
    chip(arch, {
      fillColor: ARCH[arch]?.light,
      gradientColor: ARCH[arch]?.dark,
      gradientDirection: 'east',
      fontStyle: 1,
    });
  if (d.active) chip(`${d.active} active per token`, { fillColor: '#fff' });
  if (d.layers)
    chip(/layer/.test(d.layers) ? d.layers : `${d.layers} layers`, { fillColor: '#fff' });
  if (d.context) chip(`${d.context} context`, { fillColor: '#fff' });

  // ---------------------------------------------------------------- main stack, top-down
  const zoomSources: { cell: Cell; cy: number; ids: string[]; laneX?: number }[] = [];
  const flow: Cell[] = []; // top to bottom
  const dots = new Set<Cell>();
  let y = TOP;

  const logits = vertex(
    'Next-token logits',
    CX - 80,
    y,
    160,
    20,
    text({ fontFamily: MONO, fontSize: 13 })
  );
  flow.push(logits);
  y += 20 + G;

  const frameTop = y;
  const frame = vertex('', FRAME[0], frameTop, FRAME[1] - FRAME[0], 0, {
    rounded: true,
    absoluteArcSize: true,
    arcSize: 68,
    fillColor: '#ececec',
    gradientColor: '#d6d6d6',
    strokeColor: '#2a2a2a',
    strokeWidth: 1.8,
    foldable: false,
    editable: false,
  });
  y += 22;

  const stackBox = (b: Box, parent: Cell) => {
    const h = b.cap ? 42 : 30;
    const cell = vertex(
      boxValue(b, 10.5),
      CX - BOX_W / 2,
      y,
      BOX_W,
      h,
      boxStyle(b, 13.5),
      parent
    );
    if (b.zoom) zoomSources.push({ cell, cy: y + h / 2, ids: zoomIds(b) });
    flow.push(cell);
    y += h + G;
    return cell;
  };

  for (const b of [...(d.head ?? [])].reverse()) stackBox(b, frame);
  const output = stackBox(
    { label: 'Linear output layer', cat: 'lin', cap: d.outputCap },
    frame
  );
  stackBox({ label: d.final ?? 'Final RMSNorm', cat: 'norm' }, frame);
  for (const b of [...(d.post ?? [])].reverse()) stackBox(b, frame);

  for (const block of [...d.blocks].reverse()) {
    const blockTop = y;
    const titled = block.title !== 'Transformer block';
    const bg = vertex(
      titled ? `<b>${escape(block.title)}</b>` : '',
      BLOCK[0],
      blockTop,
      BLOCK[1] - BLOCK[0],
      0,
      {
        rounded: true,
        absoluteArcSize: true,
        arcSize: 56,
        strokeColor: '#2a2a2a',
        strokeWidth: 1.8,
        foldable: false,
        fillColor: ARCH[d.arch[0]]?.light,
        gradientColor: ARCH[d.arch[d.arch.length - 1]]?.dark,
        verticalAlign: 'top',
        fontFamily: FONT,
        fontSize: 12.5,
        fontColor: INK,
        spacingTop: 6,
      },
      frame
    );
    y += 18 + (titled ? 20 : 0);
    for (const sublayer of [...block.sublayers].reverse()) {
      const op = vertex('+', CX - 11, y, 22, 22, OP_STYLE, bg);
      flow.push(op);
      y += 22 + G;
      for (const b of [...sublayer].reverse()) stackBox(b, bg);
      y -= G - 12;
      const dot = vertex('', CX - 3.5, y - 3.5, 7, 7, DOT_STYLE, bg);
      flow.push(dot);
      dots.add(dot);
      // residual: from the junction, out to the left lane, into ⊕ from the left
      link(dot, op, FLOW, {
        exit: [0, 0.5],
        entry: [0, 0.5],
        points: [
          [RES_X, y],
          [RES_X, origins.get(op)![1] + 11],
        ],
      });
      y += 12 + G;
    }
    const blockBottom = y - G + 4;
    bg.getGeometry()!.height = blockBottom - blockTop;
    const mid = (blockTop + blockBottom) / 2;
    vertex(
      escape(block.repeat),
      BLOCK[0] - 82,
      mid - 14,
      74,
      28,
      text({ fontSize: 19, fontStyle: 1, fontColor: accent, align: 'right' }),
      frame
    );
    y = blockBottom + G;
  }

  for (const b of [...(d.pre ?? [])].reverse()) stackBox(b, frame);
  const embedding = stackBox({ label: 'Token embedding layer', cat: 'emb' }, frame);
  const frameBottom = y - G + 22;
  frame.getGeometry()!.height = frameBottom - frameTop;
  y = frameBottom + G;
  flow.push(
    vertex(
      'Tokenizer',
      CX - BOX_W / 2,
      y,
      BOX_W,
      30,
      boxStyle({ label: '', cat: 'emb' }, 13.5)
    )
  );
  y += 30 + G;
  flow.push(
    vertex(
      escape(`“${d.input ?? 'Sample input text'}”`),
      CX - 100,
      y,
      200,
      22,
      text({ fontFamily: MONO, fontSize: 14 })
    )
  );

  for (let i = flow.length - 1; i > 0; i--)
    up(
      flow[i],
      flow[i - 1],
      dots.has(flow[i - 1]) ? { ...FLOW, endArrow: 'none' } : FLOW
    );

  // callouts on the left, dotted leader to the box
  const callout = (lines: string, value: string, box: Cell) => {
    const [, by] = origins.get(box)!;
    const h = box.getGeometry()!.height;
    const cell = vertex(
      `${escape(lines)}<br><span style="color:${accent}">${escape(value)}</span>`,
      CALLOUT_X,
      by + h / 2 - 22,
      205,
      44,
      text({ fontSize: 15, fontStyle: 1, align: 'left' })
    );
    link(cell, box, { ...ZOOM, endArrow: 'none' }, { exit: [1, 0.5], entry: [0, 0.5] });
  };
  if (d.vocab) callout('Vocabulary size of', d.vocab, output);
  if (d.dModel) callout('Embedding dimension of', d.dModel, embedding);

  // ---------------------------------------------------------------- zoom panels
  const panels = new Map(d.panels.map((p) => [p.id, p]));
  for (const source of zoomSources)
    for (const id of source.ids)
      if (!panels.has(id)) throw new Error(`zoom "${id}" has no panel`);

  const placed = new Map<
    string,
    { cell: Cell; x: number; y: number; w: number; h: number }
  >();
  const place = (p: Panel, x: number, top: number) => {
    const layout = layoutPanel(p);
    const titleH = 22 + Math.ceil(((p.sub?.length ?? 0) * 6.2) / layout.w) * 15;
    const py = top + titleH;
    const title =
      `<b style="font-size:14.5px">${escape(p.title)}</b>` +
      (p.sub
        ? `<br><span style="font-size:11px;color:${MUTED}">${escape(p.sub)}</span>`
        : '');
    const cell = vertex(title, x, py, layout.w, layout.h, {
      rounded: true,
      absoluteArcSize: true,
      arcSize: 36,
      fillColor: '#f4f4f4',
      gradientColor: '#e4e4e4',
      strokeColor: INK,
      strokeWidth: 2.2,
      dashed: true,
      dashPattern: '1.5 4.5',
      foldable: false,
      verticalLabelPosition: 'top',
      verticalAlign: 'bottom',
      align: 'left',
      spacingBottom: 4,
      fontFamily: FONT,
      fontSize: 11,
      fontColor: INK,
    });
    placed.set(p.id, { cell, x, y: py, w: layout.w, h: layout.h });
    const inner = layout.render(cell);
    // children (Expert N -> FFN) to the right, top-aligned, stacked
    let childTop = top;
    for (const { item, cy } of inner) {
      for (const id of zoomIds(item)) {
        const child = panels.get(id);
        if (!child) throw new Error(`zoom "${id}" has no panel`);
        zoomSources.push({
          cell: cellOf.get(item)!,
          cy: py + cy,
          ids: [id],
          laneX: x + layout.w + COL_GAP / 2,
        });
        if (placed.has(id)) continue;
        childTop = place(child, x + layout.w + COL_GAP, childTop) + ROW_GAP;
      }
    }
    return py + layout.h;
  };

  const cellOf = new Map<Item, Cell>();
  /** Lays a panel out in its own coordinates, DESIGN.md §5.5. render() draws it and lists the boxes with a zoom. */
  const layoutPanel = (p: Panel) => {
    const columns = p.columns ?? [];
    const chain = [...(p.chain ?? [])];
    const merge = p.merge ?? (columns.length ? chain.shift() : undefined);
    const gate = p.gate ?? [];
    const nCols = columns.length + (gate.length ? 1 : 0);
    const w = Math.max(300, nCols * COL + 28);
    const ih = (item: Item) => (isOp(item) ? 22 : item.cap ? 40 : 28);
    const colsX0 = (w - nCols * COL) / 2;
    const colCX = (i: number) => colsX0 + i * COL + COL / 2;
    const center = columns.length ? (colCX(0) + colCX(columns.length - 1)) / 2 : w / 2;
    const colH = (col: Item[]) =>
      col.reduce((s, it) => s + ih(it), 0) + G * (col.length - 1);
    const maxH = Math.max(0, ...columns.map(colH), gate.length ? colH(gate) : 0);

    interface Node {
      item: Item;
      x: number;
      y: number;
      w: number;
      h: number;
    }
    const node = (item: Item, cx: number, top: number, width: number): Node => {
      const h = ih(item);
      const nw = isOp(item) ? 22 : width;
      return { item, x: cx - nw / 2, y: top, w: nw, h };
    };
    let cy = PAD + G;
    const chainNodes = [...chain].reverse().map((it) => {
      const n = node(it, center, cy, CHAIN_W);
      cy += n.h + G;
      return n;
    });
    let mergeNode: Node | undefined;
    if (merge) {
      const span = columns.length ? colCX(columns.length - 1) - colCX(0) + PBW : CHAIN_W;
      mergeNode = node(merge, center, cy, Math.max(CHAIN_W, span));
      cy += mergeNode.h + G;
    }
    const colBottom = cy + maxH;
    const stackCol = (col: Item[], cx: number) => {
      let bottom = colBottom;
      return col.map((it) => {
        const n = node(it, cx, bottom - ih(it), PBW);
        bottom = n.y - G;
        return n;
      });
    };
    const colNodes = columns.map((col, i) => stackCol(col, colCX(i)));
    const gateNodes = gate.length ? stackCol(gate, colCX(columns.length)) : [];
    cy = colBottom + (maxH ? G : 0);
    let baseNode: Node | undefined;
    if (p.base) {
      const cols = p.base.cols;
      const x0 = colCX(Math.min(...cols)) - PBW / 2;
      const x1 = colCX(Math.max(...cols)) + PBW / 2;
      baseNode = { item: p.base, x: x0, y: cy, w: x1 - x0, h: ih(p.base) };
      cy += baseNode.h + G;
    }
    const busY = cy + 4;
    const h = (p.bus === false ? cy - G : busY + G) + PAD;

    const render = (panel: Cell) => {
      const [px, py] = origins.get(panel)!;
      const abs = (x: number, yy: number): XY => [px + x, py + yy];
      const draw = (n: Node) => {
        const cell = isOp(n.item)
          ? vertex(escape(n.item.op), px + n.x, py + n.y, n.w, n.h, OP_STYLE, panel)
          : vertex(
              boxValue(n.item, 10),
              px + n.x,
              py + n.y,
              n.w,
              n.h,
              boxStyle(n.item, n.w > PBW ? 12 : 11),
              panel
            );
        cellOf.set(n.item, cell);
        return cell;
      };
      const all = [
        ...chainNodes,
        ...(mergeNode ? [mergeNode] : []),
        ...colNodes.flat(),
        ...gateNodes,
        ...(baseNode ? [baseNode] : []),
      ];
      const cells = new Map(all.map((n) => [n, draw(n)]));
      const c = (n: Node) => cells.get(n)!;
      const ncx = (n: Node) => n.x + n.w / 2;

      // chain: merge -> chain, bottom to top; output stub to the top border
      const ladder = [...(mergeNode ? [mergeNode] : []), ...[...chainNodes].reverse()];
      for (let i = 1; i < ladder.length; i++) up(c(ladder[i - 1]), c(ladder[i]));
      const topNode = ladder[ladder.length - 1];
      if (topNode)
        link(c(topNode), undefined, FLOW, { exit: [0.5, 0], to: abs(ncx(topNode), 0) });

      // column tops -> merge: straight up into a wide box, an elbow into the side of an op
      for (const top of colNodes.map((col) => col[col.length - 1])) {
        if (!mergeNode || !top) continue;
        const fx = ncx(top);
        const mx = ncx(mergeNode);
        if (!isOp(mergeNode.item))
          link(c(top), c(mergeNode), FLOW, {
            exit: [0.5, 0],
            entry: [(fx - mergeNode.x) / mergeNode.w, 1],
          });
        else if (Math.abs(fx - mx) < 1) up(c(top), c(mergeNode));
        else
          link(c(top), c(mergeNode), FLOW, {
            exit: [0.5, 0],
            entry: [fx < mx ? 0 : 1, 0.5],
            points: [abs(fx, mergeNode.y + mergeNode.h / 2)],
          });
      }
      for (const col of [...colNodes, gateNodes])
        for (let i = 1; i < col.length; i++) up(c(col[i - 1]), c(col[i]));

      // gate column -> the chain op that takes it, from the right
      const gateOp = chainNodes.find((n) => isOp(n.item) && n.item.gateIn);
      const gateTop = gateNodes[gateNodes.length - 1];
      if (gateOp && gateTop)
        link(c(gateTop), c(gateOp), FLOW, {
          exit: [0.5, 0],
          entry: [1, 0.5],
          points: [abs(ncx(gateTop), gateOp.y + 11)],
        });

      // inputs: base -> its columns; bus dot -> base and the other columns
      const baseCols = new Set(p.base?.cols ?? []);
      if (baseNode)
        colNodes.forEach((col, i) => {
          if (baseCols.has(i) && col[0])
            link(c(baseNode), c(col[0]), FLOW, {
              exit: [(ncx(col[0]) - baseNode.x) / baseNode.w, 0],
              entry: [0.5, 1],
            });
        });
      const fed: Node[] = [
        ...(baseNode ? [baseNode] : []),
        ...colNodes.filter((col, i) => !baseCols.has(i) && col[0]).map((col) => col[0]),
        ...(gateNodes[0] ? [gateNodes[0]] : []),
      ];
      if (!columns.length && ladder[0]) fed.push(ladder[0]);
      if (p.bus !== false && fed.length) {
        const dotX = baseNode ? ncx(baseNode) : ncx(fed[0]);
        const dot = vertex('', px + dotX - 3.5, py + busY - 3.5, 7, 7, DOT_STYLE, panel);
        link(
          undefined,
          dot,
          { ...FLOW, endArrow: 'none' },
          { entry: [0.5, 1], from: abs(dotX, h) }
        );
        for (const n of fed) {
          const x = ncx(n);
          link(
            dot,
            c(n),
            FLOW,
            Math.abs(x - dotX) < 1
              ? { exit: [0.5, 0], entry: [(x - n.x) / n.w, 1] }
              : { exit: [x < dotX ? 0 : 1, 0.5], entry: [0.5, 1], points: [abs(x, busY)] }
          );
        }
      }
      return all
        .filter((n) => zoomIds(n.item).length)
        .map((n) => ({ item: n.item, cy: n.y + n.h / 2 }));
    };
    return { w, h, render };
  };

  // column 1, in the order of the sources, each near its source
  let cursor = TOP;
  const stackSources = [...zoomSources].sort((a, b) => a.cy - b.cy);
  for (const { ids, cy } of stackSources)
    for (const id of ids) {
      if (placed.has(id)) continue;
      cursor = place(panels.get(id)!, GRID_X, Math.max(cursor, cy - 90)) + ROW_GAP;
    }
  for (const p of d.panels)
    if (!placed.has(p.id)) cursor = place(p, GRID_X, cursor) + ROW_GAP;

  // zoom links: straight when the source faces the panel, else an elbow through a lane
  let lane = 0;
  for (const source of zoomSources) {
    source.ids.forEach((id, k) => {
      const target = placed.get(id)!;
      const exitY = source.ids.length > 1 ? (k ? 0.68 : 0.32) : 0.5;
      const sh = source.cell.getGeometry()!.height;
      const sy = source.cy + (exitY - 0.5) * sh;
      if (sy > target.y + 12 && sy < target.y + target.h - 12) {
        link(source.cell, target.cell, ZOOM, {
          exit: [1, exitY],
          entry: [0, (sy - target.y) / target.h],
        });
      } else {
        const laneX = source.laneX ?? LANES1[lane++ % LANES1.length];
        const ty = sy < target.y ? target.y + 24 : target.y + target.h - 24;
        link(source.cell, target.cell, ZOOM, {
          exit: [1, exitY],
          entry: [0, (ty - target.y) / target.h],
          points: [
            [laneX, sy],
            [laneX, ty],
          ],
        });
      }
    });
  }
};

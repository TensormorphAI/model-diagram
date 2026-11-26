#!/usr/bin/env python3
"""Universal LLM architecture template -> poster-style SVG infographic.

Slots (same for every model):
  header : "<Model> (<total params>)" · arch chips (Dense/MoE/Hybrid/Recurrent) · active · layers · context
  tower  : input -> tokenizer -> token embedding -> [pre] -> main block(s) xN -> [post] -> final norm
           -> linear output layer -> logits; callouts "Vocabulary size of ..." / "Embedding dimension of ..."
  zooms  : inset panels on the right, each linked by a dotted arrow from the component it expands
Style follows the originals in models/: grey model frame, gradient main block (colour = architecture),
shadowed module boxes, filled-triangle arrows, dotted insets with bold titles, bold callouts with
highlighted numbers. Text: Segoe UI; math symbols: KaTeX.

Model data lives in models.py. Usage:
  python3 template/render.py            # all models
  python3 template/render.py llama3     # files whose name contains "llama3"
Writes processed/<file>.svg and exits non-zero on any line overlap, crossing or collision.
"""
import re
import sys
from html import escape
from pathlib import Path

FILL = dict(norm="#f1f4c2", attn="#fde1b9", emb="#fadbde", ff="#c5e7f6", lin="#dadcf1",
            soft="#cbe8d4", plain="#ffffff", group="#f2f2f2")
# main-block gradient (light -> dark) and accent (title, numbers, repeat count) per architecture
ARCH = {
    "Dense": dict(light="#dfe2fa", dark="#9aa2e8", accent="#4652c8"),
    "MoE": dict(light="#d4ecfa", dark="#6db7e6", accent="#1677c2"),
    "Hybrid": dict(light="#ffe8cc", dark="#f3a95e", accent="#d4690f"),
    "Recurrent": dict(light="#d6f0de", dark="#77c690", accent="#1f8a52"),
}
FONT = "'Segoe UI', 'Segoe UI Variable', Helvetica, Arial, sans-serif"
MATH = "KaTeX_Main, 'Latin Modern Math', 'Cambria Math', 'Times New Roman', serif"
MATH_I = "KaTeX_Math, KaTeX_Main, 'Latin Modern Math', 'Cambria Math', serif"
MONO = "Consolas, Menlo, 'Courier New', monospace"
INK, MUTED, LINK = "#111", "#555", "#2b2b2b"
MATH_CH = set("×σαβφϕ→−·⊕⊗√∑")
GREEK = set("σαβφϕ")

# tower geometry
CALLOUT_X = 30
FRAME = (240, 672)
BLOCK = (326, 636)
RES_X = 350
CX, BOX_W = 488, 206
LANES1 = [686, 700, 714, 728, 742, 756]
GRID_X = 790
COL_GAP = 84
TOP = 128            # y where tower / grid start
G = 18               # vertical gap between stacked boxes


# ---------------------------------------------------------------- spec helpers
def B(label, cat="plain", cap=None, zoom=None, tag=None):
    """A module box. cat: norm|attn|emb|ff|lin|soft|plain|group|dots|op. cap starting with '$' is math."""
    return dict(label=label, cat=cat, cap=cap, zoom=zoom, tag=tag)


def OP(sym, gate_in=False):
    return dict(label=sym, cat="op", cap=None, zoom=None, tag=None, gate_in=gate_in)


def Block(title, repeat, sublayers, zoom=None):
    return dict(title=title, repeat=repeat, sublayers=sublayers, zoom=zoom)


# ---------------------------------------------------------------- text
def tw(s, fs, bold=False):
    return len(s.lstrip("$")) * fs * (0.57 if bold else 0.53)


def wrap(s, maxw, fs, bold=False):
    if not s:
        return []
    math = s.startswith("$")
    lines, cur = [], ""
    for word in s.lstrip("$").split():
        cand = f"{cur} {word}".strip()
        if cur and tw(cand, fs, bold) > maxw:
            lines.append(cur)
            cur = word
        else:
            cur = cand
    lines.append(cur)
    return ["$" + ln for ln in lines] if math else lines


def rich(s, accent=None):
    """SVG text content: math symbols in KaTeX, '$...' fully as math, numbers highlighted with accent."""
    if s.startswith("$"):
        return "".join(f'<tspan font-family="{MATH_I if c.isalpha() else MATH}"'
                       f'{" font-style=\"italic\"" if c.isalpha() else ""}>{escape(c)}</tspan>' for c in s[1:])
    out, buf = [], ""
    i = 0
    num = re.compile(r"\d[\d,.]*(?:\s?[kMBT]\b)?")
    while i < len(s):
        c = s[i]
        m = num.match(s, i) if accent and (i == 0 or not s[i - 1].isalnum()) else None
        if m:
            out.append(escape(buf))
            buf = ""
            out.append(f'<tspan fill="{accent}" font-weight="bold">{escape(m.group())}</tspan>')
            i = m.end()
            continue
        if c in MATH_CH:
            out.append(escape(buf))
            buf = ""
            fam = MATH_I if c in GREEK else MATH
            out.append(f'<tspan font-family="{fam}"{" font-style=\"italic\"" if c in GREEK else ""}>{escape(c)}</tspan>')
        else:
            buf += c
        i += 1
    out.append(escape(buf))
    return "".join(out)


# ---------------------------------------------------------------- scene
class Scene:
    def __init__(self, accent):
        self.accent = accent
        self.back, self.out, self.front = [], [], []
        self.nodes, self.segs, self.texts, self.walls = [], [], [], []
        self.exempt = {}     # link group -> panel it starts inside
        self.gid = 0

    def group(self):
        self.gid += 1
        return self.gid

    def text(self, x, y, s, fs, anchor="start", bold=False, fill=INK, font=FONT, check=True, owner=None,
             accent=None, layer=None):
        w = len(s) * fs * 0.6 if font == MONO else tw(s, fs, bold)
        (layer if layer is not None else self.out).append(
            f'<text x="{x:.1f}" y="{y:.1f}" font-family="{font}" font-size="{fs}" text-anchor="{anchor}"'
            f'{" font-weight=\"bold\"" if bold else ""} fill="{fill}">{rich(s, accent)}</text>')
        x0 = x - w / 2 if anchor == "middle" else x - w if anchor == "end" else x
        if check:
            self.texts.append((owner, (x0, y - fs * 0.78, x0 + w, y + fs * 0.24), s))
        return x0, x0 + w

    def measure(self, b, w, fs, cfs):
        if b["cat"] == "op":
            return 22, [], []
        lines = wrap(b["label"], w - 14, fs)
        caps = wrap(b["cap"], w - 12, cfs)
        h = 13 + len(lines) * fs * 1.22 + len(caps) * cfs * 1.25
        return max(28, round(h)), lines, caps

    def box(self, b, cx, y, w, h, fs, cfs, nid=None):
        """Draw box b centred on cx with top y. Returns bbox."""
        _, lines, caps = self.measure(b, w, fs, cfs)
        if b["cat"] == "op":
            r = 11
            cy = y + r
            self.out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="#fff" stroke="{INK}" stroke-width="1.8" filter="url(#sh)"/>')
            d = r * 0.58
            path = (f"M{cx-d:.1f},{cy:.1f} H{cx+d:.1f} M{cx:.1f},{cy-d:.1f} V{cy+d:.1f}" if b["label"] == "+"
                    else f"M{cx-d*.75:.1f},{cy-d*.75:.1f} L{cx+d*.75:.1f},{cy+d*.75:.1f} M{cx+d*.75:.1f},{cy-d*.75:.1f} L{cx-d*.75:.1f},{cy+d*.75:.1f}")
            self.out.append(f'<path d="{path}" stroke="{INK}" stroke-width="1.8"/>')
            bb = (cx - r, cy - r, cx + r, cy + r)
            self.nodes.append((nid, bb))
            return bb
        x0 = cx - w / 2
        if b["cat"] == "dots":
            self.text(cx, y + h / 2 + 5, "· · ·", 18, "middle", bold=True, font=MATH, check=False)
            return (x0, y, x0 + w, y + h)
        self.out.append(f'<rect x="{x0:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="7" '
                        f'fill="{FILL[b["cat"]]}" stroke="{INK}" stroke-width="1.5" filter="url(#sh)"/>')
        lh, clh = fs * 1.22, cfs * 1.25
        top = y + (h - len(lines) * lh - len(caps) * clh) / 2
        for i, s in enumerate(lines):
            self.text(cx, top + lh * i + fs * 0.88, s, fs, "middle", check=False)
        for i, s in enumerate(caps):
            self.text(cx, top + len(lines) * lh + clh * i + cfs * 0.98, s, cfs, "middle", fill=MUTED, check=False)
        bb = (x0, y, x0 + w, y + h)
        self.nodes.append((nid, bb))
        return bb

    def line(self, pts, g=None, arrow=True, link=False, leader=False, layer=None):
        g = g or self.group()
        d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        if link or leader:
            style = f'stroke="{LINK}" stroke-width="2.2" stroke-dasharray="1 5" stroke-linecap="round"'
        else:
            style = f'stroke="{INK}" stroke-width="1.8"'
        mark = f' marker-end="url(#{"lk" if link else "ar"})"' if arrow and not leader else ""
        (layer if layer is not None else self.out).append(f'<polyline points="{d}" fill="none" {style}{mark}/>')
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            assert abs(x1 - x2) < 0.01 or abs(y1 - y2) < 0.01, f"diagonal segment {pts}"
            self.segs.append((g, x1, y1, x2, y2))
        return g

    def dot(self, x, y, fill=INK, r=3.2, layer=None):
        (layer if layer is not None else self.out).append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}"/>')


# ---------------------------------------------------------------- checker
def _horiz(s):
    return abs(s[2] - s[4]) < 0.01


def seg_pair(a, b):
    ha, hb = _horiz(a), _horiz(b)
    if ha == hb:
        if ha and abs(a[2] - b[2]) < 1:
            lo, hi = max(min(a[1], a[3]), min(b[1], b[3])), min(max(a[1], a[3]), max(b[1], b[3]))
        elif not ha and abs(a[1] - b[1]) < 1:
            lo, hi = max(min(a[2], a[4]), min(b[2], b[4])), min(max(a[2], a[4]), max(b[2], b[4]))
        else:
            return None
        return f"overlap at {a[1:]}" if hi - lo > 1 else None
    h, v = (a, b) if ha else (b, a)
    x, y = v[1], h[2]
    if min(h[1], h[3]) + 1.5 < x < max(h[1], h[3]) - 1.5 and min(v[2], v[4]) + 1.5 < y < max(v[2], v[4]) - 1.5:
        return f"crossing at ({x:.0f},{y:.0f})"
    return None


def seg_rect(s, r, pad=2):
    x0, y0, x1, y1 = r
    if _horiz(s):
        return y0 + pad < s[2] < y1 - pad and min(s[1], s[3]) < x1 - pad and max(s[1], s[3]) > x0 + pad
    return x0 + pad < s[1] < x1 - pad and min(s[2], s[4]) < y1 - pad and max(s[2], s[4]) > y0 + pad


def check_segs(sc, new, others=None, walls=True):
    """Problems caused by the segments in `new` against the scene (and each other)."""
    out = []
    pool = sc.segs if others is None else others
    for i, a in enumerate(new):
        for b in pool:
            if a[0] != b[0] and (p := seg_pair(a, b)):
                out.append(p)
        for b in new[i + 1:]:
            if a[0] != b[0] and (p := seg_pair(a, b)):
                out.append(p)
        for nid, r in sc.nodes:
            if seg_rect(a, r):
                out.append(f"line through box {nid}")
        if walls:
            for nid, r in sc.walls:
                if sc.exempt.get(a[0]) != nid and seg_rect(a, r):
                    out.append(f"line through panel {nid}")
        for owner, r, s in sc.texts:
            if seg_rect(a, r, 0):
                out.append(f"text '{s}' hit by line")
    return out


def problems(sc):
    out = []
    for i, a in enumerate(sc.segs):
        out += check_segs(sc, [a], sc.segs[i + 1:], walls=a[0] >= 10_000)
    for i, (owner, (x0, y0, x1, y1), s) in enumerate(sc.texts):
        for nid, (a0, b0, a1, b1) in sc.nodes:
            if nid != owner and x0 < a1 and x1 > a0 and y0 < b1 and y1 > b0:
                out.append(f"text '{s}' overlaps box {nid}")
        for owner2, (a0, b0, a1, b1), s2 in sc.texts[i + 1:]:
            if x0 < a1 and x1 > a0 and y0 < b1 and y1 > b0:
                out.append(f"text '{s}' overlaps text '{s2}'")
    return out


# ---------------------------------------------------------------- zoom panel
PFS, PCFS, PG = 12, 10, 15


def panel_size(sc, p):
    cols = p.get("columns", [])
    n = len(cols) + (1 if p.get("gate") else 0)
    sp = 116
    w = max(300, n * sp + 28)
    p["_n"], p["_sp"], p["_w"] = n, sp, w
    p["_facts"] = wrap(p.get("sub", ""), w - 28, 11)
    p["_title"] = wrap(p["title"], max(w, 400), 14.5, True)
    return w, panel_layout(sc, p, 0, 0, draw=False)


def panel_layout(sc, p, px, py, draw=True):
    """Inset panel: input bus -> [base] -> columns -> merge -> chain (+ gate column) -> output.
    py is the panel box top (its title sits above it)."""
    cols = p.get("columns", [])
    gate = p.get("gate")
    allcols = cols + ([gate] if gate else [])
    n, sp, w = p["_n"], p["_sp"], p["_w"]
    cw = sp - 14
    c = px + w / 2
    xs = [c + (i - (n - 1) / 2) * sp for i in range(n)]
    main_xs = xs[:len(cols)]
    cm = (sum(main_xs) / len(main_xs)) if main_xs else c
    wide = max((max(main_xs) - min(main_xs) + cw) if main_xs else 0, 200)

    def hm(b, ww):
        return sc.measure(b, ww, PFS, PCFS)[0]

    header = 10 + 14 * len(p["_facts"]) + (6 if p["_facts"] else 0)
    rows = max((len(col) for col in allcols), default=0)
    row_h = [max((hm(col[r], cw) for col in allcols if len(col) > r), default=0) for r in range(rows)]
    chain = p.get("chain", [])
    chain_w = 170
    merge = p.get("merge")
    base = p.get("base")
    h = header + 22
    h += sum(hm(b, chain_w) + PG for b in chain)
    if merge:
        h += hm(merge, wide) + (26 if merge["cat"] == "op" else 20)
    h += sum(row_h) + PG * max(rows - 1, 0)
    if base:
        bcols = base.get("cols", range(len(main_xs)))
        bx = sum(xs[i] for i in bcols) / len(bcols)
        bw = max(xs[i] for i in bcols) - min(xs[i] for i in bcols) + cw
        h += 20 + hm(base, bw)
    if cols or gate:
        h += 18 if p.get("bus", True) else 4
    h += 24
    if not (cols or gate or merge):
        h -= PG
    if not draw:
        return h

    sc.back.append(f'<rect x="{px:.1f}" y="{py:.1f}" width="{w:.1f}" height="{h:.1f}" rx="18" fill="url(#pg)" '
                   f'stroke="{INK}" stroke-width="2.2" stroke-dasharray="1.5 4.5" stroke-linecap="round"/>')
    for i, s in enumerate(p["_title"]):
        sc.text(px + 4, py - 10 - 19 * (len(p["_title"]) - 1 - i), s, 14.5, bold=True)
    for i, s in enumerate(p["_facts"]):
        sc.text(px + 14, py + 20 + i * 14, s, 11, fill=MUTED, accent=sc.accent)
    sc.walls.append((p["id"], (px, py, px + w, py + h)))

    y = py + header + 22
    out_top = py + header + 2
    pid = p["id"]
    links = []

    def node(b, cx, top, ww, hh=None):
        bb = sc.box(b, cx, top, ww, hh or hm(b, ww), PFS, PCFS, nid=f"{pid}:{b['label']}")
        if b.get("zoom"):
            links.append((bb, b["zoom"]))
        return bb

    prev = None
    top_anchor = None
    chain_bbs = []
    for b in reversed(chain):
        hh = hm(b, chain_w)
        bb = node(b, cm, y, chain_w if b["cat"] != "op" else 22)
        chain_bbs.append((b, bb))
        if prev is None:
            top_anchor = bb[1]
        else:
            sc.line([(cm, bb[1]), (cm, prev[3])])
        prev = bb
        y += hh + PG
    if merge:
        mh_ = hm(merge, wide)
        if merge["cat"] == "op":
            y += 2
        mbb = node(merge, cm, y, wide if merge["cat"] != "op" else 22)
        if prev is not None:
            sc.line([(cm, mbb[1]), (cm, prev[3])])
        else:
            top_anchor = mbb[1]
        prev = mbb
        y += mh_ + (24 if merge["cat"] == "op" else 20)
    row_y = []
    yy = y
    for r in reversed(range(rows)):
        row_y.append(yy)
        yy += row_h[r] + PG
    row_y = list(reversed(row_y))
    col_bbs = []
    for ci, (col, x) in enumerate(zip(allcols, xs)):
        bbs = []
        for r, b in enumerate(col):
            bb = node(b, x, row_y[r], cw, row_h[r])
            if bbs and b["cat"] != "dots" and col[r - 1]["cat"] != "dots":
                sc.line([(x, bbs[-1][1]), (x, bb[3])])
            bbs.append(bb)
        col_bbs.append(bbs)
    gate_op = next((bb for b, bb in chain_bbs if b["cat"] == "op" and b.get("gate_in")), None)
    for ci, bbs in enumerate(col_bbs):
        if not bbs or allcols[ci][-1]["cat"] == "dots":
            continue
        x, top = xs[ci], bbs[-1][1]
        if gate and ci == len(allcols) - 1:
            gy = (gate_op[1] + gate_op[3]) / 2
            sc.line([(x, top), (x, gy), (gate_op[2], gy)])
        elif merge and merge["cat"] == "op":
            my = (prev[1] + prev[3]) / 2
            sc.line([(x, top), (x, my), (prev[0] if x < cm else prev[2], my)])
        elif merge or chain:
            sc.line([(x, top), (x, prev[3])])
        else:
            top_anchor = top
    y = yy - PG + 20 if rows else y
    x_in = cm
    if base:
        bh = hm(base, bw)
        bbb = node(base, bx, y, bw)
        for ci, x in enumerate(xs):
            if bbb[0] < x < bbb[2] and allcols[ci][0]["cat"] != "dots":
                sc.line([(x, bbb[1]), (x, col_bbs[ci][0][3])])
        x_in = bx
        y += bh
    bottom = py + h
    g = sc.group()
    if cols or gate:
        if p.get("bus", True):
            y_bus = y + (11 if base else 9)
            feed = [ci for ci in range(n) if allcols[ci] and allcols[ci][0]["cat"] != "dots"
                    and not (base and bbb[0] < xs[ci] < bbb[2])]
            sc.line([(x_in, bottom), (x_in, bbb[3] if base else y_bus)], g, arrow=bool(base))
            fx = [xs[ci] for ci in feed]
            if fx:
                lo, hi = min(fx + [x_in]), max(fx + [x_in])
                if hi - lo > 0.5:
                    sc.line([(lo, y_bus), (hi, y_bus)], g, arrow=False)
                    sc.dot(x_in, y_bus)
                for ci in feed:
                    sc.line([(xs[ci], y_bus), (xs[ci], col_bbs[ci][0][3])], g)
    else:
        sc.line([(cm, bottom), (cm, prev[3])], g)
    if top_anchor is not None:
        sc.line([(cm, top_anchor), (cm, out_top)])
    return h, links


# ---------------------------------------------------------------- tower measure (u = upwards)
def measure_tower(sc, m):
    items = [("box", B("Tokenizer", "emb", m.get("tokenizer"))), ("frame_start", None),
             ("box", dict(B("Token embedding layer", "emb"), callout="emb"))]
    items += [("box", b) for b in m.get("pre", [])]
    items += [("block", blk) for blk in m["blocks"]]
    items += [("box", b) for b in m.get("post", [])]
    items += [("box", B(m.get("final", "Final RMSNorm"), "norm")),
              ("box", dict(B("Linear output layer", "lin"), callout="vocab"))]
    items += [("box", b) for b in m.get("head", [])]
    items.append(("frame_end", None))
    ops = []
    prev_top = 16
    floor = 0
    frame = [0, 0]
    for kind, obj in items:
        if kind == "frame_start":
            frame[0] = prev_top + 10
            floor = frame[0] + 16
        elif kind == "frame_end":
            frame[1] = prev_top + 14
        elif kind == "box":
            h = sc.measure(obj, BOX_W, 13.5, 10.5)[0]
            ub = max(prev_top + G + 2, floor)
            ops.append(("box", obj, ub, h))
            prev_top = ub + h
            floor = 0
        else:
            blk = obj
            bottom = max(prev_top + 12, floor - 6)
            cur = bottom
            subs = []
            for si, sub in enumerate(blk["sublayers"]):
                br = cur + (12 if si == 0 else 9)
                ub = cur + (26 if si == 0 else 24)
                boxes = []
                for b in sub:
                    h = sc.measure(b, BOX_W, 13.5, 10.5)[0]
                    boxes.append((b, ub, h))
                    ub += h + G
                plus_c = boxes[-1][1] + boxes[-1][2] + G + 11
                subs.append((br, boxes, plus_c))
                cur = plus_c + 11
            title = blk["title"] if blk["title"] != "Transformer block" else ""
            blk["_tl"] = wrap(title, CX - 16 - (BLOCK[0] + 16), 12.5, True)
            top = cur + 14 + (18 * len(blk["_tl"]) + 4 if blk["_tl"] else 0)
            ops.append(("block", blk, bottom, top, subs))
            prev_top = cur
            floor = top + 16
    u_out = frame[1] + 34
    return ops, frame, u_out


# ---------------------------------------------------------------- model
def zooms(b):
    z = b.get("zoom")
    return [z] if isinstance(z, str) else (z or [])


def render(m, root):
    archs = m["arch"]
    accent = ARCH[archs[0]]["accent"]
    sc = Scene(accent)
    ops, frame, u_out = measure_tower(sc, m)
    tower_h = u_out + 8

    # ---- panels: sizes, parents, ordering
    panels = {p["id"]: p for p in m.get("panels", [])}
    size = {pid: panel_size(sc, p) for pid, p in panels.items()}
    parent = {}
    for p in panels.values():
        for col in p.get("columns", []) + ([p["gate"]] if p.get("gate") else []) + [p.get("chain", [])]:
            for b in col:
                for z in zooms(b):
                    parent[z] = p["id"]
    src_u = {}
    for op in ops:
        if op[0] == "box":
            for z in zooms(op[1]):
                src_u.setdefault(z, op[2] + op[3] / 2)
        else:
            _, blk, bottom, top, subs = op
            if blk.get("zoom"):
                src_u.setdefault(blk["zoom"], top - 14)
            for _, boxes, _ in subs:
                for b, ub, h in boxes:
                    for z in zooms(b):
                        src_u.setdefault(z, ub + h / 2)
    for pid in panels:
        assert pid in src_u or pid in parent, f"{m['file']}: panel {pid} has no inbound link"
    for z in src_u:
        assert z in panels, f"{m['file']}: zoom {z} has no panel"
    linked = sorted((pid for pid in panels if pid in src_u), key=lambda z: -src_u[z])  # top first
    child_of = {}
    for c, par in parent.items():
        child_of.setdefault(par, []).append(c)

    def TITLE(pid):
        return 19 * len(panels[pid]["_title"]) + 8      # room above a panel for its title

    ROW_GAP = 22

    def layout(mode_column):
        """Rows of [col1, col2]: tower-linked panels stack in col1 (short links, no far-right column);
        col2 only holds a child panel, right of its parent."""
        rows = []
        for pid in linked:
            kids = child_of.get(pid, [])
            if kids:
                rows.append([pid, kids[0]])
                rows += [[None, k] for k in kids[1:]]
            else:
                rows.append([pid, None])
        grid_h = sum(max(size[p][1] + TITLE(p) for p in r if p) + ROW_GAP for r in rows) - ROW_GAP if rows else 0
        y0 = TOP + (0 if mode_column else max(0, (grid_h - tower_h) / 2)) + tower_h   # y of u=0
        col1_w = max((size[r[0]][0] for r in rows if r[0]), default=300)
        placed, y = {}, TOP
        for r in rows:
            title_room = max(TITLE(p) for p in r if p)
            want = max(y, y0 - src_u[r[0]] - 50 - title_room) if mode_column and r[0] in src_u else y
            top = want + title_room
            for i, p in enumerate(r):
                if p:
                    placed[p] = (GRID_X if i == 0 else GRID_X + col1_w + COL_GAP, top)
            y = top + max(size[p][1] for p in r if p) + ROW_GAP
        return rows, y0, col1_w, placed, y

    # one column of insets while it fits beside the tower, otherwise a two-column grid
    rows, y0, col1_w, placed, grid_bottom = layout(True)
    if grid_bottom > y0 + 40:
        rows, y0, col1_w, placed, grid_bottom = layout(False)
    LANES2 = [GRID_X + col1_w + d for d in (16, 30, 44, 58, 72)]

    def Y(u):
        return y0 - u

    # ---- draw tower
    fy0, fy1 = Y(frame[1]), Y(frame[0])
    sc.back.append(f'<rect x="{FRAME[0]}" y="{fy0:.1f}" width="{FRAME[1]-FRAME[0]}" height="{fy1-fy0:.1f}" '
                   f'rx="34" fill="url(#fg)" stroke="#2a2a2a" stroke-width="1.8"/>')
    sources = {}
    tower_boxes = []
    for op in ops:
        if op[0] == "block":
            _, blk, bottom, top, subs = op
            by0, by1 = Y(top), Y(bottom)
            sc.back.append(f'<rect x="{BLOCK[0]}" y="{by0:.1f}" width="{BLOCK[1]-BLOCK[0]}" height="{by1-by0:.1f}" '
                           f'rx="28" fill="url(#bg)" stroke="#2a2a2a" stroke-width="1.8"/>')
            for i, s in enumerate(blk["_tl"]):
                sc.text(BLOCK[0] + 16, by0 + 22 + 18 * i, s, 12.5, bold=True)
            # brace + repeat count at the block's lower left, like the originals
            bh = min(70, by1 - by0 - 40)
            bx, bm = BLOCK[0] - 8, by1 - 14 - bh / 2
            t0, t1 = bm - bh / 2, bm + bh / 2
            sc.back.append(f'<path d="M{bx+6},{t0:.1f} C{bx-1},{t0:.1f} {bx+3},{bm-6:.1f} {bx-5},{bm:.1f} '
                           f'C{bx+3},{bm+6:.1f} {bx-1},{t1:.1f} {bx+6},{t1:.1f}" fill="none" stroke="{INK}" stroke-width="2"/>')
            num = blk["repeat"].replace("×", "").strip()
            sc.text(bx - 12, bm + 7, f"{num} ×", 19, "end", bold=True, fill=accent)
            if blk.get("zoom"):
                sources.setdefault(blk["zoom"], []).append((BLOCK[1], by0 + 16))
            for br, boxes, plus_c in subs:
                for b, ub, h in boxes:
                    bb = sc.box(b, CX, Y(ub + h), BOX_W, h, 13.5, 10.5, nid=b["label"])
                    for z in zooms(b):
                        sources.setdefault(z, []).append((bb[2], (bb[1] + bb[3]) / 2))
                sc.box(OP("+"), CX, Y(plus_c) - 11, 22, 22, 13.5, 10.5, nid="add")
        else:
            _, b, ub, h = op
            bb = sc.box(b, CX, Y(ub + h), BOX_W, h, 13.5, 10.5, nid=b["label"])
            tower_boxes.append((b, bb))
            for z in zooms(b):
                sources.setdefault(z, []).append((bb[2], (bb[1] + bb[3]) / 2))
    # main data flow
    sc.text(CX, Y(0) - 2, m.get("input", "Sample input text"), 14, "middle", font=MONO)
    line_from = Y(16) - 3
    for op in ops:
        if op[0] == "box":
            _, b, ub, h = op
            sc.line([(CX, line_from), (CX, Y(ub))])
            line_from = Y(ub + h)
        else:
            for br, boxes, plus_c in op[4]:
                sc.line([(CX, line_from), (CX, Y(boxes[0][1]))])
                sc.dot(CX, Y(br))
                sc.line([(CX, Y(br)), (RES_X, Y(br)), (RES_X, Y(plus_c)), (CX - 11, Y(plus_c))])
                for (b1, u1, h1), (b2, u2, h2) in zip(boxes, boxes[1:]):
                    sc.line([(CX, Y(u1 + h1)), (CX, Y(u2))])
                lb, lu, lh = boxes[-1]
                sc.line([(CX, Y(lu + lh)), (CX, Y(plus_c) + 11)])
                line_from = Y(plus_c) - 11
    sc.line([(CX, line_from), (CX, Y(u_out) + 6)])
    sc.text(CX, Y(u_out) - 2, "Next-token logits", 13, "middle", font=MONO, fill=MUTED)
    # callouts on the left with dotted leaders, like the originals
    for b, bb in tower_boxes:
        kind = b.get("callout")
        if kind == "vocab" and m.get("vocab"):
            lines = ["Vocabulary size", f"of {m['vocab']}"]
        elif kind == "emb" and m.get("d_model"):
            lines = ["Embedding", f"dimension of {m['d_model']}"]
        else:
            continue
        cy = (bb[1] + bb[3]) / 2
        ends = [sc.text(CALLOUT_X, cy + 2 + (i - (len(lines) - 1) / 2) * 19, s, 15, bold=True, accent=accent)[1]
                for i, s in enumerate(lines)]
        sc.line([(max(ends) + 8, cy), (bb[0] - 4, cy)], leader=True, arrow=False)

    # ---- panels
    child_links = []
    for pid, (px, py) in placed.items():
        _, links = panel_layout(sc, panels[pid], px, py)
        child_links += [(bb, t, pid) for bb, t in links]

    # ---- zoom links: backtracking search for a conflict-free set of orthogonal paths
    def seglist(pts, g):
        return [(g, x1, y1, x2, y2) for (x1, y1), (x2, y2) in zip(pts, pts[1:])]

    def length(pts):
        return sum(abs(b[0] - a[0]) + abs(b[1] - a[1]) for a, b in zip(pts, pts[1:]))

    conns = [[s[0], s[1], pid, None] for pid in linked for s in sources[pid]]
    by_src = {}
    for c in conns:
        by_src.setdefault((c[0], round(c[1])), []).append(c)
    for grp in by_src.values():
        for i, c in enumerate(grp):
            c[1] += (i - (len(grp) - 1) / 2) * 10
    conns.sort(key=lambda c: c[1])
    conns += [[bb[2], (bb[1] + bb[3]) / 2, target, src_pid] for bb, target, src_pid in child_links]
    gutters = [placed[r[0] or r[1]][1] - max(TITLE(p) for p in r if p) - ROW_GAP / 2 for r in rows]
    gutters.append(max(placed[p][1] + size[p][1] for p in placed) + ROW_GAP / 2)
    jobs = []
    for i, (sx, sy, pid, src_pid) in enumerate(conns):
        px, ptop = placed[pid]
        lo, hi = ptop + 16, ptop + size[pid][1] - 16
        ty = min(max(sy, lo), hi)
        cands = []
        if src_pid:                                   # inset -> inset (e.g. MoE expert -> FFN)
            if lo <= sy <= hi and px > sx:
                cands.append([(sx, sy), (px, sy)])
            cands += [[(sx, sy), (l2, sy), (l2, ty), (px, ty)] for l2 in LANES2]
        elif px == GRID_X:
            if lo <= sy <= hi:
                cands.append([(sx, sy), (px, sy)])
            cands += [[(sx, sy), (lane, sy), (lane, ty), (px, ty)] for lane in LANES1]
        else:
            for lane in LANES1:
                for gy in gutters:
                    t = min(max(gy, lo), hi)
                    cands += [[(sx, sy), (lane, sy), (lane, gy), (l2, gy), (l2, t), (px, t)] for l2 in LANES2]
        g = 10_000 + i
        sc.exempt[g] = src_pid
        cands = [c for c in sorted(cands, key=length) if not check_segs(sc, seglist(c, g))]
        jobs.append((g, cands))
    chosen, budget = [], [50_000]

    def solve(k):
        if k == len(jobs):
            return True
        g, cands = jobs[k]
        for pts in cands:
            budget[0] -= 1
            if budget[0] < 0:
                return False
            segs = seglist(pts, g)
            if any(seg_pair(a, b) for a in segs for _, path in chosen for b in path):
                continue
            chosen.append((pts, segs))
            if solve(k + 1):
                return True
            chosen.pop()
        return False

    if not solve(0):   # no clean solution: fall back to shortest candidates (the checker will report)
        chosen = [(c[0] if c else [(0, 0), (0, 1)], []) for _, c in jobs]
    for (g, _), (pts, _) in zip(jobs, chosen):
        sc.dot(*pts[0], fill=LINK, layer=sc.front)
        sc.line(pts, g=g, link=True, layer=sc.front)

    # ---- header
    W = (max(px + size[p][0] for p, (px, _) in placed.items()) if placed else FRAME[1]) + 40
    sc.text(CALLOUT_X, 58, f"{m['title']} ({m['params']})", 40, bold=True, fill=accent)
    x = CALLOUT_X
    chips = [(a, f"url(#chip{a})", True) for a in archs]
    if m.get("active"):
        chips.append((f"{m['active']} active per token", "#fff", False))
    if m.get("layers"):
        chips.append((m["layers"] if "layer" in m["layers"] else f"{m['layers']} layers", "#fff", False))
    if m.get("context"):
        chips.append((f"{m['context']} context", "#fff", False))
    for s, f, bold in chips:
        w = tw(s, 13, bold) + 24
        sc.out.append(f'<rect x="{x:.1f}" y="78" width="{w:.1f}" height="26" rx="13" fill="{f}" '
                      f'stroke="{INK if bold else "#9a9a9a"}" stroke-width="1.3"/>')
        sc.text(x + w / 2, 95.5, s, 13, "middle", bold=bold, check=False)
        x += w + 8
    W = max(W, x + 30)

    # ---- legend
    bottom = max(Y(-8), max((py + size[p][1] for p, (_, py) in placed.items()), default=0)) + 34
    lx = CALLOUT_X
    for s, cat in [("Embedding", "emb"), ("Normalization", "norm"), ("Attention", "attn"),
                   ("Feed forward / MoE", "ff"), ("Linear", "lin"), ("Gating / routing / mixing", "soft")]:
        sc.out.append(f'<rect x="{lx}" y="{bottom}" width="20" height="14" rx="3.5" fill="{FILL[cat]}" stroke="{INK}" stroke-width="1.1"/>')
        sc.text(lx + 27, bottom + 11.5, s, 12.5, check=False)
        lx += 27 + tw(s, 12.5) + 22
    sc.out.append(f'<line x1="{lx}" y1="{bottom+7}" x2="{lx+38}" y2="{bottom+7}" stroke="{LINK}" stroke-width="2.2" '
                  f'stroke-dasharray="1 5" stroke-linecap="round" marker-end="url(#lk)"/>')
    sc.text(lx + 48, bottom + 11.5, "zoom-in link", 12.5, check=False)
    W = max(W, lx + 160)
    H = bottom + 34

    issues = problems(sc)
    hue = ARCH[archs[0]]     # single hue: primary architecture only, light -> dark
    bg = f'<stop offset="0" stop-color="{hue["light"]}"/><stop offset="1" stop-color="{hue["dark"]}"/>'
    chip_defs = "".join(f'<linearGradient id="chip{a}" x1="0" y1="0" x2="1" y2="1">'
                        f'<stop offset="0" stop-color="{v["light"]}"/><stop offset="1" stop-color="{v["dark"]}"/>'
                        f'</linearGradient>' for a, v in ARCH.items())
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}" '
           f'font-family="{FONT}">',
           f'<title>{escape(m["title"])} architecture</title>',
           '<defs>'
           f'<marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker>'
           f'<marker id="lk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{LINK}"/></marker>'
           '<filter id="sh" x="-10%" y="-20%" width="130%" height="160%"><feDropShadow dx="1.5" dy="2.2" stdDeviation="1.6" flood-color="#000" flood-opacity="0.22"/></filter>'
           f'<linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">{bg}</linearGradient>'
           '<linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ececec"/><stop offset="1" stop-color="#d6d6d6"/></linearGradient>'
           '<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#e4e4e4"/></linearGradient>'
           f'{chip_defs}</defs>',
           f'<rect width="{W:.0f}" height="{H:.0f}" fill="#fff"/>'] + sc.back + sc.out + sc.front + ["</svg>"]
    out = root / "processed" / f"{m['file']}.svg"
    out.write_text("\n".join(svg))
    return out, issues


def main():
    sys.path.insert(0, str(Path(__file__).parent))
    from models import MODELS
    root = Path(__file__).resolve().parent.parent
    want = sys.argv[1:]
    bad = 0
    for m in MODELS:
        if want and not any(w in m["file"] for w in want):
            continue
        out, issues = render(m, root)
        print(f"{'OK ' if not issues else 'FAIL'} {out.name}" + "".join(f"\n     - {i}" for i in sorted(set(issues))))
        bad += bool(issues)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()

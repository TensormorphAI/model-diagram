#!/usr/bin/env python3
"""Strip callouts/notes from models/*.svg and recolor module boxes with the
transformer_architecture.svg palette. Output: processed/<same name>.svg

Usage: python3 process_svg.py [models_dir] [out_dir] [--only name ...]
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)
ET.register_namespace("c2pa", "http://c2pa.org/manifest")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
T = lambda tag: f"{{{SVG}}}{tag}"

# Palette from transformer_architecture.svg; first match wins (order matters).
PALETTE = [
    ("block", "#f2f2f2", r"\blayers (before|after)|\bprelude\b|\bcoda\b|run once"),
    ("norm", "#f1f4c2", r"norm|dropout"),
    ("soft", "#cbe8d4", r"softmax|softcap|router|sigmoid|σ|attnres|pre-mix|mix\b|message|depth|summar|block (\d+ )?sum|mh[cg]\b|hyper-conn|residual"),
    ("pos", "#fadbde", r"\brope\b|\bnope\b"),
    ("attn", "#fde1b9", r"attn|attention|\bmla\b|gqa|swa|csa|dsa|kda|delta|latent|indexer|candidate|kv\b|position bias|\bclip\b"),
    ("gate", "#cbe8d4", r"gate|gating"),
    ("emb", "#fadbde", r"embed|token|input|rope|nope|engram|position"),
    ("ff", "#c5e7f6", r"feed|ffn|moe|mlp|expert|silu|gelu|swiglu|activation|conv|\bact\b"),
    ("lin", "#dadcf1", r"linear|output|logit|head|proj|w[qkvo]\b|encoder hidden|hidden states"),
]
CONTAINER_FILLS = ["#f2f2f2", "#e6e6e6", "#f8f8f8", "#ececec"]  # by nesting depth
INK = "#111"

# Per-file fixes the heuristics miss. drop_regions: (x0, y0, x1, y1) in source
# coordinates; every element whose bbox is fully inside is removed.
# drop_text / keep_text: regexes matched against the whole text content.
# Callout/stat notes dropped in every file, even when drawn inside a panel.
DEFAULT_DROP = [
    r"vocabulary size", r"embedding (dimension|width|size)", r"dimension of", r"native context",
    r"yarn context", r"^\d[\d,.]*\s*(query |kv )?heads$", r"resource savings", r"parallel residual streams",
    r"^\(replaces", r"stream mixing\)$", r"each sublayer computes", r"not shown", r"omitted",
    r"per expert", r"active parameters", r"^experts$", r"\bsize:\s", r"^of\s+[\d,.]+\s*[kmbt]?$",
]
OVERRIDES = {
    "transformer_architecture": {"keep_text": [r"."], "no_default_drop": True},
    "GLM-5_4_Architecture_Diagram": {"drop_regions": [(0, 110, 435, 320)]},
    "kimi_k3_architecture": {
        "drop_regions": [(965, 220, 1365, 565)],
        "drop_text": [r"8 AttnRes blocks =|linear-time recurrent|full attention with|parameters ·"],
    },
    "ornith-1.5-architecture": {"drop_regions": [(820, 1080, 1185, 1095)]},
    "minimax-m3-architecture": {"drop_regions": [(830, 445, 900, 742)]},
    "inkling-2-mini-architecture": {"drop_text": [r"read with|per layer:|gate \(rank|^\(1 . f\)|from the previous pass"]},
    "Inkling_2_Mini_Architecture": {"drop_regions": [(0, 60, 470, 300)]},
    "kimi_k3_1_pro_architecture": {
        "drop_regions": [(790, 990, 1270, 1160)],
        "drop_text": [r"vision component|not shown\)|attnres blocks|layers \+ one|group sum|^(updated|current)$"],
    },
}

REPEAT_RE = re.compile(r"^\s*(\d+\s*[×x]|[×x]\s*\d+|[{}]|[·.…\s]+)\s*(per pass)?\s*$", re.I)


def num(v, d=0.0):
    try:
        return float(re.match(r"-?[\d.]+", str(v)).group())
    except Exception:
        return d


def parse_css(root):
    rules = {}
    for st in root.iter(T("style")):
        for sels, body in re.findall(r"([^{}]+)\{([^}]*)\}", st.text or ""):
            props = dict(
                (k.strip(), v.strip())
                for k, v in (p.split(":", 1) for p in body.split(";") if ":" in p)
            )
            for sel in sels.split(","):
                sel = sel.strip()
                if sel.startswith("."):
                    rules.setdefault(sel[1:], {}).update(props)
    return rules


def prop(el, name, css, parents):
    """Effective property: inline style > class CSS > attribute > inherited."""
    node = el
    while node is not None:
        st = dict(
            (k.strip(), v.strip())
            for k, v in (p.split(":", 1) for p in (node.get("style") or "").split(";") if ":" in p)
        )
        if name in st:
            return st[name]
        for c in reversed((node.get("class") or "").split()):
            if name in css.get(c, {}):
                return css[c][name]
        if node.get(name) is not None:
            return node.get(name)
        if name not in ("font-size", "font-weight", "font-family", "fill", "text-anchor"):
            return None
        node = parents.get(node)
    return None


def set_style(el, **kv):
    st = dict(
        (k.strip(), v.strip())
        for k, v in (p.split(":", 1) for p in (el.get("style") or "").split(";") if ":" in p)
    )
    for k, v in kv.items():
        st[k.replace("_", "-")] = v
    el.set("style", ";".join(f"{k}:{v}" for k, v in st.items()))


def text_of(el):
    return " ".join("".join(el.itertext()).split())


def bbox(el, css, parents):
    tag = el.tag.split("}")[-1]
    g = lambda a: num(el.get(a))
    if tag == "rect":
        return (g("x"), g("y"), g("x") + g("width"), g("y") + g("height"))
    if tag == "line":
        return (min(g("x1"), g("x2")), min(g("y1"), g("y2")), max(g("x1"), g("x2")), max(g("y1"), g("y2")))
    if tag in ("circle", "ellipse"):
        rx = g("r") or g("rx")
        ry = g("r") or g("ry")
        return (g("cx") - rx, g("cy") - ry, g("cx") + rx, g("cy") + ry)
    if tag in ("polyline", "polygon", "path"):
        nums = [float(n) for n in re.findall(r"-?\d*\.?\d+", el.get("points") or el.get("d") or "")]
        if tag == "path" and re.search(r"[a-z]", re.sub(r"[eE]", "", el.get("d") or "")):
            # relative commands: only the first absolute point is reliable
            nums = nums[:2]
        xs, ys = nums[0::2], nums[1::2]
        if not xs or not ys:
            return None
        return (min(xs), min(ys), max(xs), max(ys))
    if tag == "text":
        fs = num(prop(el, "font-size", css, parents), 16)
        lines = [ts for ts in el.iter(T("tspan")) if ts.get("x") is not None or ts.get("dy") is not None]
        chars = max((len(text_of(ts)) for ts in lines), default=0) if len(lines) > 1 else len(text_of(el))
        w = chars * fs * 0.55
        x, y = g("x"), g("y")
        if el.get("x") is None or el.get("y") is None:
            ts = next((t for t in el.iter(T("tspan")) if t.get("x") is not None or t.get("y") is not None), None)
            if ts is not None:
                x = num(ts.get("x"), x) if el.get("x") is None else x
                y = num(ts.get("y"), y) if el.get("y") is None else y
                n = sum(1 for t in el.iter(T("tspan")) if t.get("y") is not None or t.get("dy") is not None)
                y += fs * 1.2 * max(0, n - 1) / 2  # centre of multi-line block
        a = prop(el, "text-anchor", css, parents) or "start"
        x0 = x - w / 2 if a == "middle" else x - w if a == "end" else x
        base = prop(el, "dominant-baseline", css, parents) or ""
        y0 = y - fs / 2 if "middle" in base or "central" in base else y - fs * 0.8
        return (x0, y0, x0 + w, y0 + fs)
    return None


def inside(p, r, pad=0):
    return r[0] - pad <= p[0] <= r[2] + pad and r[1] - pad <= p[1] <= r[3] + pad


def contains(outer, inner):
    return outer[0] <= inner[0] and outer[1] <= inner[1] and outer[2] >= inner[2] and outer[3] >= inner[3] and outer != inner


def luminance(c):
    c = (c or "").strip().lower()
    named = {"white": "#ffffff", "black": "#000000", "none": None}
    c = named.get(c, c)
    if not c or not c.startswith("#"):
        return None
    if len(c) == 4:
        c = "#" + "".join(ch * 2 for ch in c[1:])
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def process(src: Path, dst: Path, log: dict):
    tree = ET.parse(src)
    root = tree.getroot()
    ov = OVERRIDES.get(src.stem, {})
    css = parse_css(root)
    parents = {c: p for p in root.iter() for c in p}
    vb = [num(v) for v in (root.get("viewBox") or f"0 0 {root.get('width')} {root.get('height')}").split()]
    W, H = vb[2], vb[3]
    removed = []

    def drop(el):
        p = parents.get(el)
        if p is not None and el in list(p):
            p.remove(el)
            removed.append(el)

    for el in list(root.iter(T("desc"))):
        drop(el)

    # 1. explicit drop regions (explainer mini-diagrams, tables, ...)
    for reg in ov.get("drop_regions", []):
        for el in list(root.iter()):
            if el.tag in (T("svg"), T("defs"), T("g"), T("tspan")) or parents.get(el) is None:
                continue
            if any(parents.get(a) is not None and a.tag == T("defs") for a in [parents.get(el)]):
                continue
            b = bbox(el, css, parents)
            if b and contains((reg[0] - 1, reg[1] - 1, reg[2] + 1, reg[3] + 1), b):
                drop(el)

    drawn = [e for e in root.iter() if parents.get(e) is not None and not any(
        a.tag == T("defs") for a in (parents.get(e),))]
    rects = []
    for r in root.iter(T("rect")):
        if r not in drawn or parents.get(r) is None:
            continue
        b = bbox(r, css, parents)
        if b[2] - b[0] >= W * 0.95 and b[3] - b[1] >= H * 0.95:
            continue  # canvas background
        rects.append((r, b))
    background = [r for r in root.iter(T("rect")) if r not in [x for x, _ in rects]
                  and parents.get(r) is not None and parents[r].tag != T("defs")]

    containers = [(r, b) for r, b in rects if any(contains(b, b2) for _, b2 in rects)]
    cset = {id(r) for r, _ in containers}
    boxes = [(r, b) for r, b in rects if id(r) not in cset]

    # 2. dashed leader lines (dashed rects are panel borders: keep)
    for el in list(root.iter()):
        if el.tag in (T("line"), T("polyline"), T("path")) and prop(el, "stroke-dasharray", css, parents) not in (None, "none"):
            if parents.get(el) is not None and parents[el].tag != T("defs"):
                drop(el)

    # 3. free-floating text
    title = None
    texts = [t for t in root.iter(T("text")) if parents.get(t) is not None]
    if texts:
        top = [t for t in texts if re.search(r"[A-Za-z]{2}", text_of(t)) and bbox(t, css, parents)[3] < vb[1] + H * 0.1]
        title = max(top, key=lambda t: num(prop(t, "font-size", css, parents), 16)) if top else None
    dropped_text = []
    for t in texts:
        s = text_of(t)
        if t is title:
            continue
        drops = ov.get("drop_text", []) + ([] if ov.get("no_default_drop") else DEFAULT_DROP)
        if any(re.search(p, s, re.I) for p in drops):
            dropped_text.append(t)
            continue
        if any(re.search(p, s, re.I) for p in ov.get("keep_text", [])):
            continue
        b = bbox(t, css, parents)
        anchor = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
        if any(inside(anchor, rb) for _, rb in rects):
            continue
        if REPEAT_RE.match(s) and s.strip() not in (".", "…") or s.strip() in ("{", "}"):
            continue
        # heading just above a panel
        if re.search(r"[A-Za-z]{3}", s) and any(
                0 <= cb[1] - b[3] <= 30 and cb[0] - 10 <= anchor[0] <= cb[2] + 10
                and prop(cr, "stroke-dasharray", css, parents) not in (None, "none") for cr, cb in containers):
            continue
        dropped_text.append(t)
    for t in dropped_text:
        drop(t)

    # bullet dots next to dropped text
    dt_boxes = [bbox(t, css, parents) for t in dropped_text]
    for c in list(root.iter(T("circle"))):
        if num(c.get("r")) <= 5 and parents.get(c) is not None:
            cx, cy = num(c.get("cx")), num(c.get("cy"))
            if any(0 < b[0] - cx < 45 and b[1] - 8 <= cy <= b[3] + 8 for b in dt_boxes):
                drop(c)

    # 4. recolor
    unmatched, colored, unlabeled = [], [], []
    rects_alive = [(r, b) for r, b in rects if r not in removed]
    boxes = [(r, b) for r, b in boxes if r not in removed]
    containers = [(r, b) for r, b in containers if r not in removed]
    texts = [t for t in root.iter(T("text")) if t not in removed]
    for r, b in containers:
        fill = prop(r, "fill", css, parents)
        if fill and fill != "none":
            depth = sum(1 for _, b2 in containers if contains(b2, b))
            set_style(r, fill=CONTAINER_FILLS[depth % len(CONTAINER_FILLS)])
        stroke = prop(r, "stroke", css, parents)
        if stroke and stroke != "none":
            set_style(r, stroke=INK)
    for r, b in boxes:
        w, h = b[2] - b[0], b[3] - b[1]
        inner = [t for t in texts if inside(((bbox(t, css, parents)[0] + bbox(t, css, parents)[2]) / 2,
                                            (bbox(t, css, parents)[1] + bbox(t, css, parents)[3]) / 2), b)]
        label = " ".join(text_of(t) for t in inner)
        if not label:
            unlabeled.append((r, b))
            continue
        if (w < 70 and h < 50 and re.fullmatch(r"[\d,.\s]+", label)):
            continue  # badges, unlabeled decorations
        cls = next((n for n, _, rx in PALETTE if re.search(rx, label, re.I)), None)
        if cls is None:
            unmatched.append(label)
            continue
        set_style(r, fill=dict((n, c) for n, c, _ in PALETTE)[cls])
        stroke = prop(r, "stroke", css, parents)
        if stroke and stroke != "none":
            set_style(r, stroke=INK)
        colored.append((r, b))
        for t in inner:
            set_style(t, fill=INK)
            for node in t.iter(T("tspan")):
                lum = luminance(prop(node, "fill", css, parents))
                if lum is not None and lum > 0.6:
                    set_style(node, fill=INK)
    for r, b in unlabeled:
        area = (b[2] - b[0]) * (b[3] - b[1])
        for r2, b2 in colored:
            ix = max(0, min(b[2], b2[2]) - max(b[0], b2[0])) * max(0, min(b[3], b2[3]) - max(b[1], b2[1]))
            if area and ix / area > 0.5:
                set_style(r, fill=prop(r2, "fill", css, parents), stroke=INK)
                break
    if title is not None:
        set_style(title, fill=INK)
        for ts in title.iter(T("tspan")):
            set_style(ts, fill=INK)

    # 5. crop to content
    boxes_all = []
    for el in root.iter():
        if el in background or el.tag in (T("tspan"), T("g"), T("svg")) or parents.get(el) is None:
            continue
        p = parents.get(el)
        skip = False
        while p is not None:
            if p.tag in (T("defs"), T("metadata")):
                skip = True
            p = parents.get(p)
        if skip:
            continue
        b = bbox(el, css, parents)
        if b:
            boxes_all.append(b)
    if boxes_all:
        pad = 24
        x0 = max(vb[0], min(b[0] for b in boxes_all) - pad)
        y0 = max(vb[1], min(b[1] for b in boxes_all) - pad)
        x1 = min(vb[0] + W, max(b[2] for b in boxes_all) + pad)
        y1 = min(vb[1] + H, max(b[3] for b in boxes_all) + pad)
        nw, nh = round(x1 - x0), round(y1 - y0)
        root.set("viewBox", f"{round(x0)} {round(y0)} {nw} {nh}")
        root.set("width", str(nw))
        root.set("height", str(nh))
        for bg in background:
            bg.set("x", str(round(x0)))
            bg.set("y", str(round(y0)))
            bg.set("width", str(nw))
            bg.set("height", str(nh))

    dst.parent.mkdir(parents=True, exist_ok=True)
    tree.write(dst, encoding="unicode", xml_declaration=False)
    ET.parse(dst)  # must still parse
    log[src.name] = dict(removed=len(removed), texts=len(dropped_text), unmatched=unmatched)


def main():
    args = sys.argv[1:]
    only = []
    if "--only" in args:
        i = args.index("--only")
        only, args = args[i + 1:], args[:i]
    here = Path(__file__).parent
    src_dir = Path(args[0]) if args else here / "models"
    out_dir = Path(args[1]) if len(args) > 1 else here / "processed"
    log = {}
    for f in sorted(src_dir.glob("*.svg")):
        if only and f.stem not in only:
            continue
        process(f, out_dir / f.name, log)
    for name, d in log.items():
        print(f"{name}: removed {d['removed']} ({d['texts']} text)" + (f" | unmatched: {d['unmatched']}" if d["unmatched"] else ""))


if __name__ == "__main__":
    main()

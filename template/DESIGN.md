# Model architecture diagram: design guideline

This guideline covers the SVG architecture infographics in `processed/`. It records the design decisions, the
visual spec and the workflow, so that later work keeps every diagram consistent.

| File | Role |
| --- | --- |
| `template/render.py` | Template engine: layout, style, zoom-panel engine, link router, layout checker |
| `template/models.py` | Zoom-panel library and one data spec per model |
| `template/template.svg` | The blank template, rendered with placeholder labels |
| `models/*.svg` | Hand-drawn originals. They are the **source of facts** and the **style reference**; never edit them |
| `processed/*.svg` | Generated output. Never edit it by hand; change the spec and re-render |

```bash
python3 template/render.py            # render every model, run the checker
python3 template/render.py glm-5      # only files whose name contains "glm-5"
```

The command exits non-zero if any diagram fails the layout check (see [§7](#7-acceptance-gate)).

---

## 1. How we got here (decision history)

| Step | Approach | Outcome | Lesson |
| --- | --- | --- | --- |
| v0 | Post-process the original SVGs: regex-drop "note" text and dotted leaders, recolor boxes by label keywords (`process_svg.py`, since deleted) | Worked on simple files. Failed on the busy ones: leftover notes, explainer strips, overlapping arrows (gpt-oss-120b), and no link between components and insets | Each original is hand-drawn differently, so heuristics never converge. **Generate from data instead of patching drawings.** |
| v1 | Data-driven template: one spec per model, a fixed panel library, and a geometric checker as the gate | Same anatomy for every model, zero overlaps, every inset linked | Fixed topology, where residuals and links never share a side, makes the no-overlap rule hold by design |
| v2 | Style pass to match the originals, with a compact poster layout | Matches the look of the originals: gray frame, shadowed boxes, dotted insets, bold callouts, brace + `N ×`. Single-hue architecture gradient on the main block; Segoe UI + KaTeX; one inset column (children to the right) | Style is separate from the template: all of it lives in constants at the top of `render.py` |

Keep these decisions unless there is a strong reason to change them:
1. **Data, not drawings.** A model is a spec in `models.py`; the SVG is always regenerated.
2. **One template for all models.** A new architecture adds a panel type or a spec, never a one-off layout.
3. **The checker is the acceptance gate**, and a visual review follows it ([§7](#7-acceptance-gate)).
4. **Facts come only from the source diagrams** ([§3](#3-content-rules)).

---

## 2. Template anatomy

```
 <Model name> (<total params>)                        ← title, accent color of the first architecture
 [MoE][Hybrid] (<active> active per token) (<N> layers) (<ctx> context)   ← chips

                 Next-token logits                     ┌ <Zoom title> ┐      ┌ <Child zoom> ┐
 Vocabulary size ┌──────────────────────┐              ┊ facts…        ┊      ┊ facts…       ┊
 of 129k ┈┈┈┈┈┈┈┈│ Linear output layer  │              ┊   [module]    ┊┈┈┈┈▶ ┊   [module]   ┊
                 │ [head extras]        │              └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┘      └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┘
                 │ Final norm           │
                 │ [post boxes]         │              ┌ <Zoom title> ┐
                 │ ╭─ main block ─────╮ │┈┈┈┈┈┈┈┈┈┈┈┈▶ ┊   …          ┊
                 │ │ ⊕                │ │              └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┘
            61 × { │ [sublayer boxes] │┈┼┈┈ zoom links leave on the RIGHT
                 │ │ residuals LEFT   │ │
                 │ ╰──────────────────╯ │
                 │ [pre boxes]          │
 Embedding       │ Token embedding layer│
 dimension of ┈┈┈└──────────────────────┘
 7,168             Tokenizer
                   Sample input text
 legend: Embedding · Normalization · Attention · Feed forward / MoE · Linear · Gating/routing/mixing · zoom-in link
```

| Slot | Spec field | Notes |
| --- | --- | --- |
| Title | `title`, `params` | Rendered as `"{title} ({params})"`. Put a nickname in `title`, e.g. `GLM-5.3-Flash “Ox Alpha”` |
| Architecture chips | `arch` | One or more of `Dense`, `MoE`, `Hybrid`, `Recurrent` ([§3](#3-content-rules)) |
| Fact chips | `active`, `layers`, `context` | Optional. If `layers` contains the word "layer" it is used verbatim |
| Input text | `input` | Default `Sample input text` (GPT-2 uses `Every effort moves you`) |
| Tokenizer | `tokenizer` (caption) | Always drawn, below the frame |
| Token embedding | `d_model` | Drives the left callout **Embedding dimension of …**; omit if unknown |
| Pre boxes | `pre=[B(...)]` | Between the embedding and the first block: positional embedding, embedding norm, "layers before the loop", … |
| Main block(s) | `blocks=[Block(title, "61 ×", sublayers, zoom=None)]` | Each sublayer is a list of boxes, bottom to top, closed by a residual ⊕. Several blocks stack (V4.1-Flash: encoder, then decoder). The title is hidden when it is `"Transformer block"` |
| Post boxes | `post=[...]` | Between the last block and the final norm: "Final Block AttnRes", "mHC head (4 → 1)", "layers after the loop", … |
| Final norm | `final` | Default `Final RMSNorm` |
| Output layer | `vocab` | `Linear output layer`. Drives the callout **Vocabulary size of …** |
| Head extras | `head=[...]` | After the output layer, e.g. `Logit softcap (30)` |
| Zoom panels | `panels=[...]` | Built from the panel library ([§6](#6-zoom-panel-library)) |

A box links to a panel with `zoom="id"`, or `zoom=["a","b"]` for two panels from one box (e.g. "KDA or
gated sparse attention"). A block links with `Block(..., zoom="loop")`. A node *inside* a panel can link to
another panel, e.g. `moe(..., ffn="ffn")` for MoE expert → SwiGLU.

---

## 3. Content rules

**Source of facts.** Transcribe facts only from the original diagram text (`models/*.svg`). If a fact is
missing there, leave the field out: no callout, chip or caption is drawn. Do not fill it in from memory.
Current gaps: Kimi K3.1 has no `d_model`/`vocab`; Kimi LatentMoE and the Ornith experts have no FFN panel.

**What goes where.** Keep the main stack readable. Push detail into zoom panels.

| Information | Place |
| --- | --- |
| Total params | Title, in parentheses |
| Architecture type, active params, layers, context | Header chips |
| Embedding dimension, vocabulary size | Left callouts with dotted leaders (style of the originals) |
| One short qualifier of a module (`RoPE`, `5 : 1 ratio`, `1 shared + 8 of 256 routed`) | Box caption (`cap`) |
| Side inputs (RoPE, QK-Norm, K/V short convs) | **Caption text, never an extra arrow** (see topology, [§5](#5-layout-rules)) |
| Head counts, windows, expert sizes, "first 3 blocks dense …" | Panel facts line (`sub`); numbers are highlighted automatically |
| Internal structure of a module | Zoom panel |
| Explanations, prose, resource-savings lists, explainer strips | **Not drawn.** Leave them out |

**Architecture chip rule** (a model may carry several chips; the first sets the gradient and accent):
- **MoE**: has routed experts.
- **Hybrid**: mixes linear or recurrent-state attention (KDA, Gated DeltaNet) with softmax attention.
  A local:global sliding-window mix alone (Muse Glimmer, Inkling 2 Small) does **not** count.
- **Recurrent**: looped passes over shared-weight layers (Inkling 2 Mini, GLM-5.4). It means looped depth,
  not linear-attention recurrence.
- **Dense**: none of the above.

**Schematic panels.** Where an original shows no internals (CSA/HCA, CSA2, Engram, the hierarchical indexer,
mHC, AttnRes), the panel is a schematic built from library parts. Keep labels generic
("Compress KV", "Top-k blocks") and put every number in `sub` only if the source states it.

---

## 4. Visual style spec

All values are constants at the top of `render.py`. Change them there, never per model.

### 4.1 Module colors (`FILL`, from `transformer_architecture.svg`)

| Category `cat` | Fill | Use for |
| --- | --- | --- |
| `emb` | `#fadbde` pink | Tokenizer, token / positional embedding, RoPE / NoPE, Engram |
| `norm` | `#f1f4c2` yellow | RMSNorm, LayerNorm, QK-Norm, L2 Norm, Dropout |
| `attn` | `#fde1b9` orange | Every attention variant, indexer, latent KV, delta rule |
| `ff` | `#c5e7f6` blue | Feed forward, MoE, experts, activations, short conv |
| `lin` | `#dadcf1` lavender | Linear projections, output layer |
| `soft` | `#cbe8d4` green | Router, softmax/softcap, gates (σ), AttnRes, mHC mixers, weighted sums |
| `plain` | `#ffffff` | Layer groups ("Layers before the loop", Coda, Prelude, pass boxes) |
| `group` | `#f2f2f2` | Loop pass boxes inside panels |
| `dots` / `op` | n/a | `· · ·` placeholder column; ⊕ / ⊗ operator circles |

### 4.2 Architecture colors (`ARCH`)

| Arch | Block gradient (light → dark) | Accent (title, numbers, `N ×`) |
| --- | --- | --- |
| Dense | `#dfe2fa` → `#9aa2e8` | `#4652c8` |
| MoE | `#d4ecfa` → `#6db7e6` | `#1677c2` |
| Hybrid | `#ffe8cc` → `#f3a95e` | `#d4690f` |
| Recurrent | `#d6f0de` → `#77c690` | `#1f8a52` |

The main-block gradient is a single hue: first-arch light → first-arch dark. Further archs only add
chips; they never mix into the gradient. The direction is top-left to bottom-right (`x2=0.35`). Architecture chips use the same light → dark gradient.

Neutrals: ink `#111`, muted text `#555`, links/leaders `#2b2b2b`. The model frame is a `#ececec` → `#d6d6d6`
gradient; panels are `#f4f4f4` → `#e4e4e4`.

### 4.3 Typography

| Role | Family | Size / weight |
| --- | --- | --- |
| Title | Segoe UI | 40, bold, accent color |
| Chips | Segoe UI | 13 (architecture chips bold) |
| Callouts | Segoe UI | 15 bold; numbers in accent |
| Main-stack box label / caption | Segoe UI | 13.5 / 10.5 (caption `#555`) |
| Block title | Segoe UI | 12.5 bold |
| `N ×` repeat count | Segoe UI digits + KaTeX `×` | 19 bold, accent |
| Panel title (above the panel) | Segoe UI | 14.5 bold |
| Panel facts | Segoe UI | 11, `#555`, numbers bold accent |
| Panel box label / caption | Segoe UI | 12 / 10 |
| Input text / "Next-token logits" | Consolas, Menlo | 14 / 13 |
| Math symbols `× σ α β φ → − · ⊕ ⊗` | `KaTeX_Main`; Greek in `KaTeX_Math` italic | Inherit the size |
| Whole formula | Caption starting with `$`, e.g. `"$(1 − f) · x + g · m"` | Letters `KaTeX_Math` italic, the rest `KaTeX_Main` |

Fonts are referenced by name, not embedded. Segoe UI and KaTeX are installed on the authoring Mac
(`~/Library/Fonts`). Without them the text falls back to Helvetica / Times. KaTeX (MIT) may be embedded
as base64 `@font-face` if portability is needed; Segoe UI's license does not allow embedding.

### 4.4 Shapes and lines

| Element | Spec |
| --- | --- |
| Module box | `rx=7`, stroke `#111` 1.5, drop shadow `dx 1.5 dy 2.2 σ 1.6 opacity .22`, min height 28 |
| ⊕ / ⊗ operator | Circle r=11, white fill, stroke 1.8, same shadow |
| Model frame | `rx=34`, stroke `#2a2a2a` 1.8 |
| Main block | `rx=28`, architecture gradient, stroke `#2a2a2a` 1.8 |
| Zoom panel | `rx=18`, dotted stroke `#111` 2.2 (`1.5 4.5`, round caps), title above the box |
| Data-flow arrow | Solid `#111` 1.8, filled triangle marker (`viewBox 0 0 10 10`, `markerWidth 5.5`) |
| Residual | Same as data flow; starts at a junction dot (r=3.2) and enters ⊕ from the left |
| Zoom link | Dotted `#2b2b2b` 2.2 (`1 5`, round caps), dot at the source, small triangle at the panel border |
| Callout leader | Same dotted style, no arrowhead, horizontal from the text end to the box's left edge |
| Repeat brace | Curly path left of the block's lower part, with `N ×` to its left |
| All routed lines | Orthogonal only: horizontal and vertical segments, no diagonals |

---

## 5. Layout rules

### 5.1 Topology invariant (why nothing overlaps)
- **Residual skips run on the left** inside the main block (`RES_X=350`).
- **Zoom links leave from the right edge** of the box they expand, so they never meet a residual.
- **Side inputs are captions**, so no extra arrows enter a box sideways.
- **Callouts sit on the left of the frame**, outside the block, beside the embedding / output layer.

### 5.2 Main-stack geometry (`render.py` constants)

| Constant | Value | Meaning |
| --- | --- | --- |
| `CALLOUT_X` | 30 | Left edge of the callout text |
| `FRAME` | (240, 672) | Model frame x-range |
| `BLOCK` | (326, 636) | Main block x-range |
| `CX`, `BOX_W` | 488, 206 | Stack center line and box width |
| `G` | 18 | Vertical gap between stacked boxes (the arrow length) |
| `LANES1` | 686…756, step 14 | Vertical link lanes between the frame and the insets |
| `GRID_X`, `COL_GAP` | 790, 84 | Inset column 1 x and the gap to column 2 (holds `LANES2`) |
| `TOP` | 128 | Where the stack and insets start, below the header |

The stack is measured bottom-up (`measure_tower`). The frame starts above the tokenizer. A block's
top leaves room for its title lines. The brace spans the lower part of the block.

### 5.3 Inset placement
1. Panels linked from the stack are ordered by source height, top first.
2. A **child panel** (linked from inside another panel) always sits **right of its parent, top-aligned**,
   so the link is one straight line.
3. **Column mode** is the default: one column of insets, each placed near its source. If that column would
   end more than 40 px below the stack, switch to **grid mode**: panels still stack in one column, starting
   at the top, with the stack centered vertically against them. Column 2 holds only child panels.
4. Row gap 22. Each panel reserves `19 × title lines + 8` px above itself for its title. Titles wrap at
   `max(panel width, 400)`.

### 5.4 Link routing
- A link to column 1 tries a straight line first, then an elbow through one `LANES1` lane.
- A link to column 2 goes through a `LANES1` lane, a **gutter** (the free band between rows), a
  `LANES2` lane, then into the panel.
- A child link tries a straight line, then an elbow through `LANES2`.
- Two links from one box are spread ±5 px on the box edge.
- Candidates are pre-filtered against the scene (boxes, texts, panels, other lines). Then a
  **backtracking search** picks one path per link so that no two links overlap or cross (budget 50 000
  tries). Do not go back to greedy routing: it took lanes that later links needed (Inkling 2 Mini).

### 5.5 Zoom-panel engine
Every panel has the same structure, read bottom to top:

```
input stub → [base, e.g. Router spanning some columns] → columns (box stacks)
           → merge (wide box, or ⊗/⊕ op for ≤ 2 columns) → chain (boxes / ops) → output stub
           + optional gate column at the far right, entering a chain op (⊗) from the right
```
- Column spacing is 116 and box width 102. Panel width is `max(300, columns × 116 + 28)`. The chain is 170 wide.
- Columns are bottom-aligned per row, and arrows are straight verticals.
- Columns not under the base are fed from a horizontal bus with a junction dot.
- `bus=False` means the columns are sources with no input (AttnRes depth sources, cross-pass message).
- A panel with only a chain (loop, indexer, Engram, GELU MLP) is a vertical list.

---

## 6. Zoom-panel library (`models.py`)

| Function | Draws | Used by |
| --- | --- | --- |
| `swiglu(id, sub, act, up)` | Linear(gate) → act, Linear(up) → ⊗ → Linear(down) | Most models; `act="Softcapped SiLU"` for Inkling |
| `gelu_mlp(id, sub)` | Linear → GELU → Linear | GPT-2 |
| `moe(id, routed, topk, shared, sub, ffn)` | Router → [shared] Expert 1 · · · Expert N → weighted sum; `ffn` links Expert N to an FFN panel | All MoE models |
| `attention(id, title, sub, pos, qknorm, gate)` | Q/K/V linears (+QK-norm, +RoPE) → SDPA → [⊗ σ-gate] → Linear | GQA/MHA, gated attention, MiniMax, Muse |
| `gated_gqa(id, sub)` | `attention` with Q/K L2 clip and a sigmoid gate | Inkling family |
| `mla(id, title, sub, pos, dsa, gate)` | Down/up Q, latent KV, rope-K (+ indexer column when `dsa`) → attention | DeepSeek V3/R1, Kimi DSA |
| `mla_dsa(...)` | `mla` with a DSA indexer column | DeepSeek V3.2, GLM-5.x |
| `delta(id, title, sub, …)` | Q/K/V/αβ columns → gated delta rule → RMSNorm → ⊗ gate → Linear | KDA, Gated DeltaNet |
| `csa(id, title, sub)` | Q + RoPE, compressed KV, indexer top-k → sparse attention | DeepSeek V4 / V4.1 |
| `mhc(id, sub, …)` | Pre-mix → sublayer → post, plus residual mix → add to 4 streams | DeepSeek V4, GLM-5.3 |
| `attnres(id, sub)` | Depth sources → softmax-weighted mix | Inkling, Kimi K3.1 |
| `loop(id, sub, before, middle, after, passes, msg)` | Before → pass 1…n → after | Inkling 2 Mini, GLM-5.4 |
| `chain_panel(id, title, sub, chain)` | Any vertical list | Engram, hierarchical indexer |
| `dict(...)` by hand | Any `columns / base / merge / chain / gate / bus` combination | Cross-pass message |

Model-family helpers (`deepseek_v3`, `deepseek_v4`, `llama32`, `gpt_oss`) share one spec across sibling
models. Prefer a helper when two models differ only in numbers.

---

## 7. Acceptance gate

`render.py` refuses to write a model silently wrong:
- **Spec assertions:** every panel has an inbound link, every `zoom` id has a panel, no diagonal segments,
  and the header chips fit.
- **Checker** (`problems()`). A model **FAILS** on any of:
  - collinear overlap of two different lines
  - a crossing between two different lines (T-junctions are allowed)
  - a line through a box, op, or a panel it does not start in or end at
  - a line through text
  - text overlapping a box or other text

`OK` from the checker is necessary but not sufficient. **Look at every changed diagram.** Render previews
with headless Chrome:

```bash
render() {  # render <svg> <out.png>
  read -r _ _ w h < <(rg -o 'viewBox="[^"]*"' -m1 "$1" | tr -d 'viewBox="')
  f=$(mktemp).html
  echo "<body style='margin:0'><img src='file://$1' style='width:1100px;display:block'>" > "$f"
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
    --allow-file-access-from-files --window-size=1100,$((1100*h/w+1)) --screenshot="$2" "file://$f" </dev/null
}
mkdir -p /tmp/preview
for f in processed/*.svg; do render "$PWD/$f" "/tmp/preview/$(basename "$f" .svg).png"; done
```

Visual checklist for each diagram:
- [ ] Title and chips correct; arch chips follow the rule in [§3](#3-content-rules)
- [ ] Callout numbers match the source; missing facts are omitted, not guessed
- [ ] Every zoom panel has one dotted link from the right component
- [ ] No leftover prose, explainer strips or "resource savings" lists
- [ ] Insets roughly as tall as the stack (no long column hanging below)
- [ ] Math symbols render in KaTeX; text renders in Segoe UI

---

## 8. Workflow

### Add a model
1. Read its original (`models/<file>.svg`): dump the text and look at the rendered image.
2. Decide the chips with [§3](#3-content-rules), and list the components and their order bottom to top.
3. Write the spec in `MODELS` (or reuse a family helper):
   ```python
   dict(file="<same stem as models/>", title="Llama 3", params="8B", arch=["Dense"], layers="32",
        context="8,192", d_model="4,096", vocab="128k",
        blocks=[Block("Transformer block", "32 ×", [
            [B("RMSNorm 1", "norm"), B("Masked grouped-query attention", "attn", "RoPE", zoom="attn")],
            [B("RMSNorm 2", "norm"), B("Feed forward", "ff", "SwiGLU", zoom="ffn")]])],
        panels=[attention("attn", "Masked grouped-query attention", "32 heads · causal mask · RoPE on Q and K"),
                swiglu("ffn", "Hidden layer dimension 14,336")]),
   ```
4. `python3 template/render.py <name>` until it prints `OK`, then review the preview ([§7](#7-acceptance-gate)).

### Add a panel type
Write a function in the library section of `models.py` that returns the generic panel dict. Reuse
`columns / base / merge / chain / gate / bus`. If the generic engine truly cannot express it, extend
`panel_layout()` in `render.py`, and keep every new line orthogonal and checked.

### Change the design
- Colors, fonts, sizes, strokes and markers: constants at the top of `render.py` ([§4](#4-visual-style-spec)).
- Geometry: the `FRAME / BLOCK / CX / LANES1 / GRID_X` constants ([§5.2](#52-main-stack-geometry-renderpy-constants)).
- After any change, re-render **all** models, then run the gate and the visual review.
- Update this document in the same change.

---

## 9. Known limits and backlog
- Fonts are referenced by name, not embedded ([§4.3](#43-typography)).
- Schematic panels (CSA/HCA, CSA2, Engram, indexer, mHC, AttnRes) are not taken from the source;
  revisit them when real internals are available.
- `transformer_architecture.svg` (encoder–decoder) is the color reference and is copied through
  unchanged. The template is decoder-only; encoder-decoder models would need a second stack.
- Models with many tower-linked panels get tall, because those panels all stack in column 1
  (V4.1-Flash: 1910 px). If that matters, allow a second column only past some panel count.

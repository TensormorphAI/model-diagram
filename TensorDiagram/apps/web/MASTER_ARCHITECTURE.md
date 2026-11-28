# Model visualizer: master architecture

The model visualizer turns the description of a neural network into an editable architecture diagram drawn with
`@tensormorph/tensordiagramcore`. It reproduces in the browser what two Python tools do offline:

- `../../../llmviz` reads a Hugging Face `config.json` (or a GGUF header), normalizes it into an `ArchSpec` and computes
  the parameter counts from per-layer math;
- `../../../template` (`render.py`, `models.py`, [`DESIGN.md`](../../../template/DESIGN.md)) draws one fixed anatomy for
  every model from a data spec: the decoder tower, residual ⊕, `N ×` repeat, dotted-leader callouts and zoom panels.

The visualizer joins them. llmviz supplies the facts and the template supplies the picture. TensorDiagram renders the
cells, so the result can be moved, relabeled and exported instead of being a static SVG.

```
 config.json ─┐
 safetensors ─┼─▶ parse ─▶ ArchSpec ─▶ build ─▶ DiagramSpec ─▶ draw ─▶ TensorDiagram cells ─▶ SVG / XML
 header       │   (facts)              (template)   (editable JSON)    (layout + style)     (edit in place)
 DiagramSpec ─┘ ─────────────────────────────────────────▲
```

Every arrow is a pure function except the last one. Each stage can be tested on its own, and the editor can enter at
any of them.

---

## 1. Goals and non-goals

| Goal | How |
| --- | --- |
| Any decoder LM config renders without code changes | Generic-first parser with field-name synonyms and capability detection (ported from `llmviz/spec.py`) |
| Facts are computed, never invented | Callouts and chips come from the config or the weights; a missing field draws nothing ([§4](#4-content-rules)) |
| One look for every model | The visual spec of `DESIGN.md` §4, in constants at the top of the draw module |
| Editable result | The output is a TensorDiagram graph: drag, resize, double-click to relabel, re-render from the spec |
| Runs in the browser with no backend | Header-only reads of local files, no weights loaded, no network on mount |

Non-goals for the first version: the backtracking link router and the geometric checker of `render.py`, encoder-decoder
stacks, looped-depth ("Recurrent") models, multimodal towers. See [§9](#9-backlog).

---

## 2. Inputs

| Source | Read how | What it gives |
| --- | --- | --- |
| `config.json` (HF) | Pasted, sample, or file input; JSON | Every structural field: sizes, heads, MoE, MLA, hybrid layout, positional encoding, norms |
| `model.safetensors` | `file.slice(0, 8)` is a little-endian u64 header length `n`, then `file.slice(8, 8 + n)` is JSON. **Never read past the header**; a 16 GB file costs a few kB | Tensor names, dtypes and shapes. Exact parameter count = Σ product(shape) |
| Safetensors header JSON | Pasted | Same as above |
| `DiagramSpec` JSON | Pasted, or "Show spec" | Skips parsing; draws exactly what it says. This is the hand-editing path |

The input kind is detected from the JSON itself, not from a mode switch:

- it has a `blocks` array → `DiagramSpec`;
- its values carry `dtype` and `shape` (or it has `__metadata__`) → safetensors header;
- otherwise → config.

`model.safetensors.index.json` is not a header. Its `weight_map` holds names without shapes, and its
`metadata.total_size` is **bytes, not parameters**. It is not accepted. Use a shard's header instead.

### 2.1 Weights to config

A safetensors header is turned into a partial config, which then goes through the same parser. Shapes are
`[out, in]`.

| Tensor pattern | Field |
| --- | --- |
| `embed_tokens.weight`, `wte.weight` `[V, H]` | `vocab_size = V`, `hidden_size = H` |
| `wpe.weight` `[P, H]` | learned positions, `max_position_embeddings = P` |
| max `layers.N.` / `h.N.` index + 1 | `num_hidden_layers` |
| `q_proj` `[Hq·d, H]`, `k_proj` `[Hk·d, H]` | ratio gives GQA/MQA. `d` from `q_norm.weight [d]` when present, else heads are unknown and left out |
| `kv_a_proj_with_mqa`, `q_a_proj` | MLA ranks |
| `gate_proj` / `up_proj` `[I, H]` | `intermediate_size`, gated activation |
| `experts.N.` max + 1, `experts.*.gate_proj [Im, H]` | `num_experts`, `moe_intermediate_size` |
| `shared_expert` / `shared_experts` | shared experts present |
| `lm_head.weight` missing | tied embeddings |
| a norm with a `.bias` | LayerNorm |

Not inferred from the weights, so not drawn: the head count without a `q_norm` tensor (Llama has none), MLA (the
`kv_b_proj` shape mixes the head count with the nope and value dims), top-k, positional encoding, context length.

A sharded checkpoint gives this per shard. The tool reads one header at a time, so a shard that does not hold layer 0
infers less. The exact count is then the count **of that file**, and the facts line says "exact for this weights file".

---

## 3. `ArchSpec`: the normalized facts

A TypeScript port of `llmviz/spec.py` (`parse_config` + `_estimate_params`), with the same names, so fixes can move
between the two code bases.

```ts
interface ArchSpec {
  name: string; modelType: string;
  hidden: number; layers: number; vocab?: number; context?: number;
  intermediate: number; activation: string;
  attention: { kind: 'MHA' | 'GQA' | 'MQA' | 'MLA'; heads?: number; kvHeads?: number; headDim?: number;
               slidingWindow?: number; qkNorm: boolean; mla?: { qLoraRank?: number; kvLoraRank: number;
               qkNopeHeadDim: number; qkRopeHeadDim: number; vHeadDim: number } };
  moe?: { experts: number; topK: number; shared: number; expertIntermediate: number; denseLayers: number };
  norm: 'rmsnorm' | 'layernorm'; positional: 'rope' | 'learned' | 'alibi' | 'nope';
  hybrid?: { linear: number; full: number; kind: string };   // linear-attention layers vs softmax layers
  tied: boolean;
  totalParams: number; activeParams: number; exact: boolean;  // exact = summed from a weights header
}
```

Rules carried over from llmviz:

- `text_config` is unwrapped (multimodal wrappers nest the LM).
- Field synonyms: `hidden_size | n_embd | d_model | dim`, `num_hidden_layers | n_layer | num_layers`, five spellings
  of top-k, three of the expert count, and so on.
- `kv_lora_rank` + `qk_*_head_dim` + `v_head_dim` → MLA; `kv == 1` → MQA; `kv < heads` → GQA; else MHA.
- Hybrid detection: `layer_types`, `linear_attn_config.kda_layers`, `full_attention_interval`, `attn_type_list`,
  `linear_*`.
- Parameter math per layer: attention + 2 norms + (dense FFN, or router + experts + shared). Gated activations
  (`silu`, `swiglu`) count 3 matrices, others 2 plus biases. Learned positions add `P·H`. Untied heads add `V·H`.

One deliberate difference: llmviz guesses `heads = hidden / 128` when the config has no head count. Here an unknown
head count stays `undefined`, and no head count is drawn ([§4](#4-content-rules)).

---

## 4. Content rules

These are the rules of `DESIGN.md` §3, with "the source diagram" replaced by "the config or the weights".

- **Only stated facts are drawn.** A missing `vocab_size` means no "Vocabulary size of …" callout, never a default.
- Architecture chips:
  - **MoE**: has routed experts (`num_experts > 1`).
  - **Hybrid**: linear or recurrent-state attention mixed with softmax attention. A sliding-window local:global mix
    alone is not hybrid.
  - **Dense**: neither.
  - **Recurrent** (looped depth) has no signal in HF configs and is never emitted by the parser. A hand-written
    `DiagramSpec` may still use it.
- What goes where follows `DESIGN.md` §3: totals in the title, type/active/layers/context in the chips, `d_model` and
  vocabulary as left callouts, one short qualifier per box caption, numbers in the panel facts line, internals in zoom
  panels, no prose.

---

## 5. `DiagramSpec`: the template data

The JSON twin of the `models.py` dicts, so a spec written for `render.py` maps one to one. It is the editable
artifact of the editor.

```ts
type Cat = 'emb' | 'norm' | 'attn' | 'ff' | 'lin' | 'soft' | 'plain' | 'group' | 'dots';
interface Box   { label: string; cat: Cat; cap?: string; zoom?: string }      // B(...)
interface Op    { op: '+' | '×'; gateIn?: boolean }                           // OP(...)
interface Block { title: string; repeat: string; sublayers: Box[][]; zoom?: string }
interface Panel { id: string; title: string; sub?: string;
                  columns?: (Box | Op)[][]; base?: Box & { cols: number[] };
                  merge?: Box | Op; chain?: (Box | Op)[]; gate?: Box[]; bus?: boolean }
interface DiagramSpec {
  title: string; params?: string; arch: ('Dense' | 'MoE' | 'Hybrid' | 'Recurrent')[];
  active?: string; layers?: string; context?: string; dModel?: string; vocab?: string;
  input?: string; tokenizer?: string;
  pre?: Box[]; blocks: Block[]; post?: Box[]; final?: string; head?: Box[];
  panels: Panel[];
}
```

Lists run **bottom to top**, as in `models.py`.

### 5.1 Builder: `ArchSpec` → `DiagramSpec`

| Fact | Main stack | Panel (library function) |
| --- | --- | --- |
| `positional = learned` | `pre: Positional embedding` | |
| attention MHA/GQA/MQA | `Masked <kind> attention`, caption RoPE / NoPE / sliding window | `attention(qkNorm)` |
| attention MLA | `Multi-head latent attention` | `mla()` |
| hybrid | `<linear> or attention`, caption `N : M ratio` | `delta()` and `attention()` from one box |
| dense FFN | `Feed forward`, caption SwiGLU / GELU | `swiglu()` or `geluMlp()` |
| MoE | `MoE`, caption `k of N routed (+ s shared)` | `moe()`, with Expert N → `swiglu()` |
| `moe.denseLayers` | panel facts: `first N blocks dense` | |
| norm | `RMSNorm 1/2` or `LayerNorm 1/2`, `Final RMSNorm` | |
| tied | output layer caption `tied to embedding` | |

The panel library is the subset of `models.py` that a config can trigger: `attention`, `mla`, `delta`, `swiglu`,
`geluMlp`, `moe`. The others (`csa`, `mhc`, `attnres`, `loop`, `chain_panel`) are reachable by editing the spec,
since the panel engine is generic.

---

## 6. Drawing: `DiagramSpec` → TensorDiagram cells

### 6.1 Graph setup

- `Graph` with the default plugins plus `RubberBandHandler`: the editor wants every interaction.
- Styles are **inline per cell**, no registered custom shapes, so that `resetGlobalState()` between demos stays
  correct and the XML export is self-contained.
- The model frame, the main block and every zoom panel are **containers**: their boxes are children, so dragging a panel
  or the frame moves its content, and the edges inside follow. The layout computes absolute coordinates, and the draw
  helper converts them to the parent's coordinates. An edge belongs to the common parent of its two ends, or to its only
  end when it dangles (the input and output stubs of a panel).
- The header, the callouts, the logits text, the tokenizer and the input text sit in the default parent.

### 6.2 Style map (`DESIGN.md` §4)

| Element | TensorDiagram style |
| --- | --- |
| Module box | `rounded, arcSize, fillColor = FILL[cat], strokeColor #111, strokeWidth 1.5, shadow, whiteSpace wrap`. Caption is a second line in `#555`, label is HTML |
| ⊕ / ⊗ | `shape: ellipse, perimeter: ellipsePerimeter`, 22×22, white |
| Model frame | `rounded, fillColor #ececec, gradientColor #d6d6d6, strokeColor #2a2a2a`, not selectable as a target |
| Main block | `fillColor = ARCH[first].light, gradientColor = ARCH[last].dark`, `gradientDirection: south` |
| Zoom panel | `dashed, dashPattern '1.5 4.5', fillColor #f4f4f4 → #e4e4e4`, title as a text cell above it |
| Data flow | `edgeStyle orthogonalEdgeStyle, endArrow block, strokeColor #111` |
| Residual | Same; from a junction on the incoming arrow, out to the left lane (`RES_X`), into ⊕ from the left |
| Zoom link | `dashed, dashPattern '1 5', endArrow block, strokeColor #2b2b2b`, from the right edge of the box |
| Callout | Text cell left of the frame, numbers in the accent color, dashed leader edge to the box |
| `N ×` | Text cell left of the block, accent color, bold. No brace shape |

Two deliberate gaps against `render.py`:

- `gradientDirection` is limited to the four compass directions, so the 0.35 diagonal of the original cannot be
  matched. South is used.
- Fonts are referenced by name, `Segoe UI, Helvetica, Arial`, exactly as in the Python template.

### 6.3 Layout

- **Main stack.** It is measured bottom-up like `measure_tower` and laid out top-down: logits text, head, output layer,
  final norm, post, blocks (each sublayer = its boxes + ⊕, with a residual), pre, embedding. The tokenizer and the input
  text sit below the frame. Constants: `CX`, `BOX_W`, `G`, `FRAME`, `BLOCK` and `RES_X` of `DESIGN.md` §5.2.
- **Panels: column mode only.** Panels linked from the stack are sorted by source height. Each is placed at
  `GRID_X`, aligned with its source when there is room, otherwise below the previous one. A child panel (Expert N →
  FFN) goes to the right of its parent, top-aligned.
- **Panel engine** (`DESIGN.md` §5.5): input stub → [base spanning some columns] → columns (bottom-aligned box
  stacks) → merge (box, or op) → chain → output stub, plus an optional gate column entering a chain op from the right.
  Column pitch 116, box width 102, chain width 170.
- **Routing** is delegated to `orthogonalEdgeStyle`. No crossing check: the user can move a panel, and the edges
  follow.

---

## 7. Editor (the `model-viz` demo)

One demo of the showcase, following `apps/web/README.md` "Add a demo". It needs no extra route, framework or
dependency.

| Area | Content |
| --- | --- |
| Toolbar | `Render`, `Show spec`, `Export SVG`, `Fit` |
| Side panel | Sample `<select>`, file input (`config.json`, `.safetensors`, a spec), source textarea, a facts line (total / active params, exact or estimated, KV cache per token) |
| Stage | The diagram. Drag, resize, rubber-band select, double-click to relabel |

Flow:

1. Mount renders the first bundled sample right away. The smoke test fails on a demo with no SVG, and mount makes no
   network request.
2. Picking a sample or a file fills the textarea and renders it.
3. `Render` parses the textarea, detects its kind ([§2](#2-inputs)) and redraws. An error goes to the event log, and
   the previous diagram stays: a parse error never touches the graph, and a draw error (an unknown zoom id in a
   hand-edited spec) redraws the previous spec.
4. `Show spec` replaces the textarea with the `DiagramSpec` JSON of the current diagram. Edit it, then `Render`
   again. This is how a panel type the parser never emits gets drawn.
5. `Export SVG` uses the same export as the `data` demo (shared helper `src/svg-export.ts`).

Bundled samples (from `llmviz/tests/fixtures`, real Hub configs, trimmed to the fields the parser reads):

- Llama 3 8B: dense, GQA, RoPE;
- GPT-2: learned positions, LayerNorm, GELU, tied;
- Qwen3-235B-A22B: MoE, QK-norm;
- DeepSeek-V3: MLA, MoE with a shared expert, first 3 blocks dense;
- Qwen3-Next-80B-A3B: hybrid gated DeltaNet : attention, MoE.

---

## 8. Code layout

```
apps/web/src/
  modelviz/spec.ts      parse (config, safetensors header) → ArchSpec, params, ArchSpec → DiagramSpec, samples
  modelviz/diagram.ts   DiagramSpec → cells: style constants, stack layout, panel engine, links
  demos/model-viz.ts    the editor demo
  svg-export.ts         SVG export shared with demos/data.ts
apps/web/e2e/scenarios.mjs     scenario `model-viz: …`: samples, a weights header, spec round trip, parse error
```

### 8.1 Verification

- The e2e scenario is the runnable check. It pins the estimates on the ground truths of `llmviz/tests/test_spec.py`
  (Llama 3 8B 8.03 B, DeepSeek-V3 671.03 B total and 37.55 B active). It checks the MLA and `Router` boxes, renders a
  synthetic safetensors header and compares the exact total with the sum of its shapes. It also checks that "Show spec"
  then "Render" gives the same diagram, and that invalid JSON keeps the previous one.
- `bun run --cwd apps/web build` covers tsc and the 548 kB chunk budget. `bun run --cwd apps/web test:e2e` runs the
  smoke test, the scenarios and the listener-leak cycle over every demo.

---

## 9. Backlog

| Item | Note |
| --- | --- |
| Hugging Face id input | `https://huggingface.co/<id>/resolve/main/config.json` allows CORS. It is a network request triggered by the user, so keep it off mount |
| Remote safetensors header | An HTTP `Range: bytes=0-7` request, then a second one for the header |
| GGUF header | Port `llmviz/gguf.py`: header-only key/value read, vocabulary from the token array length |
| Link router + checker | Port the backtracking search of `render.py` §5.4 if the orthogonal router produces crossings people complain about |
| Grid mode for insets | Two columns when the panel column runs more than 40 px below the stack (`DESIGN.md` §5.3) |
| Encoder-decoder, looped depth | Second stack, `loop()` panel. Both need a `DiagramSpec` written by hand until a config signal exists |
| `diff` / `lineage` | Two `DiagramSpec`s side by side in one graph |
| Zoom-link elbows after a move | The lane waypoints of a zoom link are absolute, so after a panel is dragged the last segment of an elbow link turns diagonal. Straight links and everything inside a container follow. Re-render, or drop the waypoints (`orthogonalEdgeStyle`) once a link is edited |
| Legend row | The category legend of `DESIGN.md` §2 is not drawn yet |
| Persist edits | Positions are lost on `Render`. Export the XML (`ModelXmlSerializer`) to keep a hand-tuned layout |

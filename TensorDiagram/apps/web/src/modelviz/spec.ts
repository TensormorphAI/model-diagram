// Model description -> ArchSpec (facts) -> DiagramSpec (template data), see apps/web/MASTER_ARCHITECTURE.md.
// parseConfig and estimateParams are a port of llmviz/spec.py: keep the names aligned so fixes move both ways.

type Json = Record<string, any>;

// ------------------------------------------------------------------ ArchSpec

export interface ArchSpec {
  name: string;
  modelType: string;
  hidden: number;
  layers: number;
  vocab?: number;
  context?: number;
  intermediate: number;
  activation: string;
  attention: {
    kind?: 'MHA' | 'GQA' | 'MQA' | 'MLA';
    heads?: number;
    kvHeads?: number;
    headDim?: number;
    slidingWindow?: number;
    qkNorm: boolean;
    bias: boolean;
    mla?: {
      qLoraRank?: number;
      kvLoraRank: number;
      qkNopeHeadDim: number;
      qkRopeHeadDim: number;
      vHeadDim: number;
    };
  };
  moe?: {
    experts: number;
    topK?: number;
    shared: number;
    expertIntermediate: number;
    denseLayers: number;
  };
  norm: 'rmsnorm' | 'layernorm';
  normMode: 'pre' | 'post' | 'sandwich';
  positional: 'rope' | 'learned' | 'alibi' | 'unknown';
  hybrid?: { kind: string; linear?: number; full?: number };
  tied: boolean;
  totalParams: number;
  activeParams?: number;
  /** true when totalParams is the sum of the tensor shapes of a weights header, false when estimated */
  exact: boolean;
  kvCacheBytesPerToken?: number;
}

const QK_NORM_MODEL_TYPES = new Set([
  'qwen3',
  'qwen3_moe',
  'qwen3_next',
  'olmo2',
  'gemma3',
  'gemma3_text',
]);
const POST_NORM_MODEL_TYPES = new Set(['olmo2']);
const SANDWICH_NORM_MODEL_TYPES = new Set(['gemma2', 'gemma3', 'gemma3_text']);
const TIED_BY_DEFAULT = new Set(['gpt2', 'gemma', 'gemma2', 'gemma3', 'gemma3_text']);
const LINEAR_MIXER_NAMES: Record<string, string> = {
  qwen3_next: 'Gated DeltaNet',
  kimi_linear: 'Kimi delta attention',
  minimax: 'Lightning attention',
  minimax_m1: 'Lightning attention',
  lfm2: 'Short conv',
};

const get = (cfg: Json, ...keys: string[]): any => {
  for (const key of keys) if (cfg[key] != null) return cfg[key];
  return undefined;
};

const humanize = (s: string) =>
  s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Non-standard token mixers, from whichever encoding the config uses (llmviz `_hybrid_note`). */
const parseHybrid = (
  cfg: Json,
  layers: number,
  modelType: string
): ArchSpec['hybrid'] => {
  const named = LINEAR_MIXER_NAMES[modelType];
  const lt = cfg.layer_types;
  if (Array.isArray(lt)) {
    const exotic = lt.filter(
      (t) => !['full_attention', 'sliding_attention', 'attention'].includes(t)
    );
    if (exotic.length)
      return {
        kind: named ?? humanize(exotic[0]),
        linear: exotic.length,
        full: lt.length - exotic.length,
      };
  }
  const la = cfg.linear_attn_config;
  if (la?.kda_layers)
    return {
      kind: 'Kimi delta attention',
      linear: la.kda_layers.length,
      full: la.full_attn_layers?.length,
    };
  if (cfg.full_attention_interval) {
    const full = Math.floor(layers / cfg.full_attention_interval);
    return { kind: named ?? 'Linear attention', linear: layers - full, full };
  }
  if (Array.isArray(cfg.full_attn_idxs))
    return {
      kind: named ?? 'Conv mixer',
      linear: layers - cfg.full_attn_idxs.length,
      full: cfg.full_attn_idxs.length,
    };
  if (Array.isArray(cfg.attn_type_list)) {
    const al: number[] = cfg.attn_type_list;
    return {
      kind: named ?? 'Lightning attention',
      linear: al.filter((t) => t === 0).length,
      full: al.filter((t) => t === 1).length,
    };
  }
  if (Object.keys(cfg).some((k) => k.startsWith('linear_')))
    return { kind: named ?? 'Linear attention' };
  if (Object.keys(cfg).some((k) => k.startsWith('mamba_') || k.startsWith('ssm_')))
    return { kind: 'Mamba' };
  return undefined;
};

export const parseConfig = (input: Json, name = 'model'): ArchSpec => {
  // multimodal wrappers (gemma3, llama4, ...) nest the LM under text_config
  const cfg: Json = input.text_config ? { ...input.text_config } : input;
  const modelType: string = cfg.model_type ?? input.model_type ?? 'unknown';
  const hidden: number | undefined = get(
    cfg,
    'hidden_size',
    'n_embd',
    'd_model',
    'dim',
    'hidden_dim'
  );
  const layers: number | undefined = get(
    cfg,
    'num_hidden_layers',
    'n_layer',
    'num_layers',
    'n_layers'
  );
  if (hidden == null || layers == null)
    throw new Error(
      `no recognizable hidden-size / layer fields (model_type ${modelType}): not a decoder LM config`
    );
  const heads: number | undefined = get(
    cfg,
    'num_attention_heads',
    'n_head',
    'num_heads',
    'n_heads'
  );
  let kvHeads: number | undefined =
    get(cfg, 'num_key_value_heads', 'num_kv_heads', 'n_kv_heads') ?? heads;
  if (cfg.multi_query) kvHeads = 1;
  const headDim: number | undefined =
    get(cfg, 'head_dim') ?? (heads ? hidden / heads : undefined);
  const intermediate: number =
    get(
      cfg,
      'intermediate_size',
      'n_inner',
      'ffn_hidden_size',
      'ffn_dim',
      'block_ff_dim'
    ) ?? 4 * hidden;

  let kind: ArchSpec['attention']['kind'];
  let mla: ArchSpec['attention']['mla'];
  if (
    ['kv_lora_rank', 'qk_nope_head_dim', 'qk_rope_head_dim', 'v_head_dim'].every(
      (k) => cfg[k]
    )
  ) {
    kind = 'MLA';
    mla = {
      qLoraRank: cfg.q_lora_rank ?? undefined,
      kvLoraRank: cfg.kv_lora_rank,
      qkNopeHeadDim: cfg.qk_nope_head_dim,
      qkRopeHeadDim: cfg.qk_rope_head_dim,
      vHeadDim: cfg.v_head_dim,
    };
  } else if (heads != null && kvHeads != null) {
    kind = kvHeads === 1 ? 'MQA' : kvHeads < heads ? 'GQA' : 'MHA';
  }

  const nExperts: number | undefined = get(
    cfg,
    'num_experts',
    'n_routed_experts',
    'num_local_experts',
    'moe_num_experts'
  );
  let moe: ArchSpec['moe'];
  if (nExperts && nExperts > 1) {
    let shared: number = get(cfg, 'n_shared_experts', 'num_shared_experts') ?? 0;
    if (!shared && (cfg.shared_expert_intermediate_size || cfg.shared_intermediate_size))
      shared = 1;
    moe = {
      experts: nExperts,
      topK: get(
        cfg,
        'num_experts_per_tok',
        'experts_per_token',
        'num_experts_per_token',
        'moe_topk',
        'moe_top_k',
        'num_selected_experts'
      ),
      shared,
      expertIntermediate: get(cfg, 'moe_intermediate_size') ?? intermediate,
      denseLayers: cfg.first_k_dense_replace ?? 0,
    };
  }

  const theta = get(cfg, 'rope_theta', 'rotary_emb_base', 'rope_embedding_base');
  const positional: ArchSpec['positional'] = cfg.alibi
    ? 'alibi'
    : theta != null || cfg.rotary
      ? 'rope'
      : modelType === 'gpt2' || cfg.position_embedding_type === 'absolute'
        ? 'learned'
        : 'unknown';

  const spec: ArchSpec = {
    name,
    modelType,
    hidden,
    layers,
    vocab: get(cfg, 'vocab_size', 'padded_vocab_size'),
    context: get(
      cfg,
      'max_position_embeddings',
      'n_positions',
      'n_ctx',
      'max_seq_len',
      'max_sequence_length',
      'seq_length',
      'model_max_length'
    ),
    intermediate,
    activation:
      get(cfg, 'hidden_act', 'hidden_activation', 'activation_function') ??
      (cfg.block_use_swiglu ? 'silu' : 'gelu'),
    attention: {
      kind,
      heads,
      kvHeads,
      headDim,
      slidingWindow:
        cfg.use_sliding_window === false ? undefined : (cfg.sliding_window ?? undefined),
      qkNorm: QK_NORM_MODEL_TYPES.has(modelType) || !!cfg.use_qk_norm,
      bias: !!(cfg.attention_bias ?? modelType === 'gpt2'),
      mla,
    },
    moe,
    norm: 'layer_norm_epsilon' in cfg ? 'layernorm' : 'rmsnorm',
    normMode: POST_NORM_MODEL_TYPES.has(modelType)
      ? 'post'
      : SANDWICH_NORM_MODEL_TYPES.has(modelType)
        ? 'sandwich'
        : 'pre',
    positional,
    hybrid: parseHybrid(cfg, layers, modelType),
    tied: !!(cfg.tie_word_embeddings ?? TIED_BY_DEFAULT.has(modelType)),
    totalParams: 0,
    exact: false,
  };
  estimateParams(spec);
  return spec;
};

// ------------------------------------------------------------------ parameter estimation (llmviz)

const isGated = (act: string) =>
  act === 'silu' || act === 'swiglu' || act.includes('gelu_pytorch_tanh');

const attnParams = (s: ArchSpec): number => {
  const a = s.attention;
  const h = s.hidden;
  // ponytail: heads unknown (weights without a head dim) -> assume 128-wide heads, only feeds the estimate
  const heads = a.heads ?? Math.max(Math.floor(h / 128), 1);
  if (a.mla) {
    const m = a.mla;
    const qkDim = m.qkNopeHeadDim + m.qkRopeHeadDim;
    const q = m.qLoraRank
      ? h * m.qLoraRank + m.qLoraRank + m.qLoraRank * heads * qkDim
      : h * heads * qkDim;
    const kv =
      h * (m.kvLoraRank + m.qkRopeHeadDim) +
      m.kvLoraRank +
      m.kvLoraRank * heads * (m.qkNopeHeadDim + m.vHeadDim);
    return q + kv + heads * m.vHeadDim * h;
  }
  const headDim = a.headDim ?? h / heads;
  const qDim = heads * headDim;
  const kvDim = (a.kvHeads ?? heads) * headDim;
  let p = h * qDim + 2 * h * kvDim + qDim * h;
  if (a.bias) p += qDim + 2 * kvDim + h;
  if (a.qkNorm) p += 2 * headDim;
  return p;
};

const ffnParams = (s: ArchSpec, inter: number) =>
  isGated(s.activation) ? 3 * s.hidden * inter : 2 * s.hidden * inter + inter + s.hidden;

export const estimateParams = (s: ArchSpec): void => {
  const h = s.hidden;
  const vocab = s.vocab ?? 0;
  const embed = vocab * h + (s.positional === 'learned' ? (s.context ?? 0) * h : 0);
  const head = s.tied ? 0 : vocab * h;
  const perLayer = attnParams(s) + 2 * h;
  let total = embed + head + h;
  let active = total;
  for (let layer = 0; layer < s.layers; layer++) {
    total += perLayer;
    active += perLayer;
    const m = s.moe;
    if (m && layer >= m.denseLayers) {
      const router = h * m.experts;
      const expert = ffnParams(s, m.expertIntermediate);
      // ponytail: shared-expert width = expert width * n_shared (DeepSeek convention, as llmviz)
      const shared = m.shared ? ffnParams(s, m.expertIntermediate * m.shared) : 0;
      total += router + m.experts * expert + shared;
      active += router + (m.topK ?? 0) * expert + shared;
    } else {
      const dense = ffnParams(s, s.intermediate);
      total += dense;
      active += dense;
    }
  }
  s.totalParams = total;
  s.activeParams = s.moe && s.moe.topK == null ? undefined : active;
  const a = s.attention;
  const perToken = a.mla
    ? a.mla.kvLoraRank + a.mla.qkRopeHeadDim
    : a.kvHeads && a.headDim
      ? 2 * a.kvHeads * a.headDim
      : 0;
  s.kvCacheBytesPerToken = perToken ? 2 * s.layers * perToken : undefined; // fp16
};

// ------------------------------------------------------------------ safetensors header -> partial config

export type SafetensorsHeader = Record<
  string,
  { dtype: string; shape: number[]; data_offsets?: number[] } | Json
>;

export const isSafetensorsHeader = (json: Json): boolean =>
  '__metadata__' in json ||
  Object.values(json).some(
    (v) => v != null && typeof v === 'object' && 'dtype' in v && Array.isArray(v.shape)
  );

/** Reads only the header of a .safetensors file: 8 bytes of length, then that many bytes of JSON. */
export const readSafetensorsHeader = async (file: Blob): Promise<SafetensorsHeader> => {
  const length = new DataView(await file.slice(0, 8).arrayBuffer()).getBigUint64(0, true);
  if (length > 100_000_000n)
    throw new Error('not a safetensors file: header length out of range');
  return JSON.parse(await file.slice(8, 8 + Number(length)).text());
};

/**
 * Infers the config fields the tensor names and shapes reveal (MASTER_ARCHITECTURE.md §2.1), then parses it.
 * The total is exact, everything else is what the shapes allow; a fact they cannot give stays unset.
 */
export const parseWeights = (header: SafetensorsHeader, name = 'weights'): ArchSpec => {
  const tensors = Object.entries(header).filter(([key]) => key !== '__metadata__') as [
    string,
    { shape: number[] },
  ][];
  const shape = (re: RegExp) => tensors.find(([key]) => re.test(key))?.[1].shape;
  const has = (re: RegExp) => tensors.some(([key]) => re.test(key));
  const maxIndex = (re: RegExp) =>
    tensors.reduce((max, [key]) => Math.max(max, Number(re.exec(key)?.[1] ?? -1)), -1) +
    1;

  const cfg: Json = {};
  const emb = shape(/(embed_tokens|wte|word_embeddings|tok_embeddings)\.weight$/);
  if (emb) [cfg.vocab_size, cfg.hidden_size] = emb;
  const wpe = shape(/wpe\.weight$/);
  if (wpe)
    [cfg.max_position_embeddings, cfg.position_embedding_type] = [wpe[0], 'absolute'];
  cfg.num_hidden_layers = maxIndex(/\.(?:layers|h|blocks)\.(\d+)\./);

  const q = shape(/\.0\.(?:self_attn|attn|attention)\.(?:q_proj|wq)\.weight$/);
  const k = shape(/\.0\.(?:self_attn|attn|attention)\.(?:k_proj|wk)\.weight$/);
  const qNorm = shape(/\.0\.(?:self_attn|attn|attention)\.q_norm\.weight$/);
  if (qNorm) cfg.use_qk_norm = true;
  if (q && k && qNorm) {
    cfg.head_dim = qNorm[0];
    cfg.num_attention_heads = q[0] / qNorm[0];
    cfg.num_key_value_heads = k[0] / qNorm[0];
  }
  cfg.attention_bias = has(/\.0\.(?:self_attn|attn|attention)\.(?:q_proj|wq)\.bias$/);

  const gate = shape(/\.mlp\.(?:gate_proj|w1)\.weight$/);
  const up = shape(/\.mlp\.(?:up_proj|c_fc|fc1|w3)\.weight$/);
  if (gate) [cfg.intermediate_size, cfg.hidden_act] = [gate[0], 'silu'];
  else if (up) [cfg.intermediate_size, cfg.hidden_act] = [Math.max(...up), 'gelu'];

  const experts = maxIndex(/\.experts\.(\d+)\./);
  if (experts > 1) {
    cfg.num_experts = experts;
    cfg.moe_intermediate_size = shape(
      /\.experts\.\d+\.(?:gate_proj|w1|up_proj)\.weight$/
    )?.[0];
    cfg.first_k_dense_replace = maxIndex(/\.(\d+)\.mlp\.(?:gate_proj|up_proj)\.weight$/);
    const shared = shape(/\.shared_experts?\.(?:gate_proj|up_proj)\.weight$/);
    if (shared) cfg.shared_expert_intermediate_size = shared[0];
  }
  // parseConfig keys the norm type off this field, as llmviz does: a norm with a bias is a LayerNorm
  if (has(/\.0\.(?:input_layernorm|ln_1|attention_norm)\.bias$/))
    cfg.layer_norm_epsilon = 1e-5;
  cfg.tie_word_embeddings = !has(/(lm_head|output)\.weight$/);

  const spec = parseConfig(cfg, name);
  spec.totalParams = tensors.reduce(
    (sum, [, t]) => sum + t.shape.reduce((p, d) => p * d, 1),
    0
  );
  spec.activeParams = undefined;
  spec.exact = true;
  return spec;
};

// ------------------------------------------------------------------ DiagramSpec (the template data of template/models.py)

export type Cat =
  'emb' | 'norm' | 'attn' | 'ff' | 'lin' | 'soft' | 'plain' | 'group' | 'dots';
export type Arch = 'Dense' | 'MoE' | 'Hybrid' | 'Recurrent';
export interface Box {
  label: string;
  cat: Cat;
  cap?: string;
  zoom?: string | string[];
}
export interface Op {
  op: '+' | '×';
  gateIn?: boolean;
}
export type Item = Box | Op;
export interface Block {
  title: string;
  repeat: string;
  sublayers: Box[][];
}
export interface Panel {
  id: string;
  title: string;
  sub?: string;
  columns?: Item[][];
  base?: Box & { cols: number[] };
  merge?: Item;
  chain?: Item[];
  gate?: Box[];
  bus?: boolean;
}
/** Lists run bottom to top, as in template/models.py. */
export interface DiagramSpec {
  title: string;
  params?: string;
  arch: Arch[];
  active?: string;
  layers?: string;
  context?: string;
  dModel?: string;
  vocab?: string;
  input?: string;
  pre?: Box[];
  blocks: Block[];
  post?: Box[];
  final?: string;
  head?: Box[];
  outputCap?: string;
  panels: Panel[];
}

export const isDiagramSpec = (json: Json): json is DiagramSpec =>
  Array.isArray(json.blocks);

const B = (label: string, cat: Cat, cap?: string, zoom?: string | string[]): Box => ({
  label,
  cat,
  ...(cap && { cap }),
  ...(zoom && { zoom }),
});
const OP = (op: Op['op'], gateIn?: boolean): Op => (gateIn ? { op, gateIn } : { op });
const num = (n: number) => n.toLocaleString('en-US');
export const fmtParams = (n: number) =>
  n >= 1e12
    ? `${+(n / 1e12).toFixed(2)}T`
    : n >= 1e9
      ? `${+(n / 1e9).toFixed(1)}B`
      : `${+(n / 1e6).toFixed(0)}M`;
const facts = (...parts: (string | number | false | undefined)[]) =>
  parts.filter(Boolean).join(' · ');

// Panel library: the subset of template/models.py a config can trigger

const swiglu = (id: string, sub: string): Panel => ({
  id,
  title: 'Feed forward (SwiGLU)',
  sub,
  columns: [
    [B('Linear (gate)', 'lin'), B('SiLU activation', 'ff')],
    [B('Linear (up)', 'lin')],
  ],
  merge: OP('×'),
  chain: [B('Linear (down)', 'lin')],
});

const geluMlp = (id: string, sub: string): Panel => ({
  id,
  title: 'Feed forward (MLP)',
  sub,
  chain: [B('Linear (up)', 'lin'), B('GELU activation', 'ff'), B('Linear (down)', 'lin')],
});

const moePanel = (
  id: string,
  routed: number,
  topK: number | undefined,
  shared: number,
  sub: string,
  ffn?: string
): Panel => {
  const columns: Item[][] = shared
    ? [
        [
          B(
            shared === 1 ? 'Shared expert' : `${shared} shared experts`,
            'ff',
            'always active'
          ),
        ],
      ]
    : [];
  const first = columns.length;
  columns.push(
    [B('Expert 1', 'ff')],
    [B('· · ·', 'dots')],
    [B(`Expert ${routed}`, 'ff', undefined, ffn)]
  );
  return {
    id,
    title: 'MoE layer',
    sub,
    columns,
    base: {
      ...B('Router', 'soft', topK ? `top-${topK} of ${routed}` : `${routed} experts`),
      cols: [first, first + 1, first + 2],
    },
    merge: B('Weighted sum of expert outputs', 'soft'),
  };
};

const attentionPanel = (
  id: string,
  title: string,
  sub: string,
  pos?: string,
  qkNorm?: boolean
): Panel => {
  const qk = [...(qkNorm ? [B('QK-Norm', 'norm')] : []), ...(pos ? [B(pos, 'emb')] : [])];
  return {
    id,
    title,
    sub,
    columns: [
      [B('Linear Q', 'lin'), ...qk],
      [B('Linear K', 'lin'), ...qk],
      [B('Linear V', 'lin')],
    ],
    merge: B('Scaled dot-product attention', 'attn', 'causal mask'),
    chain: [B('Linear (output)', 'lin')],
  };
};

const mlaPanel = (id: string, sub: string, pos?: string): Panel => ({
  id,
  title: 'Multi-head latent attention',
  sub,
  columns: [
    [B('Linear (down) Q', 'lin'), B('RMSNorm', 'norm'), B('Linear (up) Q', 'lin')],
    [
      B('Linear (down) KV', 'lin'),
      B('Latent KV', 'attn', 'compressed cache'),
      B('Linear (up) K, V', 'lin'),
    ],
    ...(pos ? [[B('Linear K (rope)', 'lin'), B(pos, 'emb')]] : []),
  ],
  merge: B('Multi-head attention', 'attn'),
  chain: [B('Linear (output)', 'lin')],
});

const deltaPanel = (id: string, title: string, sub: string): Panel => ({
  id,
  title,
  sub,
  columns: [
    [B('Linear Q', 'lin'), B('Conv + SiLU', 'ff'), B('L2 Norm', 'norm')],
    [B('Linear K', 'lin'), B('Conv + SiLU', 'ff'), B('L2 Norm', 'norm')],
    [B('Linear V', 'lin'), B('Conv + SiLU', 'ff')],
    [B('Linear α, β', 'lin', 'decay, write')],
  ],
  merge: B('Gated delta rule', 'attn', 'recurrent state'),
  chain: [B('RMSNorm', 'norm'), OP('×', true), B('Linear (output)', 'lin')],
  gate: [B('Linear (gate)', 'lin'), B('Sigmoid σ', 'soft')],
});

/** ArchSpec -> DiagramSpec, MASTER_ARCHITECTURE.md §5.1. Only facts the ArchSpec holds are written. */
export const buildDiagram = (s: ArchSpec): DiagramSpec => {
  const a = s.attention;
  const arch: Arch[] = [
    ...(s.moe ? (['MoE'] as const) : []),
    ...(s.hybrid ? (['Hybrid'] as const) : []),
  ];
  const normName = s.norm === 'rmsnorm' ? 'RMSNorm' : 'LayerNorm';
  const pos =
    s.positional === 'rope' ? 'RoPE' : s.positional === 'alibi' ? 'ALiBi' : undefined;
  const panels: Panel[] = [];

  const kindName = {
    MHA: 'multi-head',
    GQA: 'grouped-query',
    MQA: 'multi-query',
    MLA: 'latent',
  } as const;
  const attnTitle =
    a.kind === 'MLA'
      ? 'Multi-head latent attention'
      : `Masked ${a.kind ? `${kindName[a.kind]} ` : ''}attention`;
  const attnSub = facts(
    a.heads && `${a.heads} heads`,
    a.kind === 'GQA' && a.kvHeads && `${a.kvHeads} KV heads`,
    a.headDim && a.kind !== 'MLA' && `head dim ${num(a.headDim)}`,
    a.mla && `KV rank ${num(a.mla.kvLoraRank)}`,
    a.mla?.qLoraRank && `Q rank ${num(a.mla.qLoraRank)}`,
    a.slidingWindow && `sliding window ${num(a.slidingWindow)}`,
    pos && `${pos} on Q and K`
  );
  panels.push(
    a.kind === 'MLA'
      ? mlaPanel('attn', attnSub, pos && `Partial ${pos}`)
      : attentionPanel('attn', attnTitle, attnSub, pos, a.qkNorm)
  );

  let attnBox = B(attnTitle, 'attn', pos, 'attn');
  if (s.hybrid) {
    const h = s.hybrid;
    const ratio =
      h.linear != null && h.full != null ? `${h.linear} : ${h.full} ratio` : undefined;
    attnBox = B(`${h.kind} or attention`, 'attn', ratio, ['linear', 'attn']);
    panels.unshift(
      deltaPanel(
        'linear',
        h.kind,
        facts(
          h.linear != null && `${h.linear} ${h.kind} layers`,
          h.full != null && `${h.full} attention layers`
        )
      )
    );
  }

  const ffnPanel = (id: string, inter: number) =>
    isGated(s.activation)
      ? swiglu(id, `Hidden layer dimension ${num(inter)}`)
      : geluMlp(id, `Hidden layer dimension ${num(inter)}`);
  let ffnBox: Box;
  if (s.moe) {
    const m = s.moe;
    ffnBox = B(
      'MoE',
      'ff',
      facts(
        m.shared && `${m.shared} shared`,
        m.topK ? `${m.topK} of ${m.experts} routed` : `${m.experts} routed`
      ),
      'moe'
    );
    panels.push(
      moePanel(
        'moe',
        m.experts,
        m.topK,
        m.shared,
        facts(
          `Expert hidden size ${num(m.expertIntermediate)}`,
          m.denseLayers &&
            `first ${m.denseLayers} blocks dense (hidden ${num(s.intermediate)})`
        ),
        'ffn'
      ),
      ffnPanel('ffn', m.expertIntermediate)
    );
  } else {
    ffnBox = B(
      'Feed forward',
      'ff',
      isGated(s.activation) ? 'SwiGLU' : s.activation.toUpperCase().replace(/_.*/, ''),
      'ffn'
    );
    panels.push(ffnPanel('ffn', s.intermediate));
  }

  const sublayer = (n: number, box: Box): Box[] =>
    s.normMode === 'post'
      ? [box, B(`${normName} ${n}`, 'norm')]
      : s.normMode === 'sandwich'
        ? [B(`${normName} ${n}a`, 'norm'), box, B(`${normName} ${n}b`, 'norm')]
        : [B(`${normName} ${n}`, 'norm'), box];

  return {
    title: s.name,
    params: s.totalParams ? fmtParams(s.totalParams) : undefined,
    arch: arch.length ? arch : ['Dense'],
    active: s.moe && s.activeParams ? fmtParams(s.activeParams) : undefined,
    layers: String(s.layers),
    context: s.context ? num(s.context) : undefined,
    dModel: num(s.hidden),
    vocab: s.vocab ? num(s.vocab) : undefined,
    pre: s.positional === 'learned' ? [B('Positional embedding', 'emb')] : [],
    blocks: [
      {
        title: 'Transformer block',
        repeat: `${s.layers} ×`,
        sublayers: [sublayer(1, attnBox), sublayer(2, ffnBox)],
      },
    ],
    final: `Final ${normName}`,
    outputCap: s.tied ? 'tied to embedding' : undefined,
    panels,
  };
};

// ------------------------------------------------------------------ samples: real Hub configs (llmviz/tests/fixtures), trimmed

export const samples: Record<string, Json> = {
  'Llama-3-8B': {
    architectures: ['LlamaForCausalLM'],
    model_type: 'llama',
    hidden_size: 4096,
    intermediate_size: 14336,
    num_hidden_layers: 32,
    num_attention_heads: 32,
    num_key_value_heads: 8,
    hidden_act: 'silu',
    max_position_embeddings: 8192,
    rope_theta: 500000.0,
    rms_norm_eps: 1e-5,
    attention_bias: false,
    tie_word_embeddings: false,
    vocab_size: 128256,
  },
  'GPT-2': {
    architectures: ['GPT2LMHeadModel'],
    model_type: 'gpt2',
    activation_function: 'gelu_new',
    n_embd: 768,
    n_head: 12,
    n_layer: 12,
    n_ctx: 1024,
    n_positions: 1024,
    layer_norm_epsilon: 1e-5,
    vocab_size: 50257,
  },
  'Qwen3-235B-A22B': {
    architectures: ['Qwen3MoeForCausalLM'],
    model_type: 'qwen3_moe',
    hidden_size: 4096,
    intermediate_size: 12288,
    num_hidden_layers: 94,
    num_attention_heads: 64,
    num_key_value_heads: 4,
    head_dim: 128,
    hidden_act: 'silu',
    max_position_embeddings: 40960,
    rope_theta: 1000000.0,
    rms_norm_eps: 1e-6,
    num_experts: 128,
    num_experts_per_tok: 8,
    moe_intermediate_size: 1536,
    use_sliding_window: false,
    sliding_window: null,
    attention_bias: false,
    tie_word_embeddings: false,
    vocab_size: 151936,
  },
  'DeepSeek-V3': {
    architectures: ['DeepseekV3ForCausalLM'],
    model_type: 'deepseek_v3',
    hidden_size: 7168,
    intermediate_size: 18432,
    num_hidden_layers: 61,
    num_attention_heads: 128,
    num_key_value_heads: 128,
    hidden_act: 'silu',
    max_position_embeddings: 163840,
    rope_theta: 10000,
    rms_norm_eps: 1e-6,
    q_lora_rank: 1536,
    kv_lora_rank: 512,
    qk_nope_head_dim: 128,
    qk_rope_head_dim: 64,
    v_head_dim: 128,
    n_routed_experts: 256,
    n_shared_experts: 1,
    num_experts_per_tok: 8,
    moe_intermediate_size: 2048,
    first_k_dense_replace: 3,
    attention_bias: false,
    tie_word_embeddings: false,
    vocab_size: 129280,
  },
  'Qwen3-Next-80B-A3B': {
    architectures: ['Qwen3NextForCausalLM'],
    model_type: 'qwen3_next',
    hidden_size: 2048,
    intermediate_size: 5120,
    num_hidden_layers: 48,
    num_attention_heads: 16,
    num_key_value_heads: 2,
    head_dim: 256,
    hidden_act: 'silu',
    max_position_embeddings: 262144,
    rope_theta: 10000000,
    partial_rotary_factor: 0.25,
    full_attention_interval: 4,
    linear_conv_kernel_dim: 4,
    linear_key_head_dim: 128,
    linear_num_key_heads: 16,
    linear_num_value_heads: 32,
    linear_value_head_dim: 128,
    num_experts: 512,
    num_experts_per_tok: 10,
    moe_intermediate_size: 512,
    shared_expert_intermediate_size: 512,
    use_sliding_window: false,
    tie_word_embeddings: false,
    vocab_size: 151936,
  },
};

/** Any accepted JSON -> what to draw, plus the facts line. Throws with a readable message on anything else. */
export const toDiagram = (
  json: Json,
  name: string
): { diagram: DiagramSpec; arch?: ArchSpec } => {
  if (isDiagramSpec(json)) return { diagram: json };
  if (json.weight_map)
    throw new Error(
      'an index.json lists tensor names without shapes: open one of the .safetensors shards instead'
    );
  const arch = isSafetensorsHeader(json)
    ? parseWeights(json, name)
    : parseConfig(json, name);
  return { diagram: buildDiagram(arch), arch };
};

"""Model specs for render.py. Facts are transcribed from the original diagrams in models/;
a field missing there is left out here (no tag is drawn) rather than filled in from memory."""
from render import B, OP, Block

# ------------------------------------------------------------------ zoom panel library
# Every panel = input bus -> [base] -> columns -> merge -> chain (+ gate column) -> output.
# Columns and chains are listed bottom -> top.


def swiglu(id, sub, act="SiLU activation", up="Linear (up)", title="Feed forward (SwiGLU)"):
    return dict(id=id, title=title, sub=sub,
                columns=[[B("Linear (gate)", "lin"), B(act, "ff")], [B(up, "lin")]],
                merge=OP("×"), chain=[B("Linear (down)", "lin")])


def gelu_mlp(id, sub):
    return dict(id=id, title="Feed forward (MLP)", sub=sub,
                chain=[B("Linear (up)", "lin"), B("GELU activation", "ff"), B("Linear (down)", "lin")])


def moe(id, routed, topk=None, shared=0, sub="", ffn=None, expert="Expert"):
    cols = []
    if shared:
        cols.append([B("Shared expert" if shared == 1 else f"{shared} shared experts", "ff", "always active")])
    first = len(cols)
    cols += [[B(f"{expert} 1", "ff")], [B("· · ·", "dots")], [B(f"{expert} {routed}", "ff", zoom=ffn)]]
    router_cap = f"top-{topk} of {routed}" if topk else f"{routed} experts"
    return dict(id=id, title="MoE layer", sub=sub, columns=cols,
                base=dict(B("Router", "soft", router_cap), cols=list(range(first, first + 3))),
                merge=B("Weighted sum of expert outputs", "soft"), chain=[])


def attention(id, title, sub, pos="RoPE", qknorm=None, gate=False, core="Scaled dot-product attention",
              core_cap=None, q="Linear Q", k="Linear K", v="Linear V"):
    qk = ([B(qknorm, "norm")] if qknorm else []) + ([B(pos, "emb")] if pos else [])
    p = dict(id=id, title=title, sub=sub,
             columns=[[B(q, "lin")] + qk, [B(k, "lin")] + qk, [B(v, "lin")]],
             merge=B(core, "attn", core_cap), chain=[B("Linear (output)", "lin")])
    if gate:
        p["gate"] = [B("Linear (gate)", "lin"), B("Sigmoid σ", "soft")]
        p["chain"] = [OP("×", gate_in=True), B("Linear (output)", "lin")]
    return p


def mla(id, title, sub, pos="Partial RoPE", dsa=None, core_cap=None, gate=False):
    cols = []
    if dsa:
        cols.append([B("Lightning indexer", "attn"), B(dsa, "attn")])
    cols += [[B("Linear (down) Q", "lin"), B("RMSNorm", "norm"), B("Linear (up) Q", "lin")],
             [B("Linear (down) KV", "lin"), B("Latent KV", "attn", "compressed cache"), B("Linear (up) K, V", "lin")],
             ] + ([[B("Linear K (rope)", "lin"), B(pos, "emb")]] if pos else [])
    p = dict(id=id, title=title, sub=sub, columns=cols,
             merge=B("Sparse multi-head attention" if dsa else "Multi-head attention", "attn", core_cap),
             chain=[B("Linear (output)", "lin")])
    if gate:
        p["gate"] = [B("Linear (gate)", "lin"), B("Sigmoid σ", "soft")]
        p["chain"] = [OP("×", gate_in=True), B("Linear (output)", "lin")]
    return p


def delta(id, title, sub, rule="Gated delta rule", qk_act="Conv + SiLU", v_act="Conv + SiLU", gate_act="Sigmoid σ"):
    return dict(id=id, title=title, sub=sub,
                columns=[[B("Linear Q", "lin"), B(qk_act, "ff"), B("L2 Norm", "norm")],
                         [B("Linear K", "lin"), B(qk_act, "ff"), B("L2 Norm", "norm")],
                         [B("Linear V", "lin"), B(v_act, "ff")],
                         [B("Linear α, β", "lin", "decay, write")]],
                merge=B(rule, "attn", "recurrent state"),
                chain=[B("RMSNorm", "norm"), OP("×", gate_in=True), B("Linear (output)", "lin")],
                gate=[B("Linear (gate)", "lin"), B(gate_act, "soft")])


def mhc(id, sub, title="mHC (manifold-constrained hyper-connections)", pre="Pre-mix (4 → 1)", post="Post (1 → 4)"):
    return dict(id=id, title=title, sub=sub,
                columns=[[B(pre, "soft"), B("RMSNorm + sublayer", "plain", "attention or MoE"), B(post, "soft")],
                         [B("Residual mix", "soft", "4 × 4, constrained")]],
                merge=B("Add → 4 residual streams", "soft"), chain=[])


def attnres(id, sub):
    return dict(id=id, title="Block attention residuals (AttnRes)", sub=sub, bus=False,
                columns=[[B("Token embeddings", "emb")], [B("Earlier block sums", "soft")],
                         [B("Current block partial sum", "plain")]],
                merge=B("Softmax-weighted mix", "soft", "learned per-layer query W"), chain=[])


def loop(id, sub, before, middle, after, passes, msg=None):
    chain = [B("Layers before the loop", "plain", before)]
    for i in range(1, passes + 1):
        chain.append(B(f"Pass {i}", "group", middle + (f" · {msg}" if msg and i > 1 else "")))
    chain.append(B("Layers after the loop", "plain", after))
    return dict(id=id, title="Looped middle layers (shared weights)", sub=sub, chain=chain)


def csa(id, title, sub, core_cap="interleaved per layer"):
    return dict(id=id, title=title, sub=sub,
                columns=[[B("Linear Q", "lin"), B("Partial RoPE", "emb")],
                         [B("Linear KV", "lin"), B("Compress KV", "attn", "token blocks")],
                         [B("Lightning indexer", "attn"), B("Top-k blocks", "attn")]],
                merge=B("Sparse attention over compressed KV", "attn", core_cap),
                chain=[B("Linear (output)", "lin")])


def chain_panel(id, title, sub, chain):
    return dict(id=id, title=title, sub=sub, chain=chain)


def mla_dsa(id, title, sub, pos="Partial RoPE", gate=False, select="Top-k token select"):
    return mla(id, title, sub, pos=pos, dsa=select, gate=gate)


def deepseek_v3(file, title, attn_label, attn_panel):
    return dict(file=file, title=title, params="671B", active="37B", arch=["MoE"], layers="61",
                context="128k (YaRN)", d_model="7,168", vocab="129k",
                blocks=[Block("Transformer block", "61 ×", [
                    [B("RMSNorm 1", "norm"), B(attn_label, "attn", "Partial RoPE · 128 heads", zoom="attn")],
                    [B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 8 of 256 routed", zoom="moe")]])],
                panels=[attn_panel,
                        moe("moe", 256, 8, 1, "1 shared + 8 routed experts active per token · first 3 blocks "
                            "use a dense FFN (hidden size 18,432)", ffn="ffn"),
                        swiglu("ffn", "Intermediate hidden layer dimension 2,048")])


def deepseek_v4(file, title, params, active, layers, d_model, heads, routed, expert_dim, first_layers):
    return dict(file=file, title=title, params=params, active=active, arch=["MoE"], layers=layers,
                context="1M (YaRN)", d_model=d_model, vocab="129k",
                blocks=[Block("Transformer block", f"{layers} ×", [
                    [B("mHC pre", "soft", zoom="mhc"), B("RMSNorm 1", "norm"),
                     B("Compressed Sparse Attention (CSA) / Heavily Compressed Attention (HCA)", "attn",
                       "interleaved · Partial RoPE", zoom="attn"), B("mHC post", "soft")],
                    [B("mHC pre", "soft"), B("RMSNorm 2", "norm"),
                     B("MoE", "ff", f"1 shared + 6 of {routed} routed", zoom="moe"), B("mHC post", "soft")]])],
                post=[B("mHC head (4 → 1)", "soft")],
                panels=[mhc("mhc", "4 parallel residual streams; replaces the plain residual x + F(x) "
                                   "with constrained multi-stream mixing"),
                        csa("attn", "Compressed sparse attention (CSA / HCA)",
                            f"{heads} heads · {first_layers} · YaRN, 64k RoPE base",
                            "CSA, or HCA with heavier compression"),
                        moe("moe", routed, 6, 1, "1 shared + 6 routed experts per token · first 3 blocks use "
                            "hash-based routing instead of learned top-k", ffn="ffn"),
                        swiglu("ffn", f"Intermediate hidden layer dimension {expert_dim}")])


def llama32(file, title, params, layers, d_model, heads):
    return dict(file=file, title=title, params=params, arch=["Dense"], layers=layers, context="128k",
                d_model=d_model, vocab="128k",
                blocks=[Block("Transformer block", f"{layers} ×", [
                    [B("RMSNorm 1", "norm"), B("Masked grouped-query attention", "attn", "RoPE", zoom="attn")],
                    [B("RMSNorm 2", "norm"), B("Feed forward", "ff", "SwiGLU", zoom="ffn")]])],
                panels=[attention("attn", "Masked grouped-query attention",
                                  f"{heads} heads · causal mask · Llama 3 RoPE"),
                        swiglu("ffn", "Hidden layer dimension 8,192")])


def gpt_oss(file, title, params, active, layers, experts):
    return dict(file=file, title=title, params=params, active=active, arch=["MoE"], layers=layers,
                context="128k (YaRN)", d_model="2,880", vocab="200k",
                blocks=[Block("Transformer block", f"{layers} ×", [
                    [B("RMSNorm 1", "norm"), B("Grouped-query attention", "attn", "RoPE", zoom="attn")],
                    [B("RMSNorm 2", "norm"), B("MoE", "ff", f"4 of {experts} experts", zoom="moe")]])],
                panels=[attention("attn", "Grouped-query attention", "64 heads · RoPE with YaRN, 4k base"),
                        moe("moe", experts, 4, 0, "4 experts active per token, no shared expert", ffn="ffn"),
                        swiglu("ffn", "Input expert size 2,880 · intermediate projection 2,880")])


def gated_gqa(id, sub):
    return attention(id, "Gated grouped-query attention", sub, pos=None, qknorm="Q/K L2 clip", gate=True)


# ------------------------------------------------------------------ models
MODELS = [
    dict(file="llama3_architecture", title="Llama 3", params="8B", arch=["Dense"], layers="32",
         context="8,192", d_model="4,096", vocab="128k",
         blocks=[Block("Transformer block", "32 ×", [
             [B("RMSNorm 1", "norm"), B("Masked grouped-query attention", "attn", "RoPE", zoom="attn")],
             [B("RMSNorm 2", "norm"), B("Feed forward", "ff", "SwiGLU", zoom="ffn")]])],
         panels=[attention("attn", "Masked grouped-query attention", "32 heads · causal mask · RoPE on Q and K"),
                 swiglu("ffn", "Hidden layer dimension 14,336")]),

    gpt_oss("gpt-oss-120b-architecture", "gpt-oss-120b", "120B", "5.1B", "36", 128),
    gpt_oss("gpt-oss-20b-architecture", "gpt-oss-20b", "20B", "3.6B", "24", 32),

    dict(file="Inkling_2_Mini_Architecture", title="Inkling 2 Mini", params="26.4B", active="3.4B",
         arch=["MoE", "Recurrent"], layers="24 layers · 48 applications", context="1M", d_model="2,304",
         vocab="200,058",
         pre=[B("Embedding RMSNorm", "norm"), B("Layers before the loop", "plain", "layers 1–6 · run once")],
         blocks=[Block("Middle layers 7–18 · 3 passes", "12 ×", [
             [B("AttnRes mix", "soft", zoom="attnres"), B("RMSNorm 1", "norm"),
              B("Gated grouped-query attention", "attn", "5 local : 1 global", zoom="attn"),
              B("Short conv (kernel 4)", "ff")],
             [B("AttnRes mix", "soft"), B("RMSNorm 2", "norm"), B("MoE", "ff", "8 of 128 experts", zoom="moe"),
              B("Short conv (kernel 4)", "ff")]], zoom="loop")],
         post=[B("Layers after the loop", "plain", "layers 19–24 · run once"), B("Final Block AttnRes", "soft")],
         head=[B("Logit softcap (30)", "soft")],
         panels=[loop("loop", "24 distinct layers, 48 layer applications per token",
                      "layers 1–6", "middle layers 7–18", "layers 19–24", 3, "gated message"),
                 attnres("attnres", "4 AttnRes blocks · 6 layers per block"),
                 gated_gqa("attn", "24 query heads · 8 KV heads · local window 1,024 · K/V short convs · "
                                   "learned relative-position bias · Q/K L2 clip, V norm"),
                 moe("moe", 128, 8, 0, "8 of 128 experts per token, 0 shared", ffn="ffn"),
                 swiglu("ffn", "Expert FFN width 1,152", act="Softcapped SiLU", up="Linear + softcap")]),

    llama32("llama_3_2_1b_architecture", "Llama 3.2 1B", "1B", "16", "2,048", 32),
    llama32("llama_3_2_3b_architecture", "Llama 3.2 3B", "3B", "28", "3,072", 24),

    deepseek_v3("DeepSeek-V3_Architecture_Overview", "DeepSeek-V3", "Multi-head latent attention",
                mla("attn", "Multi-head latent attention (MLA)", "128 heads · YaRN context, 4k RoPE base")),
    deepseek_v3("DeepSeek-R1_Architecture", "DeepSeek-R1", "Multi-head latent attention",
                mla("attn", "Multi-head latent attention (MLA)", "128 heads · YaRN context, 4k RoPE base")),
    deepseek_v3("DeepSeek-V3_2_Architecture", "DeepSeek-V3.2", "MLA + DeepSeek Sparse Attention (DSA)",
                mla_dsa("attn", "MLA + DeepSeek Sparse Attention (DSA)", "128 heads · YaRN context, 4k RoPE base")),

    deepseek_v4("deepseek-v4-flash-architecture", "DeepSeek-V4-Flash", "284B", "13B", "43", "4,096", 64, 256,
                "2,048", "first 2 layers use sliding window attention alone"),
    deepseek_v4("deepseek-v4-pro", "DeepSeek-V4-Pro", "1.6T", "49B", "61", "7,168", 128, 384,
                "3,072", "first 2 layers use HCA + sliding window attention"),

    dict(file="deepseek_v4.1_flash_architecture", title="DeepSeek-V4.1-Flash", params="552B + 196B Engram",
         active="8B prefill / 16B decode", arch=["MoE"], layers="20 encoder + 20 decoder", context="1M",
         d_model="5,120", vocab="129k",
         blocks=[Block("Causal encoder", "20 ×", [
                     [B("Engram", "emb", "blocks 2 and 15 only", zoom="engram")],
                     [B("RMSNorm + attention", "attn", "SWA, or CSA2(2, Full / Reuse)", zoom="csa2")],
                     [B("RMSNorm + MoE", "ff", "1 shared + 6 of 384 routed", zoom="moe")]]),
                 Block("Decoder", "20 ×", [
                     [B("RMSNorm + attention", "attn", "CSA2(1, Full / Reindex / Reuse)", zoom="indexer")],
                     [B("RMSNorm + MoE", "ff", "1 shared + 6 of 384 routed")]])],
         post=[B("Final pre-mix (4 → 1)", "soft", zoom="mhc")],
         panels=[chain_panel("engram", "Engram (token n-gram lookup)", "196B parameters, used in encoded blocks 2 and 15",
                             [B("Token n-gram", "emb"), B("Engram table lookup", "emb", "196B parameters"),
                              B("Add to hidden state", "soft")]),
                 csa("csa2", "Compressed Sparse Attention 2 · CSA2(ratio, mode)",
                     "mode=Full builds global KV and sparse indices · Reindex recomputes sparse indices · "
                     "Reuse shares KV and sparse indices · CSA2 includes SWA", "Partial RoPE · YaRN, 64k pretraining"),
                 chain_panel("indexer", "Hierarchical sparse indexer",
                             "The first decoder Full layer builds a candidate pool for later Reindex layers",
                             [B("CSA2(1, Full)", "attn", "builds global KV and sparse indices"),
                              B("Candidate pool", "attn"), B("CSA2(1, Reindex)", "attn", "recomputes sparse indices"),
                              B("CSA2(1, Reuse)", "attn", "shares KV and sparse indices")]),
                 moe("moe", 384, 6, 1, "1 shared + 6 routed experts per token", ffn="ffn"),
                 swiglu("ffn", "Intermediate hidden layer dimension 2,304"),
                 mhc("mhc", "4 parallel residual streams · single-pass mHC surrounds every attention and MoE "
                            "sublayer; each sublayer computes pre-mix weights for the next",
                     title="Single-Pass mHC", pre="Previous pre-mix (4 → 1)", post="mHC post + residual")]),

    dict(file="glm-5.2-architecture", title="GLM-5.2", params="744B", active="40B", arch=["MoE"], layers="78",
         context="1M", d_model="6,144", vocab="155k",
         blocks=[Block("Transformer block", "78 ×", [
             [B("RMSNorm 1", "norm"), B("MLA + DSA with IndexShare", "attn", "Partial RoPE", zoom="attn")],
             [B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 8 of 256 routed", zoom="moe")]])],
         panels=[mla_dsa("attn", "MLA + DeepSeek Sparse Attention (DSA)", "DSA with IndexShare",
                         select="Top-k select (IndexShare)"),
                 moe("moe", 256, 8, 1, "8 routed + 1 shared expert per token · first 3 blocks use a dense FFN "
                     "(hidden size 12,288)", ffn="ffn"),
                 swiglu("ffn", "Input expert size 6,144 · intermediate projection 2,048")]),

    dict(file="glm-5.3-flash-architecture", title="GLM-5.3-Flash “Ox Alpha”", params="320B", active="18B",
         arch=["MoE", "Hybrid"], layers="45 (34 KDA + 11 MLA+DSA)", context="1M", d_model="4,096", vocab="155k",
         blocks=[Block("Transformer block", "45 ×", [
             [B("mHC mixer", "soft", zoom="mhc"), B("RMSNorm 1", "norm"),
              B("MLA + DSA, or Kimi Delta Attention", "attn", "64 heads", zoom=["mla", "kda"]),
              B("mHC mixer", "soft")],
             [B("mHC mixer", "soft"), B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 8 of 288 routed", zoom="moe"),
              B("mHC mixer", "soft")]])],
         panels=[mhc("mhc", "4 parallel residual streams; replaces the plain residual x + F(x)",
                     pre="mHC mixer", post="mHC mixer"),
                 mla_dsa("mla", "MLA + DeepSeek Sparse Attention (11 layers)", "NoPE in MLA Q/K", pos=None),
                 delta("kda", "Kimi Delta Attention (34 layers)", "Q/K L2-Norm"),
                 moe("moe", 288, 8, 1, "1 shared + 8 routed experts per token · first 3 blocks use dense SwiGLU FFNs",
                     ffn="ffn"),
                 swiglu("ffn", "Intermediate hidden layer dimension 2,048 per expert")]),

    dict(file="GLM-5_4_Architecture_Diagram", title="GLM-5.4", params="~750B", arch=["MoE", "Recurrent"],
         layers="78 distinct layers · 106 applications", context="1M", d_model="6,144", vocab="155k",
         pre=[B("Layers before the loop", "plain", "layers 1–26 · run once")],
         blocks=[Block("Middle decoder layer · 2 passes", "28 ×", [
             [B("RMSNorm 1", "norm"), B("MLA + DeepSeek Sparse Attention (DSA)", "attn", "Partial RoPE", zoom="attn")],
             [B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 8 of 256 routed", zoom="moe")]], zoom="loop")],
         post=[B("Layers after the loop", "plain", "layers 55–78 · run once")],
         panels=[loop("loop", "Pass 2 reuses the sparse indices and selected KV entries from pass 1 and keeps "
                              "its own sliding-window KV cache", "layers 1–26", "middle layers 27–54", "layers 55–78", 2),
                 mla_dsa("attn", "MLA + DeepSeek Sparse Attention (DSA)", "Partial RoPE"),
                 moe("moe", 256, 8, 1, "8 of 256 routed + 1 shared expert per token · layers 1–3 use a dense "
                     "FFN (width 12,288)", ffn="ffn"),
                 swiglu("ffn", "Input expert size 6,144 · intermediate projection 2,048")]),

    dict(file="Inkling_2_Small_Architecture", title="Inkling 2 Small", params="594B", active="17B", arch=["MoE"],
         layers="48", context="1M", d_model="4,608", vocab="200k",
         pre=[B("Embedding RMSNorm", "norm")],
         blocks=[Block("Transformer block", "48 ×", [
             [B("AttnRes mix", "soft", zoom="attnres"), B("RMSNorm 1", "norm"),
              B("Gated GQA + sliding window attention", "attn", "5 : 1 ratio", zoom="attn"),
              B("Short conv (kernel 4)", "ff")],
             [B("AttnRes mix", "soft"), B("RMSNorm 2", "norm"), B("MoE", "ff", "8 of 384 experts", zoom="moe"),
              B("Short conv (kernel 4)", "ff")]])],
         post=[B("Final Block AttnRes", "soft")], head=[B("Logit softcap (30)", "soft")],
         panels=[attnres("attnres", "8 AttnRes blocks · 6 layers per block · global layers mix Q, K and V separately"),
                 gated_gqa("attn", "48 query heads · 8 KV heads · K/V short convs · learned relative-position bias · "
                                   "Q/K L2 clip, V norm"),
                 moe("moe", 384, 8, 0, "8 routed, 0 shared experts per token", ffn="ffn"),
                 swiglu("ffn", "Intermediate hidden layer dimension 2,304", act="Softcapped SiLU", up="Linear + softcap")]),

    dict(file="inkling-2-mini-architecture", title="Inkling 2 Mini", params="26.4B",
         active="3.4B (5.4B over 3 passes)", arch=["MoE", "Recurrent"], layers="24 layers · 48 visits",
         context="1M", d_model="2,304", vocab="200k",
         pre=[B("Embedding RMSNorm", "norm"), B("Prelude", "plain", "layers 0–5 · run once")],
         blocks=[Block("Loop core · layers 6–17 · 3 passes", "12 ×", [
             [B("AttnRes mix", "soft", zoom="attnres"), B("Message gates Q, K, V", "soft", zoom="msg"),
              B("RMSNorm 1", "norm"), B("Gated GQA + sliding-window attention", "attn", "5 : 1 ratio", zoom="attn"),
              B("Short conv (kernel 4)", "ff")],
             [B("AttnRes mix", "soft"), B("Message gate", "soft"), B("RMSNorm 2", "norm"),
              B("MoE", "ff", "8 of 128 experts", zoom="moe"), B("Short conv (kernel 4)", "ff")]], zoom="loop")],
         post=[B("Coda", "plain", "layers 18–23 · run once"), B("Final Block AttnRes", "soft")],
         head=[B("Logit softcap (30)", "soft")],
         panels=[loop("loop", "Prelude and coda run once with no message gates", "Prelude · layers 0–5",
                      "loop core · layers 6–17", "Coda · layers 18–23", 3, "cross-pass message"),
                 dict(id="msg", title="Cross-pass message", sub="From the previous pass, applied after passes 1 and 2",
                      bus=False, columns=[[B("Block 2 sum", "soft")], [B("Block 3 sum", "soft")]],
                      merge=B("Read with 4 learned queries", "soft", "per layer: Q, K, V and MoE"),
                      chain=[B("Gate (rank 64, tanh)", "soft", "$(1 − f) · x + g · m")]),
                 attnres("attnres", "4 AttnRes blocks · 6 layers per block · the full-attention layer of each "
                                    "block mixes Q, K and V separately"),
                 gated_gqa("attn", "24 query heads · 8 KV heads · K/V short convs · learned relative-position bias · "
                                   "Q/K L2 clip, sink, gate"),
                 moe("moe", 128, 8, 0, "8 routed, 0 shared experts per token", ffn="ffn"),
                 swiglu("ffn", "Intermediate hidden layer dimension 1,152", act="Softcapped SiLU", up="Linear + softcap")]),

    dict(file="kimi_k3_1_pro_architecture", title="Kimi K3.1 Pro", params="2.8T", arch=["MoE", "Hybrid"],
         layers="93 (69 KDA + 24 DSA)", context="1M",
         blocks=[Block("Transformer block", "93 ×", [
             [B("AttnRes mix", "soft", "learned w → weights α", zoom="attnres"), B("RMSNorm 1", "norm"),
              B("Kimi Delta Attention or Gated sparse attention", "attn", "NoPE", zoom=["kda", "dsa"])],
             [B("AttnRes mix", "soft"), B("RMSNorm 2", "norm"),
              B("FFN / LatentMoE", "ff", "layer 1 dense, layers 2–93 LatentMoE")]])],
         post=[B("Final Block AttnRes", "soft")],
         panels=[attnres("attnres", "8 AttnRes blocks: 7 × 12 layers + one 9-layer block"),
                 delta("kda", "Kimi Delta Attention (KDA)", "69 KDA layers", qk_act="Conv + φ", v_act="Conv + SiLU"),
                 mla_dsa("dsa", "Gated DeepSeek Sparse Attention (DSA)", "24 DSA layers · indexer selects up to 2,048 "
                         "tokens · 32 index heads, 128 dimensions per head", pos=None, gate=True,
                         select="Top-2048 token select")]),

    dict(file="llama4_maverick_architecture", title="Llama 4 Maverick", params="400B", active="17B", arch=["MoE"],
         layers="48", context="1M", d_model="5,120", vocab="202k",
         blocks=[Block("Transformer block", "48 ×", [
             [B("RMSNorm 1", "norm"), B("Grouped-query attention", "attn", "RoPE / NoPE", zoom="attn")],
             [B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 1 of 128 routed", zoom="moe")]])],
         panels=[attention("attn", "Grouped-query attention", "NoPE in every 4th attention layer, RoPE elsewhere",
                           pos="RoPE / NoPE"),
                 moe("moe", 128, 1, 1, "1 shared + 1 routed expert per token · dense and MoE blocks alternate every "
                     "2nd block (dense hidden size 16,384)", ffn="ffn"),
                 swiglu("ffn", "Intermediate hidden layer dimension 8,192")]),

    dict(file="minimax-m3-architecture", title="MiniMax-M3", params="428B", active="23B", arch=["MoE"], layers="60",
         context="1M", d_model="6,144", vocab="200k",
         blocks=[Block("Transformer block", "60 ×", [
             [B("RMSNorm 1", "norm"), B("GQA / MiniMax Sparse Attention", "attn", "QK-Norm · Partial RoPE", zoom="attn")],
             [B("RMSNorm 2", "norm"), B("MoE", "ff", "1 shared + 4 of 128 routed", zoom="moe")]])],
         panels=[attention("attn", "GQA / MiniMax Sparse Attention", "First 3 blocks use GQA with a dense FFN "
                           "(hidden size 12,288)", pos="Partial RoPE", qknorm="QK-Norm"),
                 moe("moe", 128, 4, 1, "4 routed + 1 shared expert per token · 5.37% of parameters active", ffn="ffn"),
                 swiglu("ffn", "Input expert size 6,144 · intermediate projection 3,072")]),

    dict(file="muse_glimmer_30b", title="Muse Glimmer", params="30B", arch=["Dense"], layers="52", context="128k",
         d_model="6,656", vocab="202k",
         pre=[B("Scaleless RMSNorm", "norm")],
         blocks=[Block("Transformer block", "52 ×", [
             [B("Pre-RMSNorm 1", "norm"), B("Sliding window and gated GQA", "attn", "3 : 1 local : global",
                                           zoom="attn"), B("Post-RMSNorm 1", "norm")],
             [B("Pre-RMSNorm 2", "norm"), B("Feed forward", "ff", "SwiGLU", zoom="ffn"), B("Post-RMSNorm 2", "norm")]])],
         panels=[attention("attn", "Sliding window and gated GQA", "3:1 local (window 2,048) to global · 32 attention "
                           "heads, 2 key & value heads", pos="RoPE / NoPE", qknorm="Scaleless QK-Norm", gate=True),
                 swiglu("ffn", "Input dim. 6,656 · intermediate dim. 19,968")]),

    dict(file="ornith-1.5-architecture", title="Ornith 1.5", params="35B", active="3B", arch=["MoE", "Hybrid"],
         layers="40 (3 linear : 1 full)", context="256k (1M with YaRN)", d_model="2,048", vocab="248k",
         blocks=[Block("Transformer block", "40 ×", [
             [B("RMSNorm 1", "norm"), B("Gated DeltaNet or Gated attention", "attn",
                                       "Partial RoPE in attention layers", zoom=["gdn", "gattn"])],
             [B("RMSNorm 2", "norm"), B("MoE", "ff", "256 experts", zoom="moe")]])],
         panels=[delta("gdn", "Gated DeltaNet (linear attention)", "Layers 1–3 of every 4",
                       qk_act="Conv + σ", v_act="Conv + σ", gate_act="SiLU gate"),
                 attention("gattn", "Gated attention (full attention)", "Every 4th layer", pos="Partial RoPE",
                           qknorm="QK-Norm", gate=True),
                 moe("moe", 256, None, 0, "256 experts · 3B active parameters")]),

    dict(file="gpt2_xl_architecture", title="GPT-2 XL", params="1.5B", arch=["Dense"], layers="48",
         context="1,024", d_model="1,600", vocab="50k", final="Final LayerNorm", input="Every effort moves you",
         pre=[B("Positional embedding layer", "emb", "learned absolute, 1,024 positions"), B("Dropout", "norm")],
         blocks=[Block("Transformer block", "48 ×", [
             [B("LayerNorm 1", "norm"), B("Masked multi-head attention", "attn", zoom="attn"), B("Dropout", "norm")],
             [B("LayerNorm 2", "norm"), B("Feed forward", "ff", "GELU MLP", zoom="ffn"), B("Dropout", "norm")]])],
         panels=[attention("attn", "Masked multi-head attention", "25 heads · causal mask", pos=None),
                 gelu_mlp("ffn", "Hidden layer dimension 6,400")]),

    # Blank template: the slots every model fills in (rendered to template/template.svg).
    dict(file="../template/template", title="<Model name>", params="<total>", active="<active>",
         arch=["Dense", "MoE", "Hybrid", "Recurrent"], layers="<N>", context="<context>", d_model="<d>",
         vocab="<vocab>", input="<input text>",
         blocks=[Block("Main block", "N ×", [
             [B("<Norm 1>", "norm"), B("<Attention variant>", "attn", "<positional encoding>", zoom="attn")],
             [B("<Norm 2>", "norm"), B("<FFN or MoE>", "ff", "<experts>", zoom="ffn")]])],
         final="<Final norm>",
         panels=[dict(id="attn", title="<Zoom: attention internals>", sub="<facts: heads, window, ...>",
                      columns=[[B("<Q path>", "lin")], [B("<K path>", "lin")], [B("<V path>", "lin")]],
                      merge=B("<core op>", "attn"), chain=[B("<output>", "lin")]),
                 dict(id="ffn", title="<Zoom: FFN / MoE internals>", sub="<facts: hidden dim, experts, top-k>",
                      chain=[B("<step 1>", "lin"), B("<step 2>", "ff"), B("<step 3>", "lin")])]),
]

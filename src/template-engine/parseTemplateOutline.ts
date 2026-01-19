/**
 * templateOutline.mjs (vanilla JS, ESM)
 * -----------------------------------
 * Parses a markdown-ish bullet outline into a randomized template writer.
 *
 * Returns:
 *  {
 *    args: { Subject: null, ... },
 *    variance: <number>,
 *    write: (args) => string
 *  }
 *
 * Supported inline syntax (matches your latest example):
 *  - Args:           ${Subject} (backticks are ignored)
 *  - Alternation:    {a|b|c}
 *  - Optional:       {content}?   and   {a|b}?
 *  - Nesting:        {Xbox|the Xbox {content}? {catalog|library}}
 *  - Binder:         {#v{start|begin} playing|play}
 *  - Binder "other": {#v.1} (toggle: if chosen start -> other begin; chosen begin -> other start)
 *  - Glue:           {{ ... }} renders inner content as a single unspaced token
 *      Special-case: {{#v.1}ing} => "starting"/"beginning" via inflection of the toggled word
 *
 * Outline semantics:
 *  - Top-level bullets are "prefix groups" and are not emitted alone.
 *  - Any deeper bullet is a full template.
 *  - If a node has children, they are optional continuations:
 *      "now includes X" and "now includes X, which joined..." are both emitted.
 */

export function parseTemplateOutline(outlineText, { rng = Math.random } = {}) {
  const root = parseOutline(outlineText);
  const templateStrings = expandOutline(root);

  const compiled = templateStrings.map((source) => {
    const ast = parseTemplate(source);
    return {
      source,
      ast,
      variance: countVariance(ast),
      args: collectArgs(ast),
    };
  });

  const args = {};
  for (const t of compiled) for (const k of Object.keys(t.args)) args[k] = null;

  const variance = compiled.reduce((sum, t) => sum + t.variance, 0);

  function pickWeighted() {
    let roll = rng() * variance;
    for (const t of compiled) {
      roll -= t.variance;
      if (roll <= 0) return t;
    }
    return compiled[compiled.length - 1];
  }

  function write(argValues = {}) {
    const chosen = pickWeighted();
    const ctx = {
      rng,
      args: argValues,
      binds: Object.create(null),
    };
    return render(chosen.ast, ctx).trim();
  }

  return { args, variance, write };
}

/* =========================
 * Outline parsing + expansion
 * ========================= */

function parseOutline(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "  "))
    .filter((l) => l.trim().length);

  const root = { text: "", level: -1, children: [] };
  const stack = [root];

  for (const raw of lines) {
    const m = raw.match(/^(\s*)-\s+(.*)$/);
    if (!m) continue;

    const indent = m[1].length;
    const level = inferIndentLevel(indent);

    const node = { text: m[2].trim(), level, children: [] };

    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    (stack[stack.length - 1] ?? root).children.push(node);
    stack.push(node);
  }

  return root;
}

function inferIndentLevel(indentSpaces) {
  // Prefer 4-space steps; fall back to 2-space steps.
  if (indentSpaces % 4 === 0) return indentSpaces / 4;
  if (indentSpaces % 2 === 0) return indentSpaces / 2;
  return Math.floor(indentSpaces / 2);
}

function expandOutline(root) {
  const out = [];
  for (const group of root.children) {
    // group is a "prefix group" (not emitted alone)
    for (const s of expandFrom(group, { emitSelf: false })) out.push(s);
  }
  return uniq(out);
}

function expandFrom(node, { emitSelf }) {
  const results = [];
  const self = stripBackticks(node.text);

  if (emitSelf) results.push(self);

  if (!node.children.length) {
    if (!emitSelf) results.push(self);
    return results;
  }

  // Optional continuations
  for (const child of node.children) {
    for (const c of expandFrom(child, { emitSelf: true })) {
      results.push(joinPieces(self, stripBackticks(c)));
    }
  }

  return results;
}

function joinPieces(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (/^[,.;:!?)]/.test(b)) return a + b;
  return a + " " + b;
}

function stripBackticks(s) {
  return String(s).replace(/`/g, "");
}

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

/* =========================
 * Template parsing (AST)
 * =========================
 *
 * Node types:
 *  - text:     { t:"text", v:string }
 *  - arg:      { t:"arg", k:string }
 *  - choice:   { t:"choice", opts: Node[][] }
 *  - opt:      { t:"opt", inner: Node[] }
 *  - bind:     { t:"bind", key:string, opts:string[] }         // emits chosen word, stores idx
 *  - bindRef:  { t:"bindRef", key:string, mode:"chosen"|"other" }
 *  - glue:     { t:"glue", inner: Node[] }                     // renders as a single token
 */

function parseTemplate(input) {
  const s = String(input ?? "");
  const { nodes, i } = parseSeq(s, 0, null);
  if (i !== s.length) throw new Error(`Template parse: trailing content at index ${i}`);
  return normalizeSeq(nodes);
}

function parseSeq(s, start, until) {
  const nodes = [];
  let i = start;

  while (i < s.length) {
    if (until && s[i] === until) break;

    // Glue: {{ ... }}
    if (s[i] === "{" && s[i + 1] === "{") {
      const { node, nextI } = parseGlue(s, i);
      nodes.push(node);
      i = nextI;
      continue;
    }

    // Arg: ${Name}
    if (s[i] === "$" && s[i + 1] === "{") {
      const end = s.indexOf("}", i + 2);
      if (end === -1) throw new Error(`Unclosed \${...} at index ${i}`);
      nodes.push({ t: "arg", k: s.slice(i + 2, end).trim() });
      i = end + 1;
      continue;
    }

    // Group: { ... } with optional '?'
    if (s[i] === "{") {
      const { node, nextI } = parseBraceGroup(s, i);
      nodes.push(node);
      i = nextI;
      continue;
    }

    // Text chunk
    const next = nextIndexOfAny(s, i, until ? ["{", "$", until] : ["{", "$"]);
    const end = next === -1 ? s.length : next;
    nodes.push({ t: "text", v: s.slice(i, end) });
    i = end;
  }

  return { nodes, i };
}

function parseGlue(s, openIdx) {
  const close = s.indexOf("}}", openIdx + 2);
  if (close === -1) throw new Error(`Unclosed {{...}} at index ${openIdx}`);
  const innerRaw = s.slice(openIdx + 2, close);
  const inner = parseTemplate(innerRaw);
  return { node: { t: "glue", inner }, nextI: close + 2 };
}

function parseBraceGroup(s, openIdx) {
  const { content, endIdx } = extractBalanced(s, openIdx);
  let nextI = endIdx + 1;

  let isOptional = false;
  if (s[nextI] === "?") {
    isOptional = true;
    nextI++;
  }

  const innerTrim = content.trim();

  // Binder ref: {#v.1} means "other"
  if (/^#\w+\.1$/.test(innerTrim)) {
    const m = innerTrim.match(/^#(\w+)\.1$/);
    const node = { t: "bindRef", key: m[1], mode: "other" };
    return { node: isOptional ? { t: "opt", inner: [node] } : node, nextI };
  }

  // Binder: {#v{start|begin} playing|play}
  const bindHeader = innerTrim.match(/^#(\w+)\s*\{/);
  if (bindHeader) {
    const key = bindHeader[1];
    const bracePos = innerTrim.indexOf("{", bindHeader[0].length - 1);
    const innerBal = extractBalanced(innerTrim, bracePos);
    const optsRaw = innerBal.content; // "start|begin"
    const opts = splitTopLevel(optsRaw, "|").map((x) => x.trim()).filter(Boolean);

    const tail = innerTrim.slice(innerBal.endIdx + 1).trimStart(); // e.g. "playing"
    const bindNode = { t: "bind", key, opts };
    const tailNodes = tail ? [{ t: "text", v: tail }] : [];

    const composite = normalizeSeq([bindNode, ...tailNodes]);
    const node = composite.length === 1 ? composite[0] : { t: "glue", inner: composite };

    return { node: isOptional ? { t: "opt", inner: [node] } : node, nextI };
  }

  // Choice group if top-level '|'
  const parts = splitTopLevel(content, "|");
  if (parts.length > 1) {
    const opts = parts.map((p) => parseTemplate(p.trim()));
    const choice = { t: "choice", opts };
    return { node: isOptional ? { t: "opt", inner: [choice] } : choice, nextI };
  }

  // Plain group (possibly optional) e.g. {content}?
  const innerNodes = parseTemplate(innerTrim);
  const normalized = normalizeSeq(innerNodes);
  const node = normalized.length === 1 ? normalized[0] : { t: "glue", inner: normalized };
  return { node: isOptional ? { t: "opt", inner: [node] } : node, nextI };
}

function extractBalanced(s, openIdx) {
  if (s[openIdx] !== "{") throw new Error("extractBalanced: expected '{'");
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return { content: s.slice(openIdx + 1, i), endIdx: i };
    }
  }
  throw new Error(`Unclosed '{' at index ${openIdx}`);
}

function splitTopLevel(s, sep) {
  const out = [];
  let depth = 0;
  let last = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0 && ch === sep) {
      out.push(s.slice(last, i));
      last = i + 1;
    }
  }
  out.push(s.slice(last));
  return out;
}

function normalizeSeq(nodes) {
  const merged = [];
  for (const n of nodes) {
    const prev = merged[merged.length - 1];
    if (prev && prev.t === "text" && n.t === "text") prev.v += n.v;
    else merged.push(n);
  }
  return merged;
}

function nextIndexOfAny(s, from, chars) {
  let best = -1;
  for (const c of chars) {
    const idx = s.indexOf(c, from);
    if (idx !== -1 && (best === -1 || idx < best)) best = idx;
  }
  return best;
}

/* =========================
 * Variance + args collection
 * ========================= */

function collectArgs(ast) {
  const out = Object.create(null);
  walkAst(ast, (n) => {
    if (n.t === "arg") out[n.k] = true;
  });
  return out;
}

function countVariance(ast) {
  const seq = (nodes) => nodes.reduce((p, n) => p * node(n), 1);

  const node = (n) => {
    switch (n.t) {
      case "text":
      case "arg":
      case "bindRef":
        return 1;

      case "glue":
        return seq(n.inner);

      case "bind":
        return Math.max(1, n.opts.length);

      case "opt":
        return 1 + seq(n.inner);

      case "choice":
        return n.opts.reduce((sum, opt) => sum + seq(opt), 0);

      default:
        throw new Error(`Unknown node type: ${n.t}`);
    }
  };

  return seq(ast);
}

function walkAst(ast, fn) {
  for (const n of ast) {
    fn(n);
    if (n.t === "choice") for (const opt of n.opts) walkAst(opt, fn);
    else if (n.t === "opt") walkAst(n.inner, fn);
    else if (n.t === "glue") walkAst(n.inner, fn);
  }
}

/* =========================
 * Rendering
 * ========================= */

function render(ast, ctx) {
  const tokens = [];
  renderSeq(ast, ctx, tokens);
  return joinTokens(tokens);
}

function renderSeq(nodes, ctx, tokens) {
  for (const n of nodes) renderNode(n, ctx, tokens);
}

function renderNode(n, ctx, tokens) {
  switch (n.t) {
    case "text":
      pushTokens(tokens, n.v);
      return;

    case "arg":
      pushTokens(tokens, ctx.args[n.k] ?? `\${${n.k}}`);
      return;

    case "choice": {
      const idx = Math.floor(ctx.rng() * n.opts.length);
      renderSeq(n.opts[idx], ctx, tokens);
      return;
    }

    case "opt":
      if (ctx.rng() < 0.5) return;
      renderSeq(n.inner, ctx, tokens);
      return;

    case "bind": {
      const idx = Math.floor(ctx.rng() * n.opts.length);
      ctx.binds[n.key] = { opts: n.opts, chosenIdx: idx };
      pushTokens(tokens, n.opts[idx] ?? "");
      return;
    }

    case "bindRef": {
      const b = ctx.binds[n.key];
      if (!b) {
        pushTokens(tokens, `{#${n.key}.1}`);
        return;
      }
      // "other" toggles for 2 opts; cycles for >2
      const out = n.mode === "other"
        ? b.opts[(b.chosenIdx + 1) % b.opts.length]
        : b.opts[b.chosenIdx];
      pushTokens(tokens, out ?? "");
      return;
    }

    case "glue": {
      tokens.push(renderGlue(n.inner, ctx));
      return;
    }

    default:
      throw new Error(`Unknown node type during render: ${n.t}`);
  }
}

/**
 * Glue: renders inner without inserting spaces.
 * Special-case: {{#v.1}ing} should yield:
 *   - if binder chose "begin" => "starting"
 *   - if binder chose "start" => "beginning"
 */
function renderGlue(inner, ctx) {
  // Pattern: [bindRef(other), text("ing")]
  if (
    inner.length === 2 &&
    inner[0].t === "bindRef" &&
    inner[0].mode === "other" &&
    inner[1].t === "text" &&
    inner[1].v === "ing"
  ) {
    const b = ctx.binds[inner[0].key];
    if (!b) return `{#${inner[0].key}.1}ing`;

    const other = b.opts[(b.chosenIdx + 1) % b.opts.length];
    return toIng(other);
  }

  // Generic glue: render to tokens then concat
  const tmp = [];
  renderSeq(inner, ctx, tmp);
  return tmp.join("");
}

function toIng(word) {
  const w = String(word ?? "");
  const lower = w.toLowerCase();

  // Minimal irregulars for your start/begin pairing
  if (lower === "begin") return matchCase(w, "beginning");
  if (lower === "start") return matchCase(w, "starting");

  // Fallback inflection
  if (lower.endsWith("ie")) return matchCase(w, lower.slice(0, -2) + "ying");
  if (lower.endsWith("e") && !lower.endsWith("ee")) return matchCase(w, lower.slice(0, -1) + "ing");
  return matchCase(w, lower + "ing");
}

function matchCase(src, out) {
  if (/^[A-Z]/.test(src)) return out[0].toUpperCase() + out.slice(1);
  return out;
}

function pushTokens(tokens, raw) {
  if (raw == null) return;
  const str = String(raw);
  const parts = str.split(/(\s+)/).filter((p) => p && !/^\s+$/.test(p));
  for (const p of parts) tokens.push(p);
}

function joinTokens(tokens) {
  let out = "";
  for (const t of tokens) {
    if (!t) continue;
    if (!out) {
      out = t;
      continue;
    }
    const noSpaceBefore = /^[,.;:!?)]/.test(t);
    out += noSpaceBefore ? t : " " + t;
  }
  out = out.replace(/\s+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ");
  return out;
}

/* =========================
 * Quick smoke test (optional)
 * =========================
 *
 * const outline = `
 * - \`${Subject}\`
 *     - is now available on Xbox Game Pass.
 *     - has joined {Xbox Game Pass|the Xbox Game Pass {content}? {catalog|library}}.
 * - Xbox Game Pass
 *     - has add_e_d \`${Subject}\` to its {ever-expanding|steadily growing}? {content}? {catalog|library}.
 *     - users can {#v{start|begin} playing|play} \`${Subject}\` as part of their subscriptions {{#v.1}ing} today.
 * - The Xbox Game Pass {content}? {catalog|library}
 *     - has expanded to include \`${Subject}\`
 *     - includes \`${Subject}\` {as of|starting} today.
 *     - now includes \`${Subject}\`
 *         - {, which joined the service earlier today}
 * `;
 *
 * const prog = parseTemplateOutline(outline);
 * console.log(prog.args);     // { Subject: null }
 * console.log(prog.variance); // number
 * console.log(prog.write({ Subject: "Kingdom Come: Deliverance 2" }));
 */


/**
 * templateOutline.mjs (vanilla JS, ESM)
 * -----------------------------------
 * Adds writeAll(args): returns EVERY possible permutation across ALL expanded templates.
 *
 * Notes / constraints:
 *  - Optionals {x}? expand to: omitted OR included.
 *  - Choices {a|b} expand to all options.
 *  - Binder {#v{start|begin} playing|play}:
 *      - Expands to BOTH:
 *          - "start playing" + correlated glue uses toggled "begin" -> "beginning"
 *          - "begin playing" + correlated glue uses toggled "start" -> "starting"
 *      - And also expands to the non-binder alternative "play" if present in a choice group.
 *  - Glue {{ ... } (single closing brace) expands by concatenating inner expansions.
 *    Special-case {{#v.1}ing} is handled to match your start/begin pairing.
 *
 * Whitespace policy (as requested):
 *  - Every ${...} insertion is wrapped as "  value  "
 *  - Final output collapses whitespace with /\s+/g => " " and trims.
 *
 * Dotted variables:
 *  - First literal lookup: args["AllTiers.length"]
 *  - Else path lookup: args["AllTiers"]?.["length"] (supports deeper paths)
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
    const raw = render(chosen.ast, ctx);
    return normalizeWhitespace(raw);
  }

  function writeAll(argValues = {}) {
    const all = [];
    for (const t of compiled) {
      all.push(...expandAll(t.ast, { args: argValues }));
    }
    // Normalize + de-dupe (in case different paths converge)
    const normed = all.map(normalizeWhitespace).filter((x) => x.length > 0);
    return uniq(normed);
  }

  return { args, variance, write, writeAll };
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
  if (indentSpaces % 4 === 0) return indentSpaces / 4;
  if (indentSpaces % 2 === 0) return indentSpaces / 2;
  return Math.floor(indentSpaces / 2);
}

function expandOutline(root) {
  const out = [];
  for (const group of root.children) {
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
 * ========================= */

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

    // Glue: {{ ... }   (single closing brace)
    if (s[i] === "{" && s[i + 1] === "{") {
      const { node, nextI } = parseGlueBalanced(s, i);
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

function parseGlueBalanced(s, openIdx) {
  let i = openIdx + 2; // after '{{'
  let depth = 0;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      if (depth === 0) {
        const innerRaw = s.slice(openIdx + 2, i);
        const inner = parseTemplate(innerRaw);
        return { node: { t: "glue", inner }, nextI: i + 1 };
      }
      depth--;
    }
  }
  throw new Error(`Unclosed {{...} at index ${openIdx}`);
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
 * Rendering (single random)
 * ========================= */

function render(ast, ctx) {
  const pieces = [];
  renderSeq(ast, ctx, pieces);
  return pieces.join("");
}

function renderSeq(nodes, ctx, pieces) {
  for (const n of nodes) renderNode(n, ctx, pieces);
}

function renderNode(n, ctx, pieces) {
  switch (n.t) {
    case "text":
      pieces.push(n.v);
      return;

    case "arg": {
      const value = resolveArg(n.k, ctx.args);
      pieces.push("  ", value, "  ");
      return;
    }

    case "choice": {
      const idx = Math.floor(ctx.rng() * n.opts.length);
      renderSeq(n.opts[idx], ctx, pieces);
      return;
    }

    case "opt":
      if (ctx.rng() < 0.5) return;
      renderSeq(n.inner, ctx, pieces);
      return;

    case "bind": {
      const idx = Math.floor(ctx.rng() * n.opts.length);
      ctx.binds[n.key] = { opts: n.opts, chosenIdx: idx };
      pieces.push(n.opts[idx] ?? "");
      return;
    }

    case "bindRef": {
      const b = ctx.binds[n.key];
      if (!b) {
        pieces.push(`{#${n.key}.1}`);
        return;
      }
      const out =
        n.mode === "other"
          ? b.opts[(b.chosenIdx + 1) % b.opts.length]
          : b.opts[b.chosenIdx];
      pieces.push(out ?? "");
      return;
    }

    case "glue":
      pieces.push(renderGlue(n.inner, ctx));
      return;

    default:
      throw new Error(`Unknown node type during render: ${n.t}`);
  }
}

function renderGlue(inner, ctx) {
  // Special-case: {{#v.1}ing}
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

  const tmp = [];
  renderSeq(inner, ctx, tmp);
  return tmp.join("");
}

/* =========================
 * writeAll: enumerate all permutations
 * ========================= */

function expandAll(ast, { args }) {
  // Each expansion state carries binder assignments to support correlations.
  // We build strings incrementally.

  /** @type {{ s: string, binds: Record<string, { opts: string[], chosenIdx: number }|undefined> }[]} */
  let states = [{ s: "", binds: Object.create(null) }];

  for (const node of ast) {
    states = expandNodeAll(node, states, args);
  }

  return states.map((st) => st.s);
}

function expandNodeAll(node, states, args) {
  switch (node.t) {
    case "text":
      return states.map((st) => ({ s: st.s + node.v, binds: st.binds }));

    case "arg": {
      const val = resolveArg(node.k, args);
      const insert = "  " + val + "  ";
      return states.map((st) => ({ s: st.s + insert, binds: st.binds }));
    }

    case "opt": {
      // omitted OR included
      const omitted = states.map((st) => ({ s: st.s, binds: st.binds }));
      const included = expandSeqAll(node.inner, states, args);
      return omitted.concat(included);
    }

    case "choice": {
      const out = [];
      for (const opt of node.opts) {
        out.push(...expandSeqAll(opt, states, args));
      }
      return out;
    }

    case "bind": {
      const out = [];
      for (let idx = 0; idx < node.opts.length; idx++) {
        const word = node.opts[idx] ?? "";
        for (const st of states) {
          const binds2 = shallowCloneBinds(st.binds);
          binds2[node.key] = { opts: node.opts, chosenIdx: idx };
          out.push({ s: st.s + word, binds: binds2 });
        }
      }
      return out;
    }

    case "bindRef": {
      return states.map((st) => {
        const b = st.binds[node.key];
        const outWord = b
          ? (node.mode === "other"
              ? b.opts[(b.chosenIdx + 1) % b.opts.length]
              : b.opts[b.chosenIdx]) ?? ""
          : `{#${node.key}.1}`;
        return { s: st.s + outWord, binds: st.binds };
      });
    }

    case "glue": {
      // Expand glue inner without spaces and append as a single chunk.
      const out = [];
      for (const st of states) {
        // Special-case {{#v.1}ing}
        if (
          node.inner.length === 2 &&
          node.inner[0].t === "bindRef" &&
          node.inner[0].mode === "other" &&
          node.inner[1].t === "text" &&
          node.inner[1].v === "ing"
        ) {
          const b = st.binds[node.inner[0].key];
          const chunk = b
            ? toIng(b.opts[(b.chosenIdx + 1) % b.opts.length])
            : `{#${node.inner[0].key}.1}ing`;
          out.push({ s: st.s + chunk, binds: st.binds });
          continue;
        }

        // General glue: enumerate all inner possibilities, but keep binder state threaded through.
        const innerStates = expandSeqAll(node.inner, [{ s: "", binds: st.binds }], args);
        for (const innerSt of innerStates) {
          // IMPORTANT: glue appends to outer string, but must preserve resulting binder state
          out.push({ s: st.s + innerSt.s, binds: innerSt.binds });
        }
      }
      return out;
    }

    default:
      throw new Error(`Unknown node type in expandNodeAll: ${node.t}`);
  }
}

function expandSeqAll(nodes, states, args) {
  let outStates = states;
  for (const n of nodes) {
    outStates = expandNodeAll(n, outStates, args);
  }
  return outStates;
}

function shallowCloneBinds(binds) {
  const next = Object.create(null);
  for (const k of Object.keys(binds)) next[k] = binds[k];
  return next;
}

/* =========================
 * Arg resolution + whitespace policy
 * ========================= */

function resolveArg(key, args) {
  // 1) literal key
  if (Object.prototype.hasOwnProperty.call(args, key)) return safeToString(args[key]);

  // 2) failsafe path resolution: foo.bar.baz
  const parts = key.split(".");
  if (!parts.length) return "";

  const rootKey = parts[0];
  if (!Object.prototype.hasOwnProperty.call(args, rootKey)) return "";
  let cur = args[rootKey];

  for (let i = 1; i < parts.length; i++) {
    if (cur == null) return "";
    cur = cur[parts[i]];
  }

  return safeToString(cur);
}

function safeToString(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  try {
    return String(v);
  } catch {
    return "";
  }
}

function normalizeWhitespace(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

/* =========================
 * Inflection helpers
 * ========================= */

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

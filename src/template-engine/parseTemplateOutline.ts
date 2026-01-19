/**
 * templateOutline.mjs (vanilla JS, ESM)
 * -----------------------------------
 * Compatible with:
 *  - ${Subject} / ${AllTiers.length} (literal key OR path fallback)
 *  - {a|b|c} / {x}? / nested braces
 *  - Inline binder: #arg1{start|begin} playing
 *  - Binder ref: {#arg1.1} (toggle)
 *  - Double-curly blocks:
 *      - Glue: {{ ... }}  (renders inner without injected spaces)
 *      - Map lookup: {{start:beginning,begin:starting}[#arg1]}}
 *        Values may include full nested template syntax.
 *
 * Output policy:
 *  - Every ${...} insertion is "  value  "
 *  - Final output collapses whitespace with /\s+/g => " " and trims.
 */

export function parseTemplateOutline(outlineText: string, { rng = Math.random } = {}) {
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
    const ctx = { rng, args: argValues, binds: Object.create(null) };
    return normalizeWhitespace(render(chosen.ast, ctx));
  }

  function writeAll(argValues = {}) {
    const all = [];
    for (const t of compiled) all.push(...expandAll(t.ast, { args: argValues }));
    // Return all UNIQUE normalized outputs (typical desired behavior)
    const set = new Set(all.map(normalizeWhitespace).filter(Boolean));
    return Array.from(set);
  }

  function varianceUnique(argValues = {}) {
    return writeAll(argValues).length;
  }

  return { args, variance, varianceUnique, write, writeAll };
}

/* =========================
 * Outline parsing + expansion
 * ========================= */

function parseOutline(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "  "))
    .filter((l) => l.trim().length);

  // If input is NOT a bullet outline (as in your recent plain text example),
  // treat each non-empty line as a leaf template under a dummy group.
  const hasBullets = lines.some((l) => /^\s*-\s+/.test(l));
  if (!hasBullets) {
    return {
      text: "",
      level: -1,
      children: [
        { text: "__GROUP__", level: 0, children: lines.map((t) => ({ text: t.trim(), level: 1, children: [] })) },
      ],
    };
  }

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
 * Template AST
 * =========================
 * Node types:
 *  - text:      { t:"text", v:string }
 *  - arg:       { t:"arg", k:string }
 *  - choice:    { t:"choice", opts: Node[][] }
 *  - opt:       { t:"opt", inner: Node[] }
 *  - bind:      { t:"bind", key:string, opts:string[] }
 *  - bindRef:   { t:"bindRef", key:string, mode:"chosen"|"other" }
 *  - glue:      { t:"glue", inner: Node[] }
 *  - mapLookup: { t:"mapLookup", map: Record<string, Node[]>, refKey: string } // refKey is binder name
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

    // Double-curly block: {{ ... }}
    if (s[i] === "{" && s[i + 1] === "{") {
      const { node, nextI } = parseDoubleCurly(s, i);
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

    // Inline binder: #arg1{start|begin} ...
    if (s[i] === "#") {
      const maybe = tryParseInlineBind(s, i);
      if (maybe) {
        nodes.push(...maybe.nodes);
        i = maybe.nextI;
        continue;
      }
    }

    // Group: { ... } with optional '?'
    if (s[i] === "{") {
      const { node, nextI } = parseBraceGroup(s, i);
      nodes.push(node);
      i = nextI;
      continue;
    }

    // Text chunk
    const next = nextIndexOfAny(s, i, until ? ["{", "$", "#", until] : ["{", "$", "#"]);
    const end = next === -1 ? s.length : next;
    nodes.push({ t: "text", v: s.slice(i, end) });
    i = end;
  }

  return { nodes, i };
}

/**
 * Parses {{ ... }}.
 * If content matches: <map>[#ref] (with nesting), returns mapLookup.
 * Otherwise returns glue(innerTemplateAst).
 */
function parseDoubleCurly(s, openIdx) {
  const close = findDoubleCurlyClose(s, openIdx + 2);
  if (close === -1) throw new Error(`Unclosed {{...}} at index ${openIdx}`);

  const innerRaw = s.slice(openIdx + 2, close);
  const trimmed = innerRaw.trim();

  // Try map lookup form:  <mapText>[#refKey]  (refKey must be binder name)
  const lookup = parseMapLookupSyntax(trimmed);
  if (lookup) {
    return { node: lookup, nextI: close + 2 };
  }

  // Otherwise: glue
  const inner = parseTemplate(innerRaw);
  return { node: { t: "glue", inner }, nextI: close + 2 };
}

function findDoubleCurlyClose(s, fromIdx) {
  // We need to find the first "}}" that is not inside nested "{{ ... }}".
  // Track depth of nested double curlies.
  let depth = 0;
  for (let i = fromIdx; i < s.length - 1; i++) {
    if (s[i] === "{" && s[i + 1] === "{") {
      depth++;
      i++;
      continue;
    }
    if (s[i] === "}" && s[i + 1] === "}") {
      if (depth === 0) return i;
      depth--;
      i++;
      continue;
    }
  }
  return -1;
}

function parseMapLookupSyntax(text) {
  // Expected: "<pairs>[#name]"
  // where pairs: "k:v,k2:v2" with commas at top-level, and values can contain nested syntax.
  // We locate the final [#name] suffix first (top-level).
  const suffix = findLookupSuffix(text);
  if (!suffix) return null;

  const { mapText, refKey } = suffix;
  const map = parseMapPairs(mapText);
  if (!map) return null;

  return { t: "mapLookup", map, refKey };
}

function findLookupSuffix(text) {
  // Find a trailing [#name] at top-level (not inside braces/doublecurlies).
  // Scan from end.
  let depthBrace = 0;
  let depthDC = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    const prev = text[i - 1];

    if (prev === "}" && ch === "}") { depthDC++; i--; continue; }
    if (prev === "{" && ch === "{") { depthDC = Math.max(0, depthDC - 1); i--; continue; }
    if (depthDC > 0) continue;

    if (ch === "}") depthBrace++;
    else if (ch === "{") depthBrace = Math.max(0, depthBrace - 1);
    if (depthBrace > 0) continue;

    if (ch === "]") {
      // find matching '['
      const j = text.lastIndexOf("[", i);
      if (j === -1) return null;
      const inside = text.slice(j + 1, i).trim(); // e.g. "#arg1"
      const m = inside.match(/^#([A-Za-z_]\w*)$/);
      if (!m) return null;

      const mapText = text.slice(0, j).trim();
      return { mapText, refKey: m[1] };
    }
  }
  return null;
}

function parseMapPairs(mapText) {
  if (!mapText) return null;
  const parts = splitTopLevelMixed(mapText, ",");
  const map = Object.create(null);

  for (const p of parts) {
    const idx = indexOfTopLevelColon(p);
    if (idx === -1) return null;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (!k) return null;
    // Values are full templates (nesting supported)
    map[k] = parseTemplate(v);
  }
  return map;
}

function indexOfTopLevelColon(s) {
  let depthBrace = 0;
  let depthDC = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (ch === "{" && next === "{") { depthDC++; i++; continue; }
    if (ch === "}" && next === "}") { depthDC = Math.max(0, depthDC - 1); i++; continue; }
    if (depthDC > 0) continue;

    if (ch === "{") depthBrace++;
    else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
    if (depthBrace > 0) continue;

    if (ch === ":") return i;
  }
  return -1;
}

/**
 * Inline binder token: #name{a|b} <tail?>
 * Returns a bind node + optional tail text node(s).
 */
function tryParseInlineBind(s, i) {
  const m = s.slice(i).match(/^#([A-Za-z_]\w*)\s*\{/);
  if (!m) return null;

  const key = m[1];
  const braceIdx = i + m[0].lastIndexOf("{");
  const bal = extractBalanced(s, braceIdx);
  const optsRaw = bal.content;
  const opts = splitTopLevel(optsRaw, "|").map((x) => x.trim()).filter(Boolean);

  // After the closing brace, we do NOT consume arbitrary tail here; the surrounding parseSeq will continue.
  // But many authors write "#x{a|b} playing" with a literal space and word after.
  // We allow a single immediate space+word chunk to be captured as text so the bind emits "start" then " playing".
  const after = bal.endIdx + 1;
  let nextI = after;

  // Capture immediate whitespace + non-special text until next special char as a single text node,
  // only if the next char is whitespace (common for "#x{a|b} playing").
  const nodes = [{ t: "bind", key, opts }];

  if (s[nextI] && /\s/.test(s[nextI])) {
    const nextSpecial = nextIndexOfAny(s, nextI, ["{", "$", "#"]);
    const end = nextSpecial === -1 ? s.length : nextSpecial;
    const chunk = s.slice(nextI, end);
    // Only capture if it has some non-whitespace (so we don't eat spacing that caller expects)
    if (/\S/.test(chunk)) {
      nodes.push({ t: "text", v: chunk });
      nextI = end;
    }
  }

  return { nodes, nextI };
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

  // Choice group if top-level '|'
  const parts = splitTopLevel(innerTrim, "|");
  if (parts.length > 1) {
    const opts = parts.map((p) => parseTemplate(p.trim()));
    const choice = { t: "choice", opts };
    return { node: isOptional ? { t: "opt", inner: [choice] } : choice, nextI };
  }

  // Plain group (possibly optional)
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

function splitTopLevelMixed(s, sepChar) {
  // Splits by sepChar at top level, respecting { } and {{ }} nesting.
  const out = [];
  let depthBrace = 0;
  let depthDC = 0;
  let last = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (ch === "{" && next === "{") { depthDC++; i++; continue; }
    if (ch === "}" && next === "}") { depthDC = Math.max(0, depthDC - 1); i++; continue; }
    if (depthDC > 0) continue;

    if (ch === "{") depthBrace++;
    else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
    if (depthBrace > 0) continue;

    if (ch === sepChar) {
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
      case "mapLookup":
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
    else if (n.t === "mapLookup") for (const k of Object.keys(n.map)) walkAst(n.map[k], fn);
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
      if (!b) return; // unresolved => empty
      const out =
        n.mode === "other"
          ? b.opts[(b.chosenIdx + 1) % b.opts.length]
          : b.opts[b.chosenIdx];
      pieces.push(out ?? "");
      return;
    }

    case "glue": {
      // Glue concatenates with no injected spaces
      pieces.push(renderGlue(n.inner, ctx));
      return;
    }

    case "mapLookup": {
      const b = ctx.binds[n.refKey];
      if (!b) return;

      const chosen = b.opts[b.chosenIdx];
      const ast = n.map[chosen];
      if (!ast) return;

      // Render selected value as glue-like concatenation
      const tmp = [];
      renderSeq(ast, ctx, tmp);
      pieces.push(tmp.join(""));
      return;
    }

    default:
      throw new Error(`Unknown node type during render: ${n.t}`);
  }
}

function renderGlue(inner, ctx) {
  const tmp = [];
  renderSeq(inner, ctx, tmp);
  return tmp.join("");
}

/* =========================
 * writeAll: enumerate all permutations
 * ========================= */

function expandAll(ast, { args }) {
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
      const ins = "  " + val + "  ";
      return states.map((st) => ({ s: st.s + ins, binds: st.binds }));
    }

    case "opt": {
      const omitted = states.map((st) => ({ s: st.s, binds: st.binds }));
      const included = expandSeqAll(node.inner, states, args);
      return omitted.concat(included);
    }

    case "choice": {
      const out = [];
      for (const opt of node.opts) out.push(...expandSeqAll(opt, states, args));
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
          : "";
        return { s: st.s + outWord, binds: st.binds };
      });
    }

    case "glue": {
      const out = [];
      for (const st of states) {
        const innerStates = expandSeqAll(node.inner, [{ s: "", binds: st.binds }], args);
        for (const innerSt of innerStates) out.push({ s: st.s + innerSt.s, binds: innerSt.binds });
      }
      return out;
    }

    case "mapLookup": {
      const out = [];
      for (const st of states) {
        const b = st.binds[node.refKey];
        if (!b) { out.push({ s: st.s, binds: st.binds }); continue; }

        const chosen = b.opts[b.chosenIdx];
        const ast2 = node.map[chosen];
        if (!ast2) { out.push({ s: st.s, binds: st.binds }); continue; }

        const innerStates = expandSeqAll(ast2, [{ s: "", binds: st.binds }], args);
        for (const innerSt of innerStates) out.push({ s: st.s + innerSt.s, binds: innerSt.binds });
      }
      return out;
    }

    default:
      throw new Error(`Unknown node type in expandNodeAll: ${node.t}`);
  }
}

function expandSeqAll(nodes, states, args) {
  let outStates = states;
  for (const n of nodes) outStates = expandNodeAll(n, outStates, args);
  return outStates;
}

function shallowCloneBinds(binds) {
  const next = Object.create(null);
  for (const k of Object.keys(binds)) next[k] = binds[k];
  return next;
}

/* =========================
 * Arg resolution + whitespace normalization
 * ========================= */

function resolveArg(key, args) {
  if (Object.prototype.hasOwnProperty.call(args, key)) return safeToString(args[key]);

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
  try { return String(v); } catch { return ""; }
}

function normalizeWhitespace(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

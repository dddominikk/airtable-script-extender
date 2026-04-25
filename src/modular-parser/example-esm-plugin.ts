/**
 * example-esm-plugin.ts
 *
 * Plugin: fetch a remote URL, treat the response body as ESM source code,
 * and return the live module namespace.
 *
 * Useful for dynamic plugin loading over HTTP in environments that allow
 * data: URL imports (modern browsers, Deno, some Node flags).
 */

import { DataParser }   from './DataParser.js';
import { PathResolver } from './PathResolver.js';
import { parseRaw }     from './parseRawData.js';

// ---------------------------------------------------------------------------
// 1. PathResolver — wraps fetch, carries the raw Response object through
// ---------------------------------------------------------------------------

/**
 * Resolves a URL to its raw fetch Response.
 * We keep the full Response so the DataParser can inspect headers (MIME type)
 * before deciding how to parse the body.
 *
 * The optional `transform` callback can pre-process the Response — for
 * example, to unwrap it to text, validate status, or attach extra metadata —
 * before `resolvePath` / `resolvePaths` returns it to the caller.
 *
 * @example — unwrap to text immediately
 * const textResolver = new PathResolver(
 *   'urlResolver',
 *   (url) => fetch(url),
 *   (response) => response.text(),
 * );
 *
 * @example — validate status before handing the Response on
 * const strictResolver = new PathResolver<Response>(
 *   'urlResolver',
 *   (url) => fetch(url),
 *   (response, path) => {
 *     if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
 *     return response;
 *   },
 * );
 */
export const urlResolver = new PathResolver<Response>(
  'urlResolver',
  (url) => fetch(url),
  // Default: validate status so callers never receive a non-OK Response.
  (response, path) => {
    if (!response.ok) throw new Error(`[urlResolver] HTTP ${response.status}: ${path}`);
    return response;
  }
);

// ---------------------------------------------------------------------------
// 2. DataParser — turns an ESM text response into a live module namespace
// ---------------------------------------------------------------------------

/**
 * Converts the raw text of an ES module into a live module namespace via a
 * base64 data: URL import. Works wherever dynamic import() + data: URLs are
 * supported.
 */
async function importEsmFromText(raw: string | number[] | unknown[]): Promise<unknown> {
  const source = raw as string;
  const b64    = btoa(unescape(encodeURIComponent(source)));
  return import(`data:application/javascript;base64,${b64}`);
}

export const esmParser = new DataParser(importEsmFromText, {
  name: 'esmParser',
  supports: {
    extensions: ['js', 'mjs', 'ts'],
    mimeTypes:  [
      'application/javascript',
      'text/javascript',
      'application/x-typescript',
    ],
  },
});

// ---------------------------------------------------------------------------
// 3. Putting it together — fetch → detect MIME → parse
// ---------------------------------------------------------------------------

/**
 * Fetches `url`, reads its Content-Type, finds a matching DataParser from the
 * registry, and returns the parsed result.
 *
 * Falls back to plain text when no parser is registered for the MIME type.
 */
export async function fetchAndParse(url: string): Promise<unknown> {
  const { raw: response, path } = await urlResolver.resolvePath({ path: url });

  // urlResolver's transform already throws on non-OK status.
  const mimeType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
  const parser    = DataParser.find(mimeType);

  if (!parser) {
    // No registered parser — just return raw text
    return response.text();
  }

  const bodyText = await response.text();
  return parseRaw(bodyText, parser.parser);
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

/*
  const myModule = await fetchAndParse('https://example.com/utils.mjs');
  // → live ESM namespace, e.g. { default: ..., someExport: ... }

  // Or, skip fetchAndParse and use the pieces directly:
  const { raw: res } = await urlResolver.resolvePath({ path: 'https://example.com/utils.mjs' });
  const text         = await res.text();
  const mod          = await parseRaw(text, esmParser.parser);
*/
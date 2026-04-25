/**
 * plugins/index.ts
 *
 * Barrel that turns plugin folder names into ready-to-use DataParser instances.
 *
 * Usage:
 *   const plugins = await loadPlugins(['json-parser', 'esm-parser']);
 *
 * Each name must correspond to a folder under plugins/ that exports a default
 * PluginConfig object.  New plugins are picked up automatically — no changes
 * to this file needed.
 */

import { DataParser }        from '../DataParser.ts';
import { type PluginConfig } from './types.ts';

// ---------------------------------------------------------------------------
// loadPlugins
// ---------------------------------------------------------------------------

/**
 * Dynamically imports each named plugin, wraps it in a DataParser, registers
 * it in DataParser.s, and returns the array.
 *
 * The DataParser name is taken from the parser function's `.name` property
 * when available, falling back to the folder name.
 *
 * @param names - Folder names under `plugins/`, e.g. `['json-parser', 'esm-parser']`
 *
 * @example
 * const plugins = await loadPlugins(['json-parser', 'esm-parser']);
 * // plugins[0] === DataParser.s['jsonParser']
 * // plugins[1] === DataParser.s['esmParser']
 */
export async function loadPlugins(names: string[]): Promise<DataParser[]> {
  const entries = await Promise.all(
    names.map(async (folderName) => {
      const mod    = await import(`./${folderName}/index.ts`);
      const config = mod.default as PluginConfig;
      return { folderName, config };
    })
  );

  return entries.map(({ folderName, config }) =>
    new DataParser(config.parser, {
      // Named function → use its own name; anonymous → fall back to folder name.
      name:     config.parser.name || folderName,
      supports: config.supports,
    })
  );
}

// ---------------------------------------------------------------------------
// Re-export types so callers only need to import from 'plugins/index.ts'
// ---------------------------------------------------------------------------

export type { PluginConfig } from './types.ts';
export default loadPlugins;
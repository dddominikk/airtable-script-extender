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

import { DataParser } from "../DataParser.ts";
import { type PluginConfig } from "./types.ts";
import loadPlugins from "./load.ts";

// ---------------------------------------------------------------------------
// loadPlugins
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Re-export types so callers only need to import from 'plugins/index.js'
// ---------------------------------------------------------------------------

/*  esm-parser for Airtable would need a wrapper */
const plugins = await loadPlugins([
  { type: 'parser', name: 'json-parser' },
  { type: 'parser', name: 'mjs-parser'  },
  {type: 'pathResolver',name: }
]);

export { DataParser, loadPlugins, plugins };

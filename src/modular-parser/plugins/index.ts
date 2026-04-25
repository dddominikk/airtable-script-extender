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

import { DataParser } from "../DataParser.js";
import { type PluginConfig } from "./types.js";
import loadPlugins from "./load.ts";
// ---------------------------------------------------------------------------
// loadPlugins
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Re-export types so callers only need to import from 'plugins/index.js'
// ---------------------------------------------------------------------------

export type { PluginConfig } from "./types.js";

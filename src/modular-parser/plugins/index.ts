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

import { DataParser }  from "../DataParser.ts";
import loadPlugins    from "./load.ts";

const plugins = await loadPlugins([
	{ type: "parser",       dir: "json-parser" },
	{ type: "parser",       dir: "mjs-parser"  },
	{ type: "pathResolver", dir: "url-resolver" },
]);

const pluginMap = Object.fromEntries(plugins.map((p) => [p.name, p.instance]));

export { DataParser, loadPlugins, plugins, pluginMap };

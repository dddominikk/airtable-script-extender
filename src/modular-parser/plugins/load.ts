/**
 * plugins/load.ts
 *
 * Turns typed plugin entries into ready-to-use instances.
 *
 * Usage:
 *   const loaded = await loadPlugins([
 *     { type: 'parser',       name: 'json-parser' },
 *     { type: 'pathResolver', name: 'my-resolver' },
 *     { type: 'custom',       name: 'my-plugin'   },
 *   ]);
 *
 * Each name must correspond to a folder under plugins/ that exports a default
 * object matching the contract for its type.  New plugins are picked up
 * automatically — no changes to this file needed.
 */

import { DataParser } from "../DataParser.ts";
import { PathResolver } from "../PathResolver.ts";
import {
	type PluginConfig,
	type PathResolverConfig,
	type PluginEntry,
	type LoadedPlugin,
} from "./types.ts";

// ---------------------------------------------------------------------------
// loadPlugins
// ---------------------------------------------------------------------------

/**
 * Dynamically imports each plugin entry and constructs the appropriate
 * instance based on the entry's `type`:
 *
 * - `'parser'`       → `DataParser`   (registered in `DataParser.s`)
 * - `'pathResolver'` → `PathResolver`
 * - `'custom'`       → raw default export passed through as-is
 *
 * @param entries - Array of `{ type, name }` descriptors.
 *
 * @example
 * const loaded = await loadPlugins([
 *   { type: 'parser',       name: 'json-parser' },
 *   { type: 'pathResolver', name: 'fetch-resolver' },
 * ]);
 *
 * for (const p of loaded) {
 *   if (p.type === 'parser')       console.log(p.instance.name);   // DataParser
 *   if (p.type === 'pathResolver') console.log(p.instance.name);   // PathResolver
 *   if (p.type === 'custom')       console.log(p.instance);        // raw export
 * }
 */
export async function loadPlugins(
	entries: PluginEntry[],
): Promise<LoadedPlugin[]> {
	return Promise.all(
		entries.map(async (entry): Promise<LoadedPlugin> => {
			const key = entry.name ?? entry.dir;
			const mod = await import(`./${entry.dir}/index.ts`);

			switch (entry.type) {
				case "parser": {
					const config = mod.default as PluginConfig;
					await config.init?.();
					return {
						type: "parser",
						name: key,

						instance: new DataParser(config.parser, {
							name: config.parser.name || key,
							supports: config.supports,
						}),
					};
				}

				case "pathResolver": {
					const config = mod.default as PathResolverConfig;
					await config.init?.();
					return {
						type: "pathResolver",
						name: key,
						instance: new PathResolver(
							config.name,
							config.resolve,
							config.transform,
						),
					};
				}

				case "custom": {
					const config = mod.default as Record<string, unknown> & {
						init?: () => Promise<void> | void;
					};
					await config.init?.();
					return {
						type: "custom",
						name: key,
						instance: config,
					};
				}

        default: {
          
        }
			}
		}),
	);
}

// ---------------------------------------------------------------------------
// Re-export types so callers only need to import from 'plugins/load.ts'
// ---------------------------------------------------------------------------

export type {
	PluginConfig,
	PathResolverConfig,
	PluginEntry,
	LoadedPlugin,
} from "./types.ts";

export default loadPlugins;

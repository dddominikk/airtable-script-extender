import { DataParser }  from "../DataParser.ts";
import { PathResolver } from "../PathResolver.ts";
import { parseRaw }     from "../parseRawData.ts";
import loadPlugins      from "./load.ts";

const plugins = await loadPlugins([
	{ type: "parser",       dir: "json-parser"  },
	{ type: "parser",       dir: "mjs-parser"   },
	{ type: "pathResolver", dir: "url-resolver" },
]);

const pluginMap = Object.fromEntries(plugins.map((p) => [p.name, p.instance]));

export { DataParser, PathResolver, parseRaw, loadPlugins, plugins, pluginMap };

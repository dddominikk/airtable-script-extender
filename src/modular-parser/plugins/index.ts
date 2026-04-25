import { DataParser } from "../DataParser.ts";
import { PathResolver } from "../PathResolver.ts";
import { parseRaw } from "../parseRawData.ts";
import loadPlugins from "./load.ts";

const plugins = await loadPlugins([
	{ type: "parser", dir: "json-parser", name: "jsonParser" },
	{ type: "parser", dir: "mjs-parser", name: "mjsParser" },
	{ type: "pathResolver", dir: "url-resolver", name: "urlResolve" },
]);

const pluginMap = Object.fromEntries(plugins.map((p) => [p.name, p.instance]));

export { DataParser, PathResolver, parseRaw, loadPlugins, plugins, pluginMap };

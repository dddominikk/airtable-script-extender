import { parseJsonString, parseJsonLines } from "./lib/json.ts";
import { parseCsv } from "./lib/csv.ts";
import { parseJsonc } from "./lib/jsonc.ts";
import { parseYaml } from "./lib/yaml.ts";
import { parseToml } from "./lib/toml.ts";
import { importJavaScriptModule } from "./lib/javascript.ts";
import { transpileAndImportTypeScript } from "./lib/typescript.ts";
import type { ParserMap } from "./types.ts";

export const defaultParserMap: ParserMap = {
  json:  (source) => parseJsonString(source),
  jsonl: (source) => parseJsonLines(source),
  ndjson: (source) => parseJsonLines(source),
  jsonc: (source) => parseJsonc(source),
  yaml:  (source) => parseYaml(source),
  yml:   (source) => parseYaml(source),
  toml:  (source) => parseToml(source),
  csv:   (source) => parseCsv(source),
  js:    (source) => importJavaScriptModule(source),
  mjs:   (source) => importJavaScriptModule(source),
  ts:    (source) => transpileAndImportTypeScript(source),
  tsx:   (source) => transpileAndImportTypeScript(source),
  mts:   (source) => transpileAndImportTypeScript(source),
  cts:   (source) => transpileAndImportTypeScript(source),
};

export type { ParserFn, ParserMap, FormatDependency, FormatEntry, SupportedFormat } from "./types.ts";
export { formatDependencies, supportedFormats } from "./config.ts";
export { getCachedExternalModule } from "./moduleCache.ts";

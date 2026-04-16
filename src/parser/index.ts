import { parseJsonString, parseJsonLines } from "./lib/json.ts";
import { parseCsv } from "./lib/csv.ts";
import { parseJsonc } from "./lib/jsonc.ts";
import { parseYaml } from "./lib/yaml.ts";
import { parseToml } from "./lib/toml.ts";
import { executeAsIife, executeAsScriptFromText, importJavaScriptModule } from "./lib/javascript.ts";
import { transpileAndExecute, transpileAndImportTypeScript } from "./lib/typescript.ts";
import type { ModuleType, ParserMap } from "./types.ts";

export const defaultParserMap: ParserMap = {
  json:   (source) => parseJsonString(source),
  jsonl:  (source) => parseJsonLines(source),
  ndjson: (source) => parseJsonLines(source),
  jsonc:  (source) => parseJsonc(source),
  yaml:   (source) => parseYaml(source),
  yml:    (source) => parseYaml(source),
  toml:   (source) => parseToml(source),
  csv:    (source) => parseCsv(source),
  js:     (source) => importJavaScriptModule(source),
  mjs:    (source) => importJavaScriptModule(source),
  ts:     (source) => transpileAndImportTypeScript(source),
  tsx:    (source) => transpileAndImportTypeScript(source),
  mts:    (source) => transpileAndImportTypeScript(source),
  cts:    (source) => transpileAndImportTypeScript(source),
};

const jsExecutors: Record<ModuleType, (source: string) => unknown | Promise<unknown>> = {
  esm:    (source) => importJavaScriptModule(source),
  iife:   (source) => executeAsIife(source),
  script: (source) => executeAsScriptFromText(source),
};

/**
 * Returns a ParserMap that uses the given module type for js/ts entries.
 * All non-module formats (json, csv, yaml, etc.) are unchanged from defaultParserMap.
 */
export function buildModuleParserMap(moduleType: ModuleType): ParserMap {
  const jsExec = jsExecutors[moduleType];
  const tsExec = moduleType === "script"
    ? null  // script type does not support TypeScript
    : (source: string) => transpileAndExecute(source, moduleType);

  const tsEntry = tsExec
    ? { ts: tsExec, tsx: tsExec, mts: tsExec, cts: tsExec }
    : {};

  return {
    ...defaultParserMap,
    js:  jsExec,
    mjs: jsExec,
    ...tsEntry,
  };
}

export type { ParserFn, ParserMap, FormatDependency, FormatEntry, SupportedFormat, ModuleType, ModuleDefinition } from "./types.ts";
export { formatDependencies, supportedFormats, supportedModules } from "./config.ts";
export { getCachedExternalModule } from "./moduleCache.ts";
export { executeAsScript } from "./lib/javascript.ts";
export { transpileAndExecute, transpileAndImportTypeScript } from "./lib/typescript.ts";

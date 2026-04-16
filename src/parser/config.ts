import type { FormatDependency, FormatEntry } from "./types.ts";

export const formatDependencies: Record<string, FormatDependency> = {
  yaml: {
    cdnUrl: "https://esm.sh/yaml",
  },
  "jsonc-parser": {
    cdnUrl: "https://esm.sh/jsonc-parser",
  },
  toml: {
    cdnUrl: "https://esm.sh/toml",
  },
  typescript: {
    cdnUrl: "https://esm.sh/typescript",
  },
};

export const supportedFormats: FormatEntry[] = [
  { key: "json",       extensions: ["json"],              depKeys: [] },
  { key: "jsonl",      extensions: ["jsonl", "ndjson"],   depKeys: [] },
  { key: "jsonc",      extensions: ["jsonc"],             depKeys: ["jsonc-parser"] },
  { key: "yaml",       extensions: ["yaml", "yml"],       depKeys: ["yaml"] },
  { key: "toml",       extensions: ["toml"],              depKeys: ["toml"] },
  { key: "csv",        extensions: ["csv"],               depKeys: [] },
  { key: "javascript", extensions: ["js", "mjs"],         depKeys: [] },
  { key: "typescript", extensions: ["ts", "tsx", "mts", "cts"], depKeys: ["typescript"] },
  { key: "text",       extensions: ["txt", "sql", "md"],  depKeys: [] },
];

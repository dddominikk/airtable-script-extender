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
  { key: "json",       extensions: ["json"],                    mimeTypes: ["application/json"],                                                   depKeys: [] },
  { key: "jsonl",      extensions: ["jsonl", "ndjson"],         mimeTypes: ["application/x-ndjson", "application/jsonl"],                          depKeys: [] },
  { key: "jsonc",      extensions: ["jsonc"],                   mimeTypes: ["application/jsonc"],                                                   depKeys: ["jsonc-parser"] },
  { key: "yaml",       extensions: ["yaml", "yml"],             mimeTypes: ["application/yaml", "text/yaml", "application/x-yaml"],                depKeys: ["yaml"] },
  { key: "toml",       extensions: ["toml"],                    mimeTypes: ["application/toml"],                                                    depKeys: ["toml"] },
  { key: "csv",        extensions: ["csv"],                     mimeTypes: ["text/csv"],                                                            depKeys: [] },
  { key: "javascript", extensions: ["js", "mjs"],               mimeTypes: ["application/javascript", "text/javascript"],                          depKeys: [] },
  { key: "typescript", extensions: ["ts", "tsx", "mts", "cts"], mimeTypes: ["application/typescript", "text/typescript"],                          depKeys: ["typescript"] },
  { key: "text",       extensions: ["txt", "sql", "md"],        mimeTypes: ["text/plain", "text/markdown", "text/x-sql", "application/sql"],       depKeys: [] },
];

import { getCachedExternalModule } from "../moduleCache.ts";
import { executeAsIife, executeAsScriptFromText, importJavaScriptModule } from "./javascript.ts";
import type { ModuleType } from "../types.ts";

async function transpile(source: string): Promise<string> {
  const ts = (await getCachedExternalModule("typescript")) as {
    transpileModule?: (
      input: string,
      options?: { compilerOptions?: Record<string, unknown> },
    ) => { outputText: string };
    transpile?: (
      input: string,
      compilerOptions?: Record<string, unknown>,
    ) => string;
    ScriptTarget?: Record<string, unknown>;
    ModuleKind?: Record<string, unknown>;
  };

  return typeof ts.transpileModule === "function"
    ? ts.transpileModule(source, {
        compilerOptions: {
          target:
            (ts.ScriptTarget && "ESNext" in ts.ScriptTarget && ts.ScriptTarget.ESNext) ||
            "ESNext",
          module:
            (ts.ModuleKind && "ESNext" in ts.ModuleKind && ts.ModuleKind.ESNext) ||
            "ESNext",
          removeComments: true,
          esModuleInterop: true,
        },
      }).outputText
    : typeof ts.transpile === "function"
      ? ts.transpile(source, {
          target: "esnext",
          module: "esnext",
          removeComments: true,
          esModuleInterop: true,
        })
      : source;
}

export async function transpileAndExecute(
  source: string,
  moduleType: ModuleType = "esm",
): Promise<unknown> {
  const js = await transpile(source);

  switch (moduleType) {
    case "esm":    return await importJavaScriptModule(js);
    case "iife":   return await executeAsIife(js);
    case "script": return executeAsScriptFromText(js);
  }
}

/** @deprecated Use transpileAndExecute(source, "esm") instead. */
export async function transpileAndImportTypeScript(source: string): Promise<unknown> {
  return transpileAndExecute(source, "esm");
}

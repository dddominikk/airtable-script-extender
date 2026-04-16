import { getCachedExternalModule } from "../moduleCache.ts";
import { importJavaScriptModule } from "./javascript.ts";

export async function transpileAndImportTypeScript(source: string): Promise<unknown> {
  const ts = (await getCachedExternalModule("typescript")) as {
    transpileModule?: (
      input: string,
      options?: {
        compilerOptions?: Record<string, unknown>;
      },
    ) => { outputText: string };
    transpile?: (
      input: string,
      compilerOptions?: Record<string, unknown>,
    ) => string;
    ScriptTarget?: Record<string, unknown>;
    ModuleKind?: Record<string, unknown>;
  };

  const js =
    typeof ts.transpileModule === "function"
      ? ts.transpileModule(source, {
          compilerOptions: {
            target:
              (ts.ScriptTarget &&
                "ESNext" in ts.ScriptTarget &&
                ts.ScriptTarget.ESNext) ||
              "ESNext",
            module:
              (ts.ModuleKind &&
                "ESNext" in ts.ModuleKind &&
                ts.ModuleKind.ESNext) ||
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

  return await importJavaScriptModule(js);
}

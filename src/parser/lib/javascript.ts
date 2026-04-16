export function toJsDataUrl(source: string): string {
  return `data:application/javascript;base64,${btoa(
    unescape(encodeURIComponent(source)),
  )}`;
}

/** ESM: dynamic import via data URL. */
export async function importJavaScriptModule(source: string): Promise<unknown> {
  return await import(toJsDataUrl(source));
}

/** IIFE: always uses AsyncFunction constructor for simplicity. */
export async function executeAsIife(source: string): Promise<unknown> {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as {
    new (...args: string[]): (...args: unknown[]) => Promise<unknown>;
  };
  return await new AsyncFunction(source)();
}

/**
 * Script: calls importScripts(url) directly.
 * Only available in Worker / ServiceWorker contexts.
 * Accepts the attachment URL — does not go through the text pipeline.
 */
export function executeAsScript(url: string): void {
  if (typeof importScripts !== "function") {
    throw new Error("executeAsScript is only available in Worker contexts (importScripts is not defined).");
  }
  importScripts(url);
}

/**
 * Script (text pipeline variant): creates a Blob URL from source text,
 * calls importScripts, then revokes the blob. Used by buildModuleParserMap("script").
 */
export function executeAsScriptFromText(source: string): void {
  if (typeof importScripts !== "function") {
    throw new Error("executeAsScriptFromText is only available in Worker contexts (importScripts is not defined).");
  }
  const blob = new Blob([source], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    importScripts(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

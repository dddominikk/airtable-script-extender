import { formatDependencies } from "./config.ts";

declare global {
  var __airtableScriptExtenderModuleCache:
    | {
        modules: Record<string, unknown>;
      }
    | undefined;
}

function getRuntimeModuleCache() {
  if (!globalThis.__airtableScriptExtenderModuleCache) {
    globalThis.__airtableScriptExtenderModuleCache = {
      modules: Object.create(null),
    };
  }

  return globalThis.__airtableScriptExtenderModuleCache;
}

export async function getCachedExternalModule(key: string): Promise<unknown> {
  const cache = getRuntimeModuleCache();

  if (cache.modules[key]) {
    return cache.modules[key];
  }

  const dep = formatDependencies[key];

  if (!dep) {
    throw new Error(`No dependency registered for module key: "${key}"`);
  }

  const specifier = dep.localPath ?? dep.cdnUrl;
  const mod = await import(specifier);
  cache.modules[key] = mod;
  return mod;
}

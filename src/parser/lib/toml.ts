import { getCachedExternalModule } from "../moduleCache.ts";

export async function parseToml(source: string): Promise<unknown> {
  const toml = (await getCachedExternalModule("toml")) as {
    parse: (text: string) => unknown;
  };

  return toml.parse(source);
}

import { getCachedExternalModule } from "../moduleCache.ts";

export async function parseYaml(source: string): Promise<unknown> {
  const yaml = (await getCachedExternalModule("yaml")) as {
    parse: (text: string) => unknown;
  };

  return yaml.parse(source);
}

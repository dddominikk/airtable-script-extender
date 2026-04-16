import { getCachedExternalModule } from "../moduleCache.ts";

export async function parseJsonc(source: string): Promise<unknown> {
  const jsonc = (await getCachedExternalModule("jsonc-parser")) as {
    parse: (
      text: string,
      errors?: unknown[],
      options?: { allowTrailingComma?: boolean; disallowComments?: boolean },
    ) => unknown;
  };

  const errors: unknown[] = [];
  const value = jsonc.parse(source, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length) {
    throw new Error(`Failed to parse JSONC: ${JSON.stringify(errors)}`);
  }

  return value;
}

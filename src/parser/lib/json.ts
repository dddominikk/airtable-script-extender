export function parseJsonString(source: string): unknown {
  return JSON.parse(source);
}

export function parseJsonLines(source: string): unknown[] {
  return source
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `Failed to parse JSONL line ${index + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    });
}

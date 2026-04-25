/**
 * parseRawData.ts
 *
 * Thin utility for passing raw data through a parser function.
 * Supports sync and async parsers uniformly — always returns a Promise.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RawInput = string | number[] | unknown[];

export type ParserFn<T = unknown> = (
  data: RawInput
) => T | Promise<T>;

// ---------------------------------------------------------------------------
// parseRaw
// ---------------------------------------------------------------------------

/**
 * Passes `data` through `parser` and always returns a Promise, regardless of
 * whether `parser` is synchronous or asynchronous.
 *
 * @example
 * const result = await parseRaw('{"age":25}', (raw) => JSON.parse(raw as string));
 *
 * @example
 * const result = await parseRaw([0x7b, 0x7d], myBinaryParser);
 */
export async function parseRaw<T = unknown>(
  data: RawInput,
  parser: ParserFn<T>
): Promise<T> {
  return parser(data);
}

/**
 * PathResolver.ts
 *
 * Wraps any async resolution function (fetch, fs.readFile, Airtable lookup…)
 * in a uniform interface that always yields { raw, path }.
 *
 * The generic `R` parameter is the raw resolved value type (string by default,
 * but can be e.g. Response when wrapping fetch).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PathInput = { path: string };

export type ResolvedPath<R = string> = {
  raw: R;
  path: string;
};

/** Any async function that takes a path string and returns something. */
export type ResolveFn<R = string> = (path: string) => Promise<R>;

// ---------------------------------------------------------------------------
// PathResolver
// ---------------------------------------------------------------------------

export class PathResolver<R = string> {
  readonly name: string;
  private readonly _resolve: ResolveFn<R>;

  /**
   * @param name     - Human-readable identifier for this resolver.
   * @param resolve  - Async function that maps a path string to a raw value.
   *
   * @example
   * const resolveUrl = new PathResolver('remotePath', async (url) => {
   *   const res = await fetch(url);
   *   return res.text();
   * });
   */
  constructor(name: string, resolve: ResolveFn<R>) {
    this.name     = name;
    this._resolve = resolve;
  }

  // -------------------------------------------------------------------------
  // resolvePath — single
  // -------------------------------------------------------------------------

  /**
   * Resolves a single path, returning `{ raw, path }`.
   *
   * @example
   * const { raw, path } = await resolver.resolvePath({ path: 'https://example.com/data.json' });
   */
  async resolvePath(input: PathInput): Promise<ResolvedPath<R>> {
    const raw = await this._resolve(input.path);
    return { raw, path: input.path };
  }

  // -------------------------------------------------------------------------
  // resolvePaths — multiple, concurrent
  // -------------------------------------------------------------------------

  /**
   * Resolves multiple paths concurrently.
   * Returns an array of Promises (one per path), letting callers decide
   * whether to `await Promise.all(...)` or iterate individually.
   *
   * @example
   * const results = await Promise.all(
   *   resolver.resolvePaths({ path: '/a' }, { path: '/b' })
   * );
   */
  resolvePaths(...inputs: PathInput[]): Promise<ResolvedPath<R>>[] {
    return inputs.map((input) => this.resolvePath(input));
  }
}

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

/**
 * Optional post-resolve transform applied to the raw value before it is
 * returned from `resolvePath` / `resolvePaths`.
 * Can be sync or async; always awaited internally.
 */
export type TransformFn<R = string> = (raw: R, path: string) => R | Promise<R>;

// ---------------------------------------------------------------------------
// PathResolver
// ---------------------------------------------------------------------------

export class PathResolver<R = string> {
  readonly name: string;
  private readonly _resolve:   ResolveFn<R>;
  private readonly _transform: TransformFn<R> | undefined;

  /**
   * @param name      - Human-readable identifier for this resolver.
   * @param resolve   - Async function that maps a path string to a raw value.
   * @param transform - Optional callback invoked on the raw value before it is
   *                    returned. Receives `(raw, path)` so the transform can
   *                    branch on the originating path if needed.
   *
   * @example
   * // Strip BOM from every file read by this resolver
   * const fileResolver = new PathResolver(
   *   'fileResolver',
   *   (p) => fs.promises.readFile(p, 'utf8'),
   *   (raw) => (raw as string).replace(/^\uFEFF/, '') as R,
   * );
   *
   * @example
   * // Unwrap fetch → text so callers always receive a string
   * const urlResolver = new PathResolver(
   *   'urlResolver',
   *   (url) => fetch(url),
   *   (response) => response.text(),
   * );
   */
  constructor(name: string, resolve: ResolveFn<R>, transform?: TransformFn<R>) {
    this.name       = name;
    this._resolve   = resolve;
    this._transform = transform;
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
    const resolved = await this._resolve(input.path);
    const raw      = this._transform
      ? await this._transform(resolved, input.path)
      : resolved;
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
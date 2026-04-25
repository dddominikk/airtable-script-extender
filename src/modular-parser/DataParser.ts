/**
 * DataParser.ts
 *
 * A registry-backed class for format-aware parsing.
 * Instances are cached in DataParser.s keyed by name, making them
 * importable as a shared, stateless plugin registry.
 */

import { type RawInput, type ParserFn } from './parseRawData.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** At least one of `extensions` or `mimeTypes` must be a non-empty array. */
export type SupportsConfig =
  | { extensions: string[]; mimeTypes?: string[] }
  | { extensions?: string[]; mimeTypes: string[] };

export type DataParserOptions = {
  /** Defaults to `parser.name` when omitted. */
  name?: string;
  supports: SupportsConfig;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeExtension = (ext: string): string =>
  ext.toLowerCase().replace(/^\./, '');

const normalizeMimeType = (mime: string): string =>
  mime.toLowerCase().trim();

// ---------------------------------------------------------------------------
// DataParser
// ---------------------------------------------------------------------------

export class DataParser<T = unknown> {
  /** Global registry of all registered parsers, keyed by name. */
  static s: Record<string, DataParser> = {};

  readonly name: string;
  readonly parser: ParserFn<T>;
  readonly extensions: ReadonlySet<string>;
  readonly mimeTypes: ReadonlySet<string>;

  constructor(parser: ParserFn<T>, options: DataParserOptions) {
    const exts  = (options.supports.extensions ?? []).map(normalizeExtension);
    const mimes = (options.supports.mimeTypes  ?? []).map(normalizeMimeType);

    if (exts.length === 0 && mimes.length === 0) {
      throw new Error(
        'DataParser: `supports` must declare at least one extension or mimeType.'
      );
    }

    this.name       = options.name ?? parser.name;
    this.parser     = parser;
    this.extensions = new Set(exts);
    this.mimeTypes  = new Set(mimes);

    if (!this.name) {
      throw new Error(
        'DataParser: could not infer a name from the parser function. ' +
        'Provide an explicit `name` option or use a named function.'
      );
    }

    // Register in the static cache
    DataParser.s[this.name] = this as DataParser<unknown>;
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /** Returns true if this parser supports the given file extension. */
  supportsExtension(ext: string): boolean {
    return this.extensions.has(normalizeExtension(ext));
  }

  /** Returns true if this parser supports the given MIME type. */
  supportsMimeType(mime: string): boolean {
    return this.mimeTypes.has(normalizeMimeType(mime));
  }

  /**
   * Returns true if this parser can handle the given extension or MIME type.
   * Accepts either format: `"json"`, `".json"`, `"application/json"`.
   */
  canHandle(extensionOrMime: string): boolean {
    return (
      this.supportsExtension(extensionOrMime) ||
      this.supportsMimeType(extensionOrMime)
    );
  }

  // -------------------------------------------------------------------------
  // Parsing
  // -------------------------------------------------------------------------

  /** Runs the registered parser against `data`. Always returns a Promise. */
  async parse(data: RawInput): Promise<T> {
    return this.parser(data);
  }

  // -------------------------------------------------------------------------
  // Static helpers
  // -------------------------------------------------------------------------

  /**
   * Returns the first registered DataParser that can handle the given
   * extension or MIME type, or `undefined` if none match.
   */
  static find(extensionOrMime: string): DataParser | undefined {
    return Object.values(DataParser.s).find((p) =>
      p.canHandle(extensionOrMime)
    );
  }

  /**
   * Returns all registered DataParsers that can handle the given
   * extension or MIME type.
   */
  static findAll(extensionOrMime: string): DataParser[] {
    return Object.values(DataParser.s).filter((p) =>
      p.canHandle(extensionOrMime)
    );
  }
}

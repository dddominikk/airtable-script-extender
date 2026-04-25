/**
 * plugins/types.ts
 *
 * Contracts every plugin module must satisfy.
 * Each `plugins/{name}/index.ts` default-exports one of these.
 */

import { type RawInput }                        from '../parseRawData.ts';
import { type DataParser }                       from '../DataParser.ts';
import { type PathResolver, type ResolveFn, type TransformFn } from '../PathResolver.ts';

// ---------------------------------------------------------------------------
// Parser plugin
// ---------------------------------------------------------------------------

export interface PluginConfig<T = unknown> {
  /** Named function preferred — its `.name` is used as the DataParser name. */
  parser: (raw: RawInput) => T | Promise<T>;
  supports: {
    extensions?: string[];
    mimeTypes?:  string[];
  };
}

// ---------------------------------------------------------------------------
// PathResolver plugin
// ---------------------------------------------------------------------------

export interface PathResolverConfig<R = string> {
  name:       string;
  resolve:    ResolveFn<R>;
  transform?: TransformFn<R>;
}

// ---------------------------------------------------------------------------
// Plugin entry (input) — discriminated union
// ---------------------------------------------------------------------------

export type PluginEntry =
  | { type: 'parser';       name: string }
  | { type: 'pathResolver'; name: string }
  | { type: 'custom';       name: string };

// ---------------------------------------------------------------------------
// Loaded plugin (output) — discriminated union
// ---------------------------------------------------------------------------

export type LoadedPlugin =
  | { type: 'parser';       instance: DataParser }
  | { type: 'pathResolver'; instance: PathResolver }
  | { type: 'custom';       instance: Record<string, unknown> };

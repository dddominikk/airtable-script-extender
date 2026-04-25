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
  /** Called once by loadPlugins before the DataParser instance is created. */
  init?: () => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// PathResolver plugin
// ---------------------------------------------------------------------------

export interface PathResolverConfig<R = string> {
  name:       string;
  resolve:    ResolveFn<R>;
  transform?: TransformFn<R>;
  /** Called once by loadPlugins before the PathResolver instance is created. */
  init?: () => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Plugin entry (input) — discriminated union
// ---------------------------------------------------------------------------

export type PluginEntry =
  | { type: 'parser';       dir: string; name?: string }
  | { type: 'pathResolver'; dir: string; name?: string }
  | { type: 'custom';       dir: string; name?: string };

// ---------------------------------------------------------------------------
// Loaded plugin (output) — discriminated union
// ---------------------------------------------------------------------------

export type LoadedPlugin =
  | { type: 'parser';       name: string; instance: DataParser }
  | { type: 'pathResolver'; name: string; instance: PathResolver }
  | { type: 'custom';       name: string; instance: Record<string, unknown> };

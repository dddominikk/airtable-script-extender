/**
 * plugins/types.ts
 *
 * Contract every plugin module must satisfy.
 * Each `plugins/{name}/index.ts` default-exports one of these.
 */

import { type RawInput } from '../parseRawData.js';

export interface PluginConfig<T = unknown> {
  /**
   * Named function preferred — its `.name` is used as the DataParser name
   * when no explicit override is given in the barrel.
   */
  parser: (raw: RawInput) => T | Promise<T>;

  supports: {
    extensions?: string[];
    mimeTypes?:  string[];
  };
}

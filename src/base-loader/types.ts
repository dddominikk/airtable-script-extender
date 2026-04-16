import type { AttachmentContentLoader } from "../attachment-loader/types.ts";
import type { GetterModeSelection, GetterRegistry } from "../cell-reader/types.ts";
import type { TableSelectQuery } from "../record-loader/types.ts";

export interface BaseLoaderOptions {
  registry?: GetterRegistry;
  getterModes?: Record<string, GetterModeSelection>;
  fetchMethod?: typeof fetch;
  attachmentContentLoader?: AttachmentContentLoader;
}

export interface MultiTableSelectQueryMap {
  [tableName: string]: TableSelectQuery;
}

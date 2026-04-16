import { buildAttachmentLoader } from "../attachment-loader/index.ts";
import type { AttachmentContentLoader } from "../attachment-loader/types.ts";

export { defaultGetterRegistry } from "../cell-reader/index.ts";

export interface DefaultAttachmentContentLoaderOptions {
  fetchMethod: typeof fetch;
}

export function buildDefaultAttachmentContentLoader(
  options: DefaultAttachmentContentLoaderOptions,
): AttachmentContentLoader {
  return buildAttachmentLoader(options.fetchMethod);
}

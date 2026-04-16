import type { ParserMap } from "../parser/types.ts";
import type { AirtableAttachment } from "../airtable-types.ts";

export type AttachmentContentLoader = (
  attachment: AirtableAttachment,
) => Promise<unknown>;

export interface AttachmentLoaderOptions {
  fetchMethod: typeof fetch;
  parserMap?: ParserMap;
}

export interface LoadedAttachment extends AirtableAttachment {
  ext: string | null;
  content?: unknown;
  loadError?: string;
}

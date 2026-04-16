import type { ParserMap } from "../parser/types.ts";
import type { AirtableAttachment } from "../types/airtable.ts";

export type AttachmentContentLoader = (
  attachment: AirtableAttachment,
) => Promise<unknown>;

export interface AttachmentLoaderOptions {
  fetchMethod: typeof fetch;
  parserMap?: ParserMap;
}

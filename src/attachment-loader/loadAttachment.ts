import type { AirtableAttachment } from "../types/airtable.ts";
import { defaultParserMap } from "../parser/index.ts";
import type { AttachmentContentLoader, AttachmentLoaderOptions } from "./types.ts";

export function getAttachmentExtension(attachment: AirtableAttachment): string | null {
  const parts = String(attachment.filename ?? "").split(".");
  if (parts.length < 2) {
    return null;
  }
  return parts.at(-1)?.toLowerCase() ?? null;
}

export function buildAttachmentLoader(
  fetchMethod: typeof fetch,
  parserMap = defaultParserMap,
): AttachmentContentLoader {
  return async function loadAttachmentContent(
    attachment: AirtableAttachment,
  ): Promise<unknown> {
    const ext = getAttachmentExtension(attachment);
    const response = await fetchMethod(attachment.url);
    const parser = ext !== null ? parserMap[ext] : undefined;

    if (parser) {
      const text = await response.text();
      return await parser(text);
    }

    return await response.text();
  };
}

export function buildAttachmentLoaderFromOptions(
  options: AttachmentLoaderOptions,
): AttachmentContentLoader {
  return buildAttachmentLoader(options.fetchMethod, options.parserMap);
}

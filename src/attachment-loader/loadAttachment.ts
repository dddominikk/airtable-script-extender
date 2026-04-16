import type { AirtableAttachment } from "../airtable-types.ts";
import { defaultParserMap } from "../parser/index.ts";
import { supportedFormats } from "../parser/config.ts";
import type { ParserMap } from "../parser/types.ts";
import type { AttachmentContentLoader, AttachmentLoaderOptions } from "./types.ts";

export function getAttachmentExtension(attachment: AirtableAttachment): string | null {
  const parts = String(attachment.filename ?? "").split(".");
  if (parts.length < 2) {
    return null;
  }
  return parts.at(-1)?.toLowerCase() ?? null;
}

function buildMimeParserMap(parserMap: ParserMap): Record<string, string> {
  const map: Record<string, string> = {};
  for (const format of supportedFormats) {
    if (!parserMap[format.extensions[0]]) continue;
    for (const mime of format.mimeTypes) {
      map[mime.toLowerCase()] = format.extensions[0];
    }
  }
  return map;
}

function resolveParserKey(
  attachment: AirtableAttachment,
  mimeParserMap: Record<string, string>,
): string | null {
  const mime = typeof attachment.type === "string" ? attachment.type.toLowerCase().split(";")[0].trim() : null;
  if (mime && mimeParserMap[mime]) {
    return mimeParserMap[mime];
  }
  return getAttachmentExtension(attachment);
}

export function buildAttachmentLoader(
  fetchMethod: typeof fetch,
  parserMap = defaultParserMap,
): AttachmentContentLoader {
  const mimeParserMap = buildMimeParserMap(parserMap);

  return async function loadAttachmentContent(
    attachment: AirtableAttachment,
  ): Promise<unknown> {
    const key = resolveParserKey(attachment, mimeParserMap);
    const response = await fetchMethod(attachment.url);
    const parser = key !== null ? parserMap[key] : undefined;

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

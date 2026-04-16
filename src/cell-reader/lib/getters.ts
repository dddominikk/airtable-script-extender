import type { AirtableAttachment } from "../../airtable-types.ts";
import type { AttachmentContentLoader, LoadedAttachment } from "../../attachment-loader/types.ts";
import { getAttachmentExtension } from "../../attachment-loader/index.ts";
import type { CellValueGetterMap } from "../types.ts";

export interface DefaultCellValueGettersOptions {
  attachmentContentLoader?: AttachmentContentLoader;
}

export function defaultCellValueGetters(
  options: DefaultCellValueGettersOptions = {},
): CellValueGetterMap {
  const { attachmentContentLoader } = options;

  return {
    json: {
      key: "json",
      needs: ["string"],
      defaultMode: "jsonByFieldName",
      get: ({ reads }) => JSON.parse(reads.string ?? ""),
    },

    jsonl: {
      key: "jsonl",
      needs: ["string"],
      defaultMode: "jsonlByFieldName",
      get: ({ reads }) =>
        (reads.string ?? "")
          .split(/\r?\n/g)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => {
            try {
              return JSON.parse(line);
            } catch (error) {
              throw new Error(
                `Failed to parse JSONL line ${index + 1}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }
          }),
    },

    attachments: {
      key: "attachments",
      needs: ["value"],
      defaultMode: "attachmentsByFieldType",
      get: async ({ reads }) => {
        const attachments = Array.isArray(reads.value)
          ? (reads.value as AirtableAttachment[])
          : [];

        const loaded: LoadedAttachment[] = [];

        for (const attachment of attachments) {
          const ext = getAttachmentExtension(attachment);
          const entry: LoadedAttachment = { ...attachment, ext };

          if (attachmentContentLoader) {
            try {
              entry.content = await attachmentContentLoader(attachment);
            } catch (error) {
              entry.loadError =
                error instanceof Error ? error.message : String(error);
            }
          }

          loaded.push(entry);
        }

        return loaded;
      },
    },
  };
}

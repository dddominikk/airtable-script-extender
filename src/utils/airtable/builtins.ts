import type { AirtableAttachment } from '../../types/airtable.ts';
import type {
  AttachmentContentLoader,
  CellValueGetterMap,
  GetterRegistry,
  LoadedAttachment
} from './types.ts';
import { defaultGetterChecks } from './getterChecks.ts';
import { defaultGetterModes } from './getterModes.ts';

function parseJsonString(source: string): unknown {
  return JSON.parse(source);
}

function parseJsonLines(source: string): unknown[] {
  return source
    .split(/\r?\n/g)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function getAttachmentExtension(attachment: AirtableAttachment): string | null {
  const parts = attachment.filename.split('.');
  if (parts.length < 2) {
    return null;
  }
  return parts.at(-1)?.toLowerCase() ?? null;
}

export interface DefaultAttachmentContentLoaderOptions {
  fetchMethod: typeof fetch;
}

export function buildDefaultAttachmentContentLoader(
  options: DefaultAttachmentContentLoaderOptions
): AttachmentContentLoader {
  const { fetchMethod } = options;

  return async function loadAttachmentContent(attachment: AirtableAttachment): Promise<unknown> {
    const ext = getAttachmentExtension(attachment);
    const response = await fetchMethod(attachment.url);

    switch (ext) {
      case 'json':
        return await response.json();

      case 'jsonl': {
        const text = await response.text();
        return parseJsonLines(text);
      }

      case 'txt':
      case 'sql':
      case 'md':
      case 'mjs':
      case 'js':
      case 'yaml':
      case 'yml':
      case 'jsonc':
      default:
        return await response.text();
    }
  };
}

export interface DefaultGetterRegistryOptions {
  attachmentContentLoader?: AttachmentContentLoader;
}

export function defaultCellValueGetters(
  options: DefaultGetterRegistryOptions = {}
): CellValueGetterMap {
  const { attachmentContentLoader } = options;

  return {
    json: {
      key: 'json',
      needs: ['string'],
      defaultMode: 'jsonByFieldName',
      get: ({ reads }) => parseJsonString(reads.string ?? '')
    },

    jsonl: {
      key: 'jsonl',
      needs: ['string'],
      defaultMode: 'jsonlByFieldName',
      get: ({ reads }) => parseJsonLines(reads.string ?? '')
    },

    attachments: {
      key: 'attachments',
      needs: ['value'],
      defaultMode: 'attachmentsByFieldType',
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
              entry.loadError = error instanceof Error ? error.message : String(error);
            }
          }

          loaded.push(entry);
        }

        return loaded;
      }
    }
  };
}

export function defaultGetterRegistry(
  options: DefaultGetterRegistryOptions = {}
): GetterRegistry {
  return {
    checks: { ...defaultGetterChecks },
    modes: { ...defaultGetterModes },
    getters: defaultCellValueGetters(options)
  };
}

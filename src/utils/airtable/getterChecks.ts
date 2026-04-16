import type { CellGetterChecks } from './types.ts';

export const defaultGetterChecks: CellGetterChecks = {
  fieldNameEndsWithApplicationJson: ({ field }) =>
    field.name.toLowerCase().endsWith('.application.json'),

  fieldNameEndsWithApplicationJsonl: ({ field }) =>
    field.name.toLowerCase().endsWith('.application.jsonl'),

  isMultipleAttachmentsField: ({ field }) =>
    field.type === 'multipleAttachments',

  isLongTextLikeField: ({ field }) =>
    ['singleLineText', 'multilineText', 'richText', 'formula'].includes(field.type),
};

import type { GetterModeMap } from './types.ts';

export const defaultGetterModes: GetterModeMap = {
  jsonByFieldName: {
    all: ['fieldNameEndsWithApplicationJson']
  },

  jsonlByFieldName: {
    all: ['fieldNameEndsWithApplicationJsonl']
  },

  attachmentsByFieldType: {
    all: ['isMultipleAttachmentsField']
  }
};

import type { AirtableField, AirtableTable } from '../types/airtable.ts';
import type { FieldSelectionMap, FieldSelector, FieldSelectionObject, FieldSelectionValue } from './types.ts';

export interface ResolvedFieldSelection {
  field: AirtableField;
  config: FieldSelectionObject;
}

function normalizeFieldSelectionValue(value: FieldSelectionValue): FieldSelectionObject {
  if (value === true) {
    return { value: true, string: true };
  }

  if (typeof value === 'string') {
    return {
      getters: {
        [value]: value
      }
    };
  }

  if (Array.isArray(value)) {
    return {
      getters: Object.fromEntries(value.map(key => [key, key]))
    };
  }

  return {
    value: value.value,
    string: value.string,
    getters: value.getters
  };
}

export function getSelectedFields(
  table: AirtableTable,
  fields: FieldSelector | undefined
): ResolvedFieldSelection[] {
  if (!fields || fields === '*') {
    return table.fields.map(field => ({
      field,
      config: { value: true, string: true }
    }));
  }

  if (Array.isArray(fields)) {
    const wanted = new Set(fields.map(fieldName => fieldName.toLowerCase()));
    return table.fields
      .filter(field => wanted.has(field.name.toLowerCase()) || wanted.has(field.id.toLowerCase()))
      .map(field => ({
        field,
        config: { value: true, string: true }
      }));
  }

  const fieldMap = fields as FieldSelectionMap;

  return Object.entries(fieldMap)
    .map(([key, value]) => {
      const field = table.fields.find(
        candidate =>
          candidate.name.toLowerCase() === key.toLowerCase() ||
          candidate.id.toLowerCase() === key.toLowerCase()
      );

      if (!field) {
        return null;
      }

      return {
        field,
        config: normalizeFieldSelectionValue(value)
      };
    })
    .filter((entry): entry is ResolvedFieldSelection => Boolean(entry));
}

import type {
  AirtableField,
  AirtableRecord
} from '../types/airtable.ts';
import type { PrimitiveReads, PrimitiveReadKey } from './types.ts';

export function loadPrimitiveCellReads(
  record: AirtableRecord,
  field: AirtableField,
  needs: Iterable<PrimitiveReadKey>
): PrimitiveReads {
  const reads: PrimitiveReads = {};
  const uniqueNeeds = new Set(needs);

  if (uniqueNeeds.has('value')) {
    reads.value = record.getCellValue(field);
  }

  if (uniqueNeeds.has('string')) {
    reads.string = record.getCellValueAsString(field);
  }

  return reads;
}

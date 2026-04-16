import type {
  AirtableBase,
  AirtableRecord,
  AirtableTable
} from '../types/airtable.ts';
import { getSelectedFields } from './getSelectedFields.ts';
import { loadRecordModel } from './loadRecordModel.ts';
import type {
  GetterModeSelection,
  GetterRegistry,
  TableSelectQuery,
  TableSelectResult
} from './types.ts';

export async function selectTableRecords<TRecord extends AirtableRecord = AirtableRecord>(
  params: {
    base?: AirtableBase;
    table: AirtableTable<TRecord>;
    query?: TableSelectQuery;
    registry: GetterRegistry;
    defaultGetterModes?: Record<string, GetterModeSelection>;
  }
): Promise<TableSelectResult<TRecord>> {
  const { base, table, query, registry, defaultGetterModes } = params;
  const selectedFields = getSelectedFields(table, query?.fields).map(entry => entry.field);

  const result = await table.selectRecordsAsync({
    recordIds: query?.recordIds,
    fields: selectedFields.length ? selectedFields : undefined,
    view: query?.view
  });

  const records = [];
  for (const record of result.records) {
    records.push(
      await loadRecordModel({
        base,
        table,
        record,
        registry,
        query,
        defaultGetterModes
      })
    );
  }

  return {
    table,
    records
  };
}

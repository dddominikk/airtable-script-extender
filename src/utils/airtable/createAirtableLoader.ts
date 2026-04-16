import type {
  AirtableBase,
  AirtableRecord,
  AirtableTable
} from '../types/airtable.ts';
import { defaultGetterRegistry } from './builtins.ts';
import { selectTableRecords } from './selectTableRecords.ts';
import type {
  AirtableLoaderOptions,
  MultiTableSelectQueryMap,
  TableSelectQuery,
  TableSelectResult
} from './types.ts';

function resolveTable<TRecord extends AirtableRecord = AirtableRecord>(
  base: AirtableBase,
  tableRef: string | AirtableTable<TRecord>
): AirtableTable<TRecord> {
  if (typeof tableRef !== 'string') {
    return tableRef;
  }

  const byName = base.tables.find(
    table => table.name.toLowerCase() === tableRef.toLowerCase()
  );

  if (byName) {
    return byName as AirtableTable<TRecord>;
  }

  throw new Error(`Could not resolve Airtable table: ${tableRef}`);
}

export function createAirtableLoader(
  base: AirtableBase,
  options: AirtableLoaderOptions = {}
) {
  const registry = options.registry ?? defaultGetterRegistry();

  return {
    base,
    registry,

    table<TRecord extends AirtableRecord = AirtableRecord>(
      tableRef: string | AirtableTable<TRecord>
    ) {
      const table = resolveTable(base, tableRef);

      return {
        table,

        async select(query: TableSelectQuery = {}): Promise<TableSelectResult<TRecord>> {
          return await selectTableRecords({
            base,
            table,
            query,
            registry,
            defaultGetterModes: options.getterModes
          });
        },

        async get(
          recordId: string,
          query: Omit<TableSelectQuery, 'recordIds'> = {}
        ) {
          const result = await selectTableRecords({
            base,
            table,
            query: { ...query, recordIds: [recordId] },
            registry,
            defaultGetterModes: options.getterModes
          });

          return result.records[0] ?? null;
        },

        async first(query: TableSelectQuery = {}) {
          const result = await selectTableRecords({
            base,
            table,
            query,
            registry,
            defaultGetterModes: options.getterModes
          });

          return result.records[0] ?? null;
        }
      };
    },

    async tables(queries: MultiTableSelectQueryMap) {
      const entries = Object.entries(queries);
      const result: Record<string, TableSelectResult> = {};

      for (const [tableName, query] of entries) {
        result[tableName] = await this.table(tableName).select(query);
      }

      return result;
    }
  };
}

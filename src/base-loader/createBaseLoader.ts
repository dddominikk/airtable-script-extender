import type { AirtableBase, AirtableTable } from "../airtable-types.ts";
import { buildDefaultAttachmentContentLoader, defaultGetterRegistry } from "./builtins.ts";
import { selectTableRecords } from "../record-loader/selectTableRecords.ts";
import type { TableSelectQuery, TableSelectResult } from "../record-loader/types.ts";
import type { BaseLoaderOptions, MultiTableSelectQueryMap } from "./types.ts";

function resolveTable(
  base: AirtableBase,
  tableRef: string | AirtableTable,
): AirtableTable {
  if (typeof tableRef !== "string") {
    return tableRef;
  }

  const byName = base.tables.find(
    (table) => table.name.toLowerCase() === tableRef.toLowerCase(),
  );

  if (byName) {
    return byName as AirtableTable;
  }

  throw new Error(`Could not resolve Airtable table: ${tableRef}`);
}

export function createBaseLoader(
  base: AirtableBase,
  options: BaseLoaderOptions = {},
) {
  const fetchMethod = options?.fetchMethod ?? fetch;

  const attachmentContentLoader =
    options?.attachmentContentLoader ??
    buildDefaultAttachmentContentLoader({ fetchMethod });

  const registry =
    options.registry ?? defaultGetterRegistry({ attachmentContentLoader });

  return {
    base,
    registry,
    attachmentContentLoader,

    table(tableRef: string | AirtableTable) {
      const table = resolveTable(base, tableRef);

      return {
        table,

        async select(query: TableSelectQuery = {}): Promise<TableSelectResult> {
          return await selectTableRecords({
            base,
            table,
            query,
            registry,
            defaultGetterModes: options.getterModes,
          });
        },

        async get(
          recordId: string,
          query: Omit<TableSelectQuery, "recordIds"> = {},
        ) {
          const result = await selectTableRecords({
            base,
            table,
            query: { ...query, recordIds: [recordId] },
            registry,
            defaultGetterModes: options.getterModes,
          });

          return result.records[0] ?? null;
        },

        async first(query: TableSelectQuery = {}) {
          const result = await selectTableRecords({
            base,
            table,
            query,
            registry,
            defaultGetterModes: options.getterModes,
          });

          return result.records[0] ?? null;
        },
      };
    },

    async tables(queries: MultiTableSelectQueryMap) {
      const entries = Object.entries(queries);
      const result: Record<string, TableSelectResult> = {};

      for (const [tableName, query] of entries) {
        result[tableName] = await this.table(tableName).select(query);
      }

      return result;
    },
  };
}

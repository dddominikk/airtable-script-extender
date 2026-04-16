import type { AirtableBase, AirtableRecord, AirtableTable } from "../airtable-types.ts";
import type { GetterModeSelection, GetterRegistry } from "../cell-reader/types.ts";
import { evaluateGetterMode } from "../cell-reader/evaluateGetterMode.ts";
import { resolveGetterModeSelection } from "../cell-reader/resolveGetterMode.ts";
import { getSelectedFields } from "./getSelectedFields.ts";
import { loadPrimitiveCellReads } from "./loadPrimitiveCellReads.ts";
import type {
  LoadedRecordModel,
  PrimitivePolicy,
  TableSelectQuery,
} from "./types.ts";

export async function loadRecordModel<TRecord extends AirtableRecord = AirtableRecord>(
  params: {
    base?: AirtableBase;
    table: AirtableTable<TRecord>;
    record: TRecord;
    registry: GetterRegistry;
    query?: TableSelectQuery;
    defaultGetterModes?: Record<string, GetterModeSelection>;
  },
): Promise<LoadedRecordModel<TRecord>> {
  const { base, table, record, registry, query, defaultGetterModes } = params;

  const primitivePolicy: PrimitivePolicy = query?.primitivePolicy ?? "minimal";
  const selectedFields = getSelectedFields(table, query?.fields);

  const loaded: LoadedRecordModel<TRecord> = {
    id: record.id,
    name: record.name,
    record,
    table: { id: table.id, name: table.name },
    cells: {
      values: {},
      strings: {},
      getters: Object.fromEntries(
        Object.keys(registry.getters).map((key) => [key, {} as Record<string, unknown>]),
      ),
    },
  };

  for (const entry of selectedFields) {
    const { field, config } = entry;

    const activeGetterEntries: Array<{ getter: (typeof registry.getters)[string] }> = [];
    for (const getter of Object.values(registry.getters)) {
      const mode = resolveGetterModeSelection(
        getter,
        config.getters,
        query?.getterModes ?? defaultGetterModes,
        registry.modes,
      );

      const matches = await evaluateGetterMode(mode, registry.checks, {
        field,
        record,
        table,
        base,
      });

      if (matches) {
        activeGetterEntries.push({ getter });
      }
    }

    const primitiveNeeds = new Set<"value" | "string">();

    if (primitivePolicy === "full" || config.value) {
      primitiveNeeds.add("value");
    }

    if (primitivePolicy === "full" || config.string) {
      primitiveNeeds.add("string");
    }

    for (const { getter } of activeGetterEntries) {
      for (const need of getter.needs) {
        primitiveNeeds.add(need);
      }
    }

    const reads = loadPrimitiveCellReads(record, field, primitiveNeeds);

    if (primitiveNeeds.has("value")) {
      loaded.cells.values[field.name] = reads.value;
    }

    if (primitiveNeeds.has("string")) {
      loaded.cells.strings[field.name] = reads.string ?? "";
    }

    for (const { getter } of activeGetterEntries) {
      loaded.cells.getters[getter.key][field.name] = await getter.get({
        field,
        record,
        table,
        base,
        reads,
      });
    }
  }

  return loaded;
}

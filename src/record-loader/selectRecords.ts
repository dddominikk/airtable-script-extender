import type { FullSelectorConfig, ReaderField, ReaderRecord, ReaderView } from "./types.ts";

async function loadCustomAirtableRecordLoad() {
  return import("./loadRecord.ts");
}

export async function selectFullRecordsAsync(
  root: ReaderView | ({ id: string; fields: ReaderField[]; selectRecordsAsync: Function; url?: string }),
  options: FullSelectorConfig = {},
) {
  const thisBase = (this as any)?.base ?? (typeof base !== "undefined" ? base : undefined);

  const {
    recordIds,
    fields: fieldsToLoad,
    includeCellValue = true,
    includeCellValueAsString = false,
    cellReaders = [],
    dataParsers = [],
    useCustomAirtableRecordLoad = false,
    recordModel,
  } = options;

  const B =
    !!thisBase && typeof thisBase === "object"
      ? thisBase
      : (this as any)?.base ?? new TypeError(`The base object isn't available.`);

  const table = (root as any).id.startsWith("tbl")
    ? root
    : (B as any).tables.find(
        (t: any) =>
          t.id ===
          new RegExp(String.raw`\b(?<tblId>tbl\w{14})\b`, "i").exec((root as any).url)
            ?.groups?.tblId,
      );

  const fields: ReaderField[] = fieldsToLoad
    ? (table as any).fields.filter((f: ReaderField) =>
        fieldsToLoad.some((x) =>
          [f.name, f.id]
            .map((y) => String(y).toLowerCase())
            .includes(String(x).toLowerCase()),
        ),
      )
    : (table as any).fields;

  const queryResult = await (root as any).selectRecordsAsync({ recordIds, fields });

  const customLoader = useCustomAirtableRecordLoad
    ? (await loadCustomAirtableRecordLoad()).customAirtableRecordLoad
    : null;

  const results = [];

  for (const record of queryResult.records as ReaderRecord[]) {
    let loadedFieldMap: Record<string, unknown>;

    if (customLoader) {
      const loaded = await customLoader({
        record,
        fields,
        dataParsers,
        includeCellValue,
        includeCellValueAsString,
        cellReaders,
      });

      loadedFieldMap = loaded.fullFields;
    } else {
      loadedFieldMap = Object.fromEntries(
        await Promise.all(
          fields.map(async (field) => {
            const cellValue = record.getCellValue(field.id);
            const cellValueAsString = record.getCellValueAsString(field.id);

            const payload: Record<string, unknown> = { field };

            if (includeCellValue) {
              payload.value = cellValue;
            }

            if (includeCellValueAsString) {
              payload.valueAsString = cellValueAsString;
            }

            for (const reader of cellReaders) {
              const matches =
                typeof reader?.condition === "function"
                  ? reader.condition({ record, field })
                  : true;

              if (!matches || typeof reader?.read !== "function") continue;

              payload[reader.key] = await reader.read({
                record,
                field,
                cellValue,
                cellValueAsString,
              });
            }

            return [field.name, payload];
          }),
        ),
      );
    }

    const built =
      typeof recordModel === "function"
        ? await recordModel({
            record,
            fields,
            loadedFieldMap,
            table,
            root,
          })
        : Object.assign(record, { fields: loadedFieldMap });

    results.push(built);
  }

  return results;
}

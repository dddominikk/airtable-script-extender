import type { CellReader, CustomParser, FullRecordLoadConfig, ReaderField, ReaderRecord } from "./types.ts";

const defaultParsers: CustomParser[] = [
  {
    format: "json",
    conditionsMatch: ({ record, field }) => {
      const checks = {
        dotJsonInFldOrRecName: [field.name, record.name].some((s) =>
          String(s).toLowerCase().endsWith(".json"),
        ),
        supportedFldType: [
          "singleLineText",
          "multilineText",
          "richText",
          "formula",
        ].includes(field.type ?? ""),
        nonEmptyCell: record.getCellValueAsString(field.id)?.trim().length > 0,
      };

      return !Object.values(checks).includes(false);
    },
    parse: (stringCellValue) => {
      try {
        return JSON.parse(stringCellValue);
      } catch (e) {
        return new Error(e instanceof Error ? e.message : String(e));
      }
    },
  },
];

export async function customAirtableRecordLoad(ops: FullRecordLoadConfig) {
  const {
    record,
    fields,
    dataParsers = [],
    includeCellValue = true,
    includeCellValueAsString = true,
    cellReaders = [],
  } = ops;

  const customFormatsDefined = dataParsers.map((p) => p.format?.toLowerCase?.());
  const finalParsers = [
    ...dataParsers,
    ...defaultParsers.filter((p) => !customFormatsDefined.includes(p.format)),
  ];

  const fullyLoadedFields: Record<string, unknown> = {};

  for (const field of fields) {
    const cellValue = record.getCellValue(field.id);
    const cellValueAsString = record.getCellValueAsString(field.id);

    const cell: Record<string, unknown> = { field };

    if (includeCellValue) {
      cell.value = cellValue;
    }

    if (includeCellValueAsString) {
      cell.valueAsString = cellValueAsString;
    }

    const matchingParser = finalParsers.find((p) =>
      p?.conditionsMatch?.({ field, record }),
    );

    if (matchingParser) {
      cell.valueAsData = matchingParser.parse(cellValueAsString, { record, field });
    }

    for (const reader of cellReaders) {
      const matches =
        typeof reader?.condition === "function"
          ? reader.condition({ record, field })
          : true;

      if (!matches || typeof reader?.read !== "function") continue;

      cell[reader.key] = await reader.read({
        record,
        field,
        cellValue,
        cellValueAsString,
      });
    }

    fullyLoadedFields[field.name] = cell;

    Object.defineProperty(fullyLoadedFields, field.id, {
      get() {
        return fullyLoadedFields[field.name];
      },
      configurable: true,
    });
  }

  return Object.assign(record, { fullFields: fullyLoadedFields });
}

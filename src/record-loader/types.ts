import type { AirtableRecord, AirtableTable } from "../airtable-types.ts";
import type { GetterModeSelection } from "../cell-reader/types.ts";

export type PrimitiveReadKey = "value" | "string";

export type PrimitivePolicy = "minimal" | "full";

export interface PrimitiveReads {
  value?: unknown;
  string?: string;
}

export interface FieldSelectionObject {
  value?: boolean;
  string?: boolean;
  getters?: Record<string, GetterModeSelection>;
}

export type FieldSelectionValue =
  | boolean
  | string
  | string[]
  | FieldSelectionObject;

export type FieldSelectionMap = Record<string, FieldSelectionValue>;

export type FieldSelector = "*" | string[] | FieldSelectionMap;

export interface ResolvedFieldSelection {
  field: import("../airtable-types.ts").AirtableField;
  config: FieldSelectionObject;
}

export interface LoadedRecordCells {
  values: Record<string, unknown>;
  strings: Record<string, string>;
  getters: Record<string, Record<string, unknown>>;
}

export interface LoadedRecordModel<TRecord extends AirtableRecord = AirtableRecord> {
  id: string;
  name: string;
  record: TRecord;
  table: {
    id: string;
    name: string;
  };
  cells: LoadedRecordCells;
}

export interface TableSelectQuery {
  fields?: FieldSelector;
  recordIds?: string[];
  primitivePolicy?: PrimitivePolicy;
  getterModes?: Record<string, GetterModeSelection>;
  view?: string;
}

export interface TableSelectResult<
  TRecord extends AirtableRecord = AirtableRecord,
> {
  table: AirtableTable;
  records: Array<LoadedRecordModel<TRecord>>;
}

// --- Record reader types (legacy cell-reader/custom-parser API) ---

export type ReaderField = {
  id: `fld${string}`;
  name: string;
  type?: string;
  options?: object;
  description?: string;
};

export type ReaderRecord = {
  id: string;
  name: string;
  getCellValue(fieldId: string): unknown;
  getCellValueAsString(fieldId: string): string;
} & Record<string, unknown>;

export type ReaderView = {
  id: `viw${string}`;
  name: string;
  description: string;
};

export type CellReader = {
  key: string;
  condition?: (ops: { record: ReaderRecord; field: ReaderField }) => boolean;
  read: (ops: {
    record: ReaderRecord;
    field: ReaderField;
    cellValue: unknown;
    cellValueAsString: string;
  }) => unknown | Promise<unknown>;
};

export interface CustomParser {
  format: string;
  conditionsMatch: (init: { record: ReaderRecord; field: ReaderField }) => boolean;
  parse: (
    cellValueAsString: string,
    ops?: { record: ReaderRecord; field: ReaderField },
  ) => unknown;
}

export type FullRecordLoadConfig = {
  record: ReaderRecord;
  fields: ReaderField[];
  dataParsers?: CustomParser[];
  includeCellValue?: boolean;
  includeCellValueAsString?: boolean;
  cellReaders?: CellReader[];
};

export type FullSelectorConfig = {
  recordIds?: string[];
  fields?: string[];
  includeCellValue?: boolean;
  includeCellValueAsString?: boolean;
  cellReaders?: CellReader[];
  dataParsers?: CustomParser[];
  useCustomAirtableRecordLoad?: boolean;
  recordModel?: (ops: {
    record: ReaderRecord;
    fields: ReaderField[];
    loadedFieldMap: Record<string, unknown>;
    table: unknown;
    root: unknown;
  }) => unknown | Promise<unknown>;
};

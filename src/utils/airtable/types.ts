import type {
  AirtableAttachment,
  AirtableBase,
  AirtableField,
  AirtableRecord,
  AirtableTable
} from '../types/airtable.ts';

export type PrimitiveReadKey = 'value' | 'string';
export type PrimitivePolicy = 'minimal' | 'full';

export interface PrimitiveReads {
  value?: unknown;
  string?: string;
}

export interface CellGetterCheckContext {
  field: AirtableField;
  record: AirtableRecord;
  table?: AirtableTable;
  base?: AirtableBase;
}

export type CellGetterCheck = (
  context: CellGetterCheckContext
) => boolean | Promise<boolean>;

export type CellGetterChecks = Record<string, CellGetterCheck>;

export interface GetterModeDefinition {
  all?: string[];
  any?: string[];
  none?: string[];
}

export type GetterModeMap = Record<string, GetterModeDefinition | null>;
export type GetterModeSelection = string | null | GetterModeDefinition;

export interface CellValueGetterContext {
  field: AirtableField;
  record: AirtableRecord;
  table?: AirtableTable;
  base?: AirtableBase;
  reads: PrimitiveReads;
}

export interface CellValueGetter<TResult = unknown> {
  key: string;
  needs: PrimitiveReadKey[];
  defaultMode: string | null;
  get(context: CellValueGetterContext): TResult | Promise<TResult>;
}

export type CellValueGetterMap = Record<string, CellValueGetter>;

export interface GetterRegistry {
  checks: CellGetterChecks;
  modes: GetterModeMap;
  getters: CellValueGetterMap;
}

export interface FieldSelectionObject {
  value?: boolean;
  string?: boolean;
  getters?: Record<string, GetterModeSelection>;
}

export type FieldSelectionValue = boolean | string | string[] | FieldSelectionObject;
export type FieldSelectionMap = Record<string, FieldSelectionValue>;
export type FieldSelector = '*' | string[] | FieldSelectionMap;

export interface TableSelectQuery {
  fields?: FieldSelector;
  recordIds?: string[];
  primitivePolicy?: PrimitivePolicy;
  getterModes?: Record<string, GetterModeSelection>;
  view?: string;
}

export interface LoadedAttachment extends AirtableAttachment {
  ext: string | null;
  content?: unknown;
  loadError?: string;
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

export interface TableSelectResult<TRecord extends AirtableRecord = AirtableRecord> {
  table: AirtableTable<TRecord>;
  records: Array<LoadedRecordModel<TRecord>>;
}

export interface MultiTableSelectQueryMap {
  [tableName: string]: TableSelectQuery;
}

export interface AirtableLoaderOptions {
  registry?: GetterRegistry;
  getterModes?: Record<string, GetterModeSelection>;
}

export type AttachmentContentLoader = (attachment: AirtableAttachment) => Promise<unknown>;

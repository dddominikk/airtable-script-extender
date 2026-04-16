export type AirtableFieldType = string;

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
  [key: string]: unknown;
}

export interface AirtableField {
  id: string;
  name: string;
  type: AirtableFieldType;
  options?: Record<string, unknown>;
}

export interface AirtableRecord {
  id: string;
  name: string;
  getCellValue(field: string | AirtableField): unknown;
  getCellValueAsString(field: string | AirtableField): string;
}

export interface AirtableQueryResult<TRecord extends AirtableRecord = AirtableRecord> {
  records: TRecord[];
}

export interface AirtableTable<TRecord extends AirtableRecord = AirtableRecord> {
  id: string;
  name: string;
  fields: AirtableField[];
  selectRecordsAsync(options?: {
    fields?: AirtableField[];
    recordIds?: string[];
    sorts?: unknown[];
    view?: string;
  }): Promise<AirtableQueryResult<TRecord>>;
}

export interface AirtableBase<TTable extends AirtableTable = AirtableTable> {
  tables: TTable[];
  getTable(name: string): TTable;
}

import type {
  AirtableBase,
  AirtableField,
  AirtableRecord,
  AirtableTable,
} from "../airtable-types.ts";
import type { PrimitiveReads } from "../record-loader/types.ts";

export interface CellGetterCheckContext {
  field: AirtableField;
  record: AirtableRecord;
  table?: AirtableTable;
  base?: AirtableBase;
}

export type CellGetterCheck = (
  context: CellGetterCheckContext,
) => boolean | Promise<boolean>;

export type CellGetterChecks = Record<string, CellGetterCheck>;

export interface GetterModeDefinition {
  all?: string[];
  any?: string[];
  none?: string[];
}

export type GetterModeMap = Record<string, GetterModeDefinition>;

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
  needs: Array<"value" | "string">;
  defaultMode: string | null;
  get(context: CellValueGetterContext): TResult | Promise<TResult>;
}

export type CellValueGetterMap = Record<string, CellValueGetter>;

export interface GetterRegistry {
  checks: CellGetterChecks;
  modes: GetterModeMap;
  getters: CellValueGetterMap;
}

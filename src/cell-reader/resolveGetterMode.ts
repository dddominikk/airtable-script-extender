import type {
  CellValueGetter,
  GetterModeDefinition,
  GetterModeMap,
  GetterModeSelection,
} from "./types.ts";

export function resolveGetterModeSelection(
  getter: CellValueGetter,
  fieldOverrides: Record<string, GetterModeSelection> | undefined,
  queryOrLoaderDefaults: Record<string, GetterModeSelection> | undefined,
  modes: GetterModeMap,
): GetterModeDefinition | null {
  const explicit =
    fieldOverrides?.[getter.key] ??
    queryOrLoaderDefaults?.[getter.key] ??
    getter.defaultMode;

  if (explicit === null) {
    return null;
  }

  if (typeof explicit === "string") {
    return modes[explicit] ?? null;
  }

  return explicit;
}

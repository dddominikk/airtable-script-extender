import { defaultGetterChecks } from "./lib/checks.ts";
import { defaultGetterModes } from "./lib/modes.ts";
import { defaultCellValueGetters } from "./lib/getters.ts";
import type { GetterRegistry } from "./types.ts";
import type { DefaultCellValueGettersOptions } from "./lib/getters.ts";

export function defaultGetterRegistry(
  options: DefaultCellValueGettersOptions = {},
): GetterRegistry {
  return {
    checks: { ...defaultGetterChecks },
    modes: { ...defaultGetterModes },
    getters: defaultCellValueGetters(options),
  };
}

export type { DefaultCellValueGettersOptions };
export { defaultGetterChecks } from "./lib/checks.ts";
export { defaultGetterModes } from "./lib/modes.ts";
export { defaultCellValueGetters } from "./lib/getters.ts";
export { evaluateGetterMode } from "./evaluateGetterMode.ts";
export { resolveGetterModeSelection } from "./resolveGetterMode.ts";
export type {
  CellGetterCheck,
  CellGetterChecks,
  CellGetterCheckContext,
  CellValueGetter,
  CellValueGetterContext,
  CellValueGetterMap,
  GetterModeDefinition,
  GetterModeMap,
  GetterModeSelection,
  GetterRegistry,
} from "./types.ts";

import type { CellGetterChecks, CellGetterCheckContext, GetterModeDefinition } from "./types.ts";

async function runNamedChecks(
  names: string[] | undefined,
  checks: CellGetterChecks,
  context: CellGetterCheckContext,
  aggregator: "every" | "some",
): Promise<boolean> {
  if (!names?.length) {
    return aggregator === "every";
  }

  const results = await Promise.all(
    names.map(async (name) => {
      const check = checks[name];
      if (typeof check !== "function") {
        return false;
      }
      return await check(context);
    }),
  );

  return aggregator === "every" ? results.every(Boolean) : results.some(Boolean);
}

export async function evaluateGetterMode(
  mode: GetterModeDefinition | null,
  checks: CellGetterChecks,
  context: CellGetterCheckContext,
): Promise<boolean> {
  if (!mode) {
    return false;
  }

  const [allPass, anyPass, nonePass] = await Promise.all([
    runNamedChecks(mode.all, checks, context, "every"),
    mode.any?.length ? runNamedChecks(mode.any, checks, context, "some") : Promise.resolve(true),
    mode.none?.length
      ? runNamedChecks(mode.none, checks, context, "some").then((result) => !result)
      : Promise.resolve(true),
  ]);

  return allPass && anyPass && nonePass;
}

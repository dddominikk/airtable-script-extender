/**
 * Safely read a value from an object using a path array like:
 * ["field", "Date", "stringValue"] or ["a", 0, "b"]
 *
 * @param {any} obj
 * @param {Array<string | number>} path
 * @returns {any}
 */
export function getByPathArray(obj, path) {
  if (obj == null) return undefined;

  let cur = obj;
  for (const key of path) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

/**
 * Parse various date-like inputs into a Date (or null).
 * Supports:
 * - Date
 * - number (timestamp ms)
 * - string (ISO / RFC / common parseable strings)
 *
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseDate(value) {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Convert a Date to a sortable "day key" in local time: YYYY-MM-DD.
 * @param {Date} d
 * @returns {string}
 */
function toLocalDayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Split an array of objects into four groups around a reference date:
 * - before: items with date < reference
 * - on:     items with date === reference (same day by default)
 * - after:  items with date > reference
 * - withoutDate: missing/invalid date
 *
 * Sorting:
 * - before/on/after are sorted by date ascending (instant ascending)
 *
 * Equality mode:
 * - "day" (default): compares by calendar day in local time
 * - "instant": compares by exact millisecond timestamp
 *
 * @template T
 * @param {T[]} items
 * @param {Array<string | number>} datePath
 * @param {Date | string | number} [referenceDate=new Date()]
 * @param {{ mode?: "day" | "instant" }} [options]
 * @returns {{ before: T[], on: T[], after: T[], withoutDate: T[] }}
 */
export function splitByDate(items, datePath, referenceDate = new Date(), options = {}) {
  const { mode = "day" } = options;

  const ref = parseDate(referenceDate);
  if (!ref) throw new Error("splitByDate: referenceDate is invalid.");

  const refMs = ref.getTime();
  const refDayKey = mode === "day" ? toLocalDayKey(ref) : null;

  /** @type {{ item: T, ms: number }[]} */
  const beforeWithMs = [];
  /** @type {{ item: T, ms: number }[]} */
  const onWithMs = [];
  /** @type {{ item: T, ms: number }[]} */
  const afterWithMs = [];
  /** @type {T[]} */
  const withoutDate = [];

  for (const item of items) {
    const raw = getByPathArray(item, datePath);
    const d = parseDate(raw);

    if (!d) {
      withoutDate.push(item);
      continue;
    }

    const ms = d.getTime();

    if (mode === "instant") {
      if (ms < refMs) beforeWithMs.push({ item, ms });
      else if (ms > refMs) afterWithMs.push({ item, ms });
      else onWithMs.push({ item, ms });
    } else {
      // mode === "day"
      const dayKey = toLocalDayKey(d);
      if (dayKey < refDayKey) beforeWithMs.push({ item, ms });
      else if (dayKey > refDayKey) afterWithMs.push({ item, ms });
      else onWithMs.push({ item, ms });
    }
  }

  // Sort all dated groups by actual instant ascending
  const asc = (a, b) => a.ms - b.ms;
  beforeWithMs.sort(asc);
  onWithMs.sort(asc);
  afterWithMs.sort(asc);

  return {
    before: beforeWithMs.map((x) => x.item),
    on: onWithMs.map((x) => x.item),
    after: afterWithMs.map((x) => x.item),
    withoutDate,
  };
}

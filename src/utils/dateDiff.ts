/**
 * Calculate date difference from a -> b.
 *
 * Default: whole days (UTC midnight normalized to avoid DST issues).
 * Optional: "months" or "years".
 *
 * Months/years modes:
 * - rounding: "floor" | "ceil" | "round" | "exact"
 *   - floor (default): full completed months/years
 *   - exact: fractional (approx using average Gregorian month/year length)
 *
 * @param {Date|string|number} a
 * @param {Date|string|number} b
 * @param {{
 *   unit?: "days" | "months" | "years",
 *   rounding?: "floor" | "ceil" | "round" | "exact",
 *   absolute?: boolean
 * }} [options]
 * @returns {number}
 */
export function dateDiff(a, b, options = {}) {
    const unit = options.unit ?? "days";
    const rounding = options.rounding ?? "floor";
    const absolute = options.absolute ?? false;

    const toDate = (value) => {
        const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
        if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${String(value)}`);
        return d;
    };

    const applyRounding = (value) => {
        switch (rounding) {
            case "ceil": return Math.ceil(value);
            case "round": return Math.round(value);
            case "exact": return value;
            case "floor":
            default: return Math.floor(value);
        }
    };

    const toUtcMidnightMs = (date) =>
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

    const da = toDate(a);
    const db = toDate(b);

    // signed direction a -> b
    const sign = db.getTime() >= da.getTime() ? 1 : -1;

    // DAYS
    if (unit === "days") {
        const days =
            (toUtcMidnightMs(db) - toUtcMidnightMs(da)) / (24 * 60 * 60 * 1000);

        // Should be an integer already, but keep safe & deterministic.
        const out = Math.trunc(days);
        return absolute ? Math.abs(out) : out;
    }

    // MONTHS / YEARS
    if (unit === "months" || unit === "years") {
        // Work in ordered direction for logic, apply sign at the end.
        const start = sign === 1 ? da : db;
        const end = sign === 1 ? db : da;

        // "full completed months" calculation
        let months =
            (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
            (end.getUTCMonth() - start.getUTCMonth());

        // If end hasn't reached start day/time within its month, subtract 1 month.
        const startDay = start.getUTCDate();
        const endDay = end.getUTCDate();

        const endBeforeStartInMonth =
            endDay < startDay ||
            (endDay === startDay &&
                (end.getUTCHours() < start.getUTCHours() ||
                    (end.getUTCHours() === start.getUTCHours() &&
                        (end.getUTCMinutes() < start.getUTCMinutes() ||
                            (end.getUTCMinutes() === start.getUTCMinutes() &&
                                (end.getUTCSeconds() < start.getUTCSeconds() ||
                                    (end.getUTCSeconds() === start.getUTCSeconds() &&
                                        end.getUTCMilliseconds() < start.getUTCMilliseconds())))))));

        if (endBeforeStartInMonth) months -= 1;

        // "exact" months/years is fractional approximation
        if (rounding === "exact") {
            const msDiff = Math.abs(end.getTime() - start.getTime());
            const days = msDiff / (24 * 60 * 60 * 1000);

            if (unit === "months") {
                const avgMonthDays = 365.2425 / 12;
                const out = (days / avgMonthDays) * sign;
                return absolute ? Math.abs(out) : out;
            }

            const out = (days / 365.2425) * sign;
            return absolute ? Math.abs(out) : out;
        }

        // integer months then convert to years if needed
        const roundedMonths = applyRounding(months);

        if (unit === "months") {
            const out = roundedMonths * sign;
            return absolute ? Math.abs(out) : out;
        }

        // years
        const years = roundedMonths / 12;
        const out = applyRounding(years) * sign;
        return absolute ? Math.abs(out) : out;
    }

    throw new Error(`Unsupported unit: ${unit}`);
}

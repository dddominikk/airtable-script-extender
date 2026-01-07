export function sortEventsByDate(events: Record<string, unknown>, datePath: string|string[], order = 'asc') {

    if (!Array.isArray(events)) return [];

    const thisOrder = { asc: 'asc', desc: 'desc' }?.[order.toLowerCase()] ?? 'asc'

    const resolvePath = (obj, path) =>
        obj === null ? undefined : (Array.isArray(path)
            ? path
            : typeof path === 'string'
                ? [path]
                : []).reduce((acc, key) => {
                    if (acc == null) return undefined;
                    return acc[key];
                }, obj);

    const direction = thisOrder === 'desc' ? -1 : 1;

    return [...events].sort((a, b) => {
        const aValue = resolvePath(a, datePath);
        const bValue = resolvePath(b, datePath);

        const aTime = aValue ? (aValue instanceof Date ? aValue : new Date(aValue)).getTime() : NaN;
        const bTime = bValue ? (bValue instanceof Date ? bValue : new Date(bValue)).getTime() : NaN;

        // Push invalid / missing dates to the end
        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;

        return (aTime - bTime) * direction;
    });
}

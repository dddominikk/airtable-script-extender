export function goToPath(obj, path: keyof obj|(keyof obj|string)[]) {
    if (obj == null) return undefined;

    const keys = Array.isArray(path)
        ? path
        : typeof path === 'string'
            ? [path]
            : [];

    return keys.reduce((acc, key) => {
        if (acc == null) return undefined;
        return acc[key];
    }, obj);
};

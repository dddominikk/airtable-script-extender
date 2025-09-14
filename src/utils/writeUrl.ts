export type UrlParamSchema = Record<string, string | number | boolean | (string | number | boolean)[]>;

export function writeUrl(path: string, params: UrlParamSchema, defaultParams?: UrlParamSchema) {

    const baseParams = Object.assign({}, defaultParams || {} );

    const mergedParams = Object.assign(baseParams, params || {});

    const filteredParams = Object.entries(mergedParams).filter(([key, value]) => !!value);

    if (filteredParams.length === 0)
        return path;

    const urlObj = new URL(path);

    filteredParams.forEach(([key, value]) =>
        urlObj.searchParams.set(key,
            Array.isArray(value)
                ? value.join(',')
                : `${value}`
        )
    );

    return urlObj.toString();
};

export type DefaultOcParams = { sort: 'id', order: 'desc', skip: 0 } as const;

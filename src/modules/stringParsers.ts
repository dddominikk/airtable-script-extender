const supportedParsers: Record<string, (s:string) => unknown|Promise<unknown>> = {
    mjs: srcCode => import(`data:application/javascript;base64,${encodeToBase64(srcCode)}`),
    json: srcCode => tryJsonParse(srcCode),
    jsonl: srcCode => srcCode.split('\n').map((line, i) => ({ data: tryJsonParse(line), lineIndex: i })),
    json64: srcCode => import(`data:application/json;base64,${encodeToBase64(srcCode)}`, { with: { type: 'json' } }),
} as const ;

function parseString(src: string, format: keyof supportedParsers ) {return supportedParsers?.[format?.toLowerCase()](src)};

function tryJsonParse (txt: string){
    if (!txt || typeof txt !== 'string')
        return new TypeError(`Expected a non-empty string`);
    else try { return JSON.parse(txt); }
    catch (e) { return new Error(e) };
};

function encodeToBase64 (txt: string) {return btoa(unescape(encodeURIComponent(txt)))};

export {parseString, tryJsonParse as parseJson, supportedParsers as supported};

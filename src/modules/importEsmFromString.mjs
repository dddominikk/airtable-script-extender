import { isBase64 } from '../utils/isBase64.mjs';

/** @type {(s: string) => unknown } */
export const importEsmFromString = (srcCode) => {

    /** 
     * if you're importing ESModules from strings, the potentioal for malformed source code is non-zero.
     * I always use the base64 format as a precaution when working with code that changed platforms.
     */
    const b64String = isBase64(srcCode) ? srcCode : btoa(unescape(encodeURIComponent(srcCode)));

    return import(`data:application/javascript;base64,${b64String}`);
    
};
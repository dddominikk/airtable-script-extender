/**
 * @arg {string} str
 * @arg {boolean} [options.maxSafety=false] Performs the slower atob() method if set to true. This is to avoid edge cases  like 'abcd' returning true and ending up malformed.
 */
export const isBase64 = (str, options = { maxSafety: false }) => {

    if (typeof str !== 'string')
        return false;

    const notBase64 = /[^A-Z0-9+\/=]/i;

    const len = str.length;

    if (!len || len % 4 !== 0 || notBase64.test(str))
        return false;


    const firstPaddingChar = str.indexOf('=');

    if (
        firstPaddingChar !== -1 &&
        firstPaddingChar !== len - 1 &&
        !(firstPaddingChar === len - 2 && str[len - 1] === '=')
    )
        return false;


    if (options.maxSafety)

        try {
            return btoa(atob(str)) === str;
        } catch {
            return false;
        };


    return true;

};
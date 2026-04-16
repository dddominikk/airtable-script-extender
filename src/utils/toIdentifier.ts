/**
 * Normalizes a file or folder name into a valid JS identifier usable with dot syntax.
 * Invalid characters are removed and the next valid character is uppercased.
 *
 * Examples:
 *   "base-loader"       → "baseLoader"
 *   "cell-reader"       → "cellReader"
 *   "airtable-types.ts" → "airtableTypesTs"
 *   "123abc"            → "_123abc"
 *   "__my--module"      → "__myModule"
 */
export function toIdentifier(name: string): string {
  let result = "";
  let capitalizeNext = false;

  for (const char of name) {
    const isValidStart = result.length === 0
      ? /[a-zA-Z_$]/.test(char)
      : /[a-zA-Z0-9_$]/.test(char);

    if (/[a-zA-Z0-9_$]/.test(char)) {
      // Valid identifier character — append, capitalizing if flagged
      result += capitalizeNext ? char.toUpperCase() : char;
      capitalizeNext = false;
    } else {
      // Invalid character — skip and capitalize the next valid one
      capitalizeNext = result.length > 0;
    }
  }

  // Prefix with _ if the result starts with a digit
  if (/^[0-9]/.test(result)) {
    result = `_${result}`;
  }

  return result;
}

/** @typedef {(AirtableRecord & {fields: object})[]} RecordQueue */

/** Recursively resolves a record update queue of any size while respecting Airtable's API caps.
 * @arg records {RecordQueue}
 * @arg table {Table}
 */
export const updateRecords = (records, table) => table.updateRecordsAsync(records.splice(-50)).then(_ => records.length && updateRecords(records, table));

/** Recursively resolves a record creation queue of any size while respecting Airtable's API caps.
 * @arg records {RecordQueue}
 * @arg table {Table}
 */
export const createRecords = (records, table) => table.createRecordsAsync(records.splice(-50)).then(_ => records.length && createRecords(records, table));
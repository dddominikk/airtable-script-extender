/** @type fullRecordSelector */
export async function selectFullRecordsAsync(root, options = {}) {
    let thisBase = this?.base ?? base;

    const { recordIds, fields: fieldsToLoad, ...rest } = options;
    const B = !!thisBase && typeof thisBase === 'object'
        ? thisBase
        : this?.base ?? new TypeError(`The base object isn't `);


    const table = root.id.startsWith('tbl')
        ? root
        : B.tables.find(t => t.id === new RegExp(String.raw`\b(?<tblId>tbl\w{14})\b`, 'i').exec(root.url)?.groups?.tblId);

    const fields = fieldsToLoad
        ? table.fields.filter(f => fieldsToLoad.some(x => [f.name, f.id].map(y => y.toLowerCase()).includes(`${x}`.toLowerCase())))
        : table.fields;

    /** @type FullRecordLoad */
    const LoadFullRecord = (R) => Object.assign(R, { fields: Object.fromEntries(fields.map(f => [f.name, R.getCellValue(f.id)])) });

    /** @type {(RQS: RecordQueryResult) => FullRecord[]} */
    const LoadAll = ({ records }) => records.map(LoadFullRecord);
    const result = await root.selectRecordsAsync({ recordIds, fields }).then(LoadAll);
    return result;
};

/**
 * @typedef {(r: AirtableRecord) => r & {fields:Record<string,any>} } FullRecordLoad
 * @typedef {ReturnType<FullRecordLoad>} FullRecord

 * @typedef {(root: Table|View, options?:Fsc ) => Promise<FullRecord[]>} fullRecordSelector
 *
 * @typedef {object} Fsc fullSelectorConfig
 * @prop {AirtableRecord['id'][]} [recordIds] Loads all records if no IDs provided.
 * @prop {(Base['tables'][number]['fields'][number]['name'|'id']|Uppercase<Base['tables'][number]['fields'][number]['name'|'id']>)[]} [fields] Loads all **root** fields if no field names and/or IDs provided.
 */

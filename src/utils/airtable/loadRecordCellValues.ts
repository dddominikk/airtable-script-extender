export function loadRecordCellValues(r: AirtableRecord, table, schema) {

    const DEFAULT_SCHEMA = {

        jsonString: {

            condition: f => (
                ['multilineText', 'richText'].includes(f.type)
                || ['formula'].includes(f.type) && f.options.result.type.match(new RegExp(`text`, 'i'))
            ) && f.name.toLowerCase().endsWith('.json'),

            process: ({ record, field }) => {
                let jsonData;
                try { jsonData = JSON.parse(record.getCellValueAsString(field.id)) }
                catch (e) { jsonData = new Error(e.message) }
                return jsonData
            }
        },

        date: {
            condition: f => ['date', 'dateTime'].includes(f.type),
            process: ({ record, field }) => new Date(record.getCellValue(field.id))
        },

        files: {
            condition: f => ['multipleAttachments'].includes(f.type),
            process: ({ record, field }) => Promise.all(
                record.getCellValue(field.id)
                    .map(fileObj => fetch(fileObj.url)
                        .then(response => fileObj.type === 'application/json' ? response.json() : response.text())
                        .then(responseData => fileObj.filename.toLowerCase().endsWith('.mjs') ? import(btoa(unescape(encodeURIComponent(responseData)))) : responseData)
                        .then(responseData => (fileObj.data = responseData, fileObj))
                    ))
        }
    }

    /**
     * @type {Record<table['fields'][number]['name'], {cellValue:unknown,stringValue:string,parentField:Field} & Record<string,unknown> >}
     */

    const field = {};
    const SCHEMA = Object.assign(DEFAULT_SCHEMA, schema !== null && typeof schema === 'object' ? schema : {})

    for (const FLD of table.fields) {

        const formats = {
            cellValue: r.getCellValue(FLD.id),
            stringValue: r.getCellValueAsString(FLD.id),
            get parentField() { return FLD },
        };

        for (const CUSTOM_FLD_TYPE in SCHEMA) {
            if (SCHEMA[CUSTOM_FLD_TYPE].condition(FLD)) {
                formats[CUSTOM_FLD_TYPE] = SCHEMA[CUSTOM_FLD_TYPE].process({ field: FLD, record: r });
                break;
            }
        };
        field[FLD.name] = formats;
    };

    return Object.assign(r, { field })
};

type AirtableRecord = {id: string, name: string} & Object;

/**
 * @arg {AirtableRecord} r
 * @arg {Table} table
 * @arg {Record<string,{condition: (F:Field) => boolean, process: (r) => unknown }>} [schema]
 */

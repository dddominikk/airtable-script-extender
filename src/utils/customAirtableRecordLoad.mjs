/**
 * @typedef CustomParser
 * @prop {string} format 'mjs', 'json', etc.
 * @prop {({record:AirtableRecord,field: Field}) => boolean} conditionsMatch
 * @prop {(cellValue: string ) => unknown} parse
 * 
 * @typedef FullRecordLoadConfig
 * @prop {AirtableRecord} record
 * @prop {Field[]} fields
 * @prop {CustomParser[]} [dataParsers]
 * @arg {FullRecordLoadConfig} ops
 */

export function customAirtableRecordLoad(ops) {

    const { record, fields, dataParsers = [] } = ops;
    const defaultParsers = [
        {
            format: 'json',
            conditionsMatch: ({ record, field }) => {

                const checks = {
                    dotJsonInFldOrRecName: [field.name, record.name].some(s => s.toLowerCase().endsWith('.json')),
                    supportedFldType: ['singleLineText', 'multilineText', 'richText', 'formula'].includes(field.type),
                    nonEmptyCell: record.getCellValueAsString(field.id)?.trim().length > 0
                };

                return !Object.values(checks).includes(false);

            },
            parse: (stringCellValue) => { try { return JSON.parse(stringCellValue) } catch (e) { return new Error(e) } }
        },
    ];

    const customFormatsDefined = dataParsers.map(p => p.format?.toLowerCase());

    const finalParsers = [dataParsers, defaultParsers.filter(p => !customFormatsDefined.includes(p.format))].flat(1);


    const fullyLoadedFields = [
        {},
        ...fields
    ].reduce((obj, F, i, self) => {

        if (!i) return obj;
        const cell = {
            value: record.getCellValue(F.name),
            valueAsString: record.getCellValueAsString(F.name)
        };

        const matchingParser = finalParsers?.find(p => p?.conditionsMatch && p?.conditionsMatch({ field: F, record }));

        /** If any extra parsing's being done, it's always done on a string.*/
        if (matchingParser)
            cell.valueAsData = matchingParser.parse(cell.valueAsString);

        obj[F.name] = cell;
        Object.defineProperty(obj, F.id, { get value() { return obj[F.name] }, writable: true, configurable: true });

        return obj;

    });

    return Object.assign(record, { fullFields: fullyLoadedFields })
};

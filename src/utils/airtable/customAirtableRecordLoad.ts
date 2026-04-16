/**
 * @typedef {{
 *   key: string,
 *   condition?: (ops: { record: AirtableRecord, field: Field }) => boolean,
 *   read: (ops: {
 *     record: AirtableRecord,
 *     field: Field,
 *     cellValue: unknown,
 *     cellValueAsString: string
 *   }) => unknown | Promise<unknown>
 * }} CellReader
 *
 * @typedef {{
 *   format: string,
 *   conditionsMatch: ({record:AirtableRecord,field: Field}) => boolean,
 *   parse: (cellValueAsString: string, ops?: { record: AirtableRecord, field: Field }) => unknown
 * }} CustomParser
 *
 * @typedef {{
 *   record: AirtableRecord,
 *   fields: Field[],
 *   dataParsers?: CustomParser[],
 *   includeCellValue?: boolean,
 *   includeCellValueAsString?: boolean,
 *   cellReaders?: CellReader[],
 * }} FullRecordLoadConfig
 */

export async function customAirtableRecordLoad(ops) {
	const {
		record,
		fields,
		dataParsers = [],
		includeCellValue = true,
		includeCellValueAsString = true,
		cellReaders = [],
	} = ops;

	const defaultParsers = [
		{
			format: "json",
			conditionsMatch: ({ record, field }) => {
				const checks = {
					dotJsonInFldOrRecName: [field.name, record.name].some((s) =>
						String(s).toLowerCase().endsWith(".json"),
					),
					supportedFldType: ["singleLineText", "multilineText", "richText", "formula"].includes(
						field.type,
					),
					nonEmptyCell:
						record.getCellValueAsString(field.id)?.trim().length > 0,
				};

				return !Object.values(checks).includes(false);
			},
			parse: (stringCellValue) => {
				try {
					return JSON.parse(stringCellValue);
				} catch (e) {
					return new Error(e instanceof Error ? e.message : String(e));
				}
			},
		},
	];

	const customFormatsDefined = dataParsers.map((p) =>
		p.format?.toLowerCase?.(),
	);

	const finalParsers = [
		...dataParsers,
		...defaultParsers.filter(
			(p) => !customFormatsDefined.includes(p.format),
		),
	];

	const fullyLoadedFields = {};

	for (const field of fields) {
		const cellValue = record.getCellValue(field.id);
		const cellValueAsString = record.getCellValueAsString(field.id);

		const cell = {
			field,
		};

		if (includeCellValue) {
			cell.value = cellValue;
		}

		if (includeCellValueAsString) {
			cell.valueAsString = cellValueAsString;
		}

		const matchingParser = finalParsers.find(
			(p) => p?.conditionsMatch?.({ field, record }),
		);

		if (matchingParser) {
			cell.valueAsData = matchingParser.parse(cellValueAsString, {
				record,
				field,
			});
		}

		for (const reader of cellReaders) {
			const matches =
				typeof reader?.condition === "function"
					? reader.condition({ record, field })
					: true;

			if (!matches || typeof reader?.read !== "function") continue;

			cell[reader.key] = await reader.read({
				record,
				field,
				cellValue,
				cellValueAsString,
			});
		}

		fullyLoadedFields[field.name] = cell;

		Object.defineProperty(fullyLoadedFields, field.id, {
			get() {
				return fullyLoadedFields[field.name];
			},
			configurable: true,
		});
	}

	return Object.assign(record, { fullFields: fullyLoadedFields });
}
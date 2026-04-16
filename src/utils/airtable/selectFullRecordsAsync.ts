import type { Table } from "airtable";

type MockField = {
	id: `fld${string}`;
	name: string;
	options?: Object;
	description?: string;
};
type Field = MockField;
type View = { id: `viw${string}`; name: string; description: string };

type FullSelectorConfig = {
	recordIds?: string[];
	fields?: (string | Uppercase<string>)[];
	includeCellValue?: boolean;
	includeCellValueAsString?: boolean;
	cellReaders?: Array<{
		key: string;
		condition?: (ops: { record: AirtableRecord; field: Field }) => boolean;
		read: (ops: {
			record: AirtableRecord;
			field: Field;
			cellValue: unknown;
			cellValueAsString: string;
		}) => unknown | Promise<unknown>;
	}>;
	dataParsers?: Array<{
		format: string;
		conditionsMatch: (ops: { record: AirtableRecord; field: Field }) => boolean;
		parse: (
			cellValueAsString: string,
			ops?: { record: AirtableRecord; field: Field },
		) => unknown;
	}>;
	useCustomAirtableRecordLoad?: boolean;
	recordModel?: (ops: {
		record: AirtableRecord;
		fields: Field[];
		loadedFieldMap: Record<string, unknown>;
		table: typeof Table;
		root: typeof Table | View;
	}) => unknown | Promise<unknown>;
};

type AirtableRecord = { id: string; name: string } & Record<string, unknown>;

async function loadCustomAirtableRecordLoad() {
	return import("../customAirtableRecordLoad.mjs");
}

/** @type {(root: Table | View, options?: FullSelectorConfig) => Promise<unknown[]>} */
export async function selectFullRecordsAsync(
	root: typeof Table | View,
	options: FullSelectorConfig = {},
) {
	const thisBase = this?.base ?? base;

	const {
		recordIds,
		fields: fieldsToLoad,
		includeCellValue = true,
		includeCellValueAsString = false,
		cellReaders = [],
		dataParsers = [],
		useCustomAirtableRecordLoad = false,
		recordModel,
	} = options;

	const B =
		!!thisBase && typeof thisBase === "object"
			? thisBase
			: (this?.base ?? new TypeError(`The base object isn't available.`));

	const table = root.id.startsWith("tbl")
		? root
		: B.tables.find(
				(t) =>
					t.id ===
					new RegExp(String.raw`\b(?<tblId>tbl\w{14})\b`, "i").exec(root.url)
						?.groups?.tblId,
			);

	const fields = fieldsToLoad
		? table.fields.filter((f) =>
				fieldsToLoad.some((x) =>
					[f.name, f.id]
						.map((y) => String(y).toLowerCase())
						.includes(String(x).toLowerCase()),
				),
			)
		: table.fields;

	const queryResult = await root.selectRecordsAsync({ recordIds, fields });

	const customLoader = useCustomAirtableRecordLoad
		? (await loadCustomAirtableRecordLoad()).customAirtableRecordLoad
		: null;

	const results = [];

	for (const record of queryResult.records) {
		let loadedFieldMap: Record<string, unknown>;

		if (customLoader) {
			const loaded = await customLoader({
				record,
				fields,
				dataParsers,
				includeCellValue,
				includeCellValueAsString,
				cellReaders,
			});

			loadedFieldMap = loaded.fullFields;
		} else {
			loadedFieldMap = Object.fromEntries(
				await Promise.all(
					fields.map(async (field) => {
						const cellValue = record.getCellValue(field.id);
						const cellValueAsString = record.getCellValueAsString(field.id);

						const payload: Record<string, unknown> = { field };

						if (includeCellValue) {
							payload.value = cellValue;
						}

						if (includeCellValueAsString) {
							payload.valueAsString = cellValueAsString;
						}

						for (const reader of cellReaders) {
							const matches =
								typeof reader?.condition === "function"
									? reader.condition({ record, field })
									: true;

							if (!matches || typeof reader?.read !== "function") continue;

							payload[reader.key] = await reader.read({
								record,
								field,
								cellValue,
								cellValueAsString,
							});
						}

						return [field.name, payload];
					}),
				),
			);
		}

		const built =
			typeof recordModel === "function"
				? await recordModel({
						record,
						fields,
						loadedFieldMap,
						table,
						root,
					})
				: Object.assign(record, {
						fields: loadedFieldMap,
					});

		results.push(built);
	}

	return results;
}

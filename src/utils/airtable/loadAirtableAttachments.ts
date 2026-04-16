import {
	getDefaultAttachmentLoadSchema,
	inferAttachmentFileType,
	type AirtableAttachment,
	type AttachmentLoadSchema,
} from "./attachmentLoadDefaults.ts";

/** @typedef {Object} LAAI */
type LAAI = {
	cellValue: AirtableAttachment[];
	schema?: AttachmentLoadSchema;
	attachmentValueKey?: string;
	fetchMethod?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	getDefaultSchema?: () => Promise<Required<AttachmentLoadSchema>> | Required<AttachmentLoadSchema>;
};

export async function loadAirtableAttachments(init: LAAI) {
	const {
		cellValue,
		fetchMethod = fetch,
		schema = {},
		attachmentValueKey = "importResult",
		getDefaultSchema = getDefaultAttachmentLoadSchema,
	} = init;

	const defaultSchema = await getDefaultSchema();

	const modules = {
		...defaultSchema.modules,
		...(schema.modules ?? {}),
	};

	const supportedFileTypes = {
		...defaultSchema.supportedFileTypes,
		...(schema.supportedFileTypes ?? {}),
	};

	const treatFilesWithoutExtensionAs =
		schema.treatFilesWithoutExtensionAs ??
		defaultSchema.treatFilesWithoutExtensionAs;

	const results = [];

	for (const attachment of cellValue ?? []) {
		const fileType = inferAttachmentFileType(
			attachment,
			treatFilesWithoutExtensionAs,
		);

		const methodName = supportedFileTypes[fileType];
		let importResult: unknown;

		if (!methodName || typeof modules[methodName] !== "function") {
			importResult = {
				error: `The "${fileType}" file type is not supported.`,
			};
		} else {
			const response = await fetchMethod(attachment.url);
			importResult = await modules[methodName]({
				attachment,
				response,
			});
		}

		results.push({
			...attachment,
			[attachmentValueKey]: importResult,
		});
	}

	return results;
}
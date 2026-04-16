type AirtableAttachment = {
	url: string;
	filename: string;
	size: number;
	type: string;
	id: string;
};

type AttachmentImporterContext = {
	attachment: AirtableAttachment;
	response: Response;
	text?: string;
};

type AttachmentImporterModule = (
	ctx: AttachmentImporterContext,
) => Promise<unknown>;

type AttachmentLoadSchema = {
	modules?: Record<string, AttachmentImporterModule>;
	supportedFileTypes?: Record<string, string>;
	treatFilesWithoutExtensionAs?: string;
};

type RuntimeModuleCache = {
	modules: Record<string, unknown>;
};

declare global {
	var __airtableScriptExtenderAttachmentModuleCache:
		| RuntimeModuleCache
		| undefined;
}

export function getAttachmentRuntimeModuleCache(): RuntimeModuleCache {
	if (!globalThis.__airtableScriptExtenderAttachmentModuleCache) {
		globalThis.__airtableScriptExtenderAttachmentModuleCache = {
			modules: Object.create(null),
		};
	}

	return globalThis.__airtableScriptExtenderAttachmentModuleCache;
}

export async function getCachedExternalModule(
	key: "typescript" | "yaml" | "jsonc-parser",
) {
	const cache = getAttachmentRuntimeModuleCache();

	if (cache.modules[key]) {
		return cache.modules[key];
	}

	const specifierMap = {
		typescript: "https://esm.sh/typescript",
		yaml: "https://esm.sh/yaml",
		"jsonc-parser": "https://esm.sh/jsonc-parser",
	} as const;

	const mod = await import(specifierMap[key]);
	cache.modules[key] = mod;
	return mod;
}

export function toJsDataUrl(jsSource: string): string {
	return `data:application/javascript;base64,${btoa(
		unescape(encodeURIComponent(jsSource)),
	)}`;
}

export function inferAttachmentFileType(
	attachment: Pick<AirtableAttachment, "filename" | "type">,
	fallback = "json",
): string {
	const filename = String(attachment.filename ?? "").toLowerCase();
	const mime = String(attachment.type ?? "").toLowerCase();

	const extMatch = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase();
	if (extMatch) return extMatch;

	if (mime.includes("yaml")) return "yaml";
	if (mime.includes("json")) return "json";
	if (mime.includes("javascript")) return "mjs";
	if (mime.includes("typescript")) return "ts";
	if (mime.includes("text")) return "txt";

	return fallback.toLowerCase();
}

export function parseJsonLines(src: string): unknown[] {
	const lines = src
		.split(/\r?\n/g)
		.map((line) => line.trim())
		.filter(Boolean);

	return lines.map((line, index) => {
		try {
			return JSON.parse(line);
		} catch (error) {
			throw new Error(
				`Failed to parse JSONL line ${index + 1}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	});
}

export function valueToEsmSource(value: unknown): string {
	const json = JSON.stringify(value, null, 2);

	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return `const value = ${json};\nexport default value;\n`;
	}

	const isIdentifier = /^[$A-Z_][0-9A-Z_$]*$/i;
	const entries = Object.entries(value as Record<string, unknown>);

	const namedExports = entries
		.filter(([key]) => isIdentifier.test(key))
		.map(([
			key,
		]) => `export const ${key} = value[${JSON.stringify(key)}];`)
		.join("\n");

	return `const value = ${json};\nexport default value;\n${namedExports}\n`;
}

export async function getDefaultAttachmentLoadSchema(): Promise<Required<AttachmentLoadSchema>> {
	const modules: Record<string, AttachmentImporterModule> = {
		async fetchJson({ response }) {
			return response.json();
		},

		async fetchRawText({ response }) {
			return response.text();
		},

		async importEsModuleFromAirtableAttachment({ response }) {
			const content = await response.text();
			return import(toJsDataUrl(content));
		},

		async transpileAndImportTypeScript({ response }) {
			const content = await response.text();
			const ts = await getCachedExternalModule("typescript");

			const js =
				typeof (ts as any).transpileModule === "function"
					? (ts as any).transpileModule(content, {
							compilerOptions: {
								target: (ts as any).ScriptTarget?.ESNext ?? "ESNext",
								module: (ts as any).ModuleKind?.ESNext ?? "ESNext",
								removeComments: true,
								esModuleInterop: true,
							},
					  }).outputText
					: (ts as any).transpile(content, {
							target: "esnext",
							module: "esnext",
							removeComments: true,
					  });

			return import(toJsDataUrl(js));
		},

		async parseJsonc({ response }) {
			const content = await response.text();
			const jsonc = await getCachedExternalModule("jsonc-parser");
			const errors: any[] = [];
			const value = (jsonc as any).parse(content, errors, {
				allowTrailingComma: true,
				disallowComments: false,
			});

			if (errors.length) {
				throw new Error(`Failed to parse JSONC: ${JSON.stringify(errors)}`);
			}

			return value;
		},

		async parseJsonl({ response }) {
			const content = await response.text();
			return parseJsonLines(content);
		},

		async parseYaml({ response }) {
			const content = await response.text();
			const yaml = await getCachedExternalModule("yaml");
			return (yaml as any).parse(content);
		},

		async parseStructuredDataAsModule({ response, attachment }) {
			const fileType = inferAttachmentFileType(attachment, "json");
			const content = await response.text();

			let parsed: unknown;

			if (fileType === "json") {
				parsed = JSON.parse(content);
			} else if (fileType === "jsonc") {
				const jsonc = await getCachedExternalModule("jsonc-parser");
				const errors: any[] = [];
				parsed = (jsonc as any).parse(content, errors, {
					allowTrailingComma: true,
					disallowComments: false,
				});
				if (errors.length) {
					throw new Error(`Failed to parse JSONC: ${JSON.stringify(errors)}`);
				}
			} else if (["yaml", "yml"].includes(fileType)) {
				const yaml = await getCachedExternalModule("yaml");
				parsed = (yaml as any).parse(content);
			} else if (["jsonl", "ndjson"].includes(fileType)) {
				parsed = parseJsonLines(content);
			} else {
				parsed = content;
			}

			return import(toJsDataUrl(valueToEsmSource(parsed)));
		},
	};

	return {
		modules,
		supportedFileTypes: {
			json: "fetchJson",
			mjs: "importEsModuleFromAirtableAttachment",
			js: "importEsModuleFromAirtableAttachment",
			ts: "transpileAndImportTypeScript",
			tsx: "transpileAndImportTypeScript",
			mts: "transpileAndImportTypeScript",
			cts: "transpileAndImportTypeScript",
			jsonc: "parseJsonc",
			jsonl: "parseJsonl",
			ndjson: "parseJsonl",
			yaml: "parseYaml",
			yml: "parseYaml",
			sql: "fetchRawText",
			txt: "fetchRawText",
		},
		treatFilesWithoutExtensionAs: "json",
	};
}

export type { AirtableAttachment, AttachmentLoadSchema, AttachmentImporterModule };
import type { AirtableAttachment } from "../../types/airtable.ts";
import type {
	AttachmentContentLoader,
	CellValueGetterMap,
	GetterRegistry,
	LoadedAttachment,
} from "./types.ts";
import { defaultGetterChecks } from "./getterChecks.ts";
import { defaultGetterModes } from "./getterModes.ts";

function parseJsonString(source: string): unknown {
	return JSON.parse(source);
}

function parseJsonLines(source: string): unknown[] {
	return source
		.split(/\r?\n/g)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line, index) => {
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

function parseCsvLine(line: string, delimiter = ","): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];
		const next = line[i + 1];

		if (char === '"') {
			if (inQuotes && next === '"') {
				current += '"';
				i += 1;
				continue;
			}

			inQuotes = !inQuotes;
			continue;
		}

		if (char === delimiter && !inQuotes) {
			result.push(current);
			current = "";
			continue;
		}

		current += char;
	}

	result.push(current);
	return result;
}

function parseCsv(source: string, delimiter = ","): Array<Record<string, string>> {
	const lines = source
		.split(/\r?\n/g)
		.map((line) => line.trim())
		.filter(Boolean);

	if (!lines.length) {
		return [];
	}

	const headers = parseCsvLine(lines[0], delimiter);

	return lines.slice(1).map((line) => {
		const values = parseCsvLine(line, delimiter);
		const row: Record<string, string> = {};

		for (let i = 0; i < headers.length; i += 1) {
			row[headers[i] ?? `column_${i}`] = values[i] ?? "";
		}

		return row;
	});
}

function toJsDataUrl(source: string): string {
	return `data:application/javascript;base64,${btoa(
		unescape(encodeURIComponent(source)),
	)}`;
}

function getAttachmentExtension(attachment: AirtableAttachment): string | null {
	const parts = String(attachment.filename ?? "").split(".");
	if (parts.length < 2) {
		return null;
	}
	return parts.at(-1)?.toLowerCase() ?? null;
}

declare global {
	var __airtableScriptExtenderModuleCache:
		| {
				modules: Record<string, unknown>;
		  }
		| undefined;
}

type ExternalModuleKey =
	| "typescript"
	| "yaml"
	| "jsonc-parser"
	| "toml";

function getRuntimeModuleCache() {
	if (!globalThis.__airtableScriptExtenderModuleCache) {
		globalThis.__airtableScriptExtenderModuleCache = {
			modules: Object.create(null),
		};
	}

	return globalThis.__airtableScriptExtenderModuleCache;
}

async function getCachedExternalModule(
	key: ExternalModuleKey,
): Promise<unknown> {
	const cache = getRuntimeModuleCache();

	if (cache.modules[key]) {
		return cache.modules[key];
	}

	const specifiers: Record<ExternalModuleKey, string> = {
		typescript: "https://esm.sh/typescript",
		yaml: "https://esm.sh/yaml",
		"jsonc-parser": "https://esm.sh/jsonc-parser",
		toml: "https://esm.sh/toml",
	};

	const mod = await import(specifiers[key]);
	cache.modules[key] = mod;
	return mod;
}

async function parseJsonc(source: string): Promise<unknown> {
	const jsonc = (await getCachedExternalModule("jsonc-parser")) as {
		parse: (
			text: string,
			errors?: unknown[],
			options?: { allowTrailingComma?: boolean; disallowComments?: boolean },
		) => unknown;
	};

	const errors: unknown[] = [];
	const value = jsonc.parse(source, errors, {
		allowTrailingComma: true,
		disallowComments: false,
	});

	if (errors.length) {
		throw new Error(`Failed to parse JSONC: ${JSON.stringify(errors)}`);
	}

	return value;
}

async function parseYaml(source: string): Promise<unknown> {
	const yaml = (await getCachedExternalModule("yaml")) as {
		parse: (text: string) => unknown;
	};

	return yaml.parse(source);
}

async function parseToml(source: string): Promise<unknown> {
	const toml = (await getCachedExternalModule("toml")) as {
		parse: (text: string) => unknown;
	};

	return toml.parse(source);
}

async function importJavaScriptModule(source: string): Promise<unknown> {
	return await import(toJsDataUrl(source));
}

async function transpileAndImportTypeScript(source: string): Promise<unknown> {
	const ts = (await getCachedExternalModule("typescript")) as {
		transpileModule?: (
			input: string,
			options?: {
				compilerOptions?: Record<string, unknown>;
			},
		) => { outputText: string };
		transpile?: (
			input: string,
			compilerOptions?: Record<string, unknown>,
		) => string;
		ScriptTarget?: Record<string, unknown>;
		ModuleKind?: Record<string, unknown>;
	};

	const js =
		typeof ts.transpileModule === "function"
			? ts.transpileModule(source, {
					compilerOptions: {
						target:
							(ts.ScriptTarget &&
								"ESNext" in ts.ScriptTarget &&
								ts.ScriptTarget.ESNext) ||
							"ESNext",
						module:
							(ts.ModuleKind &&
								"ESNext" in ts.ModuleKind &&
								ts.ModuleKind.ESNext) ||
							"ESNext",
						removeComments: true,
						esModuleInterop: true,
					},
			  }).outputText
			: typeof ts.transpile === "function"
				? ts.transpile(source, {
						target: "esnext",
						module: "esnext",
						removeComments: true,
						esModuleInterop: true,
				  })
				: source;

	return await importJavaScriptModule(js);
}

export interface DefaultAttachmentContentLoaderOptions {
	fetchMethod: typeof fetch;
}

export function buildDefaultAttachmentContentLoader(
	options: DefaultAttachmentContentLoaderOptions,
): AttachmentContentLoader {
	const { fetchMethod } = options;

	return async function loadAttachmentContent(
		attachment: AirtableAttachment,
	): Promise<unknown> {
		const ext = getAttachmentExtension(attachment);
		const response = await fetchMethod(attachment.url);

		switch (ext) {
			case "json":
				return await response.json();

			case "jsonl":
			case "ndjson": {
				const text = await response.text();
				return parseJsonLines(text);
			}

			case "jsonc": {
				const text = await response.text();
				return await parseJsonc(text);
			}

			case "yaml":
			case "yml": {
				const text = await response.text();
				return await parseYaml(text);
			}

			case "toml": {
				const text = await response.text();
				return await parseToml(text);
			}

			case "csv": {
				const text = await response.text();
				return parseCsv(text);
			}

			case "mjs":
			case "js": {
				const text = await response.text();
				return await importJavaScriptModule(text);
			}

			case "ts":
			case "tsx":
			case "mts":
			case "cts": {
				const text = await response.text();
				return await transpileAndImportTypeScript(text);
			}

			case "txt":
			case "sql":
			case "md":
			default:
				return await response.text();
		}
	};
}

export interface DefaultGetterRegistryOptions {
	attachmentContentLoader?: AttachmentContentLoader;
}

export function defaultCellValueGetters(
	options: DefaultGetterRegistryOptions = {},
): CellValueGetterMap {
	const { attachmentContentLoader } = options;

	return {
		json: {
			key: "json",
			needs: ["string"],
			defaultMode: "jsonByFieldName",
			get: ({ reads }) => parseJsonString(reads.string ?? ""),
		},

		jsonl: {
			key: "jsonl",
			needs: ["string"],
			defaultMode: "jsonlByFieldName",
			get: ({ reads }) => parseJsonLines(reads.string ?? ""),
		},

		attachments: {
			key: "attachments",
			needs: ["value"],
			defaultMode: "attachmentsByFieldType",
			get: async ({ reads }) => {
				const attachments = Array.isArray(reads.value)
					? (reads.value as AirtableAttachment[])
					: [];

				const loaded: LoadedAttachment[] = [];

				for (const attachment of attachments) {
					const ext = getAttachmentExtension(attachment);
					const entry: LoadedAttachment = { ...attachment, ext };

					if (attachmentContentLoader) {
						try {
							entry.content = await attachmentContentLoader(attachment);
						} catch (error) {
							entry.loadError =
								error instanceof Error ? error.message : String(error);
						}
					}

					loaded.push(entry);
				}

				return loaded;
			},
		},
	};
}

export function defaultGetterRegistry(
	options: DefaultGetterRegistryOptions = {},
): GetterRegistry {
	return {
		checks: { ...defaultGetterChecks },
		modes: { ...defaultGetterModes },
		getters: defaultCellValueGetters(options),
	};
}
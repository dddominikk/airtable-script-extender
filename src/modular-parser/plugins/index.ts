import { jsonParser as parseJson } from "./json-parser/jsonParser.ts";

import { DataParser } from "../DataParser.ts";

export const jsonParser = new DataParser(parseJson, {
	name: "jsonParser",
	supports: {
		extensions: ["json"],
		mimeTypes: ["application/json", "text/json"],
	},
});

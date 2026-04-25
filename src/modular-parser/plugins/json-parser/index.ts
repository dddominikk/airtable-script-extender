export default {
	parser: jsonParser,
	supports: {
		extensions: ["json"],
		mimeTypes: ["application/json", "text/json"],
	},
};

function jsonParser(raw: string) {
	return JSON.parse(raw);
}
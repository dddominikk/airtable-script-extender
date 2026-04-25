export default {
	parser: function jsonParser(raw: string) {
		return JSON.parse(raw);
	},
	supports: {
		extensions: ["json"],
		mimeTypes: ["application/json", "text/json"],
	},
};

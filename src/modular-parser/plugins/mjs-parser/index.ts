export default {
	parser: async (content: string) =>
		import(
			`data:application/javascript;base64,${btoa(unescape(encodeURIComponent(content)))}`
		),
	supports: {
		extensions: ["mjs"],
		mimeTypes: ["text/javascript"],
	},
};

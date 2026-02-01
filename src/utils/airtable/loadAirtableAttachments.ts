/**
 * @typedef {Object} LAAI loadAirtableAttachments initialization object.
 * @prop {{url:string,filename:string,size:number,type:string,id:string}[]} LAAI.cellValue The cell value of an Airtable multipleAttachments field.
 * @prop {{supportedFileTypes?:Record<string,string>,modules?:Record<string,Function>}} [LAAI.schema] An object containing file importing modules and a list of supported file types paired with the name of their importing module.
 * @prop {(...args) => Promise<unknown>} LAAI.fetchMethod
 */

export async function loadAirtableAttachments(/**@type LAAI*/init) {

    const { cellValue, fetchMethod, attachmentValueKey = 'importResult' } = init;

    const DefaultSchema = {

        modules: {
            fetchJson: ({ response }) => response.json(),
            importEsModuleFromAirtableAttachment: ({ response }) => response.text()
                .then(content => import(`data:application/javascript;base64,${btoa(unescape(encodeURIComponent(content)))}`)),
            fetchRawText({ response }) => response.text()
        },

        supportedFileTypes: {
            json: 'fetchJson',
            mjs: 'importEsModuleFromAirtableAttachment',
            sql: 'fetchRawText',
            txt: 'fetchRawText'
        },

        TreatFilesWithoutExtensionAs: 'json'
    };

    const results = [];

    this.schema = init?.schema || {};

    const modules = Object.assign(DefaultSchema.modules, this.schema?.modules || {});
    const supportedFileTypes = Object.assign(DefaultSchema.supportedFileTypes, this.schema?.supportedFileTypes || {});

    for (const obj of cellValue) {

        let importResult
        const fileNameNodes = obj.filename.split('.');

        const fileType = (fileNameNodes.length > 1 ? fileNameNodes?.['at'](-1) : DefaultSchema.TreatFilesWithoutExtensionAs)?.toLowerCase();

        const methodName = supportedFileTypes[fileType];

        if (!methodName)
            importResult = { error: `The "${fileType}" file type is not supported.` }

        else {
            const response = await fetchMethod(obj.url);
            importResult = await modules[methodName]({ response });
        }

        // console.warn({ obj, importResult, fileType, methodName })

        results.push(Object.assign(obj, { [attachmentValueKey]: importResult }))

    };

    return results;


};

/**
// example
const test = await loadAirtableAttachments({
    cellValue: r.fields.cachedFiles.value,
    // partially overwwrites default methods
    schema: {
        modules: {
            returnTopLevelObjectKeys: ({ response }) => response.json().then(data => ({ dataKeys: Reflect.ownKeys(data) }))
        },
        supportedFileTypes: {
            json: 'returnTopLevelObjectKeys'
        }
    },
    fetchMethod: remoteFetchAsync
})

*/

const {fetch: fetchMethod} = await import('https://esm.sh/node-fetch-native@1.6.7?standalone&dev');
const { XMLParser } = await import('https://esm.sh/fast-xml-parser@4.3.2');

const validate = (pageNumber, fetchMethod) => validateXboxWireXmlFeedPage.call({ FastXml: new XMLParser }, pageNumber, fetchMethod);

export {
    findLastValidXboxWireXmlFeedPageViaBinarySearch as findLastFeedPage,
    validate as validateFeedPage,
};

async function findLastValidXboxWireXmlFeedPageViaBinarySearch({ minPage = 1, maxPage, validatePage = validate, fetchMethod }) {

    let left = minPage;
    let right = maxPage;
    let lastValid = null;
    const logs = new Array;

    while (left <= right) {

        const NextMedianToCheck = Math.floor((left + right) / 2);
        const medianCheck = await validatePage(NextMedianToCheck, fetchMethod);
        const { isValid, xmlItems, pageNumber } = medianCheck;

        const newLog = {
            NextMedianToCheck,
            medianCheck,
            isValid,
            xmlItems,
            pageNumber,
            lastValid,
            range: { minPage, maxPage }
        }

        if (isValid) {
            lastValid = NextMedianToCheck;
            left = NextMedianToCheck + 1; // Search right half
            newLog.UpdatingIndex = 'left';
            newLog.left = left;
            newLog.right = right;
            logs.push(newLog)

        } else {
            right = NextMedianToCheck - 1; // Search left half
            newLog.UpdatingIndex = 'right'
            newLog.right = right;
            newLog.left = left;
            logs.push(newLog)
        }

    };

    let cache = {};
    let flatCache;

    // console.debug({ logs, left, right, lastValid, minPage, maxPage })
    if (Array.isArray(logs) && logs.length) {
        cache = Object.fromEntries(
            logs?.map(o => (o?.isValid && Array.isArray(o?.xmlItems)) ? [o?.pageNumber.toString(), o?.xmlItems] : []).filter(x => x.length)
        );
    }

    flatCache = Object.values(cache).flat(1);

    return { logs, cache, flatCache, lastValid };

};

async function validateXboxWireXmlFeedPage(pageNumber = 1, fetchMethod, endpoint = '') {

    const append = typeof pageNumber === 'number' && pageNumber > 1 ? `?paged=${pageNumber}` : '';

    if (!Reflect.has(this, 'FastXml'))
        Reflect.set(this, 'FastXml', new XMLParser);

    const HOST = `https://news.xbox.com/en-us${`${endpoint}`.trim().length ? `/${endpoint}` : ''}/feed/atom`;

    const ResolvedUrl = [HOST, append].join('/')

    const [ok, res, clone] = await fetchMethod(ResolvedUrl)
        .then(response => [response.ok, response, response.clone()]);

    const txt = await clone['text']();
    const parseTxtAsXml = this.FastXml.parse(txt);
    const xmlFeed = parseTxtAsXml?.feed
    const xmlItems = xmlFeed?.entry;
    const hasXmlItems = xmlItems?.length > 0;

    const obj = {
        isValid: hasXmlItems,
        ok,
        clone: res?.['clone'](),
        res,
        pageNumber: pageNumber === 0 ? 1 : pageNumber
    };

    if (obj.isValid)
        Object.defineProperties(obj, {
            xmlItems: { value: xmlItems, enumerable: true, configurable: true, writable: true },
            xmlString: { value: txt, configurable: true }
        });

    return obj;

};


/**
* @example importing and using this file from an Airtable scripting extension, while overriding the node-fetch-native import
```
const complexGhImport = await import(`https://esm.sh/gh/dddominikk/airtable-script-extender@d0e508b/tests/xw.mjs`)
const complexTestRun = await complexGhImport.findLastFeedPage({ minPage: 1900, maxPage: 3000, fetchMethod: remoteFetchAsync });
console.info({ complexGhImport, complexTestRun })
```
*/

/**
 * 
 * @example 
 ```js
    async function findXboxWireFeedFinalPage({ minPage = 1, maxPage = 3000, fetchMethod = checkEnvironmentForFetch() }) {
        const xboxWireFeedLimits = await fetchMethod({ minPage, maxPage, fetchMethod: remoteFetchAsync });
        return xboxWireFeedLimits;
    }
```
*/

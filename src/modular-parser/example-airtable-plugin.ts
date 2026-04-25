/**
 * example-airtable-plugin.ts
 *
 * Airtable Scripting Extension plugin.
 *
 * loadAndParseAttachments(options)
 * ─────────────────────────────────
 * Selects records from a table, then for every attachment field listed in
 * `attachmentFieldNameOrIds`:
 *   1. Inspects each attachment's MIME type.
 *   2. Finds a matching DataParser from the provided `plugins` list.
 *   3. Fetches the attachment URL via the provided PathResolver.
 *   4. Parses the response body.
 *   5. Assigns the result to record[parsedFileProp].
 *
 * Because this runs inside Airtable's scripting sandbox the imports below are
 * illustrative — paste the DataParser / PathResolver source inline or load
 * them via a bundled script block.
 */

import { DataParser }   from './DataParser.js';
import { PathResolver } from './PathResolver.js';
import { parseRaw }     from './parseRawData.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of an Airtable attachment cell value entry. */
interface AirtableAttachment {
  id:       string;
  url:      string;
  filename: string;
  type:     string;   // MIME type, e.g. "application/json"
  size:     number;
}

interface EnrichedRecord {
  id:          string;
  name:        string;
  attFields:   Record<string, AirtableAttachment[]>;
  [key: string]: unknown;   // holds `parsedFileProp` dynamically
}

/** Minimal interface for an Airtable Base, enough for getTable. */
interface AirtableTable {
  selectRecordsAsync: (opts: { fields: string[] }) => Promise<{
    records: Array<{
      id:           string;
      name:         string;
      getCellValue: (fieldName: string) => AirtableAttachment[] | null;
    }>;
  }>;
}

interface LoadOptions {
  /** Table name or table ID. */
  tableNameOrId: string;

  /**
   * Names or IDs of attachment-type fields to scan.
   * Every attachment whose MIME type is supported by at least one plugin
   * will be fetched and parsed.
   */
  attachmentFieldNameOrIds: string[];

  /**
   * The property key written on the result object to hold all parsed values,
   * keyed by attachment ID.
   *
   * e.g. "parsedData"  →  record.parsedData = { attId: parsedValue, … }
   */
  parsedFileProp: string;

  /**
   * Subset of record IDs to load.  When omitted every record is processed.
   */
  recordIds?: string[];

  /**
   * DataParser instances that should be considered.
   * Defaults to every parser currently registered in `DataParser.s` when omitted,
   * so you can rely on the registry alone without passing plugins explicitly.
   * Pass an explicit subset to restrict which parsers are active for this call.
   */
  plugins?: DataParser[];

  /**
   * PathResolver used to fetch attachment URLs.
   * Defaults to a plain `fetch` resolver when not provided.
   */
  resolver?: PathResolver<Response>;

  /**
   * Airtable base instance to use.
   * Defaults to the `base` global injected by the scripting runtime.
   * Pass an explicit value when calling from outside the default scripting
   * context, e.g. from a different extension or a test harness.
   */
  base?: { getTable: (nameOrId: string) => AirtableTable };
}

// ---------------------------------------------------------------------------
// Default resolver
// ---------------------------------------------------------------------------

const defaultResolver = new PathResolver<Response>(
  'airtableFetch',
  (url) => fetch(url)
);

// ---------------------------------------------------------------------------
// loadAndParseAttachments
// ---------------------------------------------------------------------------

export async function loadAndParseAttachments(
  options: LoadOptions
): Promise<EnrichedRecord[]> {
  const {
    tableNameOrId,
    attachmentFieldNameOrIds,
    parsedFileProp,
    recordIds,
    plugins = Object.values(DataParser.s),
    resolver = defaultResolver,
    base: baseOverride,
  } = options;

  // -- 1. Airtable API surface --
  // Prefer the explicitly passed `base`; fall back to the scripting runtime global.
  // @ts-ignore — `base` global is injected by the Airtable scripting runtime
  const activeBase: { getTable: (nameOrId: string) => AirtableTable } = baseOverride ?? base;
  const table = activeBase.getTable(tableNameOrId);

  // `record.name` in the scripting API always reflects the primary field value
  // regardless of which fields are selected — no need to include it here.
  const query = await table.selectRecordsAsync({
    fields: attachmentFieldNameOrIds,
  });

  // -- 2. Filter to requested record IDs when provided --
  const records = recordIds
    ? query.records.filter((r: { id: string }) => recordIds.includes(r.id))
    : query.records;

  // -- 3. Build an enriched result per record --
  const enriched: EnrichedRecord[] = await Promise.all(
    records.map(async (record) => {
      const attFields: Record<string, AirtableAttachment[]> = {};
      const parsed:    Record<string, unknown>               = {};

      for (const fieldName of attachmentFieldNameOrIds) {
        const attachments: AirtableAttachment[] =
          record.getCellValue(fieldName) ?? [];

        attFields[fieldName] = attachments;

        // -- 4. For each attachment, try to find a matching parser --
        await Promise.all(
          attachments.map(async (att) => {
            const parser = plugins.find((p) => p.supportsMimeType(att.type));
            if (!parser) return;   // unsupported type — skip silently

            try {
              const { raw: response } = await resolver.resolvePath({ path: att.url });

              if (!response.ok) {
                console.warn(
                  `[loadAndParseAttachments] HTTP ${response.status} for attachment`,
                  att.filename
                );
                return;
              }

              const bodyText = await response.text();
              parsed[att.id] = await parseRaw(bodyText, parser.parser);
            } catch (err) {
              console.error(
                `[loadAndParseAttachments] Failed to parse attachment`,
                att.filename,
                err
              );
            }
          })
        );
      }

      return {
        id:           record.id,
        name:         record.name,
        attFields,
        [parsedFileProp]: parsed,
      };
    })
  );

  return enriched;
}

// ---------------------------------------------------------------------------
// Usage inside an Airtable scripting block
// ---------------------------------------------------------------------------

/*

  // --- Define plugins ---

  import { esmParser }        from './example-esm-plugin.js';
  import { jsonParser }       from './plugins/json-parser.js';   // your own
  import { markdownParser }   from './plugins/markdown-parser.js';

  const plugins = [esmParser, jsonParser, markdownParser];

  // --- Run ---

  const results = await loadAndParseAttachments({
    tableNameOrId:            'tblAbcDef123',
    attachmentFieldNameOrIds: ['Script', 'Config', 'Docs'],
    parsedFileProp:           'parsed',
    recordIds:                ['recXxx', 'recYyy'],  // optional
    plugins,
  });

  for (const record of results) {
    console.log(record.id, record.name);
    console.log('parsed data:', record.parsed);
    // e.g. record.parsed = {
    //   'attAbc': <live ESM module namespace>,
    //   'attDef': { ...parsed JSON... },
    // }
  }

*/

// ---------------------------------------------------------------------------
// Minimal example — JSON plugin defined inline
// ---------------------------------------------------------------------------

/*

  const jsonParser = new DataParser(
    async (raw) => JSON.parse(raw as string),
    {
      name: 'jsonParser',
      supports: {
        extensions: ['json'],
        mimeTypes:  ['application/json', 'text/json'],
      },
    }
  );

  const results = await loadAndParseAttachments({
    tableNameOrId:            'tblMyTable',
    attachmentFieldNameOrIds: ['Config File'],
    parsedFileProp:           'config',
    plugins: [jsonParser],
  });

  output.inspect(results[0].config);

*/
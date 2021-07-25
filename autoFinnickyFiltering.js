/*
Written in response to user Dave_Sheppard over on the 
Airtable community forums. The original, with context,
including an explanation for the eccentric code style:
https://community.airtable.com/t/setting-a-checkbox-for-the-last-record-inserted-only-via-scripting/41912/6
*/   

// statement 1
let table = base.getTable('Table 1'),

    q = await table.selectRecordsAsync(
        {
            sorts: [{ field: 'ID', direction: 'desc' }],
            fields: ['Done']
        }),

    latestRecord = q.recordIds[0],
    cache = []

// statement 2
q.records.forEach(
    rec => {
        let mark = rec.id === latestRecord ? true : null
        if (rec.getCellValue('Done') !== mark) {
            cache.push({ id: rec.id, fields: { Done: mark } })
        }
    })

// optional prepwork for bonus UX points, let's label it D like "Dominik"
let neededUpdating = [...cache = cache.filter(obj => obj !== null)]

// statement 3
while (cache.length > 0) {
    await table.updateRecordsAsync(cache.splice(0, 50))
}

// Here about that bonus? Promise.resolve(D)
output.markdown(`
|                      |                             |
|:---------------------|----------------------------:|  
|     Records checked  |  ${q.recordIds.length}      |
|     Records updated  |  ${neededUpdating.length}   |
`)

/*
A tweaked version with a more verbose (and entirely redundant)
logging mechanic meant to run as an Airtable automation - with
screenshots illustrating basic functionality and setup:
https://community.airtable.com/t/setting-a-checkbox-for-the-last-record-inserted-only-via-scripting/41912/8
*/
let table = base.getTable('Table 1'),

    q = await table.selectRecordsAsync(
        {
            sorts: [{ field: 'ID', direction: 'desc' }],
            fields: ['Done']
        }),

    latestRecord = q.recordIds[0],
    cache = []

q.records.forEach(
    rec => {
        let mark = rec.id === latestRecord ? true : null
        if (rec.getCellValue('Done') !== mark) {
            cache.push({ id: rec.id, fields: { Done: mark } })
        }
    })

let neededUpdating = [...cache = cache.filter(obj => obj !== null)]
// statement 3
while (cache.length > 0) {
    await table.updateRecordsAsync(cache.splice(0, 50))
}

neededUpdating.forEach(object => {
    object["Action taken"] = object.done
        ? 'I determined this to be the newest record but it wasn\'t marked as such. No need to get up, I handled it.'
        : 'This wasn\'t the latest record but it had a checkmark. Well, Checkbox field privileges #canceled, mister... object, whatever.'
})

console.log(` ${neededUpdating.length}/${q.recordIds.length} records updated`)
console.table(neededUpdating)

/**
 * Finnicky Filtering
 * Copyright © 2021 Attention Spa, vl. Dominik Bošnjak

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */





// statement 1
input.config({
    title: `Finicky Filtering`,
    description: `# Copyright © 2021 Attention Spa, vl. Dominik Bošnjak
Using a Checkbox and Autonumber fields:  
- mark the latest record in a given table  
- unmark any other  

From there, you'll be able to set up a View filter showing only a single, newest record in your table. 
This has been a popular request among many newcomers to Airtable for years, and the timing was right to do something about it, so here you go.

# Settings
`,
    items: [
        input.config.table('tableLabel', {
            label: '',
            description: 'Table to target',
        }),
        input.config.field('autonumberField', {
            parentTable: 'tableLabel',
            label: '',
            description: 'The name of its autonumber field'
        }),
        input.config.field('checkboxField', {
            parentTable: 'tableLabel',
            label: '',
            description: 'The name of its Checkbox field'
        })
    ]
})
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

// let's call this an optional statement D that will net us some extra UX points
let neededUpdating = [...cache = cache.filter(obj => obj !== null)]

// statement 3
while (cache.length > 0) {
    await table.updateRecordsAsync(cache.splice(0, 50))
}

// what was that about some bonus? Ah, right: Promise.resolve(D)
output.markdown(`
|                      |                             |
|:---------------------|----------------------------:|  
|     Records checked  |  ${q.recordIds.length}      |
|     Records updated  |  ${neededUpdating.length}   |
`)



const reportUpdate = (strings, ...notStrings) => {

    // clones that we can cut up into little pieces 
    // without angering the gods of immutability
    let strs = [...strings],
        vars = [...notStrings],
        rendering = ''

    while (strs.length + vars.length) {
        if (strs.length) {
            rendering += strs.splice(0, 1)
            if (vars.length) {
                rendering += vars.splice(0, 1)
            }
        }
    }
    output.markdown(rendering)
}


// look at this syntax and tell me js isn't the best language ever
neededUpdating
    .forEach(
        (obj, i, self) => {
           self.length 
               && 
            i === 0 
               ? reportUpdate`# ${self.length} Issue${self.length!==1?'s':''} resolved` 
               : null
            reportUpdate`- record ${obj.id} was${obj.fields.Done ? 'n\'t' : ''} marked as the latest record.`
        }
    ) 

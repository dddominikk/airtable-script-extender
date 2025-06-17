const 
    config = input.config({
    title: 'Deduper',description:'',items:[
        input.config.table('table',{
            label:'',description:'Select a table to dedupe:'
            })
        ]
    }),

    table = base.getTable(config.table.name),

    query = await table.selectRecordsAsync(),

    uniques = [...new Set(query.records.flatMap(rec => rec.name))],

    countDupes = query.records.length - uniques.length,

    //a simple deduper that deletes duplicate records based on their primary field values
    dedupe = async (toDelete = []) => {

        if(countDupes){
            uniques.forEach(record => {
            
            const filtered = query.records.filter(rec => rec.name === record)

            if(filtered.length > 1) toDelete.push(filtered.slice(1))
            })

            let deleteQueue = toDelete.flat(1) //for bonus functional programming points, this var can actually be declared as a const as well, I'm just paranoid

            while(deleteQueue.length) await table.deleteRecordsAsync(deleteQueue.splice(0,50))

            console.log(`${countDupes} duplicate${countDupes!==1?'s':''} deleted.`)
        }

        else console.log('No duplicates found.')

    }


await dedupe()

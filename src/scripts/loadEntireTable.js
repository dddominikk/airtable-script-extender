// A simple script that fully loads a table of your choosing.
// Meaning performance is going to suck if you try to run it on a 50k-record behemoth.
// But hey - it's convenient.

const 
    Log = {
    s: [],
    latest: function(){
        return this.s[this.s.length-1]
        },
    show: () => output.inspect(Log.s)
    }

const 
    
    allTables = base.tables.flatMap(table => table.name),
    
    menu = async function (buttons,label) {

        return await input.buttonsAsync(label??'', allTables)
            .then(click => Log.s.push(click))
    },

    tableNameMenu = () => menu(allTables,'Choose a table to load:'),

    allFields = (table) => base.getTable(table).fields.flatMap(field=>field.name)

class Frame {

    constructor(config){

        return config.render().then(()=>{
            output.clear()
            config.callback()
        })
    }
}

await new Frame({
    render: tableNameMenu,
    callback: () => Log.s.push(allFields(Log.latest()))          
})

const 
    
    q = await base.getTable(Log.s[0])
    .selectRecordsAsync(),
    
    Result = []

q.records.forEach(record => {

    const object = {}
    
    Log.s[1].forEach(
        field => object[field] = record.getCellValue(field)
        )

    Result.push(object)

})

output.inspect(Result)

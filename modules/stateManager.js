let
    ram = {loaded:[]},
    tables = [
        { name: 'Vars', ref: 'mods' },
        { name: 'Templates', ref: 'temps' },
        { name: 'Lexicon', ref: 'lex' }
    ]

// using function expressions instead of declarations
// here to control execution stack / avoid hoisting
const
    logModule = recId => ram.loaded.push(recId),
    getRec = (recId,field) => ram.mods.getRecord(recId).getCellValue(field??'code'),
    load = recId => logModule(recId) && eval(getRec(recId)),
    test = recId => eval(getRec(recId,'test')),
    doItAll = (recId,keyword) => eval(`${keyword??'var'} ${getRec(recId,'label')} = ${getRec(recId)}`),
    boot = async table => ram[table.ref] = await base.getTable(table.name).selectRecordsAsync()

while (tables.length) await boot(tables.pop())

const
    pick = load('recuwBcYgLXGcTHJt'), // returns a random array element
    timeout = load('reccg7afq8tVeqbGL') // Airtable's Monaco implementation claims setTimeout doesn't exist (same for btoa() and a couple of other commands). It does, but I can't stand the squiggly red lines anyway and I don't want my code to be filled with @ts-ignores, either.
    
let sessionArticle = load('recwC6wOES9UxEn4f'), // surface realization handler
    article = load('recJBht0NickAVk5k') // proxy
    

    
output.markdown(`# ${ram.loaded.length} modules loaded`)
output.inspect(ram)


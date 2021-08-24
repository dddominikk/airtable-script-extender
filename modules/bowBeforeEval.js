async function boot(){
    const
        table = base.getTable(cursor.activeTableId),
        buttonField = input.recordAsync('', table),
        f5 = output.clear(),
        idle = (ms) => new Promise(resolve => setTimeout(resolve, ms || 500, 'timeout')),
        raceWinner = await Promise.race([buttonField,idle()])

output.inspect(raceWinner)
if(raceWinner!=='timeout'){
    this.winnerMapped = {...raceWinner};
    table?.fields.flatMap(f=>f.name).forEach(
        fieldName=> winnerMapped[fieldName] = raceWinner.getCellValue(fieldName))
    console.warn(this.winnerMapped)
}
return raceWinner
}

/* usage: 
Copy the above code into any table description (the example here assumes that table is called ‘Classes’
Create a new script
Link the script to a button field from any table in a given base
Drop this one-liner inside the Scripting app/block:

await eval(`(${base.getTable('Classes')?.description})`)()

*/

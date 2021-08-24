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
    
    this.outcome = {table,record:this.winnerMapped,promiseRaceWinner:raceWinner}
    
    console.warn(this.winnerMapped)
    }
    return this.outcome||raceWinner
}

/* usage: 

    1) Copy the above code into any table description (the example here assumes that table is called ‘Classes’)
    2) Create a new script
    3) Link the script to at least one button field from any table in your base
        3.1) Optionally, link it to multiple tables
    4) Drop this one-liner inside the Scripting app/block:
        
        ```
            await eval(`(${base.getTable('Classes')?.description})`)()
        ```

Naturally, assign that line to a variable ('let someVar = await eval(...')
if you want to be able to handle the data/continue coding from there.

The code will fully load whatever calling record you activate via the Button field.
*/

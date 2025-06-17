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

    /*  This script will fully load whatever calling record's activated via the Button field.
        Here's the script:
     */
            await eval(`(${base.getTable('Classes')?.description})`)()
   
    /*  That code up there? That goes into a table description field of your choice.

    usage: 
    1) Copy the above code into any table description (the example here assumes that table is called ‘Classes’)
    2) Create a new script
    3a) Link the script to at least one button field from any table in your base
        3b) Optionally, link it to multiple tables
        4b) Naturally, assign the above line to a variable ('let someVar = await eval(...') 
            if you want to be able to handle the data/continue coding from there.
    5) Have fun
    6) Never-ever use eval irl
    7) Let me know if you can think of a way to replicate this functionality with a
       new Function constructor but without directly referencing the custom input class
       from the scripting block.
*/

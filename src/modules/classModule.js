class Module {

	static Cache = () => {
    
		const 
			table = base.getTable('Modules'),
			fields = table.fields.map( f => f.name )
		
		return this.Cache = table
      .selectRecordsAsync( {fields} ) // an empty selectRecordsAsync call is showing up as deprecated as of this week, hence the greedy fields map
			.then(data => this.Cache = data) // static class prop memoization
	}

    constructor(module){
        base.getTable('Modules')
		  .createRecordAsync({
  	  		Name: module.name,
	  	  	Code: module.toString()
        })
    }
}

// Usage: top part goes into a table description,
// the following into the Scripting block:

const Module = eval(`(${base.tables[0].description})`)

// Do the expensive table load once:
await module.Cache()

// Which overwrites the hacky getter function and turns it into a prop accessible via the dot notation

//alternative implementation using the newer ES6 syntax
class module {
  static loaded = [];
  constructor(namespace){
    this.namespace = namespace
    if(typeof namespace === 'string') {

      let m = modules.find(module => module
        .getCellValueAsString('Namespace') === this.namespace) //this would be the 'label' field from stateManager.js
       
      
      // Using eval over a new Function call here for performance reasons, 
      // BUT you should never go for eval if you're working with raw data.
      // To illustrate, the database this was originally written in contained
      // third-normal-form data. And even then the actual evaluation doesn't
      // touch that data directly; it usually just reads it or maybe processes its clones.
      
      let Eval = m 
        ? eval(`(${m.getCellValue('forEval')})`) 
      
        : 'console.error(`No module named ${namespace} found.`)'

      module.loaded.push({name:namespace,code:Eval,type:typeof Eval})
      return module[namespace] = Eval
    }
  }
  static listAll = () => console.log(module.loaded)
}


//usage example, assuming there's a module named 'Random' in the connected database

const Random = new module('Random')

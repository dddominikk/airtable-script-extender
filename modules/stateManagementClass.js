//alternative implementation using the newer ES6 syntax
class module {
  static loaded = [];
  constructor(namespace){
    this.namespace = namespace
    if(typeof namespace === 'string') {

      let m = modules.find(module => module
        .getCellValueAsString('Namespace') === this.namespace)
       
      let Eval = m 
        ? eval(`(${m.getCellValue('forEval')})`)
        : 'console.error(`No module named ${namespace} found.`)'

      module.loaded.push({name:namespace,code:Eval,type:typeof Eval})
      return module[namespace] = Eval
    }
  }
  static listAll = () => console.log(module.loaded)
}

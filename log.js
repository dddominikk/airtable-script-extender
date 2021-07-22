const log = (...args) => {
    let argsArray = [...args]
    let o = {}
    if(argsArray.length===1||argsArray.length%2!==0){o.log=args}
    else if(argsArray.length>1&&argsArray.length%2===0){
    while(argsArray.length>0){

        o[argsArray.splice(0,1)] = argsArray.splice(0,1)
       
    }}
    o.timestamp = Date.now()
    o.runtime = L.length === 0 ? 0 : Date.now() - L[0].timestamp
    o.logNumber = L.length

    if(o.runtime>1000){
    let revidedMinutes, revidedSeconds  
    if(o.runtime>60000){
        revidedMinutes = new Date (o.runtime).getMinutes()
        revidedSeconds = new Date(o.runtime).getSeconds()
        }
    else{
        revidedMinutes = 0
        revidedSeconds = o.runtime/1000
        }
    o.runtime = `${revidedMinutes<10?0:''}${revidedMinutes}:${revidedSeconds<10?0:''}${revidedSeconds}`
        }
    else if(o.runtime<1000){o.runtime=`00:00:${o.runtime<10 ? 00 : o.runtime < 100 ? 0 :''}${o.runtime}`}

    
    L.push(o)
}

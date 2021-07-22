async function reviewLogs (n,m,t){
  
    if(n===undefined){n=L.length-1}
    if(m===undefined){m=console.log}
    if(t===undefined){t = false}
    
    let o = input.buttonsAsync('',['table','inspect','markdown','text','log','debug','info','warn','error',t?'object':'string'])
    let i = input.buttonsAsync('',['<','❌','>'])
    
    try{
        output.markdown(`### Item ${n+1}/${L.length}`)

        if(t){m(L[n].t())}
        else if(!t){m(L[n])}
        
        }
        catch(Error){
            if(Error){
                log('Error','The target output is not a string.')
                }}
    finally{
        let wot = await Promise.race([i,o])

    let x,y,z

    switch(wot){

        case '<':
        if(L[n-1]===undefined){x = L.length-1}
        else{x = n-1}
        y = m
        break
        
        case '>':
        if(L[n+1]===undefined){x = 0}
        else{x = n+1}
        y = m
        break

        case '❌':
        z = n
        x = n-1
        y = m
        break

        case 'string':
        x = n
        y = m
        t = true
        break

        case 'object':
        x = n
        y = m
        t = false
        break

        case 'table':
        case 'inspect':
        case 'markdown':
        case 'text':
        y = output[wot]
        x=n
        break

        case 'log':
        case 'warn':
        case 'info':
        case 'error':
        case 'dir':
        case 'debug':
        y = console[wot]
        x = n
        break
        }

        if(z){L = L.filter((v,i)=>i!==n)}

            output.clear()
            await reviewLogs(x,y,t)
    }}

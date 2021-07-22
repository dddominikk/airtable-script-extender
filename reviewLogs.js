async function reviewLogs (n,mode,toString){
  
    if(n===undefined){n=L.length-1}
    if(mode===undefined){mode=console.log}
    if(toString===undefined){toString = false}
    
    let o = input.buttonsAsync('',['table','inspect','markdown','text','log','debug','info','warn','error',toString?'toObject()':'toString()'])
    let i = input.buttonsAsync('',['<','❌','>'])
    
    try{
        output.markdown(`### Item ${n+1}/${L.length}`)

        if(toString){mode(L[n].toString())}
        else if(!toString){mode(L[n])}
        
        }
        catch(Error){
            if(Error){
                log('Error','The target output is not a string.')
                }}
    finally{
        let wot = await Promise.race([i,o])

    let newN,newM,xAny

    switch(wot){

        case '<':
        if(L[n-1]===undefined){newN = L.length-1}
        else{newN = n-1}
        newM = mode
        break
        
        case '>':
        if(L[n+1]===undefined){newN = 0}
        else{newN = n+1}
        newM = mode
        break

        case '❌':
        xAny = n
        newN = n-1
        newM = mode
        break

        case 'toString()':
        newN = n
        newM = mode
        toString = true
        break

        case 'toObject()':
        newN = n
        newM = mode
        toString = false
        break

        case 'table':
        case 'inspect':
        case 'markdown':
        case 'text':
        newM = output[wot]
        newN=n
        break

        case 'log':
        case 'warn':
        case 'info':
        case 'error':
        case 'dir':
        case 'debug':
        newM = console[wot]
        newN = n
        break
        }

        if(xAny){L = L.filter((v,i)=>i!==n)}

            output.clear()
            await reviewLogs(newN,newM,toString)
    }}

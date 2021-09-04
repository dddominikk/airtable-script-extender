/*
    Just a silly thing I made will self-doubting 
    way more sillier things I've made. Anyway, 
    this is one piece of source code that arguably
    benefits from an absolute disregard for any 
    sort of formatting or sanity. It should be
    pretty obvious what it does but if you're
    confused, just copy-paste it to the scripting
    block and enjoy your three seconds of novelty, np.
*/

let arr = ['🙃', '🙂' , '🧡','🤍','🖤','💙','🤍','💝','❤','💛','💚']


async function chill (ms){
    let s = Date.now(), i = 0, x;
    while (!x) { i < 1e7 ? i++ : x = Date.now() - s > ms ? true : false }
    if (x) { return 'done' }
}

// const toThree = x => x%1 === 0 ? 'log' : x%2 === 0 ? 'info' : x%3 === 0 ? 'warn' : x%4 === 0 ? 'error' : 'dir'

while(true){
chill(1000)
output.clear()
// let ms = new Date(Date.now()).getMilliseconds()
let 
    ss = new Date(Date.now()).getSeconds(),
    mm = new Date(Date.now()).getMinutes(),
    hh = new Date(Date.now()).getHours(),
    n =0

const addzero = x => x < 10 ? `0${x}` : `${x}`
let 
    temp = ``.repeat(2+Math.random()*arr.length*2),
    ae = [temp.split('')],
    d = '❤',
    p

switch(true){
    case (ss%2===0):
        n = ss+1
        break
        
    case (d==='❤'):
        d = ''
        break;
    
    case (d===''):
        d = '❤'
        break

    default:
        p = (p===true?false:true)
        d = d.repeat(~~(Math.random()*100))
}


output.markdown(`# ${addzero(hh)}:${addzero(mm)}:${addzero(ss)}`)
output.markdown(`${'#'.repeat(~~(Math.random()*5))} ${'&nbsp;'.repeat(~~(Math.random()*75))}${d}`)
// output.markdown(`${'#'.repeat(~~(Math.random()*5))} ${'&nbsp;'.repeat(~~(Math.random()*255))}${ p === false ? '' : arr[~~(Math.random()*arr.length)]}`)
output.markdown(`  






 ${'&nbsp;'.repeat(~~(Math.random()*555))}



${'#'.repeat(~~(Math.random()*5))}

${'#'.repeat(~~(Math.random()*5))}  ${p === true ? '' : arr[~~(Math.random()*arr.length)]}${'&nbsp;'.repeat(~~(Math.random()*654))} 





 ${'&nbsp;'.repeat(~~(Math.random()*5555))}




 ${'&nbsp;'.repeat(~~(Math.random()*4555))}





`)
}

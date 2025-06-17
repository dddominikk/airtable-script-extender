/* 
  A proof-of-concept demonstrating how you can timeout
  user input from inside the Scripting app environment.
*/
class Frame {
        
    static menuBar = () => input.buttonsAsync('',['Option 1','Option 2'])

    // @ts-ignore
    static idle = (ms) => new Promise(resolve => setTimeout(resolve, ms || 2000, 'timeout'))

    render = async () => {
        
        const 
            buttons = Frame.menuBar(),
            interval = Frame.idle(),
            raceWinner = await Promise.race([buttons,interval])
        
        output.markdown(`# ${raceWinner}`)
    }
}

// usage: await (new Frame).render()

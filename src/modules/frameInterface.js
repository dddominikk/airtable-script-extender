class Frame {

    static Log = []

    static get lastClick (){
        return Frame.Log[Frame.Log.length-1]?.click
    }

    static get done(){
        return Frame.lastClick === 'Exit'
    }

    renderLog(){


        if(Frame.Log.length<11) {
            this.visible = Frame.Log

        }

        else {
            this.visible = Frame.Log.slice(Frame.Log.length-10)
        }

        output.table(this.visible)
        
    }

    constructor(request){

        this.header = request.header || `Frame ${Frame.Log.length + 1}`
        this.node = request.node || base
        this.buttons = Object.keys(this.node)
        this.buttonsLabel = request.buttonsLabel || ''
        this.log = request.showLog
        
        this.render = async function(Input){

            output.clear()
            
            output.markdown(`# ${this.header}`)
            
            Input = input.buttonsAsync(this.buttonsLabel, [...this.buttons,'Exit'])
                .then(click => Frame.Log.push({click:click,node:this.node.name}))
            
            if(this.log) this.renderLog()
            
            output.text(`Last click: ${Frame.lastClick||''}`)
            
            await Input
        }
        
    }
}
const requestFrame = async (config) => new Frame({
    node: config?.node || base,
    showLog: config?.showLog || true
    }).render()



while(!Frame.done){
    let lastClick = Frame.lastClick
    let rf = requestFrame(lastClick)
    await rf
    
}

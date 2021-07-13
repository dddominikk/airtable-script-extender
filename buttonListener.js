
const devMode = true
const devLog = x => devMode ? void(console.log(x)) : null
const ordersTable = config.feed

const menu0 = async => input.buttonsAsync('',['Menu'])
const menu1 = async => input.buttonsAsync('',['Back'])

var currentLocation = 'mainMenu'

let screen = {

        Back:{

         location: 'mainMenu',
          constructor(){
              return menu0()
          },
    },
        Menu:{
            location: 'level1',
            constructor(){
                return menu1()
            }
        }
};

const requestNextMenu = async x => await screen[x].constructor()

let r = await screen.Back.constructor()

while(true){
    output.clear()
    r = await requestNextMenu(r)

}

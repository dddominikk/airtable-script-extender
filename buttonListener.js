const menu0 = () => input.buttonsAsync('',['Menu'])
const menu1 = () => input.buttonsAsync('',['Back'])

const screen = {

        Back:{
         name: 'mainMenu',
         buttons: async => input.buttonsAsync('',['Menu']),
         constructor(){
              return menu0()
          }
    },
        Menu:{
          name: 'menu1',
          buttons: async => input.buttonsAsync('',['Menu']),
          constructor(){
                return menu1()
            }
        }
}

const nameLocation = x => screen[x].name

console.log(nameLocation('Back'))
let s = await screen.Back.constructor()

while(true){
    output.clear()
    console.log(nameLocation(s))
    s = await requestNextMenu(s)
}

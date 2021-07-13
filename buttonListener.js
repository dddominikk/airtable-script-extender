const menu0 = async => input.buttonsAsync('',['Menu'])
const menu1 = async => input.buttonsAsync('',['Back'])


let screen = {

        Back:{

         name: 'mainMenu',
         buttons: async => input.buttonsAsync('',['Menu']),
          constructor(){
              return menu0()
          },
    },
        Menu:{
            name: 'menu1',
            buttons: async => input.buttonsAsync('',['Menu']),
            constructor(){
                return menu1()
            }
        }
};

const requestNextMenu = async x => await screen[x].constructor()
const nameLocation = x => screen[x].name

console.log(nameLocation('Back'))
let s = await screen.Back.constructor()

while(true){


    output.clear()
    console.log(nameLocation(s))
    s = await requestNextMenu(s)

}

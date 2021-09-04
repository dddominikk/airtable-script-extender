class Die {
    static roster = []
    static sides = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"]
        .map((entry) => {
            return {
                label: entry,
                value: Math.random()
                      .toString(36)
                      .replace(/[^a-z]+/g, '')
                      .substr(0, 5),
                variant: 'secondary',
                hits: 0
            }
        })

    static wait = function (ms, s) {
        const start = Date.now()
        let i = 0, x
        while (!x) { i < 1e7 ? i++ : x = Date.now() - start > ms }
    }

    static Rolls(dieCount) {

    function prepFrames(n, dieCount) {
    let placeholder = []

    while (placeholder.length !== dieCount ?? 5) {
        placeholder.push(new Die)
    }

    let queue = [], markdownQueue = []
    const newFrame = () => []
    for(let i = 0; i < n; i++) {

        let 
            tempArray = newFrame(),
            mrkdwnArr = newFrame(),
            string = '# ' 

            placeholder.forEach(
                die => tempArray.push(die.roll()))
            queue.push(tempArray)
            tempArray.forEach(
                die => mrkdwnArr.push(die.label))
            markdownQueue.push(string += mrkdwnArr.join(''))
        }
        return [queue, markdownQueue]
    }

    let
        prepWork = prepFrames(100, dieCount ?? 5),
        headers = prepWork[1].reverse()

    for (let i = 0; i < 25; i++) {
        output.clear()
        output.markdown(headers[i])
        Die.wait(25)
        }
    }

    roll(){ const pick = this.die.label
            [~~(Math.random() * this.die.label.length)]
            pick.hits++
            return pick // the numerical value of the roll is easy to read with parseInt
        }

    constructor() {
        this.die = {
            label: Die.sides,
            variant: 'secondary',
            value: Die.roster.length + 1,
            hits: 0
        }
        Die.roster.push(this.die)
    }
}

/* demo/usage:

        let dc = 5 // die count
        while (true) {
            Die.Rolls(dc)
            await input
                .buttonsAsync('', ['➖', '🔄', '➕',])
                .then(click=>{
                    if (click === '➕') ++dc
                    else if (click === '➖') 
                    // ensuring there's always at least one
                        dc > 1 ? dc-- : dc
                        })
                    }
*/

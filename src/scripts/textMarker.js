/**
 * Text Marker
 * Copyright © 2021 Attention Spa, vl. Dominik Bošnjak
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const config = input.config({
    title: 'Text Marker', 
    description: `A demonstration showcasing one particular method of creating complex user interfaces with the built-in input.buttonAsync method.`,
    items: [
        input.config.select('mode', {
            label: ' ',
            description: 'Mode',
            options: [
                { label: 'demo', value: 'demo' },
                { label: 'manual', value: 'manual' },
            ]
        })
    ]
});

const Input = (config.mode === 'demo')
    ? 'This is a demo sentence; one written for illustrative purposes.'
    : await input.textAsync('Write a few words:');

output.clear();

class Frame {

    // tokenizes the input sentence, turning words and punctuation into
    // React buttons that we can pass to the built-in input.buttonAsync method
    static Tokens = Input.split(/\b/)
        .filter(token => token !== ' ')
        .map((word, i) => {
            return { label: word, value: i, variant: 'default', totalClicks: 0 }
        });


    // we don't actually need to keep track of *all* past clicks in
    // a session for this specific example to work, but you'll probably
    // want to have a logger handy if you were to build something more complex

    static Log = [];
    get lastClick() { return Frame.Log[Frame.Log.length - 1] };

    // respond to user clicks by changing the button styling

    buttonChange() {
        const last = Frame.Tokens.find(t => t.value === this.lastClick);
        //@ts-ignore;
        last.totalClicks++;

        switch (last?.variant) {
            case 'default':
                last.variant = 'primary';
                break;

            case 'primary':
                last.variant = 'danger';
                break;

            case 'danger':
                last.variant = 'secondary';
                break;

            case 'secondary':
                last.variant = 'default';
        }
    };

    static rerender = async () => Promise.race([
        input.buttonsAsync('', [
            { label: 'Done', value: '$$done' },
            { label: 'Reset', value: '$$reset' }
        ]),

        new Frame
    ])
        .then(click => {

            // this doesn't happen often but here's an example of valid
            // usage of the switch method with no break statements:

            switch (click) {

                case '$$done':
                    return output.table(Frame.Tokens);

                case '$$reset':
                    Frame.Tokens.forEach(t => t.variant = 'default');

                default:
                    output.clear();
                    return Frame.rerender();
            }
        });

    constructor() {
        //@ts-ignore
        return input.buttonsAsync('', Frame.Tokens)
            .then(click => Frame.Log.push(click))
            .then(() => this.buttonChange())
    }
};

await Frame.rerender();


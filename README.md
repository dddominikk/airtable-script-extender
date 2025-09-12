# Airtable Script Extender

JavaScript is amazing. 

Project management less so. 

Airtable's Scripting app allows us to cut through a lot of red tape in the form of npm-prefixed CLI commands.

This repo aimed to make the most that luxury. It's also what led to the creation of [Modulartable/Mable](https://app.gumroad.com/attentionspa), some year or so later.

Every airtable-script-extender module was transitioned to the main Mable repository and continues being supported. And besides Finnicky Filtering, each and every one has been signifivantly improved since that time. Some of those -- and others -- are also available [via Airtable Universe](https://www.airtable.com/universe/expyg6OoteY3U8LM4/modular-scripting). But the main repository is the aforementioned Gumroad release.

Same licensing and condition applies. contPing me if you need/want to use any particular component (file) commercially and I'll give you a written permission within a day or two.
Some of the included scripts might already be licensed individually.
You should be able to recognize them, but just to be sure: if a source code starts with a sizable block of text telling you it's a
free software license - it's a free software license, I promise.

## Scripts
Key traits:
- single-purpose
- zero problems (totally not jinxing it)

#### [finnickyFiltering.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/finnickyFiltering.js)

- written on request, a straightforward method of keeping tabs on the latest record in a given table
- regardless of how you define "latest"

#### [textMarker.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/textMarker.js)

- a prototypal approach to building out more complex, nuanced user interfaces 
- relative to what you're used to due to the constraints of the Scripting app environment

#### [loadEntireTable.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/loadEntireTable.js)

- fully load all records in a given table
- the result includes mapped out cell values covering every field from the source

#### [fieldCleaner.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/fieldCleaner.js)

#### [simpleDeduper.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/simpleDeduper.js)

## Tests

### Dynamic CDN Import

Example run, environment-agnostic:
```js
const test = await import('https://cdn.jsdelivr.net/gh/dddominikk/airtable-script-extender@c5c1a55ffacec12d1111bf0ddd6cff64516ccb4c/tests/dynamicCdnImport.mjs');
console.log(test);
```
<details>
  <summary>Result</summary>
  
  ![dynamicCdnImportExampleResult](https://github.com/user-attachments/assets/a44f851e-eb03-4af0-9dfb-10dd7c56fa8a)
</details>


## [Modules](https://github.com/dddominikk/airtable-script-extender/tree/main/modules)

- multifaceted
- may not be entirely polished in all respects
- mostly proof-of-concepts meant to either:
  - intrigue newcomers to ECMAScript
  - broaden the horizons of moderately proficient coders
  - entertain veterans, hopefully including those who inspired most of these stunts

#### [bowBeforeEval.js](https://github.com/dddominikk/airtable-script-extender/blob/main/modules/bowBeforeEval.js)
  - a proof-of-concept illustrating a technique for implementing
    - branching logic
    - potentially including user input
    - asynchronously
    - before reaching line two of the Scripting block
    - how's that for a strong start?

#### [moduleImporter.js](https://github.com/dddominikk/airtable-script-extender/edit/main/modules/stateManager.js)
  - the original module system prototype, or thereabout
  - meant to be used alongside stateChange.js
#### [modulES6.js](https://github.com/dddominikk/airtable-script-extender/blob/main/modules/modulES6.js)
  - an alternative module system leveraging Java-like class syntax from ES&
#### [stateChange.js](https://github.com/dddominikk/airtable-script-extender/blob/main/modules/stateChange.js)
  - needs to be in a separate Scripting block as you can't have a single one of those responding to repeated input from the (Air)table itself while it's still running
    - well, with this little trick you can
    - got the idea while lurking at community.airtable.com
    - someone specifically described this workaround for using table buttons as actual Scripting app controls, and not just initializers
    - the promise/thenable-heavy implementation seemed fitting for such a straightforward functionality
    - in reality, I might have actually overthunk this one, code review in progress
   
 ## Misc
  - playful experiments mostly intended as distractions
  - their purpose doesn's stretch far beyond making you go "aww, neat" or "ooh, really?"
#### [classDie.js](https://github.com/dddominikk/airtable-script-extender/blob/main/misc/classDie.js)
  - fully animated digital die factory using the ES6 class syntax
#### [funOClock.js](https://github.com/dddominikk/airtable-script-extender/blob/main/misc/funOClock.js)
  - a charmingly unpredictable digital clock
     
## Background
The Block SDK has crashed and burned my Windows installation one too many times.

Also, I'm lazy, so I'm finding ways to extend the Scripting block from inside the app itself. This feeling of entitlement has so far culminated in me writing a mini application state manager (React in React, basically, sans the 'wtfisthis' effect) that I'm gradually releasing into the public domain as time permits.

# Airtable Script Extender

JavaScript is amazing. 

Project management less so. 

Airtable's Scripting app allows us to cut through a lot of red tape in the form of npm-prefixed CLI commands.

This repo aims to make the most that luxury.

Ping me if you need or want to use any particular component (file) commercially and I'll give you a written permission within a day or two.
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

- a prototype demonstrating one particular approach to building out more complex and nuanced user interfaces within the constraints of the Scripting app environment

#### [loadEntireTable.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/loadEntireTable.js)

- fully load all records in a given table
- the result includes mapped out cell values covering every field from the source

#### [fieldCleaner.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/fieldCleaner.js)

#### [simpleDeduper.js](https://github.com/dddominikk/airtable-script-extender/blob/main/scripts/simpleDeduper.js)

## Modules

- multifaceted
- may not be entirely polished in all respects
- mostly proof-of-concepts meant to either:
  - intrigue newcomers to ECMAScript
  - broaden the horizons of moderately proficient coders
  - entertain veterans, hopefully including those who inspired most of these stunts

- stateChange.js needs to be in a separate Scripting block as you can't have a single one of those responding to repeated input from the (Air)table itself while it's still running
    - well, with [this little trick](https://github.com/dddominikk/airtable-script-extender/blob/main/modules/stateChange.js) you can
    - got the idea while lurking at community.airtable.com, someone specifically described this workaround for using table buttons as actual Scripting app controls, and not just      initializers
    - the promise/thenable-heavy implementation seemed fitting for such a straightforward functionality
    - in reality, I might have actually overthunk this one, code review in progress
     

## Background

The Block SDK has crashed and burned my Windows installation one too many times.

Also, I'm lazy, so I'm finding ways to extend the Scripting block from inside the app itself. This feeling of entitlement has so far culminated in me writing a mini application state manager (React in React, basically, sans the 'wtfisthis' effect) that I'm gradually releasing into the public domain as time permits.

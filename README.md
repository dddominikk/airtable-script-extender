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
- zero problems (so far 😅)

## Modules

- multifaceted
- multiproblems

- stateChange.js needs to be in a separate Scripting block as you can't have a single one of those responding to repeated input from the (Air)table itself while it's still running
    - well, with this little trick you can, got the idea from someone over at community.airtable.com

## Background

The Block SDK has crashed and burned my Windows installation one too many times.

Also, I'm lazy, so I'm finding ways to extend the Scripting block from inside the app itself. This feeling of entitlement has so far culminated in me writing a mini application state manager (React in React, basically, sans the 'wtfisthis' effect) that I'm gradually releasing into the public domain as time permits.

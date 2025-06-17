/**
 * Splits an array into multiple smaller arrays of n-length.
 * @arg Arr {any[]|string}
 * @arg targetSize {number} Splicing size.
 * @returns {[][]} The final subset will have a shorter length if Arr's length isn't divisible by targetSize.*/

export const arrayToChunks = (Arr, targetSize) => [[[]], ...Arr]
    .reduce((set, next) =>
        ((set.at(-1)?.length < targetSize) ? set.at(-1).push(next) : set.push([next])) && set);
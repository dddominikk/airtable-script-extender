/**
 * Splits an array into multiple smaller arrays of n-length.
 * The final subset will have a shorter length if Arr's length isn't divisible by targetSize.
 */

export function arrayToChunks(Arr: any[] | string, targetSize: number): typeof Arr[][] {
  return [[[]], ...Arr].reduce((set, next) =>
    ((set.at(-1)?.length < targetSize) ? set.at(-1).push(next) : set.push([next])) && set)
};

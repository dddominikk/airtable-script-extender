const { splitArrayWithDelay } = await import('https://cdn.jsdelivr.net/gh/dddominikk/airtable-script-extender/src/utils/esmCdnTest.mjs');

console.log(`Beginning dynamic CDN GH import test using JSDelivr.`);

const mockupArray = Array(5e3).fill(null);
const start = performance.now();
const result = await splitArrayWithDelay(mockupArray);
const end = performance.now();

console.log({
  runtime: end - start,
  result,
  message: `Split a ${mockupArray.length}-item array with a delay.`
});

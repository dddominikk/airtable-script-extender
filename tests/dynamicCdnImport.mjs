const { splitArrayWithDelay } = await import('https://cdn.jsdelivr.net/gh/dddominikk/airtable-script-extender/src/utils/esmCdnTest.mjs');

const mockupArray = Array(5e3).fill(null);

const testLog = [
  {
    message: `Beginning dynamic CDN GH import test using JSDelivr.`,
    timestamp: performance.now(),
    data: {mockupArray}
  }
];

const result = await splitArrayWithDelay(mockupArray);

testLog.push({
  message: `Split a ${mockupArray.length}-item array with a delay.`,
  ...(()=>{
    const timestamp = performance.now();
    const runtime = timestamp - testLog[0].timestamp;
    return {timestamp, runtime};
  })(),
  data: {result},
});

export default {testLog, splitArrayWithDelay, meta: import.meta};

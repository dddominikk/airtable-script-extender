const { splitArrayWithDelay } = await import('https://cdn.jsdelivr.net/gh/dddominikk/airtable-script-extender/src/utils/esmCdnTest.mjs');

const mockupArray = Array(5e3).fill(null);

const testLog = [
  {
    message: `Beginning dynamic CDN GH import test using JSDelivr.`,
    timestamp: performance.now(),
    data: {
      mockupArray
    }
  }
];

const result = await splitArrayWithDelay(mockupArray);

testLog.push({
  timestamp: performance.now(),
  get runtime(){
    
    const value = this.timestamp - testLog[0].timestamp;
    
    Object.defineProperty(this, 'runtime', { value, enumerable: true });
    
    return value;

  },
  data: {
    result
  },
  message: `Split a ${mockupArray.length}-item array with a delay.` 
});


export default {testLog, splitArrayWithDelay, meta: import.meta};

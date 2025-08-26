/** Just testing to confirm JSDelivr can serve fragmented GH packages of this sort. */
import {arrayToChunks} from './arrayToChunks.mjs';
import {wait} from './wait.mjs';

export async function splitArrayWithDelay(arr){
  const args = [arr].flat(1)
  if(args.length < 10e3)
      args.push(...Array.from({length: 10e3 - args.length }, (v,i) => Array(5).fill(Math.random())).flat(1));
  
  const halves = [];
  const midwayPoint = args.length / 2;
  const toSplit = [args.slice(0, midwayPoint), args.slice(midwayPoint) ];

    for(let i = 0; i < toSplit.length; i++){
      const obj = arrayToChunks(toSplit[i], toSplit[i].length / 5 ).map(arr=> Object.assign(arr, {chunkSetNo: i}));
      halves.push(obj);
      await wait(5000);
      continue;
    }

  return {halves, midwayPoint,arr};
};

const utils = {arrayToChunks, sleep: wait };


export default splitArrayWithDelay;


/* Fisher–Yates Shuffle
 * x = array;           i = current index; 
 * t = temp value;      y =  random index;
 * The premise: pick any unshuffled element and swap it with the current head.
 * The implementation is as banal as lazy as they get, but Math.random delivers.
 */

const shuffle = x => {
  let i = x.length, t, y
  while (0 !== i) {
    y = Math.floor(
        Math.random() * i)
        i -=   1
        t  = x[i]
      x[i] = x[y]
      x[y] =   t
  }
  return x
}

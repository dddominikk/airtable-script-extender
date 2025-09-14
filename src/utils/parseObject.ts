/** Parses all object properties, including the non-enumerable ones. */
export const parseObject = (t: Record<string, unknown>) => 
  Object.fromEntries(Reflect.ownKeys(t).map(e=>[e,Reflect.get(t,e)]));

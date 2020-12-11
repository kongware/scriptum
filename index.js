/*
                                                                                 
                               _|              _|                                
   _|_|_|    _|_|_|  _|  _|_|      _|_|_|    _|_|_|_|  _|    _|  _|_|_|  _|_|    
 _|_|      _|        _|_|      _|  _|    _|    _|      _|    _|  _|    _|    _|  
     _|_|  _|        _|        _|  _|    _|    _|      _|    _|  _|    _|    _|  
 _|_|_|      _|_|_|  _|        _|  _|_|_|        _|_|    _|_|_|  _|    _|    _|  
                                   _|                                            
                                   _|                                            
*/


/******************************************************************************
*******************************************************************************
*******************************[ DEPENDENCIES ]********************************
*******************************************************************************
******************************************************************************/


const crypto = require("crypto");


const fs = require("fs");


/******************************************************************************
*******************************************************************************
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const PREFIX = "scriptum_";


const TC = false; // type check


/******************************************************************************
*******************************************************************************
*****************************[ ERRORS (INTERNAL) ]*****************************
*******************************************************************************
******************************************************************************/


class ExtendableError extends Error {
  constructor(s) {
    super(s);
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
    
    else
      this.stack = (new Error(s)).stack;
  }
};


class ScriptumError extends ExtendableError {};
    

/***[ Subclasses ]************************************************************/


class HamtError extends ScriptumError {};


/******************************************************************************
*******************************************************************************
*******************************[ TYPE CHECKING ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


const FUN = PREFIX + "fun";


const OBJ = PREFIX + "obj";


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const fun = pred => f =>
  new Proxy(f, new FunProxy(pred));


const fun_ = fun(null);


const obj = o =>
  new Proxy(o, new ObjProxy());


/******************************************************************************
*************************[ IMPLEMENTATION (INTERNAL) ]*************************
******************************************************************************/


class FunProxy {
  constructor(pred) {
    this.pred = pred;
  }

  apply(f, that, args) {
    args.forEach(arg => {
      if (isUnit(arg))
        throw new TypeError("illegal argument unit type");
    });

    let p;

    if (this.pred !== null) {
      p = this.pred(...args)

      if (p === false)
        throw new TypeError("illegal argument type");
    }

    const r = f(...args);

    if (isUnit(r))
      throw new TypeError("illegal return unit type");

    else if (typeof r === "function")
      return typeof p === "function" ? fun(p) (r) : fun_(r);

    else if (typeof p === "function")
      throw new TypeError("redundant type check predicate");

    else return r;
  }

  get(f, k) {
    if (k === FUN)
      return true;

    else if (k === Symbol.toPrimitive)
      throw new TypeError("illegal type coercion");

    else return f[k];
  }
}


class ObjProxy {
  defineProperty(o, k, dtor) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }
  
  deleteProperty(o, k) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }

  get(o, k) {
    if (k === OBJ)
      return true;

    else if (k === THUNK)
      return o[k]; // allow duck typing

    switch (k) {
      case Symbol.asyncIterator:
      case Symbol.isConcatSpreadable:
      case Symbol.iterator:
      case Symbol.match:
      case Symbol.matchAll:
      case Symbol.replace:
      case Symbol.search:
      case Symbol.split:
      case Symbol.toStringTag: return o[k];
    }

    if (k === Symbol.toPrimitive)
      throw new TypeError("illegal type coercion");

    else if (!(k in o))
      throw new TypeError(`unknown property "${k}"`);

    else if (typeof o[k] === "function" && !o[k] [THUNK])
      return fun_(o[k].bind(o));

    else return o[k];
  }

  set(g, k, v) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }  
}


/******************************************************************************
*******************************************************************************
******************************[ IMPLICIT THUNK ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const lazy = f => x =>
  thunk(() => f(x));


const strict = thunk =>
  thunk && thunk[THUNK] === true
    ? thunk.valueOf()
    : thunk;


const strictRec = thunk => {
  while (thunk && thunk[THUNK] === true)
    thunk = thunk.valueOf();

  return thunk;
};


const thunk = thunk =>
  new Proxy(thunk, new ThunkProxy());


/******************************************************************************
*************************[ IMPLEMENTATION (INTERNAL) ]*************************
******************************************************************************/


class ThunkProxy {
  constructor() {
    this.memo = NULL;
  }

  apply(g, that, args) {
    if (this.memo === NULL) {
      this.memo = g();

      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo.valueOf();
    }

    return this.memo(...args);
  }

  defineProperty(g, k, dtor) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }
  
  deleteProperty(g, k) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }

  get(g, k) {
    if (k === THUNK)
      return true;

    else if (this.memo === NULL) {
      this.memo = g();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo.valueOf();
    }

    if (k === "valueOf")
      return () => this.memo

    else if (k === "toString")
      return () => this.memo.toString();

    else if (k === Symbol.isConcatSpreadable && Array.isArray(this.memo))
      return true;

    else if (k === Symbol.toStringTag)
      return Object.prototype.toString.call(this.memo).slice(8, -1);

    while (this.memo[k] && this.memo[k] [THUNK] === true)
      this.memo[k] = this.memo[k].valueOf();

    if (typeof this.memo[k] === "function" && !this.memo[k] [FUN])
      return this.memo[k].bind(this.memo);

    else return this.memo[k];
  }

  getOwnPropertyDescriptor(g, k) {
    if (this.memo === NULL) {
      this.memo = g();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo.valueOf();
    }

    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(g, k) {
    if (k === THUNK)
      return true;

    else if (this.memo === NULL) {
      this.memo = g();

      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo.valueOf();
    }

    return k in this.memo;
  }

  ownKeys(g) {
    if (this.memo === NULL) {
      this.memo = g();

      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo.valueOf();
    }

    return Object.keys(this.memo);
  }

  set(g, k, v) {
    throw new TypeError(`illegal mutation in "${k}"`);
  }  
}


/******************************************************************************
*******************************************************************************
***********************[ HASHED ARRAY MAP TRIE (HAMT) ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
**************************[ DEPENDENCIES (INTERNAL) ]**************************
******************************************************************************/


const getHamtRandomBytes = () =>
  !crypto ? _throw("missing crypto api")
    : "getRandomValues" in crypto ? crypto.getRandomValues(new Uint32Array(1)) [0]
    : "randomBytes" ? crypto.randomBytes(4).readUInt32BE()
    : _throw("unknown crypto api");


/******************************************************************************
***************************[ CONSTANTS (INTERNAL) ]****************************
******************************************************************************/


const HAMT_BITS = 5;


const HAMT_SIZE = Math.pow(2, HAMT_BITS);


const HAMT_MASK = HAMT_SIZE - 1;


const HAMT_LEAF = "Leaf";


const HAMT_BRANCH = "Branch";


const HAMT_COLLISION = "Collision";


const HAMT_EMPTY = "empty";


const HAMT_NOOP = "noop";


/******************************************************************************
***************************[ CONSTANTS (INTERNAL) ]****************************
******************************************************************************/


const hamtObjKeys = new WeakMap();


const hamtHash = k => {
  switch (typeof k) {
    case "string":
      return hamtStrHash(k);

    case "number":
      return k === 0 ? 0x42108420
        : k !== k ? 0x42108421
        : k === Infinity ? 0x42108422
        : k === -Infinity ? 0x42108423
        : (k % 1) > 0 ? hamtStrHash(k + "") // string hashes for floats
        : hamtNumHash(k);

    case "boolean":
      return k === false
        ? 0x42108424
        : 0x42108425;

    case "undefined":
      return 0x42108426;

    case "function":
    case "object":
    case "symbol": {
      if (k === null)
        return 0x42108427;

      else if (hamtObjKeys.has(k))
        return hamtObjKeys.get(k);

      else {
        const k_ = getHamtRandomBytes();

        hamtObjKeys.set(k, k_);
        return k_;
      }
    }
  }
};


const hamtStrHash = s => {
  let r = 0x811c9dc5;

  for (let i = 0, l = s.length; i < l; i++) {
    r ^= s.charCodeAt(i);
    r = Math.imul(r, 0x1000193);
  }

  return r >>> 0;
};


const hamtNumHash = n => {
  n = (n + 0x7ed55d16) + (n << 12);
  n = (n ^ 0xc761c23c) ^ (n >> 19);
  n = (n + 0x165667b1) + (n << 5);
  n = (n + 0xd3a2646c) ^ (n << 9);
  n = (n + 0xfd7046c5) + (n << 3);
  n = (n ^ 0xb55a4f09) ^ (n >> 16);
  return n >>> 0;
};


/******************************************************************************
************************[ POPULATION COUNT (INTERNAL) ]************************
******************************************************************************/


const hamtPopCount = (x, n) => {
  if (n !== undefined)
    x &= (1 << n) - 1;

  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >> 24;
};


/******************************************************************************
**************************[ CONSTRUCTORS (INTERNAL) ]**************************
******************************************************************************/


const hamtBranch = (mask = 0, children = []) => ({
  type: HAMT_BRANCH,
  mask,
  children
});


const hamtCollision = (hash, children) => ({
  type: HAMT_COLLISION,
  hash,
  children
});


const hamtLeaf = (hash, k, v) => ({
  type: HAMT_LEAF,
  hash,
  k,
  v
});


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const hamtDel = (hamt, props, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new HamtError("invalid HAMT");

  const hamt_ = hamtDelNode(hamt, hamtHash(k), k, 0);

  switch (hamt_) {
    case HAMT_NOOP:
      return hamt;

    case HAMT_EMPTY:
      return Object.assign(
        hamtBranch(), props);

    default:
      return Object.assign(
        hamt_, props);
  }
};


const Hamt = props =>
  Object.assign(hamtBranch(), props);


const Hamt_ = hamtBranch();


const hamtGet = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new HamtError("invalid HAMT");

  let node = hamt,
    depth = -1;

  while (true) {
    ++depth;

    switch (node.type) {
      case HAMT_BRANCH: {
        const frag = (hamtHash(k) >>> (HAMT_BITS * depth)) & HAMT_MASK,
          mask = 1 << frag;

        if (node.mask & mask) {
          node = node.children[hamtPopCount(node.mask, frag)];
          continue;
        }

        else
          return undefined;
      }

      case HAMT_COLLISION: {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.k === k)
            return child.v;
        }

        return undefined;
      }

      case HAMT_LEAF: {
        return node.k === k
          ? node.v
          : undefined;
      }
    }
  }
};


const hamtHas = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new HamtError("invalid HAMT");

  let node = hamt,
    depth = -1;

  while (true) {
    ++depth;

    switch (node.type) {
      case HAMT_BRANCH: {
        const frag = (hamtHash(k) >>> (HAMT_BITS * depth)) & HAMT_MASK,
          mask = 1 << frag;

        if (node.mask & mask) {
          node = node.children[hamtPopCount(node.mask, frag)];
          continue;
        }

        else
          return false;
      }

      case HAMT_COLLISION: {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.k === k)
            return true;
        }

        return false;
      }

      case HAMT_LEAF: {
        return node.k === k
          ? true
          : false;
      }
    }
  }
};


const hamtSet = (hamt, props1, props2, k, v) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new HamtError("invalid HAMT");

  const [hamt_, existing] =
    hamtSetNode(hamt, hamtHash(k), k, v, false, 0);
  
  return Object.assign(
    hamt_, existing ? props1 : props2);
};


const hamtUpd = (hamt, props, k, f) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new HamtError("invalid HAMT");

  return Object.assign(
    hamtSetNode(
      hamt, hamtHash(k), k, f(hamtGet(hamt, k)), false, 0) [0], props);
};


/******************************************************************************
*************************[ IMPLEMENTATION (INTERNAL) ]*************************
******************************************************************************/


const hamtSetNode = (node, hash, k, v, existing, depth) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      if (node.hash === hash) {
        if (node.k === k)
          return [hamtLeaf(hash, k, v), true];

        else
          return [
            hamtCollision(
              hash,
              [node, hamtLeaf(hash, k, v)]), existing];
      }

      else {
        const frag_ = (node.hash >>> (HAMT_BITS * depth)) & HAMT_MASK;

        if (frag_ === frag)
          return [
            hamtBranch(
              mask, [
                hamtSetNode(
                  hamtSetNode(Hamt_, hash, k, v, existing, depth + 1) [0],
                node.hash,
                node.k,
                node.v,
                existing,
                depth + 1) [0]]), existing];

        else {
          const mask_ = 1 << frag_,
            children = frag_ < frag
              ? [node, hamtLeaf(hash, k, v)]
              : [hamtLeaf(hash, k, v), node];

          return [hamtBranch(mask | mask_, children), existing];
        }
      }
    }

    case HAMT_BRANCH: {
      const i = hamtPopCount(node.mask, frag),
        children = node.children;

      if (node.mask & mask) {
        const child = children[i],
          children_ = Array.from(children);

        const r = hamtSetNode(
          child, hash, k, v, existing, depth + 1);
        
        children_[i] = r[0];
        existing = r[1];
        
        return [
          hamtBranch(node.mask, children_), existing];
      }

      else {
        const children_ = Array.from(children);
        children_.splice(i, 0, hamtLeaf(hash, k, v));
        
        return [
          hamtBranch(node.mask | mask, children_), existing];
      }
    }

    case HAMT_COLLISION: {
      for (let i = 0, len = node.children.length; i < len; ++i) {
        if (node.children[i].k === k) {
          const children = Array.from(node.children);
          children[i] = hamtLeaf(hash, k, v);
          
          return [
            hamtCollision(node.hash, children), existing];
        }
      }

      return [
        hamtCollision(
          node.hash,
          node.children.concat(hamtLeaf(hash, k, v))), existing];
    }
  }
};


const hamtDelNode = (node, hash, k, depth) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF:
      return node.k === k ? HAMT_EMPTY : HAMT_NOOP;

    case HAMT_BRANCH: {
      if (node.mask & mask) {
        const i = hamtPopCount(node.mask, frag),
          node_ = hamtDelNode(node.children[i], hash, k, depth + 1);

        if (node_ === HAMT_EMPTY) {
          const mask_ = node.mask & ~mask;

          if (mask_ === 0)
            return HAMT_EMPTY;
          
          else {
            const children = Array.from(node.children);
            children.splice(i, 1);
            return hamtBranch(mask_, children);
          }
        }

        else if (node_ === HAMT_NOOP)
          return HAMT_NOOP;

        else {
          const children = Array.from(node.children);
          children[i] = node_;
          return hamtBranch(node.mask, children);
        }
      }

      else
        return HAMT_NOOP;
    }

    case HAMT_COLLISION: {
      if (node.hash === hash) {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.k === k) {
            const children = Array.from(node.children);
            children.splice(i, 1);
            return hamtCollision(node.hash, children);
          }
        }
      }

      return HAMT_NOOP;
    }
  }
};


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************[ PRODUCT TYPE ]********************************
******************************************************************************/


const record = (type, o) => (
  o[Symbol.toStringTag] = type.name || type,
  TC ? obj(o) : o);


/******************************************************************************
********************************[ UNION TYPE ]*********************************
******************************************************************************/


const union = type => (tag, o) => (
  o[Symbol.toStringTag] = type,
  o.tag = tag.name || tag,
  TC ? obj(o) : o);


/***[ Elimination Rule ]******************************************************/


const match = (tx, o) => o[tx.tag] (tx);


/******************************************************************************
****************************[ AUXILIARY FUNCTION ]*****************************
******************************************************************************/


const lazyProp = k => v => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = v()},
    configurable: true,
    enumerable: true});


/******************************************************************************
*******************************************************************************
********************************[ TRAMPOLINES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*****************************[ MODULO RECURSION ]******************************
******************************************************************************/


const moduloRec = o => {
  while (o.tag === "Wind")
    o = o.f(o.wind);

  return o.tag === "Unwind"
    ? o.unwind
    : _throw(new TypeError("unknown trampoline tag"));
};


const moduloRec2 = o => {
  const stack = [];

  while (o.tag === "Wind2") {
    stack.push(o);
    o = o.g(o.wind2);
  }    

  return o.tag === "Unwind2"
    ? stack.reduceRight(
        (acc, p) => p.f(acc), o.unwind2)
    : _throw(new TypeError("unknown trampoline tag"));
};


/***[ Tags ]******************************************************************/


const Unwind = unwind =>
  ({tag: "Unwind", unwind});


const Unwind2 = unwind2 =>
  ({tag: "Unwind2", unwind2});


const Wind = f => wind =>
  ({tag: "Wind", f, wind});


const Wind2 = f => g => wind2 =>
  ({tag: "Wind2", f, g, wind2});


/******************************************************************************
******************************[ MONAD RECURSION ]******************************
******************************************************************************/


const monadRec = o => {
  while (o.tag === "Chain")
    o = o.fm(o.chain);

  return o.tag === "Of"
    ? o.of
    : _throw(new TypeError("unknown trampoline tag"));
};


/***[ Functor ]***************************************************************/


const recMap = f => tx =>
  Of(f(tx.of));


/***[ Monad ]*****************************************************************/


const recChain = mx => fm =>
  mx.tag === "Chain" ? Chain(mx.chain) (x => recChain(mx.fm(x)) (fm))
    : mx.tag === "Of" ? fm(mx.of)
    : _throw(new TypeError("unknown trampoline tag"));


// recOf @Derived


/***[ Tags ]******************************************************************/


const Chain = chain => fm =>
  ({tag: "Chain", fm, chain});


const Of = of =>
  ({tag: "Of", of});


/***[ Derived ]***************************************************************/


const recOf = Of;


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


const tailRec = f => x => {
  let o = f(x);

  while (o.tag === "Loop")
    o = f(o.loop);

  return o.tag === "Base"
    ? o.base
    : _throw(new TypeError("unknown trampoline tag"));
};


/***[ Tags ]******************************************************************/


const Base = base =>
  ({tag: "Base", base});


const Loop = loop =>
  ({tag: "Loop", loop});


/******************************************************************************
*******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ APPLICATIVE ]********************************
******************************************************************************/


const apEff = ({map, ap}) => tx => ty =>
  ap(map(_const) (tx)) (ty);


const apEff_ = ({map, ap}) => tx => ty =>
  ap(mapEff(map) (id) (tx)) (ty);


const liftA2 = ({map, ap}) => f => tx => ty =>
  ap(map(f) (tx)) (ty);


const liftA3 = ({map, ap}) => f => tx => ty => tz =>
  ap(ap(map(f) (tx)) (ty)) (tz);


const liftA4 = ({map, ap}) => f => tw => tx => ty => tz =>
  ap(ap(ap(map(f) (tw)) (tx)) (ty)) (tz);


const liftA5 = ({map, ap}) => f => tv => tw => tx => ty => tz =>
  ap(ap(ap(ap(map(f) (tv)) (tw)) (tx)) (ty)) (tz);


const liftA6 = ({map, ap}) => f => tu => tv => tw => tx => ty => tz =>
  ap(ap(ap(ap(ap(map(f) (tu)) (tv)) (tw)) (tx)) (ty)) (tz);


const liftAn = ({map, ap}) => f => ts =>
  arrFold(acc => (tx, i) =>
    i + 1 === ts.length
      ? acc(tx)
      : ap(acc(tx)))
          (ts.length === 0 ? f : map(f));


/******************************************************************************
*********************************[ FOLDABLE ]**********************************
******************************************************************************/


const all = ({fold, append, empty}) => p =>
  comp(tx => tx.all) (foldMap({fold, append, empty}) (comp(All) (p)));


const any = ({fold, append, empty}) => p =>
  comp(tx => tx.any) (foldMap({fold, append, empty}) (comp(Any) (p)));


const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);


// TODO: add foldMapk


const foldMapr = ({foldr, append, empty}) => f =>
  foldr(comp(append) (f)) (empty);


const maxn = ({fold1, max}) => tx =>
  fold1(x => y =>
    max(x) (y)) (tx);


const minn = ({fold1, min}) => tx =>
  fold1(x => y =>
    min(x) (y)) (tx);


/******************************************************************************
**********************************[ FUNCTOR ]**********************************
******************************************************************************/


const mapEff = map => x =>
  map(_ => x);


/******************************************************************************
***********************************[ MONAD ]***********************************
******************************************************************************/


const chain2 = chain => mx => my => fm =>
  chain(chain(mx) (x => fm(x)))
    (gm => chain(my) (y => gm(y)));


const chain3 = chain => mx => my => mz => fm =>
  chain(chain(chain(mx) (x => fm(x)))
    (gm => chain(my) (y => gm(y))))
      (hm => chain(mz) (z => hm(z)));


const chain4 = chain => mw => mx => my => mz => fm =>
  chain(chain(chain(chain(mw) (w => fm(w)))
    (gm => chain(mx) (x => gm(x))))
      (hm => chain(my) (y => hm(y))))
        (im => chain(mz) (z => im(z)));


const chain5 = chain => mv => mw => mx => my => mz => fm =>
  chain(chain(chain(chain(chain(mv) (v => fm(v)))
    (gm => chain(mw) (w => gm(w))))
      (hm => chain(mx) (x => hm(x))))
        (im => chain(my) (y => im(y))))
          (jm => chain(mz) (z => jm(z)));


const chain6 = chain => mu => mv => mw => mx => my => mz => fm =>
  chain(chain(chain(chain(chain(chain(mu) (u => fm(u)))
    (gm => chain(mv) (v => gm(v))))
      (hm => chain(mw) (w => hm(w))))
        (im => chain(mx) (x => im(x))))
          (jm => chain(my) (y => jm(y))))
            (km => chain(mz) (z => km(z)));


const chainEff = chain => mx => my =>
  chain(_ => my) (mx);


const chainn = chain => ([mx, ...ms]) => fm =>
  arrFold(acc => (mx_, i) =>
    i === ms.length
      ? acc
      : chain(acc) (acc_ =>
          chain(mx_) (x => acc_(x))))
            (mx === undefined ? fm : chain(mx) (fm))
              (ms);


const join = chain => ttx =>
  chain(ttx) (id);


const komp = chain => fm => gm =>
  x => chain(gm(x)) (fm);


const komp3 = chain => fm => gm => hm =>
  x => chain(chain(hm(x)) (gm)) (fm);


const komp4 = chain => fm => gm => hm => im =>
  x => chain(chain(chain(im(x)) (hm)) (gm)) (fm);


const komp5 = chain => fm => gm => hm => im => jm =>
  x => chain(chain(chain(chain(jm(x)) (im)) (hm)) (gm)) (fm);


const komp6 = chain => fm => gm => hm => im => jm => km =>
  x => chain(chain(chain(chain(chain(km(x)) (jm)) (im)) (hm)) (gm)) (fm);


const kompn = chain => ([fm, ...fs]) => x =>
  arrFold(acc => (gm, i) =>
    i === fs.length
      ? acc
      : chain(acc) (acc_ =>
          gm(log(acc_))))
            (fm === undefined ? x : fm(x))
              (fs);


/******************************************************************************
*****************************[ MISC. COMBINATORS ]*****************************
******************************************************************************/


const takeWhile_ = ({cons, empty}) => p => xs => // TODO: reconcile with takeWhile transducer
  tailRec(([ys, acc]) =>
    match(ys, {
      Nil: _ => Base(acc),
      Cons: ({head, tail}) =>
        p(head)
          ? Loop([tail, cons(head) (acc)])
          : Base(acc)
    })) ([xs, empty]);


/******************************************************************************
*********************************[ MONADFIX ]**********************************
******************************************************************************/


const mfix = chain_ => {
  const go = fm => chain_(fm) (x => go(fm) (x));

  return go;
};


/******************************************************************************
**********************************[ MONOID ]***********************************
******************************************************************************/


const concat = fold =>
  fold(arrAppend) (arrEmpty);


/***[ Lifted Option Monoid ]**************************************************/


const optmAppend = append => tx => ty =>
  match(tx, {
    None: _ => ty,

    Some: ({some: x}) => match(ty, {
      None: _ => tx,
      Some: ({some: y}) => Some(append(x) (y))
    })
  });


const optmPrepend = optmAppend; // pass prepend as type dictionary


// optmEmpty @DERIVED


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


const ARRAY = {};


/***[ Alternative ]***********************************************************/


// arrAlt @Derived


// arrZero @Derived


/***[ Applicative ]***********************************************************/


// arrAp @Derived


// arrLiftA2 @Derived


// arrLiftA3 @Derived


// arrLiftA4 @Derived


// arrLiftA5 @Derived


// arrLiftA6 @Derived


const arrOf = x => [x];


ARRAY.of = arrOf;


/***[ Clonable ]**************************************************************/


const arrClone = xs =>
  xs.concat();


ARRAY.clone = arrClone;


/***[ Con-/Deconstruction ]***************************************************/


const arrCons = x => xs =>
  [x].concat(xs);


const arrCons_ = xs => x =>
  [x].concat(xs);


const arrSnoc = x => xs =>
  xs.concat([x]);


const arrSnoc_ = xs => x =>
  xs.concat([x]);


const arrUncons = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs[0], xs.slice(1)]);
};


const arrUnsnoc = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs[xs.length - 1], xs.slice(0, -1)]);
};


/***[ Eq ]********************************************************************/


const arrEq = eq => xs => ys =>
  xs.length !== ys.length
    ? false
    : tailRec(i =>
        i === xs.length
          ? true
          : eq(xs[i]) (ys[i])
              ? Loop(i + 1)
              : Base(false)) (0);


ARRAY.eq = arrEq;


/***[ Filterable ]************************************************************/


const arrFilter = p => xs =>
  xs.filter(p);


const arrPartition = p => xs => pair =>
  arrFold(([ys, zs]) => x =>
    p(x)
      ? Pair_(ys.concat([x]), zs)
      : Pair_(ys, zs.concat([x])))
        (pair) (xs);


/***[ Foldable ]**************************************************************/


const arrFold = f => init => xs => {
  let acc = init;
  
  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


ARRAY.fold = arrFold;


const arrFold1 = f => xs => {
  let acc = xs[0];

  for (let i = 1; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


ARRAY.fold1 = arrFold1;


const arrFoldk = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i).cont(id);

  return acc;
};


const arrFoldr = f => init => xs => { // no thunks b/c array is strict
  let acc = init;

  for (let i = xs.length - 1; i >= 0; i--)
    acc = f(xs[i], i) (acc);

  return acc;
};


ARRAY.foldr = arrFoldr;


const arrSum = arrFold(x => y => x + y) (0);


/***[ Functor ]***************************************************************/


const arrMap = f => xs =>
  xs.map((x, i) => f(x, i));


ARRAY.map = arrMap;


/***[ Monad ]*****************************************************************/


const arrChain = mx => fm =>
  mx.flatMap(fm);


ARRAY.chain = arrChain;


const arrChain_ = fm => mx =>
  mx.flatMap(fm);


ARRAY.chain_ = arrChain_;


const arrChain2 = chain2(arrChain);


const arrChain3 = chain3(arrChain);


const arrChain4 = chain4(arrChain);


const arrChain5 = chain5(arrChain);


const arrChain6 = chain6(arrChain);


const arrChainn = chainn(arrChain);


const arrJoin = join(arrChain);


ARRAY.join = arrJoin;


const arrKomp = komp(arrChain);


ARRAY.komp = arrKomp;


const arrKomp3 = komp3(arrChain);


const arrKomp4 = komp4(arrChain);


const arrKomp5 = komp5(arrChain);


const arrKomp6 = komp6(arrChain);


const arrKompn = kompn(arrChain);


/***[ Monoid ]****************************************************************/


const arrAppend = xs => ys =>
  xs.concat(ys);


ARRAY.append = arrAppend;


const arrPrepend = ys => xs =>
  xs.concat(ys);


ARRAY.prepend = arrPrepend;


const arrEmpty = [];


ARRAY.empty = arrEmpty;


/***[ Read ]******************************************************************/


const arrRead = read => s =>
  s[0] !== "[" || s[s.length - 1] !== "]"
    ? _throw("invalid array string")
    : s.slice(1, -1)
        .split(",")
        .map(s_ => read(s_));


ARRAY.read = arrRead;


/***[ Show ]******************************************************************/


const arrShow = show => xs => {
  const s = xs.map(x => show(x))
    .join(",");

  return `[${s}]`;
};


ARRAY.show = arrShow;


/***[ Traversable ]***********************************************************/


const arrMapA = ({fold, map, ap, of}) => f => xs => {
  const liftA2_ = liftA2({map, ap});

  return fold(ys => y =>
    liftA2_(arrSnoc) (f(y)) (ys))
      (of([])) (xs);
};


ARRAY.mapA = arrMapA;


const arrSeqA = ({fold, map, ap, of}) =>
  fold(liftA2({map, ap}) (arrSnoc_)) (of([]));


ARRAY.seqA = arrSeqA;


/***[ Unfoldable ]************************************************************/


const arrUnfold = f => x => {
  let acc = [],
    tx = f(x);

  while (tx.tag === "Some") {
    const [x, y] = tx.some;
    acc = arrSnoc(x) (acc);
    tx = f(y);
  }

  return acc;
};


ARRAY.unfold = arrUnfold;


// TODO: implement arrUnfoldr


/***[ Misc. Combinators ]*****************************************************/


const _null = xs =>
  xs.length === 0;


/***[ Derived ]***************************************************************/


const arrAlt = arrAppend;


ARRAY.alt = arrAlt;


const arrAp = tf => xs =>
  arrFold(acc => f =>
    arrAppend(acc)
      (arrMap(x => f(x)) (xs)))
        ([])
          (tf);


ARRAY.ap = arrAp;


const arrLiftA2 = liftA2({map: arrMap, ap: arrAp});


ARRAY.liftA2 = arrLiftA2;


const arrLiftA3 = liftA3({map: arrMap, ap: arrAp});


const arrLiftA4 = liftA4({map: arrMap, ap: arrAp});


const arrLiftA5 = liftA5({map: arrMap, ap: arrAp});


const arrLiftA6 = liftA6({map: arrMap, ap: arrAp});


const arrLiftAn = liftAn({map: arrMap, ap: arrAp});


const arrZero = arrEmpty;


ARRAY.zero = arrZero;


/******************************************************************************
**********************************[ BOOLEAN ]**********************************
******************************************************************************/


const BOOL = {};


/***[ Bounded ]***************************************************************/


const boolMaxBound = true;


BOOL.maxBound = boolMaxBound;


const boolMinBound = false;


BOOL.minBound = boolMinBound;


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


const formatDate = sep => (...fs) => d =>
  fs.map(f => f(d))
    .join(sep);


const formatDay = digits => d => {
  switch (digits) {
    case 1: return String(d.getUTCDate());
    case 2: return String(d.getUTCDate()).padStart(2, "0");
    default: throw new RangeError("invalid digits argument");
  }
};


const formatMonth = nameMap => digits => d => {
  switch (digits) {
    case 1: return String(d.getUTCMonth() + 1);
    case 2: return String(d.getUTCMonth() + 1).padStart(2, "0");
    case 3: return nameMap[String(d.getUTCMonth() + 1)];
    default: throw new RangeError("invalid digits argument");
  }
};


const formatWeekday = nameMap => digits => d => {
  switch (digits) {
    case 1: return String(d.getUTCDay());
    case 2: return String(d.getUTCDay()).padStart(2, "0");
    case 3: return nameMap[String(d.getUTCDay())];
    default: throw new RangeError("invalid digits argument");
  }
};


const formatYear = digits => d => {
  switch (digits) {
    case 2: return String(d.getUTCFullYear()).slice(2);
    case 4: return String(d.getUTCFullYear());
    default: throw new RangeError("invalid digits argument");
  }
};


/******************************************************************************
********************************[ DATE STRING ]********************************
******************************************************************************/


// TODO: take I18N into account


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


/***[ Applicative ]***********************************************************/


const funAp = tf => tg => x =>
  tf(x) (tg(x));


// funLiftA2 @Derived


// funLiftA3 @Derived


// funLiftA4 @Derived


// funLiftA5 @Derived


// funLiftA6 @Derived


// funOf @Derived


/***[ Composition ]***********************************************************/


const comp = f => g => x =>
  f(g(x));


const comp3 = f => g => h => x =>
  f(g(h(x)));


const comp4 = f => g => h => i => x =>
  f(g(h(i(x))));


const comp5 = f => g => h => i => j => x =>
  f(g(h(i(j(x)))));


const comp6 = f => g => h => i => j => k => x =>
  f(g(h(i(j(k(x))))));


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const compBin = f => g => x => y =>
  f(g(x) (y));


const compn = fs => x =>
  moduloRec(arrFold(f => g =>
    x => Wind(f) (g(x))) (x => Unwind(x)) (fs) (x));


const compOn = f => g => x => y =>
  f(g(x)) (g(y));


/***[ Conditional Combinators ]***********************************************/


const guard = p => f => x =>
  p(x) ? f(x) : x;


const ifElse = p => f => g => x =>
  p(x) ? f : g;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


/***[ Contravariant Functor ]*************************************************/


const funContra = g => f => x =>
  f(g(x));


/***[ Currying/Partial Application ]******************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const partialProps = (f, o) => p =>
  f({...o, ...p});


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


/***[ Debugging ]*************************************************************/


const debug = f => (...args) => {
  debugger;
  return f(...args);
};


const debugIf = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


const delayTask = f => ms => x =>
  Task((res, rej) => setTimeout(comp(res) (f), ms, x));


const delayPara = f => ms => x =>
  Parallel((res, rej) => setTimeout(comp(res) (f), ms, x));


const log = (...ss) =>
  (console.log(...ss), ss[ss.length - 1]);


const taggedLog = tag => s =>
  (console.log(tag, s), s);


const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/***[ Functor ]***************************************************************/


const funMap = comp;


/***[ Impure/Meta Programming ]***********************************************/


const eff = f => x =>
  (f(x), x);


const introspect = x =>
  Object.prototype.toString.call(x).slice(8, -1);


const isUnit = x =>
  x === undefined
    || x === x === false // NaN
    || (
      typeof x === "object"
        && x !== null
        && "getTime" in x
        && Number.isNaN(x.getTime())); // Invalid Date


const _new = Cons => x =>
  new Cons(x);


const _throw = e => {
  throw e;
};


const throwOn = p => e => msg => x => {
  if (p(x))
    throw new e(msg);
  
  else return x;
};


const throwOnEmpty = throwOn(xs => xs.length === 0);


const throwOnFalse = throwOn(x => x === false);


const throwOnUnit = throwOn(isUnit);


/***[ Infix Combinators ]*****************************************************/


const appr = (f, y) => x =>
  f(x) (y);


const infix = (x, f, y) =>
  f(x) (y);


const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);


const infix4 = (v, f, w, g, x, h, y, i, z) =>
  i(h(g(f(v) (w)) (x)) (y)) (z);


const infix5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z);


const infix6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z);


// TODO: infixn


const infixr3 = (w, f, x, g, y, h, z) =>
  f(w) (g(x) (h(y) (z)));


const infixr4 = (v, f, w, g, x, h, y, i, z) =>
  f(v) (g(w) (h(x) (i(y) (z))));


const infixr5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  f(u) (g(v) (h(w) (i(x) (j(y) (z)))));


const infixr6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(t) (g(u) (h(v) (i(w) (j(x) (k(y) (z))))));


// TODO: infixrn


/***[ Local Binding ]*********************************************************/


const _let = f => f();


/***[ Logical Combinators ]***************************************************/


const and = x => y => x && y;


const andf = f => x => y =>
  f(x) && f(y);


const not = x => !x;


const notf = f => x => !f(x);


const or = x => y => x || y;


const orf = f => x => y =>
  f(x) || f(y);


const xor = x => y =>
  !!((x ? 1 : 0) ^ (y ? 1 : 0));


/***[ Monad ]*****************************************************************/


const funChain = mg => fm => x =>
  fm(mg(x)) (x);


const funJoin = mmf => x =>
  mmf(x) (x);


/***[ Monoid ]****************************************************************/


const funAppend = append => f => g => x =>
  append(f(x)) (g(x));


const funPrepend = prepend => f => g => x =>
  prepend(f(x)) (g(x));


const funEmpty = empty =>
  _ => empty;

/***[ Multi-Argument ]********************************************************/


const appRest = f => (...args) =>
  f(args);


const appSpread = f => tuple =>
  f(...tuple);


/***[ Primitives ]************************************************************/


const app = f => x => f(x);


const app_ = x => f => f(x);


const appn = fs => x =>
  arrFold(app_) (x) (fs);


const _const = x => _ => x;


const const_ = _ => y => y;


const fix = f =>
  x => f(fix(f)) (x);


const fix_ = comp(moduloRec) (fix);


const fix2 = compBin(moduloRec2) (fix);


const flip = f => y => x =>
  f(x) (y);


const id = x => x;


/***[ Transducer ]************************************************************/


const drop = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, acc)
      : append(acc) (x);
};


const dropk = n => append => { 
  let m = 0;

  return acc => x =>
    Cont(k =>
      m < n
        ? (m++, k(acc))
        : append(acc) (x).cont(k))};


const dropr = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, acc)
      : append(x) (acc);
};


const dropWhile = p => append => {
  let drop = true;

  return acc => x => 
    drop && p(x)
      ? acc
      : (drop = false, append(acc) (x));
};


const dropWhilek = p => append => {
  let drop = true;

  return acc => x =>
    Cont(k =>
      drop && p(x)
        ? k(acc)
        : (drop = false, append(acc) (x).cont(k)))};


const dropWhiler = p => append => {
  let drop = true;

  return x => acc =>
    drop && p(x)
      ? acc
      : (drop = false, append(x) (acc));
};


const filter = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const filterk = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : k(acc));


const filterr = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


const map = f => append => acc => x =>
  append(acc) (f(x));


const mapk = f => append => acc => x =>
  Cont(k =>
    append(acc) (f(x)).cont(k));


const mapr = f => append => x => acc =>
  append(f(x)) (acc);


const take = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, append(acc) (x))
      : acc;
};


const takek = n => append => { 
  let m = 0;

  return acc => x =>
    Cont(k =>
      m < n
        ? (m++, append(acc) (x).cont(k))
        : Base(acc))};


const taker = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, append(x) (acc))
      : acc;
};


const takeWhile = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const takeWhilek = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : Base(acc));


const takeWhiler = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


const transduce = ({append, fold}) => f =>
  fold(f(append));


/***[ Derived ]***************************************************************/


const funLiftA2 = liftA2({map: funMap, ap: funAp});


const funLiftA3 = liftA3({map: funMap, ap: funAp});


const funLiftA4 = liftA4({map: funMap, ap: funAp});


const funLiftA5 = liftA5({map: funMap, ap: funAp});


const funLiftA6 = liftA6({map: funMap, ap: funAp});


const funOf = _const;


/******************************************************************************
************************************[ MAP ]************************************
******************************************************************************/


const mapDel = k => m =>
  m.has(k)
    ? new Map(m).delete(k)
    : m;


const mapGet = k => m =>
  m.get(k);


const mapHas = k => m =>
  m.has(k);


const mapSet = k => v => m =>
  new Map(m).set(k, v);


const mapUpd = k => f => m => // TODO: replace with more general version
  m.has(k)
    ? new Map(m).set(k, f(m.get(k)))
    : m;


/******************************************************************************
**********************************[ NUMBER ]***********************************
******************************************************************************/


NUM = {};


/***[ Arithmetic ]************************************************************/


const add = x => y => x + y;


const dec = x => x - 1;


const div = x => y => x / y;


const inc = x => x + 1;


const mod = x => y => x % y;


const mul = x => y => x * y;


const neg = x => -x;


const pow = y => x => x ** y;


const sub = x => y => x - y;



/***[ Bounded ]***************************************************************/


const numMaxBound = Number.MAX_SAFE_INTEGER;


NUM.maxBound = numMaxBound;


const numMinBound = Number.MIN_SAFE_INTEGER;


NUM.minBound = numMinBound;


/***[ Enum ]******************************************************************/


const numPred = n =>
  n === numMinBound
    ? None
    : Some(n - 1);


NUM.pred = numPred;


const numSucc = n =>
  n === numMaxBound
    ? None
    : Some(n + 1);


NUM.succ = numSucc;


/***[ Ord ]*******************************************************************/


const numCompare = m => n =>
  m < n ? LT
    : m > n ? GT
    : EQ;


NUM.compare = numCompare;


const numGt = m => n => m > n;


NUM.gt = numGt;


const numGte = m => n => m >= n;


NUM.gte = numGte;


const numLt = m => n => m < n;


NUM.lt = numLt;


const numLte = m => n => m <= n;


NUM.lte = numLte;


const numMax = m => n =>
  n > m ? n : m;


NUM.max = numMax;


const numMin = m => n =>
  n < m ? n : m;


NUM.min = numMin;


/***[ Read ]******************************************************************/


const numRead = s => {
  const n = parseFloat(s);

  if (n.toString() === s)
    return n;

  else throw new TypeError("invalid number string");
};


NUM.read = numRead;


/***[ Show ]******************************************************************/


const numShow = n => n.toString();


NUM.show = numShow;


/***[ Misc. Combinators ]*****************************************************/


const decimalAdjust = (k, n, decimalPlaces) => { // internal
  const p = Math.pow(10, decimalPlaces);

  if (Math.round(n * p) / p === n)
    return n;

  const m = (n * p) * (1 + Number.EPSILON);
  
  return Math[k] (m) / p;
};


const numCeil = decimalPlaces => n =>
  decimalAdjust("ceil", n, decimalPlaces);


const numFloor = decimalPlaces => n =>
  decimalAdjust("floor", n, decimalPlaces);


const numRound = decimalPlaces => n =>
  decimalAdjust("round", n, decimalPlaces);


const numTrunc = decimalPlaces => n =>
  decimalAdjust("trunc", n, decimalPlaces);


/******************************************************************************
*******************************[ NUMBER STRING ]*******************************
******************************************************************************/


// TODO: take I18N into account


const formatNum = sep => (...fs) => n => {
  const s = String(n)
    .split(/[^\d]|$/)
    .concat("");

  return fs.map(f => f(s))
    .join(sep);
};


const formatFrac = digits => ([_, s]) =>
    s.padEnd(digits, "0");


const formatInt = sep => ([s]) =>
  strReplace(
    Rexg("(\\d)(?=(?:\\d{3})+$)")) (`$1${sep}`) (s);


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


const OBJECT = {};


/***[ Clonable ]**************************************************************/


const objClone = o => {
  const p = {};

  for (k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


OBJECT.clone = objClone;


/***[ De-/Construction ]******************************************************/


const thisify = f => f({});


const unprop = k => ({[k]: prop, ...o}) =>
  Pair_(prop, o);


const unprop2 = k1 => k2 => ({[k1]: prop1, [k2]: prop2, ...o}) =>
  Triple_(prop1, prop2, o);


/***[ Foldable ]**************************************************************/


const objFold = f => init => o => {
  let acc = init;

  for (k in o)
    acc = f(acc) (o[k]);

  return acc;
};


OBJECT.fold = objFold;


/***[ Filterable ]************************************************************/


const objFilter = p => o => {
  const p = {};

  for (k in o) {
    if (p(o[k]))
      p[k] = o[k];
  }

  return p;
};


OBJECT.filter = objFilter;


const objPartition = p => o => pair =>
  objFold(([xs, ys]) => prop =>
    p(prop)
      ? Pair_(xs.concat([prop]), ys)
      : Pair_(xs, ys.concat([prop])))
        (pair) (o);


/***[ Functor ]***************************************************************/


const objMap = f => o => {
  const p = {};

  for (k in o)
    p[k] = f(o[k]);

  return p;
};


OBJECT.map = objMap;


/***[ Generator ]*************************************************************/


function* objEntries(o) {
  for (let prop in o) {
    yield [prop, o[prop]];
  }
}


function* objKeys(o) {
  for (let prop in o) {
    yield prop;
  }
}


function* objValues(o) {
  for (let prop in o) {
    yield o[prop];
  }
}


/***[ Getters/Setters ]*******************************************************/


const objGet = k => o =>
  o[k] === undefined
    ? None
    : Some(o[k]);


const objGetOr = def => k => o =>
  k in o ? o[k] : def;


const objGetPath = (...ks) => o => {
  const r = arrFold(p => k =>
    p[k]) (o) (ks);

  return r === undefined
    ? None
    : Some(r);
};


const objGetPathOr = def => (...ks) => o =>
  tailRec(([p, i]) =>
    i === ks.length ? Base(p)
      : ks[i] in p ? Loop([p[ks[i]], i + 1])
      : Base(def)) ([o, 0]);


const objSetPath = (...ks) => v => o =>
  arrFold(([p, ref, root]) => (k, i) => {
    if (i === ks.length - 1) {
      p[k] = v;
      return root;
    }
    
    else if (Array.isArray(ref[k]))
      p[k] = ref[k].concat();

    else
      p[k] = Object.assign({}, ref[k]);

    return [p[k], ref[k], root];
  }) (thisify(p => [Object.assign(p, o), o, p])) (ks);


const objUpdPath = (...ks) => f => o =>
  arrFold(([p, ref, root]) => (k, i) => {
    if (i === ks.length - 1) {
      p[k] = f(ref[k]);
      return root;
    }
    
    else if (Array.isArray(ref[k]))
      p[k] = ref[k].concat();

    else
      p[k] = Object.assign({}, ref[k]);

    return [p[k], ref[k], root];
  }) (thisify(p => [Object.assign(p, o), o, p])) (ks);


/******************************************************************************
****************************[ REGULAR EXPRESSION ]*****************************
******************************************************************************/


const Rex = (...xs) =>
  new RegExp(xs.join(""));


const Rexf = flags => (...xs) =>
  new RegExp(xs.join(""), flags);


const Rexg = Rexf("g");


const Rexu = Rexf("u");


/******************************************************************************
************************************[ SET ]************************************
******************************************************************************/


const setDel = k => s =>
  s.has(k)
    ? new Set(s).delete(k)
    : s;


const setHas = k => s =>
  s.has(k);


const setSet = k => v => s =>
  new Set(s).add(k, v);


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


/***[ Monoid ]****************************************************************/


const strAppend = s => t => s.concat(t); // TODO: enfore strings


const strPrepend = t => s => s.concat(t); // TOIDO: enforce strings


const strEmpty = "";


/***[ Foldable ]**************************************************************/


const strFold = arrFold;


const strFoldr = arrFoldr;


const strFoldChunk = rx => f => acc => s => {
  const ry = new RegExp( // clone
    rx.source,
    rx.flags[0] !== "g"
      ? "g" + rx.flags
      : rx.flags);

  let r, acc_ = acc;

  while (r = ry.exec(s)) {
    acc_ = f(acc_) (r[0]);
  }

  return acc_;
};


const strFoldChunkr = rx => f => acc => s => {
  const ry = new RegExp( // clone
    rx.source,
    rx.flags[0] !== "g"
      ? "g" + rx.flags
      : rx.flags);

  const go = r =>
    r === null
      ? Cons(acc) (NIL)
      : f(r[0]) (thunk(() => go(ry.exec(s))));

  return go(ry.exec(s));
};


/***[ Misc. Combinators ]*****************************************************/


const strIncludes = rx => s =>
  s.search(rx) !== -1;


const strMatch = rx => s =>
  _let((r = s.match(rx)) =>
    r === null ? ""
      : rx.flags[0] === "g" ? r.join("")
      : r[0]);


const strMatchAll = rx => s =>
  _let((r = s.match(rx)) =>
    r === null ? []
      : rx.flags[0] !== "g" ? []
      : r);


const strMatchLast = rx => s =>
  strFoldChunk(rx)
    (_ => x => x)
      ("")
        (s);


const strMatchNth = rx => n => s =>
  listFoldr((head, i) => tail =>
    i === n
      ? head
      : strict(tail)) // TODO: revise strictness
        ("")
          (strFoldChunkr(rx)
            (Cons)
              ([])
                (s));


const strMatchSection = rx => ry => s =>
  match(optLiftA2(
    o => p => s.slice(o.index, p.index + p[0].length))
      (fromNullable(s.match(rx)))
        (fromNullable(s.match(ry))), {
      None: _ => "",
      Some: ({some}) => some
    });


const strParse = rx => s => // TODO: return a value of type Parser
  _let((r = s.match(rx)) =>
    r === null ? ["", ""]
      : rx.flags[0] === "g" ? [r.join(""), ""]
      : [s.slice(r.index + r[0].length), r[0]]);


const strReplace = rx => x => s =>
  s.replace(rx, x);


const strReplaceBy = rx => f => s =>
  s.replace(rx, (...args) => f(args));


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ ALL ]************************************
******************************************************************************/


const All = all => record("All", {all});


/***[ Monoid ]****************************************************************/


const allAppend = tx => ty =>
  All(tx.all && ty.all);


const allPrepend = allAppend; // commutative


const allEmpty = All(true);


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = any => record("Any", {any});


/***[ Monoid ]****************************************************************/


const anyAppend = tx => ty =>
  Any(tx.any || ty.any);


const anyPrepend = anyAppend; // commutative


const anyEmpty = Any(false);


/******************************************************************************
********************************[ COMPARATOR ]*********************************
******************************************************************************/


const Comparator = union("Comparator");


const LT = Comparator("LT", {valueOf: () => -1});


const EQ = Comparator("EQ", {valueOf: () => 0});


const GT = Comparator("GT", {valueOf: () => 1});


/***[ Monoid ]****************************************************************/


const ctorAppend = tx => ty => 
  match(tx, {
    LT: _ => LT,
    EQ: _ => ty,
    GT: _ => GT
  });


const ctorPrepend = ty => tx => 
  match(tx, {
    LT: _ => LT,
    EQ: _ => ty,
    GT: _ => GT
  });


const ctorEmpty = EQ;


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


const Compare = cmp => record(
  Compare,
  {cmp});


/***[ Contravariant ]*********************************************************/


const cmpContra = f => tf =>
  Compare(compOn(tf.cmp) (f));


/***[ Monoid ]****************************************************************/


const cmpAppend = tx => ty =>
  Compare(x => y =>
    ctorAppend(tx.cmp(x) (y)) (ty.cmp(x) (y)));


const cmpPrepend = ty => tx =>
  Compare(x => y =>
    ctorAppend(tx.cmp(x) (y)) (ty.cmp(x) (y)));


const cmpEmpty = _ => _ => ctorEmpty;


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


const Cont = cont => record(Cont, {cont});


/***[ Applicative ]***********************************************************/


const contAp = tf => tx =>
  Cont(k =>
    tf.cont(f =>
      tx.cont(x =>
        k(f(x)))));


// contLiftA2 @Derived


// contLiftA3 @Derived


// contLiftA4 @Derived


// contLiftA5 @Derived


// contLiftA6 @Derived


const contOf = x => Cont(k => k(x));


/***[ Delimited Cont (w/o Regions) ]******************************************/


// reset :: Cont a a -> Cont r a
// reset :: ((a -> a) -> a) -> (a -> r) -> r
const reset = tx =>
  Cont(k => k(tx.cont(id)));


// ((a -> r) -> Cont r r) -> Cont r a
// ((a -> r) -> (r -> r) -> r) -> (a -> r) -> r
const shift = f =>
  Cont(k => f(k).cont(id));


/***[ Functor ]***************************************************************/


const contMap = f => tx =>
  Cont(k => tx.cont(x => k(f(x))));


/***[ Monad ]*****************************************************************/


const contChain = mx => fm =>
  Cont(k =>
    mx.cont(x =>
      fm(x).cont(k)));


/***[ Monoid ]****************************************************************/


const contAppend = append => tx => ty =>
  Cont(k =>
    tx.cont(x =>
      ty.cont(y =>
        k(append(x) (y)))));


const contPrepend = contAppend; // pass prepend as type dictionary


const contEmpty = empty =>
  Cont(k => k(empty));


/***[ Derived ]***************************************************************/


const contLiftA2 = liftA2({map: contMap, ap: contAp});


const contLiftA3 = liftA3({map: contMap, ap: contAp});


const contLiftA4 = liftA4({map: contMap, ap: contAp});


const contLiftA5 = liftA5({map: contMap, ap: contAp});


const contLiftA6 = liftA6({map: contMap, ap: contAp});


/******************************************************************************
***********************************[ CONTT ]***********************************
******************************************************************************/


const ContT = contt => record(ContT, {contt});


/***[ Transformer ]***********************************************************/


const contChainT = mmk => fmm =>
  ContT(k => mmk.contt(x => fmm(x).contt(k)));


const contLiftT = chain => mmk =>
  ContT(k => chain(mmk) (k));


const contOfT = x => ContT(k => k(x));


/******************************************************************************
**********************************[ EFFECT ]***********************************
******************************************************************************/


const Effect = eff =>
  record(Effect, {get eff() {return eff()}});


/***[ Applicative ]***********************************************************/


const effOf = x => Effect(() => x);


/***[ Monad ]*****************************************************************/


const effChain = mx => fm =>
  Eff(() => fm(mx.eff).eff);


/***[ Transformer ]***********************************************************/


const effChainT = ({map, chain, of}) => mmx => fmm =>
  chain(mmx) (mx =>
    Effect(() => map(my => my.eff) (fmm(mx.eff))));


const effOfT = of => x => of(Effect(() => x));


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const Left = left =>
  Either(Left, {left});


const Right = right =>
  Either(Right, {right});


/***[ Applicative ]***********************************************************/


const eithAp = ft => tx =>
  match(ft, {
    Left: _ => ft,
    Right: ({right: f}) =>
      match(tx, {
        Left: _ => tx,
        Right: ({right: x}) => Right(f(x))
      })
  });


const eithOf = x => Right(x);


/***[ Functor ]***************************************************************/


const eithMap = f => tx =>
  match(tx, {
    Left: _ => tx,
    Right: ({right: x}) => Right(f(x))
  });


/***[ Monad ]*****************************************************************/


const eithChain = mx => fm =>
  match(mx, {
    Left: _ => mx,
    Right: ({right: x}) => fm(x)
  });


/***[ Transformer ]***********************************************************/


const eithChainT = ({chain, of}) => mmx => fmm =>
  chain(mmx) (mx =>
    match(mx, {
      Left: ({left: x}) => of(Left(x)),
      Right: ({right: y}) => fmm(y)
    }));


const eithOfT = of => x => of(Right(x));


/******************************************************************************
***********************************[ ENDO ]************************************
******************************************************************************/


/***[ Monoid ]****************************************************************/


const endoAppend = comp; // TODO: enforce a -> a


const endoPrepend = funContra;  // TODO: enforce a -> a


const endoEmpty = id;


/******************************************************************************
***********************************[ EQUIV ]***********************************
******************************************************************************/


const Equiv = equiv => record("Equiv", {equiv});


/***[ Contravariant Functor ]*************************************************/


const equivContra = f => tf =>
  Equiv(compOn(tf.equiv) (f));


/***[ Monoid ]****************************************************************/


const equivAppend = tf => tg =>
  Equiv(x => y =>
    tf.equiv(x) (y) && tg.equiv(x) (y));


const equivPrepend = equivAppend;


const equivEmpty = Equiv(x => y => true);


/******************************************************************************
***********************************[ FIRST ]***********************************
******************************************************************************/


const First = first => record("First", {first});


/***[ Semigroup ]*************************************************************/


const firstAppend = x => _ => x;


// firstPrepend @DERIVED


/******************************************************************************
**********************************[ IARRAY ]***********************************
******************************************************************************/


const iarrEmpty = Hamt(
  {[Symbol.toStringTag]: "IArray", length: 0, offset: 0});


/***[ Conversion ]************************************************************/


const iarrFromArr = arrFold(acc => (x, i) =>
  hamtSet(
    acc,
    {}, {
      [Symbol.toStringTag]: "IArray",
      length: i + 1,
      offset: 0},
    i,
    x)) (iarrEmpty);


const iarrItor = xs => {
  return {[Symbol.iterator]: function* () {
    for (let i = 0; i < xs.length; i++) {
      yield hamtGet(xs, i + xs.offset);
    }
  }};
};


const iarrToArr = xs =>
  tailRec(([tx, acc]) =>
    match(tx, {
      None: _ => Base(acc),
      Some: ({some: [y, ys]}) =>
        Loop([iarrUncons(ys), acc.concat([y])])
    })) ([iarrUncons(xs), []]);


/***[ Con-/Deconstruction ]***************************************************/


const iarrCons = x => xs =>
  hamtSet(
    xs,
    {}, {
      [Symbol.toStringTag]: "IArray",
      length: xs.length + 1,
      offset: xs.offset - 1},
    xs.offset - 1,
    x);


const iarrSnoc = x => xs =>
  hamtSet(
    xs,
    {}, {
      [Symbol.toStringTag]: "IArray",
      length: xs.length + 1,
      offset: xs.offset},
    xs.length,
    x);


const iarrUncons = xs =>
  xs.length === 0
    ? None
    : Some(Pair_(
        hamtGet(xs, xs.offset),
        hamtDel(
          xs, {
            [Symbol.toStringTag]: "IArray",
            length: xs.length - 1,
            offset: xs.offset + 1},
          xs.offset)));


const iarrUnsnoc = xs =>
  xs.length === 0
    ? None
    : Some(Pair_(
        hamtGet(xs, xs.length - 1 + xs.offset),
        hamtDel(
          xs, {
            [Symbol.toStringTag]: "IArray",
            length: xs.length - 1,
            offset: xs.offset},
          xs.length - 1 + xs.offset)));


/***[ Foldable ]**************************************************************/


const iarrFold = f => acc => xs => {
  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (hamtGet(xs, i + xs.offset));

  return acc;
};


const iarrFoldr = f => acc => xs => {
  const go = i =>
    i === xs.length
      ? acc
      : f(hamtGet(xs, i + xs.offset))
          (thunk(() => go(i + 1)));

  return go(0);
};


/***[ Misc. Combinators ]*****************************************************/


const iarrDel = i => xs =>
  i === 0 || i === xs.length - 1
    ? hamtDel(
        xs, {
          [Symbol.toStringTag]: "IArray",
          length: xs.length - 1,
          offset: i === 0 ? xs.offset + 1 : xs.offset},
        i + xs.offset)
    : _throw(new TypeError("illegal index for removal"));


const iarrGet = i => xs =>
  hamtGet(xs, i + xs.offset);


const iarrHas = i => xs =>
  hamtHas(xs, i + xs.offset);


const iarrSet = i => x => xs =>
  i > xs.length
    ? _throw(new TypeError("index out of bound"))
    : hamtSet(
        xs, {
          [Symbol.toStringTag]: "IArray",
          length: xs.length,
          offset: xs.offset}, {
          [Symbol.toStringTag]: "IArray",
          length: xs.length + 1,
          offset: xs.offset},
        i,
        x);


// TODO: add iarrUpd


/******************************************************************************
***********************************[ IMAP ]************************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ ISET ]************************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ DEFER ]***********************************
******************************************************************************/


const Defer = defer => record(Defer, {get defer() {
  return this.defer = defer();
}});


/***[Applicative]*************************************************************/


const deferAp = tf => tx =>
  Defer(() => tf.defer(tx.defer));


const deferOf = x => Defer(() => x);


/***[Functor]*****************************************************************/


const deferMap = f => tx =>
  Defer(() => f(tx.defer));


/***[Monad]*******************************************************************/


const deferChain = mx => fm =>
  Defer(() => fm(mx.defer).defer);


const deferJoin = mmx =>
  Defer(() => mmx.defer.defer);


/******************************************************************************
***********************************[ LAZY ]************************************
******************************************************************************/


const Lazy = lazy => record(Lazy, {get lazy() {
  delete this.lazy
  return this.lazy = lazy();
}});


/***[Applicative]*************************************************************/


const lazyAp = tf => tx =>
  Lazy(() => tf.lazy(tx.lazy));


const lazyOf = x => Lazy(() => x);


/***[Functor]*****************************************************************/


const lazyMap = f => tx =>
  Lazy(() => f(tx.lazy));


/***[Monad]*******************************************************************/


const lazyChain = mx => fm =>
  Lazy(() => fm(mx.lazy).lazy);


const lazyJoin = mmx =>
  Lazy(() => mmx.lazy.lazy);


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


const Last = last => record("Last", {last});


/***[ Semigroup ]*************************************************************/


const lastAppend = _ => y => y;


const lastPrepend = firstAppend;


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


const List = union("List");


const Nil = List("Nil", {});


const Cons = head => tail =>
  List(Cons, {head, tail});


const Cons_ = (head, tail) =>
  List(Cons, {head, tail});


/***[ Applicative ]***********************************************************/


// listAp @Derived


// listLiftA2 @Derived


// listLiftA3 @Derived


// listLiftA4 @Derived


// listLiftA5 @Derived


// listLiftA6 @Derived


const listOf = x => Cons(x) (Nil);


/***[ Conversion ]************************************************************/


const listFromArr = arrFoldr(
  x => xs => Cons(x) (xs)) (Nil);


// listToArr @Derived


/***[ Con-/Deconstruction ]***************************************************/


const listCons = Cons;


const listCons_ = flip(Cons);


// TODO: implement listSnoc


// TODO: implement listSnoc_


// TODO: implement listUncons


// TODO: implement listUnsnoc


/***[ Foldable ]**************************************************************/


const listFold = f => init => xs => {
  let ys = xs,
    acc = init
    i = 0;

  do {
    if (ys.tag === "Nil")
      break;

    else if (ys.tag === "Cons") {
      const {head, tail} = ys;
      acc = f(acc) (head, i);
      ys = tail;
      i++;
    }
  } while (true);

  return acc;
};


const listFoldr = f => acc => xs => {
  const go = (xs, i) =>
    match(xs, {
      Nil: _ => acc,
      Cons: ({head, tail}) => f(head, i) (thunk(() => go(tail, i + 1)))
    });

  return go(xs, 0);
};


/***[ Functor ]***************************************************************/


const listMap = f =>
  listFoldr(x => acc =>
    Cons(f(x)) (acc))
      (Nil);


/***[ Infinite Lists ]********************************************************/


const iterate = f => {
  const go = x =>
    Cons_(x, thunk(() => go(f(x))));

  return go;
};


const repeat = x =>
  Cons_(x, thunk(() => repeat(x)));


/***[ Monad ]*****************************************************************/


const listChain = mx => fm => {
  const go = my => match(my, {
    Nil: _ => Nil,
    Cons: ({head, tail}) => listAppend(fm(head)) (go(tail))
  });

  return go(mx);
};


/***[ Monoid ]****************************************************************/


const listAppend = xs => ys =>
  listFoldr(Cons) (ys) (xs);


const listPrepend = ys => xs =>
  listFoldr(Cons) (ys) (xs);


const listEmpty = Nil;


/***[ Unfoldable ]************************************************************/


// TODO: implement listUnfold


const listUnfoldr = f => x =>
  match(f(x), {
    None: _ => [],
    Some: ({some: [x, y]}) => Cons(x) (thunk(() => listUnfoldr(f) (y)))
  });


/***[ Derived ]***************************************************************/


const listAp = fs => xs =>
  listFoldr(f => acc =>
    listAppend(listMap(f) (xs))
      (acc)) (Nil) (fs);


const listLiftA2 = liftA2({map: listMap, ap: listAp});


const listLiftA3 = liftA3({map: listMap, ap: listAp});


const listLiftA4 = liftA4({map: listMap, ap: listAp});


const listLiftA5 = liftA5({map: listMap, ap: listAp});


const listLiftA6 = liftA6({map: listMap, ap: listAp});


const listToArr =
  listFold(arrSnoc_) ([]);


/******************************************************************************
***********************************[ LISTT ]***********************************
******************************************************************************/


const ListT = union("ListT");


const NilT = of =>
  of(ListT("NilT", {}));


const ConsT = of => head => tail =>
  of(ListT("ConsT", {head, tail}));


/***[ Alternative ]***********************************************************/


const listAltT = ({chain, of}) => mmx => mmy => {
  const go = (mmx_) =>
    chain(mmx_) (mx =>
      match(mx, {
        NilT: _ => strict(mmy), // TODO: revise strictness
        ConsT: ({head, tail}) =>
          ConsT(of) (head) (thunk(() => go(tail)))
      }));
  
  return go(mmx);
};


const listZeroT = NilT;


/***[ Conversion ]************************************************************/


const listFromArrT = of =>
  arrFoldr(x => acc =>
    ConsT(of) (x) (acc))
      (NilT(of));


const listToArrT = ({chain, of}) =>
  listFoldT(chain) (acc => x =>
    chain(acc) (acc_ =>
      of(arrSnoc(x) (acc_)))) (of([]));


/***[ Foldable ]**************************************************************/


const listFoldrT = chain => f => acc => {
  const go = mmx => chain(mmx) (mx =>
    match(mx, {
      NilT: _ => strict(acc), // TODO: revise strictness
      ConsT: ({head, tail}) =>
        f(head) (thunk(() => go(tail)))
    }));

  return go;
};


const listFoldT = chain => f => init => mmx =>
  tailRec(([acc, mmx_]) =>
    chain(mmx_) (mx =>
      match(mx, {
        NilT: _ => Base(acc),
        ConsT: ({head, tail}) =>
          Loop([f(acc) (head), tail])
      }))) ([init, mmx]);


/***[ Monoid ]****************************************************************/


const listAppendT = ({chain, of}) => mmx => mmy =>
  listFoldrT(chain)
    (ConsT(of))
      (mmy)
        (mmx);


/***[ Transformer ]***********************************************************/


const listChainT = ({chain, of}) => mmx => fmm =>
  listFoldrT(chain)
    (x => listAppendT({chain, of}) (fmm(x)))
      (NilT(of))
        (mmx);


const listLiftT = ({chain, of}) => mx =>
  chain(mx) (listOfT(of));


const listOfT = of => x =>
  ConsT(of) (x) (NilT(of));


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = max => record("Max", {max});


/***[ Monoid ]****************************************************************/


const maxAppend = max => x => y =>
  Max(max(x) (y));


const maxPrepend = maxAppend;


const maxEmpty = minBound => Max(minBound);


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = min => record("Min", {min});


/***[ Monoid ]****************************************************************/


const minAppend = min => x => y =>
  Min(min(x) (y));


const minPrepend = minAppend;


const minEmpty = maxBound => Min(maxBound);


/******************************************************************************
**********************************[ NEArray ]**********************************
******************************************************************************/


// TODO


/******************************************************************************
**********************************[ NEList ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


const Option = union("Option");


const None = Option("None", {});


const Some = some => Option(Some, {some});


/***[ Applicative ]***********************************************************/


const optAp = tf => tx =>
  match(tf, {
    None: _ => None,
    Some: ({some: f}) => {
      return match(tx, {
        None: _ => None,
        Some: ({some: x}) => Some(f(x))
      });
    }
  });


// optLiftA2 @Derived


// optLiftA3 @Derived


// optLiftA4 @Derived


// optLiftA5 @Derived


// optLiftA6 @Derived


const optOf = x => Some(x);


/***[ Functor ]***************************************************************/


const optMap = f => tx =>
  match(tx, {
    None: _ => None,
    Some: ({some: x}) => Some(f(x))
  });


/***[ Monoid ]****************************************************************/


const optAppend = append => tx => ty =>
  match(tx ,{
    None: _ => ty,
    Some: ({some: x}) => {
      match(ty, {
        None: _ => tx,
        Some: ({some: y}) =>
          Some(append(x) (y))
      });
    }
  });


const optPrepend = prepend => tx => ty =>
  match(tx ,{
    None: _ => ty,
    Some: ({some: x}) => {
      match(ty, {
        None: _ => tx,
        Some: ({some: y}) =>
          Some(prepend(x) (y))
      });
    }
  });


const optEmpty = None;


/***[ Monad ]*****************************************************************/


const optChain = mx => fm =>
  match(mx, {
    None: _ => None,
    Some: ({some: x}) => fm(x)
  });


/***[ Misc. Combinators ]*****************************************************/


const fromNullable = x =>
  x === null ? None : Some(x);


/***[ Derived ]***************************************************************/


const optLiftA2 = liftA2({map: optMap, ap: optAp});


const optLiftA3 = liftA3({map: optMap, ap: optAp});


const optLiftA4 = liftA4({map: optMap, ap: optAp});


const optLiftA5 = liftA5({map: optMap, ap: optAp});


const optLiftA6 = liftA6({map: optMap, ap: optAp});


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


const Parallel = para => record(
  Parallel,
  thisify(o => {
    o.para = (res, rej) =>
      para(x => {
        o.para = k => k(x);
        return res(x);
      }, rej);
    
    return o;
  }));


/***[ Applicative ]***********************************************************/


const paraAp = tf => tx =>
  Parallel((res, rej) =>
    paraAnd(tf) (tx)
      .para(([f, x]) =>
         res(f(x)), rej));


// paraLiftA2 @Derived


// paraLiftA3 @Derived


// paraLiftA4 @Derived


// paraLiftA5 @Derived


// paraLiftA6 @Derived


const paraOf = x => Parallel((res, rej) => res(x));


/***[ Functor ]***************************************************************/


const paraMap = f => tx =>
  Parallel((res, rej) =>
    tx.para(x => res(f(x)), rej));


const paraMap_ = f => tx =>
  Parallel((res, rej) =>
    Wind(f => tx.para(f)) (x => Wind(res) (f(x)), rej));


/***[ Monoid (type parameter) ]***********************************************/


const paraAppend = append => tx => ty =>
  Parallel((res, rej) =>
    paraAnd(tx) (ty)
      .para(([x, y]) =>
        res(append(x) (y)), rej));


const paraPrepend = paraAppend; // pass prepend as type dictionary

  
const paraEmpty = empty =>
  Parallel((res, rej) => res(empty));


/***[ Monoid (race) ]*********************************************************/


const raceAppend = tx => ty =>
  Parallel((res, rej) =>
    paraOr(tx) (ty)
      .para(x => res(x), rej));


const racePrepend = raceAppend; // order doesn't matter


const raceEmpty = Parallel((res, rej) => null);


/***[ Misc. Combinators ]*****************************************************/


const paraAnd = tx => ty => {
  const guard = (res, rej, i) => [
    x => (
      r[i] = x,
      isRes || isRej || r[0] === undefined || r[1] === undefined
        ? false
        : (isRes = true, res(r))),
    e =>
      isRes || isRej
        ? false
        : (isRej = true, rej(e))];

  const r = [];

  let isRes = false,
    isRej = false;

  return Parallel(
    (res, rej) => (
      tx.para(...guard(res, rej, 0)),
      ty.para(...guard(res, rej, 1))));
};


const paraAll = ({fold, cons, empty, paraMap}) => // TODO: review
  fold(tx => ty =>
    paraMap(([x, y]) =>
      cons(x) (y))
        (paraAnd(tx) (ty)))
          (paraOf(empty));


const paraOr = tx => ty => {
  const guard = (res, rej) => [
    x => (
      isRes || isRej
        ? false
        : (isRes = true, res(x))),
    e =>
        isRes || isRej
          ? false
          : (isRej = true, rej(e))];

  let isRes = false,
    isRej = false;

  return Parallel(
    (res, rej) => (
      tx.para(...guard(res, rej)),
      ty.para(...guard(res, rej))));
};


const paraRecover = f => tx =>
  Parallel((res, rej) =>
    tx.para(id, f));


/***[ Derived ]***************************************************************/


const paraLiftA2 = liftA2({map: paraMap, ap: paraAp});


const paraLiftA3 = liftA3({map: paraMap, ap: paraAp});


const paraLiftA4 = liftA4({map: paraMap, ap: paraAp});


const paraLiftA5 = liftA5({map: paraMap, ap: paraAp});


const paraLiftA6 = liftA6({map: paraMap, ap: paraAp});


/******************************************************************************
***********************************[ PRED ]************************************
******************************************************************************/


const Pred = pred => record(Pred, {pred});


/***[ Contravariant ]*********************************************************/


const predContra = p => tp =>
  x => Pred(tp.pred(p(x)));


/***[ Monoid ]****************************************************************/


const predAppend = tp => tq =>
  Pred(x => tp.pred(x) && tq.pred(x));


const predPrepend = tq => tp =>
  Pred(x => tp.pred(x) && tq.pred(x));


const predEmpty = Pred(_ => true);


/******************************************************************************
***********************************[ PROD ]************************************
******************************************************************************/


const Prod = prod => record(Prod, {prod});


/***[ Monoid ]****************************************************************/


const prodAppend = tx => ty =>
  Prod(tx.prod * ty.prod);


const prodPrepend = prodAppend; // commutative


const prodEmpty = Prod(1);


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = f => record("State", {state: f});


/***[ Applicative ]***********************************************************/


const stateAp = tf => tx =>
  State(s => {
    const [f, s_] = tf.state(s),
      [x, s__] = tx.state(s_);

    return Pair_(f(x), s__);
  });


const stateOf = x => State(s => Pair_(x, s));


/***[ Functor ]***************************************************************/


const stateMap = f => tx =>
  State(s => {
    const [x, s_] = tx.state(s);
    return Pair_(f(x), s_);
  });


/***[ Monad ]*****************************************************************/


const stateChain = mx => fm =>
  State(s => {
    const [x, s_] = mx.state(s);
    return fm(x).state(s_);
  });


/***[ Misc. Combinators ]*****************************************************/


const stateEval = tf =>
  s => tf.state(s) [0];


const stateExec = tf =>
  s => tf.state(s) [1];


const stateGet = State(s => Pair_(s, s));


const stateGets = f =>
  State(s => Pair_(f(s), s));


const stateModify = f =>
  State(s => Pair_(null, f(s)));


const statePut = s =>
  State(_ => Pair_(null, s));


/******************************************************************************
************************************[ SUM ]************************************
******************************************************************************/


const Sum = sum => record(Sum, {sum});


/***[ Monoid ]****************************************************************/


const sumAppend = tx => ty =>
  Sum(tx.sum + ty.sum);


const sumPrepend = sumAppend; // commutative


const sumEmpty = Sum(0);


/******************************************************************************
***********************************[ TASK ]************************************
******************************************************************************/


/*
TODO: The entire Task type needs revision, because I switch from multi handler
to ordinary continuations. In order to handle async exceptions there will be
a TaskT transformer that can be combined with Maybe/Either or add stack-safety.
*/


const Task = task => record(
  Task,
  thisify(o => {
    o.task = k =>
      task(x => {
        o.task = k_ => k_(x);
        return k(x);
      });

    return o;
  }));


/***[ Applicative ]***********************************************************/


const taskAp = tf => tx =>
  Task((res, rej) =>
    taskAnd(tf) (tx)
      .task(([f, x]) =>
         res(f(x)), rej));


// taskLiftA2 @Derived


// taskLiftA3 @Derived


// taskLiftA4 @Derived


// taskLiftA5 @Derived


// taskLiftA6 @Derived


const taskOf = x =>
  Task((res, rej) => res(x));


/***[ Functor ]***************************************************************/


const taskMap = f => tx =>
  Task((res, rej) =>
    tx.task(x => res(f(x)), rej));


const taskMap_ = f => tx =>
  Task((res, rej) =>
    Wind(f => tx.task(f)) (x => Wind(res) (f(x)), rej));


/***[ Monad ]*****************************************************************/


const taskChain = mx => fm =>
  Task((res, rej) =>
    mx.task(x =>
      fm(x).task(res, rej), rej));


/***[ Monoid ]****************************************************************/


const taskAppend = append => tx => ty =>
  Task((res, rej) =>
    taskAnd(tx) (ty)
      .task(([x, y]) =>
        res(append(x) (y)), rej));


const taskPrepend = taskAppend; // pass prepend as type dictionary


const taskEmpty = empty =>
  Task((res, rej) => res(empty));


/***[ Misc. Combinators ]*****************************************************/


const taskAnd = tx => ty =>
  Task((res, rej) =>
    tx.task(x =>
      ty.task(y =>
        res([x, y]), rej), rej));


const taskAll = ({fold, cons, empty, taskMap}) => // TODO: replace with arrSeqA
  fold(tx => ty =>
    taskMap(([x, y]) =>
      cons(x) (y))
        (taskAnd(tx) (ty)))
          (taskOf(empty));


const taskRecover = f => tx =>
  Task((res, rej) =>
    tx.task(id, f));


/***[ Derived ]***************************************************************/


const taskLiftA2 = liftA2({map: taskMap, ap: taskAp});


const taskLiftA3 = liftA3({map: taskMap, ap: taskAp});


const taskLiftA4 = liftA4({map: taskMap, ap: taskAp});


const taskLiftA5 = liftA5({map: taskMap, ap: taskAp});


const taskLiftA6 = liftA6({map: taskMap, ap: taskAp});


/******************************************************************************
********************************[ TREE (LIKE) ]********************************
******************************************************************************/


// e.g. {foo: [1, {bat: {baz: "abc"}}, 3], bar: true};


/***[ Foldable ]***************************************************************/


const tlikeFold = f => init => tx => { // post-order
  const go = acc => tx => {
    if (Array.isArray(tx))
      return arrFold(go) (acc) (tx);

    else if (tx !== null && typeof tx === "object")
      return objFold(go) (acc) (tx);

    else return f(acc) (tx);
  };

  return go(init) (tx);
};


/***[ Functor ]***************************************************************/


const tlikeMap = f => {
  const go = tx => {
    if (Array.isArray(tx))
      return arrMap(go) (tx);

    else if (tx !== null && typeof tx === "object")
      return objMap(go) (tx);

    else return f(tx);
  };

  return go;
};


/******************************************************************************
*****************************[ TREE (MULTI-WAY) ]******************************
******************************************************************************/


const Node = branchKey => leaf => branch =>
  record("Tree", {...leaf, [branchKey]: branch});


const Node_ = branchKey => leaf => (...branch) =>
  record("Tree", {...leaf, [branchKey]: branch});


/***[ Foldable ]**************************************************************/


const treeFold = uncons => f => { // pre-order
  const go = acc => node => {
    const [branch, leaf] = uncons(node);
    return arrFold(go) (f(acc) (leaf)) (branch);
  };

  return go;
};

const treeFoldLevel = uncons => f => init => tree => { // level-order
  const go = branch =>
    branch.length === 0
      ? []
      : arrAppend(branch)
          (go(arrFold(acc => node => {
            const [branch_] = uncons(node);
            return arrAppend(acc) (branch_);
          }) ([]) (branch)));

  return arrFold(acc => node => f(acc) (node)) (init) (go([tree]));
};

const treeFoldr = uncons => f => init => tree => { // post-order
  const go = node => acc => {
    const [branch, leaf] = uncons(node);
    return arrFoldr(go) (f(leaf) (acc)) (branch);
  };

  return go(tree) (init);
};


/***[ Functor ]***************************************************************/


const treeMap = ({cons, uncons}) => f =>
  treeCata(uncons) (comp(cons) (f));


/***[ Recursion Schemes ]*****************************************************/


const treeCata = uncons => f => {
  const go = node => {
    const [branch, leaf] = uncons(node);
    return f(leaf) (thunk(() => arrMap(go) (branch)));
  };

  return go;
};


const treeCata_ = uncons => f => g => acc => {
  const go = node => {
    const [branch, leaf] = uncons(node);

    return comp3(f(leaf))
      (arrFoldr(g) (acc))
        (arrMap(go)) (branch);
  }

  return go;
};


/***[ Tree Structure ]********************************************************/


const treeCountLeafs = uncons =>
  treeCata(uncons) (_ => branch =>
    branch.length === 0 ? 1 : arrSum(branch));


const treeCountNodes = uncons =>
  treeCata(uncons) (_ => branch =>
    branch.length === 0 ? 0 : 1 + arrSum(branch));


const treeHeight = uncons => {
  const maxn_ = maxn({fold1: arrFold1, max: numMax});

  return treeCata(uncons) (_ => branch =>
    branch.length === 0
      ? 0 : 1 + maxn_(branch));
};


const treeLeafs = uncons => acc =>
  treeCata(uncons) (leaf => branch =>
    branch.length === 0
      ? arrSnoc(leaf) (acc)
      : arrFold(arrAppend) (acc) (branch));


const treeLevels = uncons => tree =>
  comp(takeWhile_(
    {cons: arrSnoc, empty: []})
      (notf(_null)))
        (iterate(foldMap({
          fold: arrFold,
          append: acc => ([branch]) => arrAppend(acc) (branch),
          empty: []})
            (uncons))) ([tree]);


const treeMapLeafs = ({cons, uncons}) => f =>
  treeCata(uncons) (leaf => branch =>
    comp(cons) (branch.length === 0 ? f : id) (leaf) (branch));


const treeMapNodes = ({cons, uncons}) => f =>
  treeCata(uncons) (leaf => branch =>
    comp(cons) (branch.length > 0 ? f : id) (leaf) (branch));


const treeNodes = uncons => acc =>
  treeCata(uncons) (leaf => branch =>
    branch.length > 0
      ? arrCons(leaf) (arrFold(arrAppend) (acc) (branch))
      : acc);


const treePaths = uncons => {
  const go = node => {
    const [branch, leaf] = uncons(node);

    return branch.length === 0
      ? [[leaf]]
      : arrMap(arrCons(leaf))
          (foldMap({
            fold: arrFold,
            append: arrAppend,
            empty: []})
              (go) (branch));
  };

  return go;
};


/******************************************************************************
********************************[ TREE (AVL) ]*********************************
******************************************************************************/


// TODO


/******************************************************************************
*****************************[ TREE (RED/BLACK) ]******************************
******************************************************************************/


// TODO


/******************************************************************************
*******************************[ TREE (Finger) ]*******************************
******************************************************************************/


// TODO


/******************************************************************************
********************************[ TREE (Rope) ]********************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ TRIE ]************************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ TUPLE ]***********************************
******************************************************************************/


const Pair = _1 => _2 => record(Pair, {
  0: _1,
  1: _2,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
  }});


const Pair_ = (_1, _2) => record(Pair, {
  0: _1,
  1: _2,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
  }});


const Triple = _1 => _2 => _3 => record(Triple, {
  0: _1,
  1: _2,
  2: _3,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
    yield _3;
  }});


const Triple_ = (_1, _2, _3) => record(Triple, {
  0: _1,
  1: _2,
  2: _3,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
    yield _3;
  }});


const Quad = _1 => _2 => _3 => _4 => record(Quad, {
  0: _1,
  1: _2,
  2: _3,
  3: _4,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
    yield _3;
    yield _4;
  }});


const Quad_ = (_1, _2, _3, _4) => record(Quad, {
  0: _1,
  1: _2,
  2: _3,
  3: _4,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
    yield _3;
    yield _4;
  }});


/***[ Functor ]***************************************************************/


const pairMap = f => ([x, y]) =>
  Pair_(x, f(y));


const tripMap = f => ([x, y, z]) =>
  Triple_(x, y, f(z));


const quadMap = f => ([w, x, y, z]) =>
  Quad_(w, x, y, f(z));


/***[ Misc. Combinators ]*****************************************************/


const pairMap1st = f => ([x, y]) =>
  Pair_(f(x), y);


const tripMap1st = f => ([x, y, z]) =>
  Triple_(f(x), y, z);


const quadMap1st = f => ([w, x, y, z]) =>
  Quad_(f(w), x, y, z);


const tripMap2nd = f => ([x, y, z]) =>
  Triple_(x, f(y), z);


const quadMap2nd = f => ([w, x, y, z]) =>
  Quad_(w, f(x), y, z);


const quadMap3rd = f => ([w, x, y, z]) =>
  Quad_(w, x, f(y), z);


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = pair => record(Writer, {writer: pair});


/***[ Applicative ]***********************************************************/


const writerAp = append => ({writer: [f, w]}) => ({writer: [x, w_]}) =>
  Writer(Pair_(f(x), append(w) (w_)));


const writerOf = empty => x =>
  Writer(Pair_(x, empty));


/***[ Functor ]***************************************************************/


const writerMap = f => ({writer: [x, w]}) =>
  Writer(Pair_(f(x), w));


/***[ Monad ]*****************************************************************/


const writerChain = append => ({writer: [x, w]}) => fm => {
  const [x_, w_] = fm(x).writer;
  return Writer(Pair_(x_, append(w) (w_)));
};


/***[ Misc. Combinators ]*****************************************************/


const writerCensor = ({append, empty}) => f => tx =>
  writerPass(
    writerChain(append) (tx) (x =>
      writerOf(empty) (Pair_(x, f))))


const writerExec = ({writer: [_, w]}) => w;


const writerListen = ({writer: [x, w]}) =>
  Writer(Pair_(Pair_(x, w), w));


const writerListens = f => ({writer: [x, w]}) =>
  Writer(Pair_(Pair_(x, f(w)), w));


const writerMapBoth = f => tx =>
  Writer(f(tx.writer));


const writerPass = ({writer: [[x, f], w]}) =>
  Writer(Pair_(x, f(w)));


const writerTell = w => Writer(Pair_(null, w));


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const firstPrepend = lastAppend;


/******************************************************************************
*******************************************************************************
*******************************[ TRANSFORMERS ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
**********************************[ ARRAYT ]***********************************
******************************************************************************/


/***[ Applicative ]***********************************************************/


const arrOfT = of => x => of([of(x)]);


/***[ Foldable ]**************************************************************/


const arrFoldT = chain => f => init => mmx =>
  chain(mmx) (mx => {
    const go = (acc, i) =>
      i === mx.length
        ? acc
        : chain(mx[i]) (x =>
            go(f(acc) (x), i + 1))

    return go(init, 0);
  });


/***[ Monoid ]****************************************************************/


const arrAppendT = ({chain, of}) => mmx => mmy =>
  arrFoldT(chain)
    (acc => x =>
      chain(acc) (acc_ =>
        of(arrSnoc(of(x)) (acc_)))) (mmx) (mmy);


/***[ Monad ]*****************************************************************/


const arrChainT = ({chain, of}) => mmx => fmm =>
  arrFoldT(chain)
    (acc => x =>
      arrAppendT({chain, of}) (acc) (fmm(x)))
        (of([]))
          (mmx);


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


const fileRead_ = Async => opt => path =>
  Async((res, rej) =>
    fs.readFile(path, opt, (e, x) =>
      e ? rej(e) : res(x)));


const fileWrite_ = Async => opt => path => s =>
  Async((res, rej) =>
    fs.writeFile(path, s, opt, e =>
      e ? rej(e) : res()));


const scanDir_ = Async => path =>
  Async((res, rej) =>
    fs.readdir(path, (e, xs) =>
      e ? rej(e) : res(xs)));


/******************************************************************************
*******************************************************************************
**********************************[ DERIVED ]**********************************
*******************************************************************************
******************************************************************************/


const optmEmpty = None;


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  add,
  All,
  all,
  allAppend,
  allEmpty,
  allPrepend,
  and,
  andf,
  Any,
  any,
  anyAppend,
  anyEmpty,
  anyPrepend,
  apEff,
  apEff_,
  app,
  app_,
  appn,
  appr,
  appRest,
  appSpread,
  arrAlt,
  arrAp,
  arrAppend: TC
    ? fun(xs => ys =>
        introspect(ys) !== "Array"
          ? _throw(new TypeError("illegal semigroup argument"))
          : true)
            (arrAppend)
    : arrAppend,
  arrAppendT: TC
    ? fun(({chain, of}) => mmx => mmy =>
        chain(mmy) (my =>
          introspect(my) !== "Array"
            ? _throw(new TypeError("illegal semigroup argument"))
            : true))
              (arrAppendT)
    : arrAppendT,
  ARRAY,
  arrChain,
  arrChain_,
  arrChain2,
  arrChain3,
  arrChain4,
  arrChain5,
  arrChain6,
  arrChainn,
  arrChainT,
  arrClone,
  arrCons,
  arrCons_,
  arrEmpty,
  arrEq,
  arrFilter,
  arrFold,
  arrFold1: TC
    ? fun(f => xs =>
        introspect(xs) !== "Array" || xs.length === 0
          ? _throw(new TypeError("non-empty array expected"))
          : true)
            (arrFold1)
    : arrFold1,
  arrFoldk,
  arrFoldr,
  arrFoldT,
  arrJoin,
  arrKomp,
  arrKomp3,
  arrKomp4,
  arrKomp5,
  arrKomp6,
  arrKompn,
  arrLiftA2,
  arrLiftA3,
  arrLiftA4,
  arrLiftA5,
  arrLiftA6,
  arrLiftAn,
  arrMap,
  arrMapA,
  arrOf,
  arrOfT,
  arrPartition,
  arrPrepend: TC
    ? fun(ys =>
        introspect(ys) !== "Array"
          ? _throw(new TypeError("illegal semigroup argument"))
          : true)
            (arrPrepend)
    : arrPrepend,
  arrRead,
  arrSeqA,
  arrShow,
  arrSnoc,
  arrSnoc_,
  arrSum,
  arrUncons,
  arrUnfold,
  arrUnsnoc,
  arrZero,
  Base,
  BOOL,
  boolMaxBound,
  boolMinBound,
  Chain,
  chain2,
  chain3,
  chain4,
  chain5,
  chain6,
  chainEff,
  chainn,
  cmpAppend,
  cmpContra,
  cmpEmpty,
  cmpPrepend,
  comp: TC ? fun_(comp) : comp,
  comp3,
  comp4,
  comp5,
  comp6,
  comp2nd,
  Compare,
  compBin,
  compn,
  compOn,
  concat,
  Cons,
  Cons_,
  ConsT,
  _const,
  const_,
  Cont,
  contAp,
  contAppend,
  contChain,
  contEmpty,
  contLiftA2,
  contLiftA3,
  contLiftA4,
  contLiftA5,
  contLiftA6,
  contMap,
  contOf,
  contPrepend,
  ContT,
  contChainT,
  contLiftT,
  contOfT,
  ctorAppend,
  ctorEmpty,
  ctorPrepend,
  curry,
  curry3,
  curry4,
  debug,
  debugIf,
  delayPara,
  delayTask,
  dec,
  Defer,
  deferAp,
  deferChain,
  deferJoin,
  deferMap,
  deferOf,
  div,
  drop,
  dropk,
  dropr,
  dropWhile,
  dropWhilek,
  dropWhiler,
  eff,
  effChain,
  effChainT,
  Effect,
  effOf,
  effOfT,
  Either,
  eithAp,
  eithChain,
  eithChainT,
  eithMap,
  eithOf,
  eithOfT,
  endoAppend,
  endoEmpty,
  endoPrepend,
  EQ,
  Equiv,
  equivAppend,
  equivContra,
  equivEmpty,
  equivPrepend,
  fileRead_,
  fileWrite_,
  filter,
  filterk,
  filterr,
  First,
  firstAppend,
  firstPrepend,
  fix,
  fix_,
  fix2,
  flip,
  foldMap,
  foldMapr,
  formatDate,
  formatDay,
  formatFrac,
  formatInt,
  formatMonth,
  formatNum,
  formatWeekday,
  formatYear,
  fromNullable,
  fun,
  fun_,
  funAp,
  funAppend,
  funChain,
  funEmpty,
  funJoin,
  funLiftA2,
  funLiftA3,
  funLiftA4,
  funLiftA5,
  funLiftA6,
  funMap,
  funOf,
  funPrepend,
  GT,
  guard,
  Hamt,
  hamtDel,
  hamtGet,
  hamtHas,
  hamtSet,
  hamtUpd,
  iarrCons,
  iarrDel,
  iarrGet,
  iarrHas,
  iarrFold,
  iarrFoldr,
  iarrFromArr,
  iarrItor,
  iarrEmpty,
  iarrSet,
  iarrSnoc,
  iarrToArr,
  iarrUncons,
  iarrUnsnoc,
  id: TC ? fun_(id) : id,
  ifElse,
  inc,
  infix,
  infix3,
  infix4,
  infix5,
  infix6,
  infixr3,
  infixr4,
  infixr5,
  infixr6,
  introspect,
  isUnit,
  iterate,
  join,
  komp,
  komp3,
  komp4,
  komp5,
  komp6,
  kompn,
  Last,
  lastAppend,
  lastPrepend,
  lazy,
  Lazy,
  lazyAp,
  lazyChain,
  lazyJoin,
  lazyMap,
  lazyOf,
  lazyProp,
  Left,
  _let,
  liftA2,
  liftA3,
  liftA4,
  liftA5,
  liftA6,
  liftAn,
  List,
  listAp,
  listAltT,
  listAppend,
  listAppendT: TC
    ? fun(({chain, of}) => mmx => mmy =>
        chain(mmy) (my =>
          introspect(my) !== "ListT"
            ? _throw(new TypeError("illegal semigroup argument"))
            : true))
              (listAppendT)
    : listAppendT,
  listChain,
  listChainT,
  listCons,
  listCons_,
  listEmpty,
  listFold,
  listFoldr,
  listFoldrT,
  listFoldT,
  listFromArr,
  listFromArrT,
  listLiftA2,
  listLiftA3,
  listLiftA4,
  listLiftA5,
  listLiftA6,
  listLiftT,
  listMap,
  listOf,
  listOfT,
  listPrepend,
  ListT,
  listToArr,
  listToArrT,
  listUnfoldr,
  listZeroT,
  log,
  Loop,
  LT,
  mapDel,
  mapEff,
  mapHas,
  mapGet,
  mapSet,
  mapUpd,
  map,
  mapk,
  mapr,
  match: TC ? fun_(match) : match,
  Max,
  maxAppend,
  maxn,
  maxPrepend,
  mfix,
  Min,
  minAppend,
  minn,
  minPrepend,
  mod,
  moduloRec,
  moduloRec2,
  monadRec,
  mul,
  neg,
  _new,
  Nil,
  NilT,
  Node,
  Node_,
  None,
  not,
  notf,
  _null,
  NUM,
  numCeil,
  numCompare,
  numFloor,
  numGt,
  numGte,
  numLt,
  numLte,
  numMax,
  numMaxBound,
  numMin,
  numMinBound,
  numPred,
  numRead,
  numRound,
  numShow,
  numSucc,
  numTrunc,
  obj,
  objClone,
  objEntries,
  objFilter,
  objFold,
  objGet,
  objGetOr,
  objGetPath,
  objGetPathOr,
  objKeys,
  objMap,
  objPartition,
  objSetPath,
  objUpdPath,
  objValues,
  Of,
  Option,
  optAp,
  optAppend,
  optChain,
  optEmpty,
  optLiftA2,
  optLiftA3,
  optLiftA4,
  optLiftA5,
  optLiftA6,
  optMap,
  optmAppend,
  optmEmpty,
  optmPrepend,
  optOf,
  optPrepend,
  or,
  orf,
  Pair,
  Pair_,
  pairMap,
  pairMap1st,
  Parallel,
  paraAll,
  paraAnd,
  paraAp,
  paraAppend,
  paraEmpty,
  paraLiftA2,
  paraLiftA3,
  paraLiftA4,
  paraLiftA5,
  paraLiftA6,
  paraMap,
  paraMap_,
  paraOf,
  paraOr,
  paraPrepend,
  paraRecover,
  partial,
  partialProps,
  pow,
  Pred,
  predAppend,
  predContra,
  predEmpty,
  predPrepend,
  PREFIX,
  Prod,
  prodAppend,
  prodEmpty,
  prodPrepend,
  Quad,
  Quad_,
  quadMap,
  quadMap1st,
  quadMap2nd,
  quadMap3rd,
  raceAppend,
  raceEmpty,
  racePrepend,
  recChain,
  recMap,
  recOf,
  record: TC ? fun_(record) : record,
  repeat,
  reset,
  Rex,
  Rexf,
  Rexg,
  Rexu,
  Right,
  scanDir_,
  ScriptumError,
  select,
  setDel,
  setHas,
  setSet,
  shift,
  Some,
  State,
  stateAp,
  stateChain,
  stateEval,
  stateExec,
  stateGet,
  stateGets,
  stateMap,
  stateModify,
  stateOf,
  statePut,
  strAppend,
  strEmpty,
  strict,
  strictRec,
  strFold,
  strFoldChunk,
  strFoldChunkr,
  strFoldr,
  strIncludes,
  strMatch,
  strMatchAll,
  strMatchLast,
  strMatchNth,
  strMatchSection,
  strParse,
  strPrepend,
  strReplace,
  strReplaceBy,
  sub,
  Sum,
  sumAppend,
  sumEmpty,
  sumPrepend,
  taggedLog,
  tailRec,
  take,
  takek,
  taker,
  takeWhile,
  takeWhile_,
  takeWhilek,
  takeWhiler,
  Task,
  taskAll,
  taskAnd,
  taskAp,
  taskAppend,
  taskChain,
  taskEmpty,
  taskLiftA2,
  taskLiftA3,
  taskLiftA4,
  taskLiftA5,
  taskLiftA6,
  taskMap,
  taskMap_,
  taskOf,
  taskPrepend,
  taskRecover,
  thisify,
  _throw,
  throwOn,
  throwOnEmpty,
  throwOnFalse,
  throwOnUnit,
  thunk,
  tlikeFold,
  tlikeMap,
  trace,
  transduce,
  treeCata,
  treeCata_,
  treeCountLeafs,
  treeCountNodes,
  treeFold,
  treeFoldLevel,
  treeFoldr,
  treeHeight,
  treeLeafs,
  treeLevels,
  treeMap,
  treeMapLeafs,
  treeMapNodes,
  treeNodes,
  treePaths,
  Triple,
  Triple_,
  tripMap,
  tripMap1st,
  tripMap2nd,
  uncurry,
  uncurry3,
  uncurry4,
  union: TC ? fun_(union) : union,
  unprop,
  unprop2,
  Wind,
  Wind2,
  Writer,
  writerAp,
  writerCensor,
  writerChain,
  writerExec,
  writerListen,
  writerListens,
  writerMap,
  writerMapBoth,
  writerOf,
  writerPass,
  writerTell,
  Unwind,
  Unwind2
};

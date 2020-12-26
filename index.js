/*
                           ,,                                                
                           db             mm                                 
                                          MM                                 
,pP"Ybd  ,p6"bo `7Mb,od8 `7MM `7MMpdMAo.mmMMmm `7MM  `7MM  `7MMpMMMb.pMMMb.  
8I   `" 6M'  OO   MM' "'   MM   MM   `Wb  MM     MM    MM    MM    MM    MM  
`YMMMa. 8M        MM       MM   MM    M8  MM     MM    MM    MM    MM    MM  
L.   I8 YM.    ,  MM       MM   MM   ,AP  MM     MM    MM    MM    MM    MM  
M9mmmP'  YMbmd' .JMML.   .JMML. MMbmmd'   `Mbmo  `Mbod"YML..JMML  JMML  JMML.
                                MM                                           
                              .JMML.                                        
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


const MICROTASK_TRESHOLD = 0.01;


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
  f[FUN] ? f : new Proxy(f, new FunProxy(pred));


const fun_ = fun(null);


const obj = o => {
  if (o[OBJ]) return o;

  for (let [k, v] of (objEntries(o))) {
    if (isUnit(v))
      throw new TypeError("illegal property unit type");

    else if (typeof v === "function")
      o[k] = fun_(v);

    else if (v !== null && typeof v === "object")
      o[k] = obj(v);
  }

  return new Proxy(o, new ObjProxy());
};


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

    if (this.pred !== null) {
      this.pred = this.pred(...args)
// may ei ^^^^^^^^^^^^^^^^^^ ther return a boolean or another predicate

      if (this.pred === false)
        throw new TypeError("illegal argument type");
    }

    const r = f(...args);

    if (isUnit(r))
      throw new TypeError("illegal return unit type");

    else if (typeof r === "function")
      return typeof this.pred === "function" ? fun(this.pred) (r) : fun_(r);

    else if (typeof this.pred === "function")
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

    else if (k === FUN)
      return false;

    else if (k === THUNK)
      return o[k];

    if (k === Symbol.toPrimitive)
      throw new TypeError("illegal type coercion");

    else if (typeof o[k] === "function" && !o[k] [THUNK])
      return fun_(o[k].bind(o));

    else return o[k];
  }

  set(o, k, v) {
    if (o[k] && o[k] [THUNK]) {
// allow mutati ^^^^^^^^^^^^ ons to replace once evaluated thunks with its
// result
      o[k] = v;
      return true;      
    }

    else
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


const matchAs = (tx, o) => o[tx.tag] (tx, tx);
// deconstruct the 1st argument and   ^^  ^^ pass the 2nd one as is


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
**************************[ TRAMPOLINES/INTERPRETER ]**************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
****************************[ DEFUNCTIONALIZATION ]****************************
******************************************************************************/


const defunc = o => {
  while (o.tag === "Call")
    o = o.f(o.call);

  return o.tag === "Return"
    ? o.return
    : _throw(new TypeError("unknown trampoline tag"));
};


/***[ Tags ]******************************************************************/


const Call = f => call =>
  ({tag: "Call", f, call});


const Call_ = (f, call) =>
  ({tag: "Call", f, call});


const Return = _return =>
  ({tag: "Return", return: _return});


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


/***[ Applicative ]***********************************************************/


const recAp = tf => tx =>
  recChain(tf) (f =>
    recChain(tx) (x =>
      Of(f(x))));


// recOf @Derived


/***[ Functor ]***************************************************************/


const recMap = f => tx =>
  recChain(tx) (x => Of(f(x)));


/***[ Monad ]*****************************************************************/


const recChain = mx => fm =>
  mx.tag === "Chain" ? Chain(mx.chain) (x => recChain(mx.fm(x)) (fm))
    : mx.tag === "Of" ? fm(mx.of)
    : _throw(new TypeError("unknown trampoline tag"));


/***[ Tags ]******************************************************************/


const Chain = chain => fm =>
  ({tag: "Chain", fm, chain});


const Of = of =>
  ({tag: "Of", of});


/***[ Derived ]***************************************************************/


const recOf = Of;


/******************************************************************************
***************************[ MODULO CONS RECURSION ]***************************
******************************************************************************/


const moduloRec = o => {
  const stack = [];

  while (o.tag === "Wind") {
    stack.push(o);
    o = o.g(o.wind);
  }    

  return o.tag === "Unwind"
    ? stack.reduceRight(
        (acc, p) => p.f(acc), o.unwind)
    : _throw(new TypeError("unknown trampoline tag"));
};


/***[ Tags ]******************************************************************/


const Unwind = unwind =>
  ({tag: "Unwind", unwind});


const Wind = f => g => wind =>
  ({tag: "Wind", f, g, wind});


const Wind_ = (f, g, wind) =>
  ({tag: "Wind", f, g, wind});


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
************************************[ IX ]*************************************
******************************************************************************/


/***[ Getters/Setters ]*******************************************************/


const _1st = ([x]) => x;


const _2nd = ([, y]) => y;


const _3rd = ([,, z]) => z;


const _4th = ([,,, z]) => z;


/******************************************************************************
*********************************[ LIST-LIKE ]*********************************
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


const _do = ({chain, of}) => init => gtor => {
  const go = ({done, value: x}) =>
    done
      ? of(x)
      : chain(x) (y => go(it.next(y)));

  const it = gtor(init);
  return go(it.next());
};


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
          gm(acc_)))
            (fm === undefined ? x : fm(x))
              (fs);


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


// Please note that their is no distinct non-empty array type in scriptum,
// since I fail to see the benefits of such type.


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


const arrDel = i => xs =>
  xs.slice(0, i)
    .concat(xs.slice(i + 1));


const arrGet = i => xs =>
  i < xs.length
    ? Some(xs[i])
    : None;


const arrGetOr = def => i => xs =>
  i < xs.length
    ? xs[i]
    : def;


const arrGetWith = i => xs =>
  Pair(
    i < xs.length
      ? Some(xs[i])
      : None,
    xs);


const arrIns = i => x => xs =>
  xs.slice(0, i)
    .concat(x, xs.slice(i));


const arrRem = i => xs =>
  Pair(
    xs[i],
    xs.slice(0, i)
      .concat(xs.slice(i + 1)));


const arrSet = i => x => xs =>
  xs.slice(0, i)
    .concat(x, xs.slice(i + 1));


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


const arrUpd = i => f => xs =>
  xs.slice(0, i)
    .concat(f(xs[i]), xs.slice(i + 1));


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
      ? Pair(ys.concat([x]), zs)
      : Pair(ys, zs.concat([x])))
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


/***[ Optics ]****************************************************************/


const arrGetter = i =>
  Optic(_ => f => xs =>
    constMap(id)
      (f(xs[i])));


const arrLens = i =>
  Optic(map => f => xs =>
    map(x => arrSet(i) (x) (xs))
      (f(xs[i])));


const arrLensAt = i =>
  Optic(map => f => xs =>
    map(tx =>
      match(tx, {
        None: _ => arrDel(i) (xs),
        Some: ({some: x}) => arrIns(i) (x) (xs)
      })) (f(xs[i])));


const arrLensOpt = i =>
  Optic(map => f => xs =>
    map(x => arrSet(i) (x) (xs))
      (f(xs && i < xs.length ? xs[i] : null)));
// null is necessary to keep optional  ^^^^ lenses composable


const arrSetter = i =>
  Optic(_ => f => xs =>
    idMap(x => arrSet(i) (x) (xs))
      (f(xs[i])));


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


const arrSeqA = ({fold, map, ap, of}) => // TODO: refactor to liftA2
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


/***[ Miscellaneous ]*********************************************************/


const arrNull = xs =>
  xs.length === 0;


const arrReverse = xs => xs.reverse();


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


/***[ Async ]*****************************************************************/


const _async = k => f => // internal
  Promise.resolve(null)
    .then(_ => k(f));


const delayf = Cons => f => ms => x =>
  Cons(k => setTimeout(comp(k) (f), ms, x));


/***[ Category ]**************************************************************/


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
  defunc(arrFold(f => g =>
    x => Call_(f, g(x))) (x => Return(x)) (fs) (x));


const compOn = f => g => x => y =>
  f(g(x)) (g(y));


const id = x => x;


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


const log = (...ss) =>
  (console.log(...ss), ss[ss.length - 1]);


const taggedLog = tag => (...ss) =>
  (console.log(tag, ...ss), ss[ss.length - 1]);


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


const fix_ = comp(defunc) (fix);


const fix2 = compBin(moduloRec) (fix);


const flip = f => y => x =>
  f(x) (y);


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


const _Map = pairs => new Map(pairs);


/***[ Getters/Setters ]*******************************************************/


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


const mapUpd = k => f => m =>
  m.has(k)
    ? new Map(m).set(k, f(m.get(k)))
    : m;


/***[ Optics ]****************************************************************/


const mapGetter = k =>
  Optic(_ => f => m =>
    constMap(id)
      (f(m.get(k))));


const mapLens = k =>
  Optic(map => f => m =>
    map(v => mapSet(k) (v) (m))
      (f(m.get(k))));


const mapLensOpt = k =>
  Optic(map => f => m =>
    map(v => mapSet(k) (v) (m))
      (f(m && m.has(k) ? m.get(k) : null)));
// null is necessary to keep option ^^^^ al lenses composable


const mapSetter = k =>
  Optic(_ => f => m =>
    idMap(v => mapSet(k) (v) (m))
      (f(m.get(k))));


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


/***[ Miscellaneous ]*********************************************************/


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


const objDecon = k => ({[k]: k, ...o}) =>
  Pair(k, o);


const thisify = f => f({});


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
      ? Pair(xs.concat([prop]), ys)
      : Pair(xs, ys.concat([prop])))
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


const objDel = k => ({[k]: _, ...o}) => o;


const objDelPath = (...ks) => o =>
  arrFold(([p, ref, root]) => (k, i) => {
    if (!(k in p))
      return root;

    else if (i === ks.length - 1) {
      delete p[k];
      return root;
    }
    
    else if (Array.isArray(ref[k]))
      p[k] = ref[k].concat();

    else
      p[k] = Object.assign({}, ref[k]);

    return [p[k], ref[k], root];
  }) (thisify(p => [Object.assign(p, o), o, p])) (ks);


const objGet = k => o =>
  o[k] === undefined
    ? None
    : Some(o[k]);


const objGetOr = def => k => o =>
  k in o ? o[k] : def;


const objGetPath = (...ks) => o => {
  const go = (acc, i) =>
    i === ks.length ? Some(acc)
      : ks[i] in acc ? go(acc[ks[i]], i + 1)
      : None;

  return go(o, 0);
};


const objGetPathOr = def => (...ks) => o => {
  const go = (acc, i) =>
    i === ks.length ? acc
      : ks[i] in acc ? go(acc[ks[i]], i + 1)
      : def;

  return go(o, 0);
};


const objSet = k => v => o =>
  ({...o, [k]: v});


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


const objUpd = k => f => o =>
  k in o
    ? ({...o, [k]: f(o[k])})
    : o;


const objUpdPath = (...ks) => f => o =>
  arrFold(([p, ref, root]) => (k, i) => {
    if (!(k in p))
      return root;

    else if (i === ks.length - 1) {
      p[k] = f(ref[k]);
      return root;
    }

    else if (Array.isArray(ref[k]))
      p[k] = ref[k].concat();

    else
      p[k] = Object.assign({}, ref[k]);

    return [p[k], ref[k], root];
  }) (thisify(p => [Object.assign(p, o), o, p])) (ks);


/***[ Optics ]****************************************************************/


const objGetter = k =>
  Optic(_ => f => o =>
    constMap(id)
      (f(o[k])));


const objLens = k =>
  Optic(map => f => o =>
    map(v => objSet(k) (v) (o))
      (f(o[k])));


const objLensOpt = k =>
  Optic(map => f => o =>
    map(v => objSet(k) (v) (o))
      (f(o && k in o ? o[k] : null)));
// null is necessary to keep  ^^^^ optional lenses composable


const objSetter = k =>
  Optic(_ => f => o =>
    idMap(v => objSet(k) (v) (o))
      (f(o[k])));


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


const _Set = xs => new Set(xs);


/***[ Getters/Setters ]*******************************************************/


const setDel = k => s =>
  s.has(k)
    ? new Set(s).delete(k)
    : s;


const setHas = k => s =>
  s.has(k);


const setSet = k => v => s =>
  new Set(s).add(k, v);


/***[ Optics ]****************************************************************/


const setGetter = k =>
  Optic(_ => f => s =>
    constMap(id)
      (f(s.has(k))));


const setLens = k =>
  Optic(map => f => s =>
    map(v => mapSet(k) (v) (s))
      (f(s.has(k))));


const setSetter = k =>
  Optic(_ => f => s =>
    idMap(v => mapSet(k) (v) (s))
      (f(s.has(k))));


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


/***[ Getters/Setters ]*******************************************************/


// TODO


/***[ Monoid ]****************************************************************/


const strAppend = s => t => s.concat(t); // TODO: enforce strings


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


/***[ Optics ]****************************************************************/


// TODO


/***[ Regex based ]***********************************************************/


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
      : strict(tail))
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


const All = all => record(All, {all});


/***[ Monoid ]****************************************************************/


const allAppend = tx => ty =>
  All(tx.all && ty.all);


const allPrepend = allAppend; // commutative


const allEmpty = All(true);


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = any => record(Any, {any});


/***[ Monoid ]****************************************************************/


const anyAppend = tx => ty =>
  Any(tx.any || ty.any);


const anyPrepend = anyAppend; // commutative


const anyEmpty = Any(false);


/******************************************************************************
***********************************[ COMP ]************************************
******************************************************************************/


const Comp = comp => record(Comp, {comp});


/***[Applicative]*************************************************************/


const compAp = ({liftA2, ap}) => ttf => ttx =>
  Comp(liftA2(ap) (ttf.comp) (ttx.comp));


const compOf = ({of1, of2}) => x =>
  Comp(of1(of2(x)));


/***[Functor]*****************************************************************/


const compMap = ({map1, map2}) => f => ttx =>
  Comp(map1(map2(f)) (ttx.comp));


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


const Compare = cmp => record(Compare, {cmp});


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
***********************************[ CONST ]***********************************
******************************************************************************/


const Const = _const => record(Const, {const: _const});


/***[Applicative]*************************************************************/


const constAp = append => ({const: f}) => ({const: x}) =>
  Const(append(f) (x));


const constOf = empty => _ => Const(empty);


/***[Functor]*****************************************************************/


const constMap = _ => ({const: x}) => Const(x);


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


const Cont = k => record(Cont, {cont: k});


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
*********************************[ COYONEDA ]**********************************
******************************************************************************/


const Coyoneda = f => x =>
  record(Coyoneda, {coyo: Pair(f, x)});


/***[ Applicative ]***********************************************************/


const coyoAp = liftA2 => ({coyo: [f, tx]}) => ({coyo: [g, ty]}) =>
  coyoLift(
    liftA2(x => y =>
      f(x) (g(y))) (tx) (ty));


const coyoOf = of => f =>
  comp(coyoLift) (of);


/***[ Con-/Deconstruction ]***************************************************/


const coyoLift = tx => Coyoneda(id) (tx);


const coyoLower = map => ({coyo: [f, tx]}) =>
  map(f) (tx);


/***[ Functor ]***************************************************************/


const coyoMap = map => f => ({coyo: [g, tx]}) =>
  Coyoneda(comp(f) (g)) (tx);


/***[ Monad ]*****************************************************************/


const coyoChain = chain => ({coyo: [f, mx]}) => fm =>
  coyoLift(chain(mx) (comp3(coyoLower) (fm) (f)));


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


/******************************************************************************
***********************************[ ENDO ]************************************
******************************************************************************/


/***[ Monoid ]****************************************************************/


const endoAppend = comp; // TODO: enforce a -> a


const endoPrepend = funContra;  // TODO: enforce a -> a


const endoEmpty = id;


/******************************************************************************
************************************[ ENV ]************************************
******************************************************************************/


const Env = e => x => record(Env, {env: Pair(e, x)});


/***[ Comonad ]***************************************************************/


const envExtend = wf => wx =>
  Env(wx.env[0]) (wf(wx));


const envExtract = ({env: [, x]}) => x;


/******************************************************************************
***********************************[ EQUIV ]***********************************
******************************************************************************/


const Equiv = equiv => record(Equiv, {equiv});


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


const First = first => record(First, {first});


/***[ Semigroup ]*************************************************************/


const firstAppend = x => _ => x;


// firstPrepend @DERIVED


/******************************************************************************
**********************************[ IARRAY ]***********************************
******************************************************************************/


const IArray = Hamt(
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
    x)) (IArray);


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
    : Some(Pair(
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
    : Some(Pair(
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


/***[ Miscellaneous ]*********************************************************/


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
************************************[ ID ]*************************************
******************************************************************************/


const Id = id => record(Id, {id});


/***[Applicative]*************************************************************/


const idAp = ({id: f}) => ({id: x}) => Id(f(x));


const idOf = x => Id(x);


/***[Comonad]*****************************************************************/


const idExtract = tw => tw.id;


const idDuplicate = Id;


const idExtend = f => comp(Id) (f);


/***[Functor]*****************************************************************/


const idMap = f => ({id: x}) => Id(f(x));


/***[Monad]*******************************************************************/


const idChain = ({id: x}) => fm => fm(x);


/******************************************************************************
***********************************[ IMAP ]************************************
******************************************************************************/


// TODO: add insertion order map + key ordered map + unordered map


/******************************************************************************
***********************************[ ISET ]************************************
******************************************************************************/


// TODO: add insertion order set + unordered set


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


const Last = last => record(Last, {last});


/***[ Semigroup ]*************************************************************/


const lastAppend = _ => y => y;


const lastPrepend = firstAppend;


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


// Please note that their is no distinct non-empty list type in scriptum,
// since I fail to see the benefits of such type.


const List = union("List");


const Cons = head => tail =>
  List(Cons, {head, tail});


const Cons_ = tail => head =>
  List(Cons, {head, tail});


const Nil = List("Nil", {});


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


const listUncons = xs =>
  match(xs, {
    Nil: _ => None,
    Cons: ({head, tail}) => Some(Pair(head, tail))
  });


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
    Cons(x) (thunk(() => go(f(x))));

  return go;
};


const repeat = x =>
  Cons(x) (thunk(() => repeat(x)));


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


/***[ Miscellaneous ]*********************************************************/


const listHead = ({head: x}) => x;


const listInit = xs => {
  const go = ({head: x, tail: xs_}) => match(xs_, {
    Nil: _ => Unwind(Nil),
    Cons: _ => Wind(Cons(x)) (go) (xs_)
  });

  return moduloRec(go(xs));
};


const listLast =
  tailRec(({head: x, tail: xs}) =>
    match(xs, {
      Nil: _ => Base(x),
      Cons: _ => Loop(xs)
    }));


const listReverse = listFold(Cons_) (Nil);


const listTail = ({tail: xs}) => xs;


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
********************************[ LIST ZIPPER ]********************************
******************************************************************************/


const ListZipper = ls => x => rs =>
  record(ListZipper, {lzip: Triple(ls, x, rs)});


/***[ Comonad ]***************************************************************/


const lzipExtend = wf => tx =>
  ListZipper(
    lzipMap(wf) (comp(listTail) (iterate(lzipLeft)) (tx)))
      (wf(tx.lzip[1]))
        (lzipMap(wf) (comp(listTail) (iterate(lzipRight)) (tx)));


// lzipExtract @Derived


/***[ Conversion ]************************************************************/


const lzipFromList = ({head: x, tail: xs}) => ListZipper(Nil) (x) (xs);


const lzipFromListEnd = xs => {
  const {head: x, tail: xs_} = listReverse(xs_);
  return ListZipper(xs) (x) (Nil);
};


const lzipToList = ({lzip: [ls, x, rs]}) =>
  listAppend(listReverse(ls)) (Cons(x) (rs));


/***[ Getters/Setters ]*******************************************************/


const lzipCursor = ({lzip: [, x]}) => x;


const lzipDel = ({lzip: [ls,, rs]}) =>
  match(rs, {
    Nil: _ =>
      match(ls, {
        Nil: _ => _throw(new TypeError("illegal empty zipper")),
        Cons: ({head: x, tail: ls_}) => ListZipper(ls_) (x) (rs)
      }),

    Cons: ({head: x, tail: rs_}) => ListZipper(ls) (x) (rs_)
  });


const lzipIns = x => ({lzip: [ls, y, rs]}) =>
  ListZipper(ls) (x) (Cons(y) (rs));


const lzipSet = x => ({lzip: [ls,, rs]}) =>
  ListZipper(ls) (x) (rs);


const lzipUpd = f => ({lzip: [ls, x, rs]}) =>
  ListZipper(ls) (f(x)) (rs);


/***[ Foldable ]**************************************************************/


const lzipFold = f => acc => ({lzip: [, x, rs]}) =>
  listFold(f) (f(acc) (x)) (rs);


const lzipFoldr = f => acc => ({lzip: [, x, rs]}) =>
  listFoldr(f) (thunk(() => f(x) (acc))) (rs);


/***[ Functor ]***************************************************************/


const lzipMap = f => ({lzip: [ls, x, rs]}) =>
  ListZipper(listMap(f) (ls)) (f(x)) (listMap(f) (rs));


/***[ Navigation ]************************************************************/


const lzipEnd = ({lzip: [ls, x, rs]}) => {
  const {head: x_, tail: ls_} =
    listAppend(listReverse(rs)) (Cons(x) (ls));

  return ListZipper(ls_) (x_) (Nil);
};


const lzipLeft = ({lzip: [ls, x, rs]}) =>
  match(ls, {
    Nil: _ => ListZipper(ls) (x) (rs),
    Cons: ({head: x_, tail: ls_}) =>
      ListZipper(ls_) (x_) (Cons(x) (rs))
  });


const lzipRight = ({lzip: [ls, x, rs]}) =>
  match(rs, {
    Nil: _ => ListZipper(ls) (x) (rs),
    Cons: ({head: x_, tail: rs_}) =>
      ListZipper(Cons(x) (ls)) (x_) (rs_)
  });


const lzipStart = ({lzip: [ls, x, rs]}) => {
  const {head: x_, tail: rs_} =
    listAppend(listReverse(Cons(x) (ls))) (rs);

  return ListZipper(Nil) (x_) (rs_);
};


/***[ Predicates ]************************************************************/


const lzipIsEnd = ({lzip: [,, rs]}) =>
  match(rs, {
    Nil: _ => true,
    Cons: _ => false
  });


const lzipIsStart = ({lzip: [ls]}) =>
  match(ls, {
    Nil: _ => true,
    Cons: _ => false
  });


/***[ Derived ]***************************************************************/


const lzipExtract = lzipCursor;


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = max => record(Max, {max});


/***[ Monoid ]****************************************************************/


const maxAppend = max => x => y =>
  Max(max(x) (y));


const maxPrepend = maxAppend;


const maxEmpty = minBound => Max(minBound);


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = min => record(Min, {min});


/***[ Monoid ]****************************************************************/


const minAppend = min => x => y =>
  Min(min(x) (y));


const minPrepend = minAppend;


const minEmpty = maxBound => Min(maxBound);


/******************************************************************************
**********************************[ MUTABLE ]**********************************
******************************************************************************/


const Mutable = clone => refType => // strict variant
  record(Mutable, app(([o, refType]) => {
    o.mutable = {
      run: k => {
        o.mutable.run = _ => {
          throw new TypeError("illegal subsequent inspection");
        };

        o.mutable.set = _ => {
          throw new TypeError("illegal subsequent mutation");
        };

        return k(refType);
      },

      set: k => {
        k(refType);
        return o;
      }
    }

    return o;
  }) ([{}, clone(refType)]));


const Mutable_ = clone => refType => // non-strict variant
  record(Mutable, app(([o, queue, refType]) => {
    o.mutable = {
      run: k => {
        o.mutable.run = _ => {
          throw new TypeError("illegal subsequent inspection");
        };

        o.mutable.set = _ => {
          throw new TypeError("illegal subsequent mutation");
        };

        for (k_ of queue)
          k_(refType);

        return k(refType);
      },

      set: k => {
        queue.push(k);
        return o;
      }
    }

    return o;
  }) ([{}, [], clone(refType)]));


/******************************************************************************
***********************************[ OPTIC ]***********************************
******************************************************************************/


const Optic = optic => record(Optic, {optic});


/***[Category]****************************************************************/


const opticComp = tx => ty =>
  Optic(map => f =>
    tx.optic(map) (ty.optic(map) (f)));


const opticComp3 = tx => ty => tz =>
  Optic(map => f =>
    tx.optic(map) (ty.optic(map) (tz.optic(map) (f))));


const opticId = Optic(id);


/***[ Getters/Setters ]*******************************************************/


const opticDel = tx => o =>
  tx.optic(idMap) (_const(Id(None))) (o);


const opticGet = tx => o =>
  tx.optic(constMap) (Const) (o);


const opticGetOpt = tx => o =>
  tx.optic(constMap) (x => Const(fromNullable(x))) (o);


const opticIns = tx => v => o =>
  tx.optic(idMap) (_const(Id(Some(v)))) (o);


const opticSet = tx => v => o =>
  tx.optic(idMap) (_const(Id(v))) (o);


const opticUpd = tx => f => o =>
  tx.optic(idMap) (v => Id(f(v))) (o);


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


/***[ Miscellaneous ]*********************************************************/


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


// TODO: add cancellation


const Parallel = para => record(
  Parallel,
  thisify(o => {
    o.para = k =>
      para(x => {
        o.para = k_ => k_(x);
        return k(x);
      });
    
    if (Math.random() < MICROTASK_TRESHOLD) // defer to next microtask
      o.para = _async(o.para);

    return o;
  }));


/***[ Applicative ]***********************************************************/


const paraAp = tf => tx =>
  Parallel(k =>
    paraAnd(tf) (tx)
      .para(([f, x]) =>
         k(f(x))));


// paraLiftA2 @Derived


// paraLiftA3 @Derived


// paraLiftA4 @Derived


// paraLiftA5 @Derived


// paraLiftA6 @Derived


const paraOf = x => Parallel(k => k(x));


/***[ Functor ]***************************************************************/


const paraMap = f => tx =>
  Parallel(k => tx.para(x => k(f(x))));


/***[ Monoid (type parameter) ]***********************************************/


const paraAppend = append => tx => ty =>
  Parallel(k =>
    paraAnd(tx) (ty)
      .para(([x, y]) =>
        k(append(x) (y))));


const paraPrepend = paraAppend; // pass prepend as type dictionary

  
const paraEmpty = empty =>
  Parallel(k => k(empty));


/***[ Monoid (race) ]*********************************************************/


// TODO: move to distinct Race type


// raceAppend @Derived


// racePrepend @Derived


const raceEmpty = Parallel(k => null);


/***[ Miscellaneous ]*********************************************************/


const paraAnd = tx => ty => {
  const guard = (k, i) => x => {
    pair[i] = x;

    return settled || !("0" in pair) || !("1" in pair)
      ? false
      : (settled = true, k(Pair(pair[0], pair[1])));
  };

  const pair = [];
  let settled = false;

  return Parallel(k => (
    tx.para(guard(k, 0)),
    ty.para(guard(k, 1))));
};


const paraAll = arrSeqA({
  fold: arrFold,
  map: paraMap,
  ap: paraAp,
  of: paraOf});


const paraAny =
  arrFold(acc => tx =>
    paraOr(acc) (tx))
      (raceEmpty);


const paraOr = tx => ty => {
  const guard = k => x =>
    settled
      ? false
      : (settled = true, k(x));

  let settled = false;

  return Parallel(k => (
    tx.para(guard(k)),
    ty.para(guard(k))));
};


/***[ Derived ]***************************************************************/


const raceAppend = paraOr;


const paraLiftA2 = liftA2({map: paraMap, ap: paraAp});


const paraLiftA3 = liftA3({map: paraMap, ap: paraAp});


const paraLiftA4 = liftA4({map: paraMap, ap: paraAp});


const paraLiftA5 = liftA5({map: paraMap, ap: paraAp});


const paraLiftA6 = liftA6({map: paraMap, ap: paraAp});


const racePrepend = paraOr; // order doesn't matter


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


const State = f => record(State, {state: f});


/***[ Applicative ]***********************************************************/


const stateAp = tf => tx =>
  State(s => {
    const [f, s_] = tf.state(s),
      [x, s__] = tx.state(s_);

    return Pair(f(x), s__);
  });


const stateOf = x => State(s => Pair(x, s));


/***[ Functor ]***************************************************************/


const stateMap = f => tx =>
  State(s => {
    const [x, s_] = tx.state(s);
    return Pair(f(x), s_);
  });


/***[ Monad ]*****************************************************************/


const stateChain = mx => fm =>
  State(s => {
    const [x, s_] = mx.state(s);
    return fm(x).state(s_);
  });


/***[ Miscellaneous ]*********************************************************/


const stateEval = tf =>
  s => tf.state(s) [0];


const stateExec = tf =>
  s => tf.state(s) [1];


const stateGet = State(s => Pair(s, s));


const stateGets = f =>
  State(s => Pair(f(s), s));


const stateModify = f =>
  State(s => Pair(null, f(s)));


const statePut = s =>
  State(_ => Pair(null, s));


/******************************************************************************
***********************************[ STORE ]***********************************
******************************************************************************/


const Store = f => x => record(Store, {store: Pair(f, x)});


/***[ Comonad ]***************************************************************/


const storeExtend = wf => ({store: [f, x]}) =>
  Store(comp(wf) (Store(f))) (x);


const storeExtract = ({store: [f, x]}) => f(x);


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


// Task is run sequentially if it is composes either with Applicative or Monad.
// There is no guarantee that two distinct Tasks run in lexical order, because
// one can run synchronously whereas the other in the next microtask of the
// event loop. Task is stack-safe because every hundredth constructed value is
// invoked within the next microtask.


// TODO: add cancellation


const Task = task => record(
  Task,
  thisify(o => {
    o.task = k =>
      task(x => {
        o.task = k_ => k_(x); // sharing of once computed tasks
        return k(x);
      });

    if (Math.random() < MICROTASK_TRESHOLD) // defer to next microtask
      o.task = _async(o.task);

    return o;
  }));


/***[ Applicative ]***********************************************************/


const taskAp = tf => tx =>
  Task(k =>
    taskAnd(tf) (tx)
      .task(([f, x]) =>
         k(f(x))));


// taskLiftA2 @Derived


// taskLiftA3 @Derived


// taskLiftA4 @Derived


// taskLiftA5 @Derived


// taskLiftA6 @Derived


const taskOf = x => Task(k => k(x));


/***[ Functor ]***************************************************************/


const taskMap = f => tx =>
  Task(k => tx.task(x => k(f(x))));


/***[ Monad ]*****************************************************************/


const taskChain = mx => fm =>
  Task(k => mx.task(x => fm(x).task(k)));


/***[ Monoid ]****************************************************************/


const taskAppend = append => tx => ty =>
  Task(k => taskAnd(tx) (ty)
    .task(([x, y]) => k(append(x) (y))));


const taskPrepend = taskAppend; // pass prepend as type dictionary


const taskEmpty = empty => Task(k => k(empty));


/***[ Miscellaneous ]*********************************************************/


const taskAnd = tx => ty =>
  Task(k => tx.task(x =>
    ty.task(y =>
      k([x, y]))));


const taskAll = arrSeqA({
  fold: arrFold,
  map: taskMap,
  ap: taskAp,
  of: taskOf});


/***[ Derived ]***************************************************************/


const taskLiftA2 = liftA2({map: taskMap, ap: taskAp});


const taskLiftA3 = liftA3({map: taskMap, ap: taskAp});


const taskLiftA4 = liftA4({map: taskMap, ap: taskAp});


const taskLiftA5 = liftA5({map: taskMap, ap: taskAp});


const taskLiftA6 = liftA6({map: taskMap, ap: taskAp});


/******************************************************************************
**********************************[ TRACED ]***********************************
******************************************************************************/


const Traced = f => record(Traced, {traced: f});


/***[ Comonad ]***************************************************************/


const traceExtend = fw => ({traced: f}) =>
  Traced(x => fw(y => f(append(x) (y))));


const traceExtract = empty => ({traced: f}) => f(empty);


/******************************************************************************
********************************[ TREE (LIKE) ]********************************
******************************************************************************/


// Tree-like data structure shaped of arbitrarily nested object and arrays,
// like {foo: [1, {bat: {baz: "abc"}}, 3], bar: true} for instance.


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
      (notf(arrNull)))
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


const Pair = (_1, _2) => record(Pair, {
  0: _1,
  1: _2,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
  }});


const Triple = (_1, _2, _3) => record(Triple, {
  0: _1,
  1: _2,
  2: _3,
  [Symbol.iterator]: function*() {
    yield _1;
    yield _2;
    yield _3;
  }});


const Quad = (_1, _2, _3, _4) => record(Quad, {
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
  Pair(x, f(y));


const pairMap1st = f => ([x, y]) =>
  Pair(f(x), y);


const tripMap = f => ([x, y, z]) =>
  Triple(x, y, f(z));


const tripMap1st = f => ([x, y, z]) =>
  Triple(f(x), y, z);


const tripMap2nd = f => ([x, y, z]) =>
  Triple(x, f(y), z);


const quadMap = f => ([w, x, y, z]) =>
  Quad(w, x, y, f(z));


const quadMap1st = f => ([w, x, y, z]) =>
  Quad(f(w), x, y, z);


const quadMap2nd = f => ([w, x, y, z]) =>
  Quad(w, f(x), y, z);


const quadMap3rd = f => ([w, x, y, z]) =>
  Quad(w, x, f(y), z);


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = x => w => record(Writer, {writer: Pair(x, w)});


/***[ Applicative ]***********************************************************/


const writerAp = append => ({writer: [f, w]}) => ({writer: [x, w_]}) =>
  Writer(f(x)) (append(w) (w_));


const writerOf = empty => x =>
  Writer(x) (empty);


/***[ Functor ]***************************************************************/


const writerMap = f => ({writer: [x, w]}) =>
  Writer(f(x)) (w);


/***[ Monad ]*****************************************************************/


const writerChain = append => ({writer: [x, w]}) => fm => {
  const [x_, w_] = fm(x).writer;
  return Writer(x_) (append(w) (w_));
};


/***[ Miscellaneous ]*********************************************************/


const writerCensor = ({append, empty}) => f => tx =>
  writerPass(
    writerChain(append) (tx) (x =>
      writerOf(empty) (Pair(x, f))));


const writerExec = ({writer: [_, w]}) => w;


const writerListen = ({writer: [x, w]}) =>
  Writer(Pair(x, w)) (w);


const writerListens = f => ({writer: [x, w]}) =>
  Writer(Pair(x, f(w))) (w);


const writerMapBoth = f => tx =>
  Writer(f(tx.writer));


const writerPass = ({writer: [[x, f], w]}) =>
  Writer(x) (f(w));


const writerTell = w => Writer(null) (w);


/******************************************************************************
**********************************[ YONEDA ]***********************************
******************************************************************************/


const Yoneda = yoneda => record(Yoneda, {yoneda});


/***[ Applicative ]***********************************************************/


const yoAp = ap => tf => tx =>
  Yoneda(f =>
    ap(tf.yoneda(comp(f)))
      (id(tx.yoneda)));


const yoOf = of => x => Yoneda(f => of(f(x)));


/***[ Functor ]***************************************************************/


const yoMap = f => tx =>
  Yoneda(g => tx.yoneda(comp(g) (f)));


/***[ Con-/Deconstruction ]***************************************************/


const yoLift = map => tx =>
  Yoneda(f => map(f) (tx));


const yoLower = tx => tx.yoneda(id);


/***[ Monad ]*****************************************************************/


const yoChain = chain => mx => fm =>
  Yoneda(f =>
    chain(mx.yoneda(id)) (x =>
      fm(x).yoneda(f)));


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


const ArrayT = x => record(ArrayT, [x]); // type synonym


// TODO: change to ArrayT type synonym


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
***********************************[ CONTT ]***********************************
******************************************************************************/


const ContT = k => record(ContT, {contt: k});


/***[ Monad ]*****************************************************************/


const contChainT = mmk => fmm =>
  ContT(k => mmk.contt(x => fmm(x).contt(k)));


const contLiftT = chain => mmk =>
  ContT(k => chain(mmk) (k));


const contOfT = x => ContT(k => k(x));


/******************************************************************************
**********************************[ DEFERT ]***********************************
******************************************************************************/


// TODO: add type


/***[ Monad ]*****************************************************************/


const deferChainT = ({map, chain, of}) => mmx => fmm =>
  chain(mmx) (mx =>
    Defer(() => map(my => my.defer) (fmm(mx.defer))));


const deferOfT = of => x => of(Defer(() => x));


/******************************************************************************
**********************************[ EITHERT ]**********************************
******************************************************************************/


// TODO: add type


/***[ Monad ]*****************************************************************/


const eithChainT = ({chain, of}) => mmx => fmm =>
  chain(mmx) (mx =>
    match(mx, {
      Left: ({left: x}) => of(Left(x)),
      Right: ({right: y}) => fmm(y)
    }));


const eithOfT = of => x => of(Right(x));


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
        NilT: _ => strict(mmy), // strictness is necessary
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
      NilT: _ => strict(acc), // strictness is necessary
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
  _1st: TC ? fun_(_1st) : _1st,
  _2nd: TC ? fun_(_2nd) : _2nd,
  _3rd: TC ? fun_(_3rd) : _3rd,
  _4th: TC ? fun_(_4th) : _4th,
  add: TC ? fun_(add) : add,
  All: TC ? fun_(All) : All,
  all: TC ? fun_(all) : all,
  allAppend: TC ? fun_(allAppend) : allAppend,
  allEmpty: TC ? fun_(allEmpty) : allEmpty,
  allPrepend: TC ? fun_(allPrepend) : allPrepend,
  and: TC ? fun_(and) : and,
  andf: TC ? fun_(andf) : andf,
  Any: TC ? fun_(Any) : Any,
  any: TC ? fun_(any) : any,
  anyAppend: TC ? fun_(anyAppend) : anyAppend,
  anyEmpty: TC ? fun_(anyEmpty) : anyEmpty,
  anyPrepend: TC ? fun_(anyPrepend) : anyPrepend,
  apEff: TC ? fun_(apEff) : apEff,
  apEff_: TC ? fun_(apEff_) : apEff_,
  app: TC ? fun_(app) : app,
  app_: TC ? fun_(app_) : app_,
  appn: TC ? fun_(appn) : appn,
  appr: TC ? fun_(appr) : appr,
  appRest: TC ? fun_(appRest) : appRest,
  appSpread: TC ? fun_(appSpread) : appSpread,
  arrAlt: TC ? fun_(arrAlt) : arrAlt,
  arrAp: TC ? fun_(arrAp) : arrAp,
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
  ArrayT: TC ? fun_(ArrayT) : ArrayT,
  arrChain: TC ? fun_(arrChain) : arrChain,
  arrChain_: TC ? fun_(arrChain_) : arrChain_,
  arrChain2: TC ? fun_(arrChain2) : arrChain2,
  arrChain3: TC ? fun_(arrChain3) : arrChain3,
  arrChain4: TC ? fun_(arrChain4) : arrChain4,
  arrChain5: TC ? fun_(arrChain5) : arrChain5,
  arrChain6: TC ? fun_(arrChain6) : arrChain6,
  arrChainn: TC ? fun_(arrChainn) : arrChainn,
  arrChainT: TC ? fun_(arrChainT) : arrChainT,
  arrClone: TC ? fun_(arrClone) : arrClone,
  arrCons: TC ? fun_(arrCons) : arrCons,
  arrCons_: TC ? fun_(arrCons_) : arrCons_,
  arrDel: TC ? fun_(arrDel) : arrDel,
  arrEmpty: TC ? fun_(arrEmpty) : arrEmpty,
  arrEq: TC ? fun_(arrEq) : arrEq,
  arrFilter: TC ? fun_(arrFilter) : arrFilter,
  arrFold: TC ? fun_(arrFold) : arrFold,
  arrFold1: TC
    ? fun(f => xs =>
        introspect(xs) !== "Array" || xs.length === 0
          ? _throw(new TypeError("non-empty array expected"))
          : true)
            (arrFold1)
    : arrFold1,
  arrFoldk: TC ? fun_(arrFoldk) : arrFoldk,
  arrFoldr: TC ? fun_(arrFoldr) : arrFoldr,
  arrFoldT: TC ? fun_(arrFoldT) : arrFoldT,
  arrGet: TC ? fun_(arrGet) : arrGet,
  arrGetOr: TC ? fun_(arrGetOr) : arrGetOr,
  arrGetWith: TC ? fun_(arrGetWith) : arrGetWith,
  arrGetter: TC ? fun_(arrGetter) : arrGetter,
  arrIns: TC ? fun_(arrIns) : arrIns,
  arrJoin: TC ? fun_(arrJoin) : arrJoin,
  arrKomp: TC ? fun_(arrKomp) : arrKomp,
  arrKomp3: TC ? fun_(arrKomp3) : arrKomp3,
  arrKomp4: TC ? fun_(arrKomp4) : arrKomp4,
  arrKomp5: TC ? fun_(arrKomp5) : arrKomp5,
  arrKomp6: TC ? fun_(arrKomp6) : arrKomp6,
  arrKompn: TC ? fun_(arrKompn) : arrKompn,
  arrLens: TC ? fun_(arrLens) : arrLens,
  arrLensAt: TC ? fun_(arrLensAt) : arrLensAt,
  arrLensOpt: TC ? fun_(arrLensOpt) : arrLensOpt,
  arrLiftA2: TC ? fun_(arrLiftA2) : arrLiftA2,
  arrLiftA3: TC ? fun_(arrLiftA3) : arrLiftA3,
  arrLiftA4: TC ? fun_(arrLiftA4) : arrLiftA4,
  arrLiftA5: TC ? fun_(arrLiftA5) : arrLiftA5,
  arrLiftA6: TC ? fun_(arrLiftA6) : arrLiftA6,
  arrLiftAn: TC ? fun_(arrLiftAn) : arrLiftAn,
  arrMap: TC ? fun_(arrMap) : arrMap,
  arrMapA: TC ? fun_(arrMapA) : arrMapA,
  arrNull: TC ? fun_(arrNull) : arrNull,
  arrOf: TC ? fun_(arrOf) : arrOf,
  arrOfT: TC ? fun_(arrOfT) : arrOfT,
  arrPartition: TC ? fun_(arrPartition) : arrPartition,
  arrPrepend: TC
    ? fun(ys =>
        introspect(ys) !== "Array"
          ? _throw(new TypeError("illegal semigroup argument"))
          : true)
            (arrPrepend)
    : arrPrepend,
  arrRead: TC ? fun_(arrRead) : arrRead,
  arrRem: TC ? fun_(arrRem) : arrRem,
  arrReverse: TC ? fun_(arrReverse) : arrReverse,
  arrSeqA: TC ? fun_(arrSeqA) : arrSeqA,
  arrSet: TC ? fun_(arrSet) : arrSet,
  arrSetter: TC ? fun_(arrSetter) : arrSetter,
  arrShow: TC ? fun_(arrShow) : arrShow,
  arrSnoc: TC ? fun_(arrSnoc) : arrSnoc,
  arrSnoc_: TC ? fun_(arrSnoc_) : arrSnoc_,
  arrSum: TC ? fun_(arrSum) : arrSum,
  arrUncons: TC ? fun_(arrUncons) : arrUncons,
  arrUnfold: TC ? fun_(arrUnfold) : arrUnfold,
  arrUnsnoc: TC ? fun_(arrUnsnoc) : arrUnsnoc,
  arrUpd: TC ? fun_(arrUpd) : arrUpd,
  arrZero: TC ? fun_(arrZero) : arrZero,
  Base: TC ? fun_(Base) : Base,
  BOOL,
  boolMaxBound,
  boolMinBound,
  Call,
  Call_,
  coyoAp: TC ? fun_(coyoAp) : coyoAp,
  coyoChain: TC ? fun_(coyoChain) : coyoChain,
  coyoLift: TC ? fun_(coyoLift) : coyoLift,
  coyoLower: TC ? fun_(coyoLower) : coyoLower,
  coyoMap: TC ? fun_(coyoMap) : coyoMap,
  Coyoneda: TC ? fun_(Coyoneda) : Coyoneda,
  coyoOf: TC ? fun_(coyoOf) : coyoOf,
  Chain,
  chain2: TC ? fun_(chain2) : chain2,
  chain3: TC ? fun_(chain3) : chain3,
  chain4: TC ? fun_(chain4) : chain4,
  chain5: TC ? fun_(chain5) : chain5,
  chain6: TC ? fun_(chain6) : chain6,
  chainEff: TC ? fun_(chainEff) : chainEff,
  chainn: TC ? fun_(chainn) : chainn,
  cmpAppend: TC ? fun_(cmpAppend) : cmpAppend,
  cmpContra: TC ? fun_(cmpContra) : cmpContra,
  cmpEmpty: TC ? fun_(cmpEmpty) : cmpEmpty,
  cmpPrepend: TC ? fun_(cmpPrepend) : cmpPrepend,
  Comp: TC ? fun_(Comp) : Comp,
  comp: TC ? fun_(comp) : comp,
  comp3: TC ? fun_(comp3) : comp3,
  comp4: TC ? fun_(comp4) : comp4,
  comp5: TC ? fun_(comp5) : comp5,
  comp6: TC ? fun_(comp6) : comp6,
  comp2nd: TC ? fun_(comp2nd) : comp2nd,
  compAp: TC ? fun_(compAp) : compAp,
  Compare: TC ? fun_(Compare) : Compare,
  compBin: TC ? fun_(compBin) : compBin,
  compMap: TC ? fun_(compMap) : compMap,
  compn: TC ? fun_(compn) : compn,
  compOf: TC ? fun_(compOf) : compOf,
  compOn: TC ? fun_(compOn) : compOn,
  concat: TC ? fun_(concat) : concat,
  Cons: TC ? fun_(Cons) : Cons,
  Cons_: TC ? fun_(Cons_) : Cons_,
  ConsT: TC ? fun_(ConsT) : ConsT,
  Const: TC ? fun_(Const) : Const,
  _const: TC ? fun_(_const) : _const,
  const_: TC ? fun_(const_) : const_,
  constAp: TC ? fun_(constAp) : constAp,
  constMap: TC ? fun_(constMap) : constMap,
  constOf: TC ? fun_(constOf) : constOf,
  Cont: TC ? fun_(Cont) : Cont,
  contAp: TC ? fun_(contAp) : contAp,
  contAppend: TC ? fun_(contAppend) : contAppend,
  contChain: TC ? fun_(contChain) : contChain,
  contEmpty: TC ? fun_(contEmpty) : contEmpty,
  contLiftA2: TC ? fun_(contLiftA2) : contLiftA2,
  contLiftA3: TC ? fun_(contLiftA3) : contLiftA3,
  contLiftA4: TC ? fun_(contLiftA4) : contLiftA4,
  contLiftA5: TC ? fun_(contLiftA5) : contLiftA5,
  contLiftA6: TC ? fun_(contLiftA6) : contLiftA6,
  contMap: TC ? fun_(contMap) : contMap,
  contOf: TC ? fun_(contOf) : contOf,
  contPrepend: TC ? fun_(contPrepend) : contPrepend,
  ContT: TC ? fun_(ContT) : ContT,
  contChainT: TC ? fun_(contChainT) : contChainT,
  contLiftT: TC ? fun_(contLiftT) : contLiftT,
  contOfT: TC ? fun_(contOfT) : contOfT,
  ctorAppend: TC ? fun_(ctorAppend) : ctorAppend,
  ctorEmpty: TC ? fun_(ctorEmpty) : ctorEmpty,
  ctorPrepend: TC ? fun_(ctorPrepend) : ctorPrepend,
  curry: TC ? fun_(curry) : curry,
  curry3: TC ? fun_(curry3) : curry3,
  curry4: TC ? fun_(curry4) : curry4,
  debug,
  debugIf,
  delayf: TC ? fun_(delayf) : delayf,
  dec: TC ? fun_(dec) : dec,
  Defer: TC ? fun_(Defer) : Defer,
  deferAp: TC ? fun_(deferAp) : deferAp,
  deferChain: TC ? fun_(deferChain) : deferChain,
  deferChainT: TC ? fun_(deferChainT) : deferChainT,
  deferJoin: TC ? fun_(deferJoin) : deferJoin,
  deferMap: TC ? fun_(deferMap) : deferMap,
  deferOf: TC ? fun_(deferOf) : deferOf,
  deferOfT: TC ? fun_(deferOfT) : deferOfT,
  defunc: TC ? fun_(defunc) : defunc,
  div: TC ? fun_(div) : div,
  _do: TC ? fun_(_do) : _do,
  drop: TC ? fun_(drop) : drop,
  dropk: TC ? fun_(dropk) : dropk,
  dropr: TC ? fun_(dropr) : dropr,
  dropWhile: TC ? fun_(dropWhile) : dropWhile,
  dropWhilek: TC ? fun_(dropWhilek) : dropWhilek,
  dropWhiler: TC ? fun_(dropWhiler) : dropWhiler,
  Either: TC ? fun_(Either) : Either,
  eithAp: TC ? fun_(eithAp) : eithAp,
  eithChain: TC ? fun_(eithChain) : eithChain,
  eithChainT: TC ? fun_(eithChainT) : eithChainT,
  eithMap: TC ? fun_(eithMap) : eithMap,
  eithOf: TC ? fun_(eithOf) : eithOf,
  eithOfT: TC ? fun_(eithOfT) : eithOfT,
  endoAppend: TC ? fun_(endoAppend) : endoAppend,
  endoEmpty: TC ? fun_(endoEmpty) : endoEmpty,
  endoPrepend: TC ? fun_(endoPrepend) : endoPrepend,
  Env: TC ? fun_(Env) : Env,
  envExtend: TC ? fun_(envExtend) : envExtend,
  envExtract: TC ? fun_(envExtract) : envExtract,
  EQ,
  Equiv: TC ? fun_(Equiv) : Equiv,
  equivAppend: TC ? fun_(equivAppend) : equivAppend,
  equivContra: TC ? fun_(equivContra) : equivContra,
  equivEmpty: TC ? fun_(equivEmpty) : equivEmpty,
  equivPrepend: TC ? fun_(equivPrepend) : equivPrepend,
  fileRead_: TC ? fun_(fileRead_) : fileRead_,
  fileWrite_: TC ? fun_(fileWrite_) : fileWrite_,
  filter: TC ? fun_(filter) : filter,
  filterk: TC ? fun_(filterk) : filterk,
  filterr: TC ? fun_(filterr) : filterr,
  First: TC ? fun_(First) : First,
  firstAppend: TC ? fun_(firstAppend) : firstAppend,
  firstPrepend: TC ? fun_(firstPrepend) : firstPrepend,
  fix: TC ? fun_(fix) : fix,
  fix_: TC ? fun_(fix_) : fix_,
  fix2: TC ? fun_(fix2) : fix2,
  flip: TC ? fun_(flip) : flip,
  foldMap: TC ? fun_(foldMap) : foldMap,
  foldMapr: TC ? fun_(foldMapr) : foldMapr,
  formatDate: TC ? fun_(formatDate) : formatDate,
  formatDay: TC ? fun_(formatDay) : formatDay,
  formatFrac: TC ? fun_(formatFrac) : formatFrac,
  formatInt: TC ? fun_(formatInt) : formatInt,
  formatMonth: TC ? fun_(formatMonth) : formatMonth,
  formatNum: TC ? fun_(formatNum) : formatNum,
  formatWeekday: TC ? fun_(formatWeekday) : formatWeekday,
  formatYear: TC ? fun_(formatYear) : formatYear,
  fromNullable: TC ? fun_(fromNullable) : fromNullable,
  fun,
  fun_,
  funAp: TC ? fun_(funAp) : funAp,
  funAppend: TC ? fun_(funAppend) : funAppend,
  funChain: TC ? fun_(funChain) : funChain,
  funEmpty: TC ? fun_(funEmpty) : funEmpty,
  funJoin: TC ? fun_(funJoin) : funJoin,
  funLiftA2: TC ? fun_(funLiftA2) : funLiftA2,
  funLiftA3: TC ? fun_(funLiftA3) : funLiftA3,
  funLiftA4: TC ? fun_(funLiftA4) : funLiftA4,
  funLiftA5: TC ? fun_(funLiftA5) : funLiftA5,
  funLiftA6: TC ? fun_(funLiftA6) : funLiftA6,
  funMap: TC ? fun_(funMap) : funMap,
  funOf: TC ? fun_(funOf) : funOf,
  funPrepend: TC ? fun_(funPrepend) : funPrepend,
  GT,
  guard: TC ? fun_(guard) : guard,
  Hamt: TC ? fun_(Hamt) : Hamt,
  hamtDel: TC ? fun_(hamtDel) : hamtDel,
  hamtGet: TC ? fun_(hamtGet) : hamtGet,
  hamtHas: TC ? fun_(hamtHas) : hamtHas,
  hamtSet: TC ? fun_(hamtSet) : hamtSet,
  hamtUpd: TC ? fun_(hamtUpd) : hamtUpd,
  IArray: TC ? fun_(IArray) : IArray,
  iarrCons: TC ? fun_(iarrCons) : iarrCons,
  iarrDel: TC ? fun_(iarrDel) : iarrDel,
  iarrGet: TC ? fun_(iarrGet) : iarrGet,
  iarrHas: TC ? fun_(iarrHas) : iarrHas,
  iarrFold: TC ? fun_(iarrFold) : iarrFold,
  iarrFoldr: TC ? fun_(iarrFoldr) : iarrFoldr,
  iarrFromArr: TC ? fun_(iarrFromArr) : iarrFromArr,
  iarrItor: TC ? fun_(iarrItor) : iarrItor,
  iarrSet: TC ? fun_(iarrSet) : iarrSet,
  iarrSnoc: TC ? fun_(iarrSnoc) : iarrSnoc,
  iarrToArr: TC ? fun_(iarrToArr) : iarrToArr,
  iarrUncons: TC ? fun_(iarrUncons) : iarrUncons,
  iarrUnsnoc: TC ? fun_(iarrUnsnoc) : iarrUnsnoc,
  Id: TC ? fun_(Id) : Id,
  id: TC ? fun_(id) : id,
  idAp: TC ? fun_(idAp) : idAp,
  idChain: TC ? fun_(idChain) : idChain,
  idDuplicate: TC ? fun_(idDuplicate) : idDuplicate,
  idExtend: TC ? fun_(idExtend) : idExtend,
  idExtract: TC ? fun_(idExtract) : idExtract,
  idMap: TC ? fun_(idMap) : idMap,
  idOf: TC ? fun_(idOf) : idOf,
  ifElse: TC ? fun_(ifElse) : ifElse,
  inc: TC ? fun_(inc) : inc,
  infix: TC ? fun_(infix) : infix,
  infix3: TC ? fun_(infix3) : infix3,
  infix4: TC ? fun_(infix4) : infix4,
  infix5: TC ? fun_(infix5) : infix5,
  infix6: TC ? fun_(infix6) : infix6,
  infixr3: TC ? fun_(infixr3) : infixr3,
  infixr4: TC ? fun_(infixr4) : infixr4,
  infixr5: TC ? fun_(infixr5) : infixr5,
  infixr6: TC ? fun_(infixr6) : infixr6,
  introspect,
  isUnit,
  iterate: TC ? fun_(iterate) : iterate,
  join: TC ? fun_(join) : join,
  komp: TC ? fun_(komp) : komp,
  komp3: TC ? fun_(komp3) : komp3,
  komp4: TC ? fun_(komp4) : komp4,
  komp5: TC ? fun_(komp5) : komp5,
  komp6: TC ? fun_(komp6) : komp6,
  kompn: TC ? fun_(kompn) : kompn,
  Last: TC ? fun_(Last) : Last,
  lastAppend: TC ? fun_(lastAppend) : lastAppend,
  lastPrepend: TC ? fun_(lastPrepend) : lastPrepend,
  lazy: TC ? fun_(lazy) : lazy,
  Lazy: TC ? fun_(Lazy) : Lazy,
  lazyAp: TC ? fun_(lazyAp) : lazyAp,
  lazyChain: TC ? fun_(lazyChain) : lazyChain,
  lazyJoin: TC ? fun_(lazyJoin) : lazyJoin,
  lazyMap: TC ? fun_(lazyMap) : lazyMap,
  lazyOf: TC ? fun_(lazyOf) : lazyOf,
  lazyProp: TC ? fun_(lazyProp) : lazyProp,
  Left: TC ? fun_(Left) : Left,
  _let: TC ? fun_(_let) : _let,
  liftA2: TC ? fun_(liftA2) : liftA2,
  liftA3: TC ? fun_(liftA3) : liftA3,
  liftA4: TC ? fun_(liftA4) : liftA4,
  liftA5: TC ? fun_(liftA5) : liftA5,
  liftA6: TC ? fun_(liftA6) : liftA6,
  liftAn: TC ? fun_(liftAn) : liftAn,
  List: TC ? fun_(List) : List,
  listAp: TC ? fun_(listAp) : listAp,
  listAltT: TC ? fun_(listAltT) : listAltT,
  listAppend: TC ? fun_(listAppend) : listAppend,
  listAppendT: TC
    ? fun(({chain, of}) => mmx => mmy =>
        chain(mmy) (my =>
          introspect(my) !== "ListT"
            ? _throw(new TypeError("illegal semigroup argument"))
            : true))
              (listAppendT)
    : listAppendT,
  listChain: TC ? fun_(listChain) : listChain,
  listChainT: TC ? fun_(listChainT) : listChainT,
  listEmpty: TC ? fun_(listEmpty) : listEmpty,
  listFold: TC ? fun_(listFold) : listFold,
  listFoldr: TC ? fun_(listFoldr) : listFoldr,
  listFoldrT: TC ? fun_(listFoldrT) : listFoldrT,
  listFoldT: TC ? fun_(listFoldT) : listFoldT,
  listFromArr: TC ? fun_(listFromArr) : listFromArr,
  listFromArrT: TC ? fun_(listFromArrT) : listFromArrT,
  listHead: TC ? fun_(listHead) : listHead,
  listInit: TC ? fun_(listInit) : listInit,
  listLast: TC ? fun_(listLast) : listLast,
  listLiftA2: TC ? fun_(listLiftA2) : listLiftA2,
  listLiftA3: TC ? fun_(listLiftA3) : listLiftA3,
  listLiftA4: TC ? fun_(listLiftA4) : listLiftA4,
  listLiftA5: TC ? fun_(listLiftA5) : listLiftA5,
  listLiftA6: TC ? fun_(listLiftA6) : listLiftA6,
  listLiftT: TC ? fun_(listLiftT) : listLiftT,
  listMap: TC ? fun_(listMap) : listMap,
  listOf: TC ? fun_(listOf) : listOf,
  listOfT: TC ? fun_(listOfT) : listOfT,
  listPrepend: TC ? fun_(listPrepend) : listPrepend,
  listReverse: TC ? fun_(listReverse) : listReverse,
  ListT: TC ? fun_(ListT) : ListT,
  listTail: TC ? fun_(listTail) : listTail,
  listToArr: TC ? fun_(listToArr) : listToArr,
  listToArrT: TC ? fun_(listToArrT) : listToArrT,
  listUncons: TC ? fun_(listUncons) : listUncons,
  listUnfoldr: TC ? fun_(listUnfoldr) : listUnfoldr,
  listZeroT: TC ? fun_(listZeroT) : listZeroT,
  ListZipper: TC ? fun_(ListZipper) : ListZipper,
  log,
  Loop,
  LT,
  lzipCursor: TC ? fun_(lzipCursor) : lzipCursor,
  lzipDel: TC ? fun_(lzipDel) : lzipDel,
  lzipEnd: TC ? fun_(lzipEnd) : lzipEnd,
  lzipExtend: TC ? fun_(lzipExtend) : lzipExtend,
  lzipExtract: TC ? fun_(lzipExtract) : lzipExtract,
  lzipFold: TC ? fun_(lzipFold) : lzipFold,
  lzipFoldr: TC ? fun_(lzipFoldr) : lzipFoldr,
  lzipFromList: TC ? fun_(lzipFromList) : lzipFromList,
  lzipFromListEnd: TC ? fun_(lzipFromListEnd) : lzipFromListEnd,
  lzipIns: TC ? fun_(lzipIns) : lzipIns,
  lzipIsEnd: TC ? fun_(lzipIsEnd) : lzipIsEnd,
  lzipIsStart: TC ? fun_(lzipIsStart) : lzipIsStart,
  lzipLeft: TC ? fun_(lzipLeft) : lzipLeft,
  lzipMap: TC ? fun_(lzipMap) : lzipMap,
  lzipRight: TC ? fun_(lzipRight) : lzipRight,
  lzipSet: TC ? fun_(lzipSet) : lzipSet,
  lzipStart: TC ? fun_(lzipStart) : lzipStart,
  lzipToList: TC ? fun_(lzipToList) : lzipToList,
  lzipUpd: TC ? fun_(lzipUpd) : lzipUpd,
  mapDel: TC ? fun_(mapDel) : mapDel,
  mapEff: TC ? fun_(mapEff) : mapEff,
  mapHas: TC ? fun_(mapHas) : mapHas,
  mapGet: TC ? fun_(mapGet) : mapGet,
  mapGetter: TC ? fun_(mapGetter) : mapGetter,
  mapLens: TC ? fun_(mapLens) : mapLens,
  mapLensOpt: TC ? fun_(mapLensOpt) : mapLensOpt,
  mapSet: TC ? fun_(mapSet) : mapSet,
  mapSetter: TC ? fun_(mapSetter) : mapSetter,
  mapUpd: TC ? fun_(mapUpd) : mapUpd,
  map: TC ? fun_(map) : map,
  mapk: TC ? fun_(mapk) : mapk,
  mapr: TC ? fun_(mapr) : mapr,
  match: TC ? fun_(match) : match,
  matchAs: TC ? fun_(matchAs) : matchAs,
  Max: TC ? fun_(Max) : Max,
  maxAppend: TC ? fun_(maxAppend) : maxAppend,
  maxn: TC ? fun_(maxn) : maxn,
  maxPrepend: TC ? fun_(maxPrepend) : maxPrepend,
  Min: TC ? fun_(Min) : Min,
  minAppend: TC ? fun_(minAppend) : minAppend,
  minn: TC ? fun_(minn) : minn,
  minPrepend: TC ? fun_(minPrepend) : minPrepend,
  mod: TC ? fun_(mod) : mod,
  moduloRec: TC ? fun_(moduloRec) : moduloRec,
  monadRec: TC ? fun_(monadRec) : monadRec,
  mul: TC ? fun_(mul) : mul,
  Mutable: TC ? fun_(Mutable) : Mutable,
  Mutable_: TC ? fun_(Mutable_) : Mutable_,
  neg: TC ? fun_(neg) : neg,
  _new: TC ? fun_(_new) : _new,
  Nil,
  NilT: TC ? fun_(NilT) : NilT,
  Node: TC ? fun_(Node) : Node,
  Node_: TC ? fun_(Node_) : Node_,
  None,
  not: TC ? fun_(not) : not,
  notf: TC ? fun_(notf) : notf,
  NUM,
  numCeil: TC ? fun_(numCeil) : numCeil,
  numCompare: TC ? fun_(numCompare) : numCompare,
  numFloor: TC ? fun_(numFloor) : numFloor,
  numGt: TC ? fun_(numGt) : numGt,
  numGte: TC ? fun_(numGte) : numGte,
  numLt: TC ? fun_(numLt) : numLt,
  numLte: TC ? fun_(numLte) : numLte,
  numMax: TC ? fun_(numMax) : numMax,
  numMaxBound,
  numMin: TC ? fun_(numMin) : numMin,
  numMinBound,
  numPred: TC ? fun_(numPred) : numPred,
  numRead: TC ? fun_(numRead) : numRead,
  numRound: TC ? fun_(numRound) : numRound,
  numShow: TC ? fun_(numShow) : numShow,
  numSucc: TC ? fun_(numSucc) : numSucc,
  numTrunc: TC ? fun_(numTrunc) : numTrunc,
  obj,
  objClone: TC ? fun_(objClone) : objClone,
  objDecon: TC ? fun_(objDecon) : objDecon,
  objDel: TC ? fun_(objDel) : objDel,
  objDelPath: TC ? fun_(objDelPath) : objDelPath,
  objEntries: TC ? fun_(objEntries) : objEntries,
  objFilter: TC ? fun_(objFilter) : objFilter,
  objFold: TC ? fun_(objFold) : objFold,
  objGet: TC ? fun_(objGet) : objGet,
  objGetOr: TC ? fun_(objGetOr) : objGetOr,
  objGetPath: TC ? fun_(objGetPath) : objGetPath,
  objGetPathOr: TC ? fun_(objGetPathOr) : objGetPathOr,
  objGetter: TC ? fun_(objGetter) : objGetter,
  objKeys: TC ? fun_(objKeys) : objKeys,
  objLens: TC ? fun_(objLens) : objLens,
  objLensOpt: TC ? fun_(objLensOpt) : objLensOpt,
  objMap: TC ? fun_(objMap) : objMap,
  objPartition: TC ? fun_(objPartition) : objPartition,
  objSet: TC ? fun_(objSet) : objSet,
  objSetPath: TC ? fun_(objSetPath) : objSetPath,
  objSetter: TC ? fun_(objSetter) : objSetter,
  objUpd: TC ? fun_(objUpd) : objUpd,
  objUpdPath: TC ? fun_(objUpdPath) : objUpdPath,
  objValues: TC ? fun_(objValues) : objValues,
  Of,
  Option: TC ? fun_(Option) : Option,
  optAp: TC ? fun_(optAp) : optAp,
  optAppend: TC ? fun_(optAppend) : optAppend,
  optChain: TC ? fun_(optChain) : optChain,
  optEmpty: TC ? fun_(optEmpty) : optEmpty,
  Optic: TC ? fun_(Optic) : Optic,
  opticComp: TC ? fun_(opticComp) : opticComp,
  opticComp3: TC ? fun_(opticComp3) : opticComp3,
  opticDel: TC ? fun_(opticDel) : opticDel,
  opticGet: TC ? fun_(opticGet) : opticGet,
  opticGetOpt: TC ? fun_(opticGetOpt) : opticGetOpt,
  opticId: TC ? fun_(opticId) : opticId,
  opticIns: TC ? fun_(opticIns) : opticIns,
  opticSet: TC ? fun_(opticSet) : opticSet,
  opticUpd: TC ? fun_(opticUpd) : opticUpd,
  optLiftA2: TC ? fun_(optLiftA2) : optLiftA2,
  optLiftA3: TC ? fun_(optLiftA3) : optLiftA3,
  optLiftA4: TC ? fun_(optLiftA4) : optLiftA4,
  optLiftA5: TC ? fun_(optLiftA5) : optLiftA5,
  optLiftA6: TC ? fun_(optLiftA6) : optLiftA6,
  optMap: TC ? fun_(optMap) : optMap,
  optmAppend: TC ? fun_(optmAppend) : optmAppend,
  optmEmpty: TC ? fun_(optmEmpty) : optmEmpty,
  optmPrepend: TC ? fun_(optmPrepend) : optmPrepend,
  optOf: TC ? fun_(optOf) : optOf,
  optPrepend: TC ? fun_(optPrepend) : optPrepend,
  or: TC ? fun_(or) : or,
  orf: TC ? fun_(orf) : orf,
  Pair: TC ? fun_(Pair) : Pair,
  pairMap: TC ? fun_(pairMap) : pairMap,
  pairMap1st: TC ? fun_(pairMap1st) : pairMap1st,
  Parallel: TC ? fun_(Parallel) : Parallel,
  paraAll: TC ? fun_(paraAll) : paraAll,
  paraAnd: TC ? fun_(paraAnd) : paraAnd,
  paraAny: TC ? fun_(paraAny) : paraAny,
  paraAp: TC ? fun_(paraAp) : paraAp,
  paraAppend: TC ? fun_(paraAppend) : paraAppend,
  paraEmpty: TC ? fun_(paraEmpty) : paraEmpty,
  paraLiftA2: TC ? fun_(paraLiftA2) : paraLiftA2,
  paraLiftA3: TC ? fun_(paraLiftA3) : paraLiftA3,
  paraLiftA4: TC ? fun_(paraLiftA4) : paraLiftA4,
  paraLiftA5: TC ? fun_(paraLiftA5) : paraLiftA5,
  paraLiftA6: TC ? fun_(paraLiftA6) : paraLiftA6,
  paraMap: TC ? fun_(paraMap) : paraMap,
  paraOf: TC ? fun_(paraOf) : paraOf,
  paraOr: TC ? fun_(paraOr) : paraOr,
  paraPrepend: TC ? fun_(paraPrepend) : paraPrepend,
  partial: TC ? fun_(partial) : partial,
  partialProps: TC ? fun_(partialProps) : partialProps,
  pow: TC ? fun_(pow) : pow,
  Pred: TC ? fun_(Pred) : Pred,
  predAppend: TC ? fun_(predAppend) : predAppend,
  predContra: TC ? fun_(predContra) : predContra,
  predEmpty: TC ? fun_(predEmpty) : predEmpty,
  predPrepend: TC ? fun_(predPrepend) : predPrepend,
  PREFIX,
  Prod: TC ? fun_(Prod) : Prod,
  prodAppend: TC ? fun_(prodAppend) : prodAppend,
  prodEmpty: TC ? fun_(prodEmpty) : prodEmpty,
  prodPrepend: TC ? fun_(prodPrepend) : prodPrepend,
  Quad: TC ? fun_(Quad) : Quad,
  quadMap: TC ? fun_(quadMap) : quadMap,
  quadMap1st: TC ? fun_(quadMap1st) : quadMap1st,
  quadMap2nd: TC ? fun_(quadMap2nd) : quadMap2nd,
  quadMap3rd: TC ? fun_(quadMap3rd) : quadMap3rd,
  raceAppend: TC ? fun_(raceAppend) : raceAppend,
  raceEmpty: TC ? fun_(raceEmpty) : raceEmpty,
  racePrepend: TC ? fun_(racePrepend) : racePrepend,
  recAp: TC ? fun_(recAp) : recAp,
  recChain: TC ? fun_(recChain) : recChain,
  recMap: TC ? fun_(recMap) : recMap,
  recOf: TC ? fun_(recOf) : recOf,
  record: TC ? fun_(record) : record,
  repeat: TC ? fun_(repeat) : repeat,
  reset: TC ? fun_(reset) : reset,
  Return,
  Rex: TC ? fun_(Rex) : Rex,
  Rexf: TC ? fun_(Rexf) : Rexf,
  Rexg: TC ? fun_(Rexg) : Rexg,
  Rexu: TC ? fun_(Rexu) : Rexu,
  Right: TC ? fun_(Right) : Right,
  scanDir_: TC ? fun_(scanDir_) : scanDir_,
  ScriptumError,
  select: TC ? fun_(select) : select,
  setDel: TC ? fun_(setDel) : setDel,
  setGetter: TC ? fun_(setGetter) : setGetter,
  setHas: TC ? fun_(setHas) : setHas,
  setLens: TC ? fun_(setLens) : setLens,
  setSet: TC ? fun_(setSet) : setSet,
  setSetter: TC ? fun_(setSetter) : setSetter,
  shift: TC ? fun_(shift) : shift,
  Some: TC ? fun_(Some) : Some,
  State: TC ? fun_(State) : State,
  stateAp: TC ? fun_(stateAp) : stateAp,
  stateChain: TC ? fun_(stateChain) : stateChain,
  stateEval: TC ? fun_(stateEval) : stateEval,
  stateExec: TC ? fun_(stateExec) : stateExec,
  stateGet: TC ? fun_(stateGet) : stateGet,
  stateGets: TC ? fun_(stateGets) : stateGets,
  stateMap: TC ? fun_(stateMap) : stateMap,
  stateModify: TC ? fun_(stateModify) : stateModify,
  stateOf: TC ? fun_(stateOf) : stateOf,
  statePut: TC ? fun_(statePut) : statePut,
  Store: TC ? fun_(Store) : Store,
  storeExtend: TC ? fun_(storeExtend) : storeExtend,
  storeExtract: TC ? fun_(storeExtract) : storeExtract,
  strAppend: TC ? fun_(strAppend) : strAppend,
  strEmpty,
  strict: TC ? fun_(strict) : strict,
  strictRec: TC ? fun_(strictRec) : strictRec,
  strFold: TC ? fun_(strFold) : strFold,
  strFoldChunk: TC ? fun_(strFoldChunk) : strFoldChunk,
  strFoldChunkr: TC ? fun_(strFoldChunkr) : strFoldChunkr,
  strFoldr: TC ? fun_(strFoldr) : strFoldr,
  strIncludes: TC ? fun_(strIncludes) : strIncludes,
  strMatch: TC ? fun_(strMatch) : strMatch,
  strMatchAll: TC ? fun_(strMatchAll) : strMatchAll,
  strMatchLast: TC ? fun_(strMatchLast) : strMatchLast,
  strMatchNth: TC ? fun_(strMatchNth) : strMatchNth,
  strMatchSection: TC ? fun_(strMatchSection) : strMatchSection,
  strParse: TC ? fun_(strParse) : strParse,
  strPrepend: TC ? fun_(strPrepend) : strPrepend,
  strReplace: TC ? fun_(strReplace) : strReplace,
  strReplaceBy: TC ? fun_(strReplaceBy) : strReplaceBy,
  sub: TC ? fun_(sub) : sub,
  Sum: TC ? fun_(Sum) : Sum,
  sumAppend: TC ? fun_(sumAppend) : sumAppend,
  sumEmpty: TC ? fun_(sumEmpty) : sumEmpty,
  sumPrepend: TC ? fun_(sumPrepend) : sumPrepend,
  taggedLog,
  tailRec: TC ? fun_(tailRec) : tailRec,
  take: TC ? fun_(take) : take,
  takek: TC ? fun_(takek) : takek,
  taker: TC ? fun_(taker) : taker,
  takeWhile: TC ? fun_(takeWhile) : takeWhile,
  takeWhile_: TC ? fun_(takeWhile_) : takeWhile_,
  takeWhilek: TC ? fun_(takeWhilek) : takeWhilek,
  takeWhiler: TC ? fun_(takeWhiler) : takeWhiler,
  Task: TC ? fun_(Task) : Task,
  taskAll: TC ? fun_(taskAll) : taskAll,
  taskAnd: TC ? fun_(taskAnd) : taskAnd,
  taskAp: TC ? fun_(taskAp) : taskAp,
  taskAppend: TC ? fun_(taskAppend) : taskAppend,
  taskChain: TC ? fun_(taskChain) : taskChain,
  taskEmpty: TC ? fun_(taskEmpty) : taskEmpty,
  taskLiftA2: TC ? fun_(taskLiftA2) : taskLiftA2,
  taskLiftA3: TC ? fun_(taskLiftA3) : taskLiftA3,
  taskLiftA4: TC ? fun_(taskLiftA4) : taskLiftA4,
  taskLiftA5: TC ? fun_(taskLiftA5) : taskLiftA5,
  taskLiftA6: TC ? fun_(taskLiftA6) : taskLiftA6,
  taskMap: TC ? fun_(taskMap) : taskMap,
  taskOf: TC ? fun_(taskOf) : taskOf,
  taskPrepend: TC ? fun_(taskPrepend) : taskPrepend,
  thisify: TC ? fun_(thisify) : thisify,
  _throw: TC ? fun_(_throw) : _throw,
  throwOn: TC ? fun_(throwOn) : throwOn,
  throwOnEmpty: TC ? fun_(throwOnEmpty) : throwOnEmpty,
  throwOnFalse: TC ? fun_(throwOnFalse) : throwOnFalse,
  throwOnUnit: TC ? fun_(throwOnUnit) : throwOnUnit,
  thunk,
  tlikeFold: TC ? fun_(tlikeFold) : tlikeFold,
  tlikeMap: TC ? fun_(tlikeMap) : tlikeMap,
  trace,
  Traced: TC ? fun_(Traced) : Traced,
  traceExtend: TC ? fun_(traceExtend) : traceExtend,
  traceExtract: TC ? fun_(traceExtract) : traceExtract,
  transduce: TC ? fun_(transduce) : transduce,
  treeCata: TC ? fun_(treeCata) : treeCata,
  treeCata_: TC ? fun_(treeCata_) : treeCata_,
  treeCountLeafs: TC ? fun_(treeCountLeafs) : treeCountLeafs,
  treeCountNodes: TC ? fun_(treeCountNodes) : treeCountNodes,
  treeFold: TC ? fun_(treeFold) : treeFold,
  treeFoldLevel: TC ? fun_(treeFoldLevel) : treeFoldLevel,
  treeFoldr: TC ? fun_(treeFoldr) : treeFoldr,
  treeHeight: TC ? fun_(treeHeight) : treeHeight,
  treeLeafs: TC ? fun_(treeLeafs) : treeLeafs,
  treeLevels: TC ? fun_(treeLevels) : treeLevels,
  treeMap: TC ? fun_(treeMap) : treeMap,
  treeMapLeafs: TC ? fun_(treeMapLeafs) : treeMapLeafs,
  treeMapNodes: TC ? fun_(treeMapNodes) : treeMapNodes,
  treeNodes: TC ? fun_(treeNodes) : treeNodes,
  treePaths: TC ? fun_(treePaths) : treePaths,
  Triple: TC ? fun_(Triple) : Triple,
  tripMap: TC ? fun_(tripMap) : tripMap,
  tripMap1st: TC ? fun_(tripMap1st) : tripMap1st,
  tripMap2nd: TC ? fun_(tripMap2nd) : tripMap2nd,
  uncurry: TC ? fun_(uncurry) : uncurry,
  uncurry3: TC ? fun_(uncurry3) : uncurry3,
  uncurry4: TC ? fun_(uncurry4) : uncurry4,
  union: TC ? fun_(union) : union,
  Wind,
  Writer: TC ? fun_(Writer) : Writer,
  writerAp: TC ? fun_(writerAp) : writerAp,
  writerCensor: TC ? fun_(writerCensor) : writerCensor,
  writerChain: TC ? fun_(writerChain) : writerChain,
  writerExec: TC ? fun_(writerExec) : writerExec,
  writerListen: TC ? fun_(writerListen) : writerListen,
  writerListens: TC ? fun_(writerListens) : writerListens,
  writerMap: TC ? fun_(writerMap) : writerMap,
  writerMapBoth: TC ? fun_(writerMapBoth) : writerMapBoth,
  writerOf: TC ? fun_(writerOf) : writerOf,
  writerPass: TC ? fun_(writerPass) : writerPass,
  writerTell: TC ? fun_(writerTell) : writerTell,
  Unwind,
  yoAp: TC ? fun_(yoAp) : yoAp,
  yoChain: TC ? fun_(yoChain) : yoChain,
  yoLift: TC ? fun_(yoLift) : yoLift,
  yoLower: TC ? fun_(yoLower) : yoLower,
  yoMap: TC ? fun_(yoMap) : yoMap,
  Yoneda: TC ? fun_(Yoneda) : Yoneda,
  yoOf: TC ? fun_(yoOf) : yoOf
};

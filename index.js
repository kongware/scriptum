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
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const NOT_FOUND = -1;


const TYPE = Symbol.toStringTag;


/******************************************************************************
*******************************************************************************
**********************************[ ERRORS ]***********************************
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


/******************************************************************************
*******************************************************************************
***************************[ WEAK HEAD NORMAL FORM ]***************************
*******************************************************************************
******************************************************************************/


class ProxyHandler {
  constructor(f) {
    this.f = f;
    this.memo = undefined;
  }

  apply(g, that, args) {
    if (this.memo === undefined)
      this.memo = g();

    return this.memo(...args);
  }

  defineProperty(g, k, descriptor) { debugger;
    if (this.memo === undefined)
      this.memo = g();

    Object.defineProperty(this.memo, k, descriptor);
    return true;
  }

  get(g, k) {
    if (this.memo === undefined)
      this.memo = g();

    if (k === Symbol.toPrimitive)
      return () => this.memo;

    else if (k === "valueOf")
      return () => this.memo;

    else return this.memo[k];
  }

  has(g, k) {
    if (this.memo === undefined)
      this.memo = g();

    return k in this.memo;
  }

  set(g, k, v) {
    if (this.memo === undefined)
      this.memo = g();

    this.memo[k] = v;
    return true;
  }  
}


const thunk = f =>
  new Proxy(f, new ProxyHandler(f));


const strict = thunk =>
  thunk.valueOf();


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************[ PRODUCT TYPE ]********************************
******************************************************************************/


const record = (type, o) =>
  (o[type.name || type] = type.name || type, o);


/******************************************************************************
********************************[ UNION TYPE ]*********************************
******************************************************************************/


const union = type => (tag, o) =>
  (o[type] = type, o.tag = tag.name || tag, o);


/***[ Elimination Rule ]******************************************************/


const match = (tx, o) =>
  o[tx.tag] (tx);


const match2 = (tx, ty, o) =>
  o[tx.tag] [ty.tag] (tx) (ty);


const match3 = (tx, ty, tz, o) =>
  o[tx.tag] [ty.tag] [tz.tag] (tx) (ty) (tz);


/******************************************************************************
****************************[ AUXILIARY FUNCTION ]*****************************
******************************************************************************/


const lazyProp = (k, v) => o =>
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
************************[ TAIL RECURSION MODULO CONS ]*************************
******************************************************************************/


const rec = f => (...args) => {
  let step = f(...args);
  const stack = [];

  while (step.tag !== "Base") {
    stack.push(step.f);
    step = f(...step.step.args);
  }

  let r = step.x;

  for (let i = stack.length - 1; i >= 0; i--) {
    r = stack[i] (r);
    
    if (r && r.tag === "Base") {
      r = r.x;
      break;
    }
  }

  return r;
};


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


const tailRec = f => (...args) => {
    let step = f(...args);

    while (step.tag !== "Base")
      step = f(...step.args);

    return step.x;
};


/******************************************************************************
******************************[ MONAD RECURSION ]******************************
******************************************************************************/


const monadRec = step => {
    while (step.tag !== "Base")
      step = step.f(...step.args);

    return step.x;
};


/***[ Monad ]*****************************************************************/


const recChain = mx => fm =>
  mx.tag === "Chain"
    ? Chain(args => recChain(mx.f(...args)) (fm)) (mx.args)
    : fm(mx.x);


// recOf @DERIVED


/******************************************************************************
*****************************[ MUTUAL RECURSION ]******************************
******************************************************************************/


const mutuRec = monadRec;


/******************************************************************************
******************************[ POST RECURSION ]*******************************
******************************************************************************/


const postRec = tx => {
  do {
    tx = tx.cont(id);
  } while (tx && tx.tag === "Cont")

  return cont;
};


/******************************************************************************
***********************************[ TAGS ]************************************
******************************************************************************/


const Base = x =>
  ({tag: "Base", x});


const Call = (f, step) =>
  ({tag: "Call", f, step});


const Chain = f => (...args) =>
  ({tag: "Chain", f, args});


const Mutu = Chain;


const Step = (...args) =>
  ({tag: "Step", args});



/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const recOf = Base;


/******************************************************************************
*******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[ De-/Constructor ]*******************************************************/


const arrCons = x => xs =>
  (xs.unshift(x), xs);


const arrCons_ = xs => x =>
  (xs.unshift(x), xs);


const arrSnoc = x => xs =>
  (xs.push(x), xs);


const arrSnoc_ = xs => x =>
  (xs.push(x), xs);


const arrUncons = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.shift(), xs]);
};


const arrUnsnoc = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.pop(), xs]);
};


/***[ Foldable ]**************************************************************/


const arrFold = f => acc => xs => {
  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


const arrFoldk = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc_)
      : f(acc_) (xs[i], i).cont(acc__ => Step(acc__, i + 1))) (acc, 0);


const arrFoldr = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), Step(i + 1))) (0);


const arrFoldr_ = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), thunk(() => Step(i + 1))))
          (0);


const arrFoldrk = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(acc => f(xs[i]) (acc).cont(id), Step(i + 1))) (0);


/***[ Semigroup ]*************************************************************/


const arrAppend = xs => ys =>
  (xs.push.apply(xs, ys), xs);


const arrPrepend = ys => xs =>
  (xs.push.apply(xs, ys), xs);


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


/***[ Applicative ]***********************************************************/


const funAp = tf => tg => x =>
  tf(x) (tg(x));


const funLiftA2 = f => tg => th => x =>
  f(tg(x)) (th(x));


// funOf @Derived


/***[ Composition ]***********************************************************/


const comp = f => g => x =>
  f(g(x));


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const compBin = f => g => x => y =>
  f(g(x) (y));


const compOn = f => g => x => y =>
  f(g(x)) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipe_ = g => f => x => y =>
  f(x) (g(y));


const pipeBin = g => f => x => y =>
  f(g(x) (y));


const pipeOn = g => f => x => y =>
  f(g(x)) (g(y));


/***[ Conditional Combinators ]***********************************************/


const guard = p => f => x =>
  p(x) ? f(x) : x;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


/***[ Contravariant Functor ]*************************************************/


const funContra = pipe;


/***[ Currying/Partial Application ]******************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const curry5 = f => v => w => x => y => z =>
  f(v, w, x, y, z);


const curry6 = f => u => v => w => x => y => z =>
  f(u, v, w, x, y, z);


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


const uncurry5 = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);


const uncurry6 = f => (u, v, w, x, y, z) =>
  f(u) (v) (w) (x) (y) (z);


/***[ Debugging ]*************************************************************/


const debug = f => (...args) => {
  debugger;
  return f(...args);
};


const delay = f => ms => x =>
  Task((res, rej) => setTimeout(comp(res) (f), ms, x));


const log = s =>
  (console.log(s), s);


const taggedLog = tag => s =>
  (console.log(tag, s), s);


const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/***[ Functor ]***************************************************************/


const funMap = comp;


/***[ Impure ]****************************************************************/


const eff = f => x =>
  (f(x), x);


const introspect = x =>
  x && x[TYPE] !== undefined
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


const isUnit = x =>
  x === undefined
    || x === null
    || x === x === false // NaN
    || x.getTime !== undefined && Number.isNaN(x.getTime()); // Invalid Date


const _throw = e => {
  throw e;
};


const tryCatch = f => g => x => {
  try {
    return f(x);
  }

  catch(e) {
    return g(x) (e);
  }
};


/***[ Infix Combinators ]*****************************************************/


const appr = (f, y) => x =>
  f(x) (y);


const infix = (x, f, y) =>
  f(x) (y);


const infix2 = (x, f, y, g, z) =>
  g(f(x) (y)) (z);


const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);


const infix4 = (v, f, w, g, x, h, y, i, z) =>
  i(h(g(f(v) (w)) (x)) (y)) (z);


const infix5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z);


const infix6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z);


const infixM2 = (λ, f, x, g, y) =>
  f(x_ =>
    λ(x_, α => g(y_ =>
      α(y_, id)) (y))) (x);


const infixM3 = (λ, f, x, g, y, h, z) =>
  f(x_ =>
    λ(x_, α => g(y_ =>
      α(y_, β => h(z_ =>
        β(z_, id)) (z))) (y))) (x);


const infixM4 = (λ, f, w, g, x, h, y, i, z) =>
  f(w_ =>
    λ(w_, α => g(x_ =>
      α(x_, β => h(y_ =>
        β(y_, γ => i(z_ =>
          γ(z_, id)) (z))) (y))) (x))) (w);



const infixM5 = (λ, f, v, g, w, h, x, i, y, j, z) =>
  f(v_ =>
    λ(v_, α => g(w_ =>
      α(w_, β => h(x_ =>
        β(x_, γ => i(y_ =>
          γ(y_, δ => j(z_ =>
            δ(z_, id)) (z))) (y))) (x))) (w))) (v);



const infixM6 = (λ, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(u_ =>
    λ(u_, α => g(v_ =>
      α(v_, β => h(w_ =>
        β(w_, γ => i(x_ =>
          γ(x_, δ => j(y_ =>
            δ(y_, ε => k(z_ =>
              ε(z_, id)) (z))) (y))) (x))) (w))) (v))) (u);


const infixr = (y, f, x) =>
  f(x) (y);


const infixr2 = (x, f, y, g, z) =>
  f(x) (g(y) (z));


const infixr3 = (w, f, x, g, y, h, z) =>
  f(w) (g(x) (h(y) (z)));


const infixr4 = (v, f, w, g, x, h, y, i, z) =>
  f(v) (g(w) (h(x) (i(y) (z))));


const infixr5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  f(u) (g(v) (h(w) (i(x) (j(y) (z)))));


const infixr6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(t) (g(u) (h(v) (i(w) (j(x) (k(y) (z))))));


const infixrM2 = (x, f, y, g, λ) =>
  f(x) (x_ =>
    λ(x_, α => g(y) (y_ =>
      α(y_, id))));


const infixrM3 = (x, f, y, g, z, h, λ) =>
  f(x) (x_ =>
    λ(x_, α => g(y) (y_ =>
      α(y_, β => h(z) (z_ =>
        β(z_, id))))));


const infixrM4 = (w, f, x, g, y, h, z, i, λ) =>
  f(w) (w_ =>
    λ(w_, α => g(x) (x_ =>
      α(x_, β => h(y) (y_ =>
        β(y_, γ => i(z) (z_ =>
          γ(z_, id))))))));


const infixrM5 = (v, f, w, g, x, h, y, i, z, j, λ) =>
  f(v) (v_ =>
    λ(v_, α => g(w) (w_ =>
      α(w_, β => h(x) (x_ =>
        β(x_, γ => i(y) (y_ =>
          γ(y_, δ => j(z) (z_ =>
            δ(z_, id))))))))));


const infixrM6 = (u, f, v, g, w, h, x, i, y, j, z, k, λ) =>
  f(u) (u_ =>
    λ(u_, α => g(v) (v_ =>
      α(w_, β => h(w) (w_ =>
        β(x_, γ => i(x) (x_ =>
          γ(y_, δ => j(y) (y_ =>
            δ(y_, ε => k(z) (z_ =>
              ε(z_, id))))))))))));


/***[ Local Binding ]*********************************************************/


const _let = f => f();


/***[ Monad ]*****************************************************************/


const funChain = mg => fm => x =>
  fm(mg(x)) (x);


const funJoin = mmf => x =>
  mmf(x) (x);


/***[ Monoid ]****************************************************************/


// funEmpty @Derived


/***[ Primitive Combinators ]*************************************************/


const app = f => x => f(x);


const app_ = x => f => f(x);


const _const = x => _ => x;


const const_ = _ => y => y;


const fix = f => // partial function (not stack safe)
  thunk(() => f(fix(f)));


const flip = f => y => x =>
  f(x) (y);


const id = x => x;


/***[ Semigroup ]*************************************************************/


const funAppend = comp;


const funPrepend = pipe;


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

  return acc => x => k =>
    m < n
      ? (m++, k(acc))
      : append(acc) (x).cont(k)};


const dropNth = nth => append => { 
  let n = 0;

  return acc => x =>
    ++n % nth === 0
      ? acc
      : append(acc) (x);
};


const dropNthk = nth => append => { 
  let n = 0;

  return acc => x => k =>
    ++n % nth === 0
      ? k(acc)
      : append(acc) (x).cont(k)};


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


const filter = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const filterk = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : k(acc));


const map = f => append => acc => x =>
  append(acc) (f(x));


const mapk = f => append => acc => x =>
  Cont(k =>
    append(acc) (f(x)).cont(k));


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
        : acc)};


const takeNth = nth => append => { 
  let n = 0;

  return acc => x =>
    ++n % nth === 0
      ? append(acc) (x)
      : acc;
};


const takeNthk = nth => append => { 
  let n = 0;

  return acc => x =>
    Cont(k =>
      ++n % nth === 0
        ? append(acc) (x).cont(k)
        : acc)};


const takeWhile = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const takeWhilek = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : acc);


const transduce = ({append, fold}) => f =>
  fold(f(append));


/***[ Derived ]***************************************************************/


const funEmpty = () => id;


const funOf = _const;


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/

/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


const Cont = cont => record("Cont", {cont});


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


const List = union("List");


const Nil = List("Nil", {});


const Cons = head => tail =>
  List(Cons, {head, tail});


/***[ Foldable ]**************************************************************/


const listFold = f => acc => xs =>
  tailRec((acc_, xs) =>
    match(xs, {
      Nil: _ => Base(acc_),
      Cons: ({head, tail}) => Step(f(acc_) (head), tail)
    })) (acc, xs);


const listFoldr = f => acc =>
  rec(xs =>
    match(xs, {
      Nil: _ => Base(acc),
      Cons: ({head, tail}) => Call(f(head), Step(tail))
    }));


/***[ Functor ]***************************************************************/


const listMap = f =>
  rec(xs =>
    match(xs, {
      Nil: _ => Base(Nil),
      Cons: ({head, tail}) => Call(Cons(f(head)), Step(tail))
    }));


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


const Option = union("Option");


const None = Option("None", {});


const Some = some => Option(Some, {some});


/******************************************************************************
*******************************[ TUPLE (PAIR) ]********************************
******************************************************************************/


class Pair extends Array {
  constructor(x, y) {
    const r = super(2);
    r[0] = x;
    r[1] = y;
    return r;
  }
}


/******************************************************************************
******************************[ TUPLE (TRIPLE) ]*******************************
******************************************************************************/


class Triple extends Array {
  constructor(x, y, z) {
    const r = super(3);
    r[0] = x;
    r[1] = y;
    r[2] = z;
    return r;
  }
}


/******************************************************************************
*******************************************************************************
***********************[ HASHED ARRAY MAP TRIE (HAMT) ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


const HAMT_BITS = 5;


const HAMT_SIZE = Math.pow(2, HAMT_BITS);


const HAMT_MASK = HAMT_SIZE - 1;


const HAMT_LEAF = "Leaf";


const HAMT_BRANCH = "Branch";


const HAMT_COLLISION = "Collision";


const HAMT_DELETE = "delete";


const HAMT_NOOP = "noop";


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


let hamtObjKeys = new WeakMap();


/******************************************************************************
***********************************[ HASH ]************************************
******************************************************************************/


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
        const k_ = crypto.getRandomValues(
          new Uint32Array(1)) [0];

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


const hamtNumHash = n =>
{
  n = (n + 0x7ed55d16) + (n << 12);
  n = (n ^ 0xc761c23c) ^ (n >> 19);
  n = (n + 0x165667b1) + (n << 5);
  n = (n + 0xd3a2646c) ^ (n << 9);
  n = (n + 0xfd7046c5) + (n << 3);
  n = (n ^ 0xb55a4f09) ^ (n >> 16);
  return n >>> 0;
};


/******************************************************************************
*****************************[ POPULATION COUNT ]******************************
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
*******************************[ CONSTRUCTORS ]********************************
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


const hamtDel = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT");

  const hash = hamtHash(k),
    hamt_ = hamtDelNode(hamt, hash, k, 0);

  if (hamt_ === HAMT_NOOP)
    return hamt;

  else if (hamt_ === HAMT_DELETE)
    return hamtEmpty;

  else return hamt_;
};


const hamtEmpty = hamtBranch();


const hamtGet = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT"); // TODO: change to HAMT error

  const hash = hamtHash(k);

  let node = hamt,
    depth = -1;

  while (true) {
    ++depth;

    switch (node.type) {
      case HAMT_BRANCH: {
        const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
          mask = 1 << frag;

        if (node.mask & mask) {
          const i = hamtPopCount(node.mask, frag);
          node = node.children[i];
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


const hamtSet = (hamt, k, v) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT");

  const hash = hamtHash(k);
  return hamtSetNode(hamt, hash, k, v);
};


/******************************************************************************
******************************[ IMPLEMENTATION ]*******************************
******************************************************************************/


const hamtSetNode = (node, hash, k, v, depth = 0) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      if (node.hash === hash) {
        if (node.k === k)
          return hamtLeaf(hash, k, v)

        return hamtCollision(
          hash,
          [node, hamtLeaf(hash, k, v)]);
      }

      else {
        const prevFrag = (node.hash >>> (HAMT_BITS * depth)) & HAMT_MASK;

        if (prevFrag === frag)
          return hamtBranch(
            mask, [
              hamtSetNode(
                hamtSetNode(hamtEmpty, hash, k, v, depth + 1),
              node.hash,
              node.k,
              node.v,
              depth + 1)
            ]
          );

        const prevMask = 1 << prevFrag,
          children = prevFrag < frag
            ? [node, hamtLeaf(hash, k, v)]
            : [hamtLeaf(hash, k, v), node];

        return hamtBranch(mask | prevMask, children);
      }
    }

    case HAMT_BRANCH: {
      const i = hamtPopCount(node.mask, frag),
        children = node.children;

      if (node.mask & mask) {
        const child = children[i],
          children_ = Array.from(children);

        children_[i] = hamtSetNode(child, hash, k, v, depth + 1);
        return hamtBranch(node.mask, children_);
      }

      else {
        const children_ = Array.from(children);
        children_.splice(i, 0, hamtLeaf(hash, k, v));
        return hamtBranch(node.mask | mask, children_);
      }
    }

    case HAMT_COLLISION: {
      for (let i = 0, len = node.children.length; i < len; ++i) {
        if (node.children[i].k === k) {
          const children = Array.from(node.children);
          children[i] = hamtLeaf(hash, k, v);
          return hamtCollision(node.hash, children);
        }
      }

      return hamtCollision(
        node.hash,
        node.children.concat(hamtLeaf(hash, k, v))
      );
    }
  }
}


const hamtDelNode = (node, hash, k, depth) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      // null means remove, undefined
      // means do nothing
      return node.k === k ? HAMT_DELETE : HAMT_NOOP;
    }

    case HAMT_BRANCH: {
      if (node.mask & mask) {
        const i = hamtPopCount(node.mask, frag),
          node_ = hamtDelNode(node.children[i], hash, k, depth + 1);

        if (node_ === HAMT_DELETE) {
          const newMask = node.mask & ~mask;

          if (newMask === 0)
            return HAMT_DELETE;
          
          else {
            const children = Array.from(node.children);
            children.splice(i, 1);
            return hamtBranch(newMask, children);
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
}


/******************************************************************************
*******************************************************************************
**********************************[ DERIVED ]**********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  app,
  app_,
  appr,
  arrAppend,
  arrPrepend,
  arrCons,
  arrCons_,
  arrFold,
  arrFoldk,
  arrFoldr,
  arrFoldr_,
  arrFoldrk,
  arrSnoc,
  arrSnoc_,
  arrUncons,
  arrUnsnoc,
  Base,
  Call,
  Chain,
  comp,
  comp2nd,
  compBin,
  compOn,
  Cons,
  _const,
  const_,
  Cont,
  curry,
  curry3,
  curry4,
  curry5,
  curry6,
  debug,
  delay,
  drop,
  dropk,
  dropNth,
  dropNthk,
  dropWhile,
  dropWhilek,
  eff,
  filter,
  filterk,
  fix,
  flip,
  funAp,
  funAppend,
  funChain,
  funEmpty,
  funJoin,
  funLiftA2,
  funMap,
  funOf,
  funPrepend,
  guard,
  hamtDel,
  hamtEmpty,
  hamtGet,
  hamtSet,
  id,
  infix,
  infix2,
  infix3,
  infix4,
  infix5,
  infix6,
  infixM2,
  infixM3,
  infixM4,
  infixM5,
  infixM6,
  infixr,
  infixr2,
  infixr3,
  infixr4,
  infixr5,
  infixr6,
  infixrM2,
  infixrM3,
  infixrM4,
  infixrM5,
  infixrM6,
  introspect,
  isUnit,
  lazyProp,
  _let,
  List,
  listFold,
  listFoldr,
  listMap,
  log,
  map,
  mapk,
  match,
  match2,
  match3,
  monadRec,
  Mutu,
  mutuRec,
  Nil,
  None,
  NOT_FOUND,
  Option,
  Pair,
  partial,
  pipe,
  pipe_,
  pipeBin,
  pipeOn,
  postRec,
  rec,
  recChain,
  recOf,
  record,
  select,
  Some,
  Step,
  strict,
  taggedLog,
  tailRec,
  take,
  takek,
  takeNth,
  takeNthk,
  takeWhile,
  takeWhilek,
  _throw,
  thunk,
  trace,
  transduce,
  Triple,
  tryCatch,
  TYPE,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  uncurry6,
  union
};

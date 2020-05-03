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


const PREFIX = "scriptum_";


const TYPE = Symbol.toStringTag;


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
***************************[ WEAK HEAD NORMAL FORM ]***************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const strict = thunk => {
  while (thunk[THUNK])
    thunk = thunk.valueOf();

  return thunk;
};


const thunk = f =>
  new Proxy(f, new ThunkProxy(f));


/******************************************************************************
*************************[ IMPLEMENTATION (INTERNAL) ]*************************
******************************************************************************/


class ThunkProxy {
  constructor(f) {
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

    if (k === THUNK)
      return true;

    else if (k === Symbol.toPrimitive)
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


const THUNK = PREFIX + "thunk";


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
***********************************[ MONAD ]***********************************
******************************************************************************/


/***[ Applicators ]***********************************************************/


const chain2 = chain => mx => my => fm =>
  chain(mx) (x =>
    chain(my) (y =>
      fm(x) (y)));


const chain2_ = chain => fm => mx => my =>
  chain(x =>
    chain(y =>
        fm(x) (y)) (my)) (mx);


const chain3 = chain => mx => my => mz => fm =>
  chain(mx) (x =>
    chain(my) (y =>
      chain(mz) (z =>
        fm(x) (y) (z))));


const chain3_ = chain => fm => mx => my => mz =>
  chain(x =>
    chain(y =>
      chain(z =>
        fm(x) (y) (z)) (mz)) (my)) (mx);


const chain4 = chain => mw => mx => my => mz => fm =>
  chain(mw) (w =>
    chain(mx) (x =>
      chain(my) (y =>
        chain(mz) (z =>
          fm(w) (x) (y) (z)))));


const chain4_ = chain => fm => mw => mx => my => mz =>
  chain(w =>
    chain(x =>
      chain(y =>
        chain(z =>
          fm(w) (x) (y) (z)) (mz)) (my)) (mx)) (mw);


const chain5 = chain => mv => mw => mx => my => mz => fm =>
  chain(mv) (v =>
    chain(mw) (w =>
      chain(mx) (x =>
        chain(my) (y =>
          chain(mz) (z =>
            fm(v) (w) (x) (y) (z))))));


const chain5_ = chain => fm => mv => mw => mx => my => mz =>
  chain(v =>
    chain(w =>
      chain(x =>
        chain(y =>
          chain(z =>
            fm(v) (w) (x) (y) (z)) (mz)) (my)) (mx)) (mw)) (mv);


const chain6 = chain => mu => mv => mw => mx => my => mz => fm =>
  chain(mu) (u =>
    chain(mv) (v =>
      chain(mw) (w =>
        chain(mx) (x =>
          chain(my) (y =>
            chain(mz) (z =>
              fm(u) (v) (w) (x) (y) (z)))))));


const chain6_ = chain => fm => mu => mv => mw => mx => my => mz =>
  chain(u =>
    chain(v =>
      chain(w =>
        chain(x =>
          chain(y =>
            chain(z =>
              fm(u) (v) (w) (x) (y) (z)) (mz)) (my)) (mx)) (mw)) (mv)) (mu);


const chainn = chain => ms => fm => {
  const go = (gm, i) =>
    i === ms.length
      ? gm
      : chain(ms[i]) (x => go(gm(x), i + 1));

  return go(fm, 0);
};


const chainn_ = chain => ms => fm => {
  const go = (gm, i) =>
    i === ms.length
      ? gm
      : chain(x => go(gm(x), i + 1)) (ms[i]);

  return go(fm, 0);
};


const compk = chain => fm => gm => x =>
  chain(fm(x)) (gm);


const compk_ = chain => fm => gm => x =>
  chain(gm) (fm(x));


const compk3 = chain => fm => gm => hm => x =>
  chain(chain(fm(x)) (gm)) (hm);


const compk3_ = chain => fm => gm => hm => x =>
  chain(hm) (chain(gm) (fm(x)));


const compk4 = chain => fm => gm => hm => im => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);


const compk4_ = chain => fm => gm => hm => im => x =>
  chain(im) (chain(hm) (chain(gm) (fm(x))));


const compk5 = chain => fm => gm => hm => im => jm => x =>
  chain(chain(chain(chain(fm(x)) (gm)) (hm)) (im)) (jm);


const compk5_ = chain => fm => gm => hm => im => jm => x =>
  chain(jm) (chain(im) (chain(hm) (chain(gm) (fm(x)))));


const compk6 = chain => fm => gm => hm => im => jm => km => x =>
  chain(chain(chain(chain(chain(fm(x)) (gm)) (hm)) (im)) (jm)) (km);


const compk6_ = chain => fm => gm => hm => im => jm => km => x =>
  chain(km) (chain(jm) (chain(im) (chain(hm) (chain(gm) (fm(x))))));


const compkn = chain => fs => x => {
  const go = (mx, i) =>
    i === fs.length
      ? mx
      : chain(mx) (x => go(fs[i] (x), i + 1));

  return go(fs[0] (x), 1);
};


const compkn_ = chain => fs => x => {
  const go = (mx, i) =>
    i === fs.length
      ? mx
      : chain(x => go(fs[i] (x), i + 1)) (mx);

  return go(fs[0] (x), 1);
};


const pipek = chain => gm => fm => x =>
  chain(fm(x)) (gm);


const pipek_ = chain => gm => fm => x =>
  chain(gm) (fm(x));


const pipek3 = chain => hm => gm => fm => x =>
  chain(chain(fm(x)) (gm)) (hm);


const pipek3_ = chain => hm => gm => fm => x =>
  chain(hm) (chain(gm) (fm(x)));


const pipek4 = chain => im => hm => gm => fm => x =>
  chain(chain(chain(fm(x)) (gm)) (hm)) (im);


const pipek4_ = chain => im => hm => gm => fm => x =>
  chain(im) (chain(hm) (chain(gm) (fm(x))));


const pipek5 = chain => jm => im => hm => gm => fm => x =>
  chain(chain(chain(chain(fm(x)) (gm)) (hm)) (im)) (jm);


const pipek5_ = chain => jm => im => hm => gm => fm => x =>
  chain(jm) (chain(im) (chain(hm) (chain(gm) (fm(x)))));


const pipek6 = chain => km => jm => im => hm => gm => fm => x =>
  chain(chain(chain(chain(chain(fm(x)) (gm)) (hm)) (im)) (jm)) (km);


const pipek6_ = chain => km => jm => im => hm => gm => fm => x =>
  chain(km) (chain(jm) (chain(im) (chain(hm) (chain(gm) (fm(x))))));


const pipekn = chain => fs => x => {
  const go = (mx, i) =>
    i < 0
      ? mx
      : chain(mx) (x => go(fs[i] (x), i - 1));

  return go(fs[fs.length - 1] (x), fs.length - 2);
};


const pipekn_ = chain => fs => x => {
  const go = (mx, i) =>
    i < 0
      ? mx
      : chain(x => go(fs[i] (x), i - 1)) (mx);

  return go(fs[fs.length - 1] (x), fs.length - 2);
};


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Clonable]****************************************************************/


const arrClone = xs =>
  xs.slice(0);


/***[ De-/Construction ]******************************************************/


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


const arrFoldr_ = f => acc => xs => {
  const go = i =>
    i === xs.length
      ? acc
      : f(xs[i]) (thunk(() => go(i + 1)));

  return go(0);
};


const arrFoldrk = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(acc => f(xs[i]) (acc).cont(id), Step(i + 1))) (0);


/***[ Functor ]***************************************************************/


const arrMap = f => xs =>
  xs.map((x, i) => f(x, i));


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


const infix2 = (x, f) => (y, g) => z =>
  g(f(x) (y)) (z);


const infix3 = (w, f) => (x, g) => (y, h) => z =>
  h(g(f(w) (x)) (y)) (z);


const infix4 = (v, f) => (w, g) => (x, h) => (y, i) => z =>
  i(h(g(f(v) (w)) (x)) (y)) (z);


const infix5 = (u, f) => (v, g) => (w, h) => (x, i) => (y, j) => z =>
  j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z);


const infix6 = (t, f) => (u, g) => (v, h) => (w, i) => (x, j) => (y, k) => z =>
  k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z);


const infixn = pairs => z => {
  const go = (f, i) =>
    i === pairs.length
      ? f
      : go(pairs[i] [1] (f(pairs[i] [0])), i + 1);

  return pairs.length === 0
    ? z
    : go(pairs[0] [1] (pairs[0] [0]), 1) (z);
};


const infixr2 = (x, f) => (y, g) => z =>
  f(x) (g(y) (z));


const infixr3 = (w, f) => (x, g) => (y, h) => z =>
  f(w) (g(x) (h(y) (z)));


const infixr4 = (v, f) => (w, g) => (x, h) => (y, i) => z =>
  f(v) (g(w) (h(x) (i(y) (z))));


const infixr5 = (u, f) => (v, g) => (w, h) => (x, i) => (y, j) => z =>
  f(u) (g(v) (h(w) (i(x) (j(y) (z)))));


const infixr6 = (t, f) => (u, g) => (v, h) => (w, i) => (x, j) => (y, k) => z =>
  f(t) (g(u) (h(v) (i(w) (j(x) (k(y) (z))))));


const infixrn = pairs => z => {
  const go = (f, i) =>
    i === pairs.length
      ? f(z)
      : f(go(pairs[i] [1] (pairs[i] [0]), i + 1));

  return pairs.length === 0
    ? z
    : go(pairs[0] [1] (pairs[0] [0]), 1);
};


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


const dropr = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, acc)
      : append(x) (acc);
};


const dropk = n => append => { 
  let m = 0;

  return acc => x =>
    Cont(k =>
      m < n
        ? (m++, k(acc))
        : append(acc) (x).cont(k))};


const droprk = n => append => { 
  let m = 0;

  return x => acc =>
    Cont(k =>
      m < n
        ? (m++, k(acc))
        : append(x) (acc).cont(k))};


const dropWhile = p => append => {
  let drop = true;

  return acc => x => 
    drop && p(x)
      ? acc
      : (drop = false, append(acc) (x));
};


const dropWhiler = p => append => {
  let drop = true;

  return x => acc =>
    drop && p(x)
      ? acc
      : (drop = false, append(x) (acc));
};


const dropWhilek = p => append => {
  let drop = true;

  return acc => x =>
    Cont(k =>
      drop && p(x)
        ? k(acc)
        : (drop = false, append(acc) (x).cont(k)))};


const dropWhilerk = p => append => {
  let drop = true;

  return x => acc =>
    Cont(k =>
      drop && p(x)
        ? k(acc)
        : (drop = false, append(x) (acc).cont(k)))};


const filter = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const filterr = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


const filterk = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : k(acc));


const filterrk = p => append => x => acc =>
  Cont(k =>
    p(x)
      ? append(x) (acc).cont(k)
      : k(acc));


const map = f => append => acc => x =>
  append(acc) (f(x));


const mapr = f => append => x => acc =>
  append(f(x)) (acc);


const mapk = f => append => acc => x =>
  Cont(k =>
    append(acc) (f(x)).cont(k));


const maprk = f => append => x => acc =>
  Cont(k =>
    append(f(x)) (acc).cont(k));


const take = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, append(acc) (x))
      : acc;
};


const taker = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, append(x) (acc))
      : acc;
};


const takek = n => append => { 
  let m = 0;

  return acc => x =>
    Cont(k =>
      m < n
        ? (m++, append(acc) (x).cont(k))
        : Base(acc))};


const takerk = n => append => { 
  let m = 0;

  return x => acc =>
    Cont(k =>
      m < n
        ? (m++, append(x) (acc).cont(k))
        : Base(acc))};


const takeWhile = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


const takeWhiler = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


const takeWhilek = p => append => acc => x =>
  Cont(k =>
    p(x)
      ? append(acc) (x).cont(k)
      : Base(acc));


const takeWhilerk = p => append => x => acc =>
  Cont(k =>
    p(x)
      ? append(x) (acc).cont(k)
      : Base(acc));


const transduce = ({append, fold}) => f =>
  fold(f(append));


/***[ Derived ]***************************************************************/


const funEmpty = {fresh: id};


const funOf = _const;


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


/***[ Auxiliary ]*************************************************************/


const thisify = f => f({});


/***[ Clonable ]**************************************************************/


const objClone = o => {
  const p = {};

  for (k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


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


const objPathOr = def => (...ks) => o =>
  ks.reduce((acc, k) => acc && acc[k] || def, o);


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/

/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


const Cont = cont => record("Cont", {cont});


/***[ Functor ]***************************************************************/


const contMap = f => tx =>
  Cont(k => tx.cont(x => k(f(x))));


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


const List = union("List");


const Nil = List("Nil", {});


const Cons = head => tail =>
  List(Cons, {head, tail});


/***[ De-/Construction ]******************************************************/


const cons_ = tail => head =>
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


const listFoldr_ = f => acc => {
  const go = xs =>
    match(xs, {
      Nil: _ => acc,
      Cons: ({head, tail}) => f(head) (thunk(() => go(tail)))
    });

  return go;
};


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


/***[ Functor ]***************************************************************/


const optMap = f => tx =>
  match(tx, {
    None: _ => None,
    Some: ({some: x}) => Some(f(x))
  });


/******************************************************************************
***********************************[ TASK ]************************************
******************************************************************************/


const Task = task => record(
  Task,
  thisify(o => {
    o.task = (res, rej) =>
      task(x => {
        o.task = k_ => k_(x);
        return res(x);
      }, rej);
    
    return o;
  }));


/***[ Functor ]***************************************************************/


const tMap = f => tx =>
  Task((res, rej) => tx.task(x => res(f(x)), rej));


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
  arrClone,
  arrCons,
  arrCons_,
  arrFold,
  arrFoldk,
  arrFoldr,
  arrFoldr_,
  arrFoldrk,
  arrMap,
  arrPrepend,
  arrSnoc,
  arrSnoc_,
  arrUncons,
  arrUnsnoc,
  Base,
  Call,
  Chain,
  chain2,
  chain2_,
  chain3,
  chain3_,
  chain4,
  chain4_,
  chain5,
  chain5_,
  chain6,
  chain6_,
  chainn,
  chainn_,
  comp,
  comp2nd,
  compBin,
  compk,
  compk3,
  compk4,
  compk5,
  compk6,
  compkn,
  compk_,
  compk3_,
  compk4_,
  compk5_,
  compk6_,
  compkn_,
  compOn,
  Cons,
  cons_,
  _const,
  const_,
  Cont,
  contMap,
  curry,
  curry3,
  curry4,
  curry5,
  curry6,
  debug,
  delay,
  drop,
  dropr,
  dropk,
  droprk,
  dropWhile,
  dropWhiler,
  dropWhilek,
  dropWhilerk,
  eff,
  filter,
  filterr,
  filterk,
  filterrk,
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
  Hamt,
  Hamt_,
  hamtDel,
  hamtGet,
  hamtHas,
  hamtSet,
  hamtUpd,
  id,
  infix,
  infix2,
  infix3,
  infix4,
  infix5,
  infix6,
  infixn,
  infixr2,
  infixr3,
  infixr4,
  infixr5,
  infixr6,
  infixrn,
  introspect,
  isUnit,
  lazyProp,
  _let,
  List,
  listFold,
  listFoldr,
  listFoldr_,
  listMap,
  log,
  map,
  mapr,
  mapk,
  maprk,
  match,
  match2,
  match3,
  monadRec,
  Mutu,
  mutuRec,
  Nil,
  None,
  NOT_FOUND,
  objClone,
  objEntries,
  objKeys,
  objPathOr,
  objValues,
  Option,
  optMap,
  partial,
  pipe,
  pipe_,
  pipeBin,
  pipek,
  pipek3,
  pipek4,
  pipek5,
  pipek6,
  pipekn,
  pipek_,
  pipek3_,
  pipek4_,
  pipek5_,
  pipek6_,
  pipekn_,
  pipeOn,
  postRec,
  PREFIX,
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
  taker,
  takek,
  takerk,
  takeWhile,
  takeWhiler,
  takeWhilek,
  takeWhilerk,
  Task,
  thisify,
  _throw,
  thunk,
  tMap,
  trace,
  transduce,
  tryCatch,
  TYPE,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  uncurry6,
  union
};

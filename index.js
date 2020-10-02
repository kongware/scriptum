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


const fs = require("fs");


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
******************************[ IMPLICIT THUNK ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const lazy = f => x =>
  thunk(() => f(x));


const strict = thunk => {
  while (thunk && thunk[THUNK])
    thunk = thunk.valueOf();

  return thunk;
};


const strict1 = thunk =>
  thunk && thunk[THUNK]
    ? thunk.valueOf()
    : thunk;


const thunk = f =>
  new Proxy(f, new ThunkProxy());


/******************************************************************************
*************************[ IMPLEMENTATION (INTERNAL) ]*************************
******************************************************************************/


class ThunkProxy {
  constructor() {
    this.memo = undefined;
  }

  apply(g, that, args) {
    if (this.memo === undefined) {
      this.memo = g();

      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    return this.memo(...args);
  }

  defineProperty(g, k, descriptor) {
    if (this.memo === undefined) {
      this.memo = g();

      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    Object.defineProperty(this.memo, k, descriptor);
    return true;
  }
  
  ownKeys(g) {
    if (this.memo === undefined) {
      this.memo = g();

      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    return Reflect.ownKeys(this.memo);
  }

  getOwnPropertyDescriptor(g, k) {
    if (this.memo === undefined) {
      this.memo = g();
      
      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  get(g, k) {
    if (this.memo === undefined) {
      this.memo = g();
      
      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    if (k === THUNK)
      return true;

    else if (k === Symbol.toPrimitive)
      return this.memo[Symbol.toPrimitive];

    else if (k === "valueOf")
      return () => this.memo;

    else return this.memo[k];
  }

  has(g, k) {
    if (this.memo === undefined) {
      this.memo = g();

      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

    return k in this.memo;
  }

  set(g, k, v) {
    if (this.memo === undefined) {
      this.memo = g();

      while (this.memo && this.memo[THUNK])
        this.memo = this.memo.valueOf();
    }

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
********************************[ APPLICATIVE ]********************************
******************************************************************************/


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


/******************************************************************************
*********************************[ FOLDABLE ]**********************************
******************************************************************************/


const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);


/******************************************************************************
***********************************[ MONAD ]***********************************
******************************************************************************/


const join = chain => ttx =>
  chain(ttx) (id);


/******************************************************************************
**********************************[ MONOID ]***********************************
******************************************************************************/


const compk = chain => fm => gm =>
  x => chain(gm(x)) (fm);


const compk3 = chain => fm => gm => hm =>
  x => chain(chain(hm(x)) (gm)) (fm);


const compk4 = chain => fm => gm => hm => im =>
  x => chain(chain(chain(im(x)) (hm)) (gm)) (fm);


const compk5 = chain => fm => gm => hm => im => jm =>
  x => chain(chain(chain(chain(jm(x)) (im)) (hm)) (gm)) (fm);


const compk6 = chain => fm => gm => hm => im => jm => km =>
  x => chain(chain(chain(chain(chain(km(x)) (jm)) (im)) (hm)) (gm)) (fm);


const compkn = chain => (...fs) => {
  switch (fs.length) {
    case 2: return compk(chain) (fs[0]) (fs[1]);
    case 3: return compk3(chain) (fs[0]) (fs[1]) (fs[2]);
    case 4: return compk4(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return compk5(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return compk6(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


const pipek = chain => fm => gm =>
  x => chain(gm(x)) (fm);


const pipek3 = chain => hm => gm => fm =>
  x => chain(chain(hm(x)) (gm)) (fm);


const pipek4 = chain => im => hm => gm => fm =>
  x => chain(chain(chain(im(x)) (hm)) (gm)) (fm);


const pipek5 = chain => jm => im => hm => gm => fm =>
  x => chain(chain(chain(chain(jm(x)) (im)) (hm)) (gm)) (fm);


const pipek6 = chain => km => jm => im => hm => gm => fm =>
  x => chain(chain(chain(chain(chain(km(x)) (jm)) (im)) (hm)) (gm)) (fm);


const pipekn = chain => (...fs) => {
  switch (fs.length) {
    case 2: return pipek(chain) (fs[0]) (fs[1]);
    case 3: return pipek3(chain) (fs[0]) (fs[1]) (fs[2]);
    case 4: return pipek4(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return pipek5(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return pipek6(chain) (fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


/******************************************************************************
**********************************[ MONOID ]***********************************
******************************************************************************/


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


/***[Applicative]*************************************************************/


// arrAp @Derived


// arrLiftA2 @Derived


// arrLiftA3 @Derived


// arrLiftA4 @Derived


// arrLiftA5 @Derived


// arrLiftA6 @Derived


const arrOf = x => [x];


/***[Clonable]****************************************************************/


const arrClone = xs =>
  xs.slice(0);


/***[ De-/Construction ]******************************************************/


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


/***[ Foldable ]**************************************************************/


const arrFold = f => init => xs => {
  let acc = init;
  
  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


const arrFoldk = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc_)
      : f(acc_) (xs[i], i).cont(acc__ => Step(acc__, i + 1))) (acc, 0);


// arrFoldMap @DERIVED

 
const arrFoldr = f => acc => xs => {
  const go = i =>
    i === xs.length
      ? acc
      : f(xs[i]) (thunk(() => go(i + 1)));

  return go(0);
};


/***[ Functor ]***************************************************************/


const arrMap = f => xs =>
  xs.map((x, i) => f(x, i));


/***[ Infinite Lists ]********************************************************/


const iterate = f => x =>
  [x, thunk(() => iterate(f) (f(x)))];


/***[ Monad ]*****************************************************************/


const arrChain = mx => fm =>
  arrFold(acc => x =>
    arrAppend(acc) (fm(x))) ([]) (mx);


const arrJoin = join(arrChain);


/***[ Monoid ]****************************************************************/


const arrAppend = xs => ys =>
  xs.concat(ys);


const arrPrepend = ys => xs =>
  xs.concat(ys);


const arrEmpty = [];


/***[ Unfoldable ]************************************************************/


const arrUnfold = f => x => // TODO: maybe switch to for loop
  tailRec((acc, tx) =>
    match(tx, {
      None: _ => Base(acc),
      Some: ({some: [x, y]}) => Step(arrSnoc(x) (acc), f(y))
    })) ([], f(x));


const arrUnfoldr = f => x =>
  match(f(x), {
    None: _ => [],
    Some: ({some: [x, y]}) => cons(x) (thunk(() => arrUnfoldr(f) (y)))
  });


/***[ Derived ]***************************************************************/


const arrAp = tf => xs =>
  arrFold(acc => f =>
    arrAppend(acc)
      (arrMap(x => f(x)) (xs)))
        ([])
          (tf);


const arrLiftA2 = liftA2({map: arrMap, ap: arrAp});


const arrLiftA3 = liftA3({map: arrMap, ap: arrAp});


const arrLiftA4 = liftA4({map: arrMap, ap: arrAp});


const arrLiftA5 = liftA5({map: arrMap, ap: arrAp});


const arrLiftA6 = liftA6({map: arrMap, ap: arrAp});


/******************************************************************************
**********************************[ BOOLEAN ]**********************************
******************************************************************************/


/***[ All Monoid ]************************************************************/


const allAppend = x => y => x && y;


const allPrepend = y => x => x && y;


const allEmpty = true;


/***[ Any Monoid ]************************************************************/


const anyAppend = x => y => x || y;


const anyPrepend = y => x => x || y;


const anyEmpty = false;


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
    case 1: return String(d.getUTCMonth());
    case 2: return String(d.getUTCMonth()).padStart(2, "0");
    case 3: return nameMap[String(d.getUTCMonth())];
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


const compn = (...fs) => {
  switch (fs.length) {
    case 2: return comp(fs[0]) (fs[1]);
    case 3: return comp3(fs[0]) (fs[1]) (fs[2]);
    case 4: return comp4(fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return comp5(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return comp6(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


const compOn = f => g => x => y =>
  f(g(x)) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipe3 = h => g => f => x =>
  f(g(h(x)));


const pipe4 = i => h => g => f => x =>
  f(g(h(i(x))));


const pipe5 = j => i => h => g => f => x =>
  f(g(h(i(j(x)))));


const pipe6 = k => j => i => h => g => f => x =>
  f(g(h(i(j(k(x))))));


const pipen = (...fs) => {
  switch (fs.length) {
    case 2: return pipe(fs[0]) (fs[1]);
    case 3: return pipe3(fs[0]) (fs[1]) (fs[2]);
    case 4: return pipe4(fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return pipe5(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return pipe6(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


const pipe2nd = g => f => x => y =>
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


const partialProps = (f, o) => p =>
  f({...o, ...p});


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


const delayTask = f => ms => x =>
  Task((res, rej) => setTimeout(comp(res) (f), ms, x));


const delayParallel = f => ms => x =>
  Parallel((res, rej) => setTimeout(comp(res) (f), ms, x));


const log = s =>
  (console.log(s), s);


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
  x && x[TYPE] !== undefined
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


const isUnit = x =>
  x === undefined
    || x === null
    || x === x === false // NaN
    || x.getTime !== undefined && Number.isNaN(x.getTime()); // Invalid Date


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


const infixn = (...fs) => {
  switch (fs.length) {
    case 2: return infix(fs[0]) (fs[1]);
    case 3: return infix3(fs[0]) (fs[1]) (fs[2]);
    case 4: return infix4(fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return infix5(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return infix6(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


const infixr3 = (w, f, x, g, y, h, z) =>
  f(w) (g(x) (h(y) (z)));


const infixr4 = (v, f, w, g, x, h, y, i, z) =>
  f(v) (g(w) (h(x) (i(y) (z))));


const infixr5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  f(u) (g(v) (h(w) (i(x) (j(y) (z)))));


const infixr6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(t) (g(u) (h(v) (i(w) (j(x) (k(y) (z))))));


const infixrn = (...fs) => {
  switch (fs.length) {
    case 3: return infixr3(fs[0]) (fs[1]) (fs[2]);
    case 4: return infixr4(fs[0]) (fs[1]) (fs[2]) (fs[3]);
    case 5: return infixr5(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]);
    case 6: return infixr6(fs[0]) (fs[1]) (fs[2]) (fs[3]) (fs[4]) (fs[5]);
    default: throw new TypeError("invalid argument number");
  }
};


/***[ Local Binding ]*********************************************************/


const _let = f => f();


/***[ Logical Combinators ]***************************************************/


const and = x => y => x && y;


const andf = f => g => x =>
  f(x) && g(x);


const implies = x => y => !x || y;


const impliesf = f => x => y =>
  !f(x) || f(y);


const not = x => !x;


const notf = f => x => !f(x);


const or = x => y => x || y;


const orf = f => g => x =>
  f(x) || g(x);


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


const _const = x => _ => x;


const const_ = _ => y => y;


const fix = f =>
  x => f(fix(f)) (x);


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


const funLiftA2 = liftA2({map: funMap, ap: funAp});


const funLiftA3 = liftA3({map: funMap, ap: funAp});


const funLiftA4 = liftA4({map: funMap, ap: funAp});


const funLiftA5 = liftA5({map: funMap, ap: funAp});


const funLiftA6 = liftA6({map: funMap, ap: funAp});


const funOf = _const;


/******************************************************************************
************************************[ MAP ]************************************
******************************************************************************/


const delMap = k => m =>
  m.has(k)
    ? new Map(m).delete(k)
    : m;


const getMap = k => m =>
  m.get(k);


const hastMap = k => m =>
  m.has(k);


const modMap = k => f => m =>
  m.has(k)
    ? new Map(m).set(k, f(m.get(k)))
    : m;


const setMap = k => v => m =>
  new Map(m).set(k, v);


/******************************************************************************
**********************************[ NUMBER ]***********************************
******************************************************************************/


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


/***[ Monoid under addition ]*************************************************/


const sumAppend = x => y => x + y;


const sumPrepend = sumAppend; // commutative


const sumEmpty = 0;


/***[ Monoid under multiplication ]*******************************************/


const prodAppend = x => y => x * y;


const prodPrepend = prodAppend; // commutative


const prodEmpty = 1;


/***[Misc. Combinators]*******************************************************/


const ceil = digits => n =>
  decimalAdjust("ceil", n, -digits);


const decimalAdjust = (k, float, exp) => { // internal
  float = float.toString().split("e");
  float = Math[k] (+(float[0] + "e" + (float[1] ? (+float[1] - exp) : -exp)));
  float = float.toString().split("e");
  return +(float[0] + "e" + (float[1] ? (+float[1] + exp) : exp));
};


const floor = digits => n =>
  decimalAdjust("floor", n, -digits);


const round = digits => n =>
  decimalAdjust("round", n, -digits);


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


/***[ Auxiliary Functions ]***************************************************/


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


const getTree = (...ks) => o =>
  arrFold(p => k =>
    p[k]) (o) (ks);


const getTreeOr = def => (...ks) => o =>
  tailRec((p, i) =>
    i === ks.length ? Base(p)
      : ks[i] in p ? Step(p[ks[i]], i + 1)
      : Base(def)) (o, 0);


const modTree = (...ks) => f => o =>
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


const setTree = (...ks) => v => o =>
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


const objGet = k => o => o[k];


const objGetOr = def => k => o =>
  k in o ? o[k] : def;


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


const delSet = k => s =>
  s.has(k)
    ? new Set(s).delete(k)
    : s;


const hasSet = k => s =>
  s.has(k);


const setSet = k => v => s =>
  new Set(s).add(k, v);


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


/***[ Foldable ]**************************************************************/


const strFold = arrFold;


const strFoldk = arrFoldk;


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


/***[ RegExp ]****************************************************************/


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
      : strict1(tail))
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


const strParse = rx => s =>
  _let((r = s.match(rx)) =>
    r === null ? ["", ""]
      : rx.flags[0] === "g" ? [r.join(""), ""]
      : [s.slice(r.index + r[0].length), r[0]]);


const strReplace = rx => x => s =>
  s.replace(rx, x);


const strReplaceBy = rx => f => s =>
  s.replace(rx, (...args) => f(args));


/******************************************************************************
***********************************[ TUPLE ]***********************************
******************************************************************************/


const Pair = x => y => [x, y];


const Triple = x => y => z => [x, y, z];


/***[ Functor ]***************************************************************/


const pairMap = f => ([x, y]) =>
  [x, f(y)];


/***[Misc. Combinators]*******************************************************/


const pairMapFirst = f => ([x, y]) =>
  [f(x), y];


/******************************************************************************
**********************************[ WEAKMAP ]**********************************
******************************************************************************/


/******************************************************************************
**********************************[ WEAKSET ]**********************************
******************************************************************************/


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const arrFoldMap = partialProps(foldMap, {fold: arrFold});


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/


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


/***[ Monoid ]****************************************************************/


const cmpAppend = tx => ty =>
  Compare(x => y => ctorAppend(tx.cmp(x) (y)) (ty.cmp(x) (y)));


const cmpPrepend = ty => tx =>
  Compare(x => y => ctorAppend(tx.cmp(x) (y)) (ty.cmp(x) (y)));


const cmpEmpty = _ => _ => ctorEmpty;


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


const Cont = cont => record(Cont, {cont});


/***[ Applicative ]***********************************************************/


const contAp = tf => tx =>
  Cont(k => tf.cont(f => tx.cont(x => k(f(x)))));


// contLiftA2 @Derived


// contLiftA3 @Derived


// contLiftA4 @Derived


// contLiftA5 @Derived


// contLiftA6 @Derived


const contOf = x => Cont(k => k(x));


/***[ Functor ]***************************************************************/


const contMap = f => tx =>
  Cont(k => tx.cont(x => k(f(x))));


/***[ Monoid ]****************************************************************/


const contAppend = append => tx => ty =>
  Cont(k => tx.cont(x => ty.cont(y => append(x) (y))));


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
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const Left = left =>
  Either(Left, {left});


const Right = right =>
  Either(Right, {right});


/******************************************************************************
***********************************[ ENDO ]************************************
******************************************************************************/


/***[ Monoid ]****************************************************************/


const endoAppend = comp;


const endoPrepend = pipe;


const endoEmpty = id;


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


const List = union("List");


const Nil = List("Nil", {});


const Cons = head => tail =>
  List(Cons, {head, tail});


/***[ Applicative ]***********************************************************/


// listAp @Derived


// listLiftA2 @Derived


// listLiftA3 @Derived


// listLiftA4 @Derived


// listLiftA5 @Derived


// listLiftA6 @Derived


const listOf = x => Cons(x) (Nil);


/***[ De-/Construction ]******************************************************/


const cons = Cons;


const cons_ = tail => head =>
  List(Cons, {head, tail});


/***[ Foldable ]**************************************************************/


const listFold = f => acc => xs => {
  let xs_ = xs,
    acc_ = acc
    i = 0;

  do {
    if (xs_.tag === "Nil")
      break;

    else if (xs_.tag === "Cons") {
      const {head, tail} = xs_;
      acc_ = f(acc_) (head, i);
      xs_ = tail;
      i++;
    }
  } while (true);

  return acc_;
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
  rec(xs =>
    match(xs, {
      Nil: _ => Base(Nil),
      Cons: ({head, tail}) => Call(Cons(f(head)), Step(tail))
    }));


const listMap_ = f => {
  const go = xs =>
    match(xs, {
      Nil: _ => Nil,
      Cons: ({head, tail}) => Cons(f(head)) (thunk(() => go(tail)))
    });

  return go;
};


/***[ Monoid ]****************************************************************/


const listAppend = xs => ys =>
  listFoldr(Cons) (ys) (xs);


const listPrepend = ys => xs =>
  listFoldr(Cons) (ys) (xs);


const listEmpty = Nil;


/***[ Derived ]***************************************************************/


const listAp = fs => xs =>
  listFoldr(f => acc =>
    listAppend(listMap(f) (xs))
      (acc))
        (Nil)
          (fs);


const listLiftA2 = liftA2({map: listMap, ap: listAp});


const listLiftA3 = liftA3({map: listMap, ap: listAp});


const listLiftA4 = liftA4({map: listMap, ap: listAp});


const listLiftA5 = liftA5({map: listMap, ap: listAp});


const listLiftA6 = liftA6({map: listMap, ap: listAp});


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


/***[Monoid]******************************************************************/


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


/***[Misc. Combinators]*******************************************************/


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


const Parallel = par => record(
  Parallel,
  thisify(o => {
    o.par = (res, rej) =>
      par(x => {
        o.par = k => k(x);
        return res(x);
      }, rej);
    
    return o;
  }));


/***[ Applicative ]***********************************************************/


const parAp = tf => tx =>
  Parallel((res, rej) =>
    parAnd(tf) (tx)
      .par(([f, x]) =>
         res(f(x)), rej));


// parLiftA2 @Derived


// parLiftA3 @Derived


// parLiftA4 @Derived


// parLiftA5 @Derived


// parLiftA6 @Derived


const parOf = x => Parallel((res, rej) => res(x));


/***[ Functor ]***************************************************************/


const parMap = f => tx =>
  Parallel((res, rej) =>
    tx.par(x => res(f(x)), rej));


/***[ Monoid (type parameter) ]***********************************************/


const parAppend = append => tx => ty =>
  Parallel((res, rej) =>
    parAnd(tx) (ty)
      .par(([x, y]) =>
        res(append(x) (y)), rej));


const parPrepend = parAppend; // pass prepend as type dictionary

  
const parEmpty = empty =>
  Parallel((res, rej) => res(empty));


/***[ Monoid (race) ]*********************************************************/


const raceAppend = tx => ty =>
  Parallel((res, rej) =>
    parOr(tx) (ty)
      .par(x => res(x), rej));


const racePrepend = raceAppend; // order doesn't matter


const raceEmpty = Parallel((res, rej) => null);


/***[ Primitives ]************************************************************/


const parAnd = tx => ty => {
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
      tx.par(...guard(res, rej, 0)),
      ty.par(...guard(res, rej, 1))));
};


const parOr = tx => ty => {
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
      tx.par(...guard(res, rej)),
      ty.par(...guard(res, rej))));
};


/***[ Derived ]***************************************************************/


const parLiftA2 = liftA2({map: parMap, ap: parAp});


const parLiftA3 = liftA3({map: parMap, ap: parAp});


const parLiftA4 = liftA4({map: parMap, ap: parAp});


const parLiftA5 = liftA5({map: parMap, ap: parAp});


const parLiftA6 = liftA6({map: parMap, ap: parAp});


/******************************************************************************
***********************************[ PRED ]************************************
******************************************************************************/


const Pred = pred => record(Pred, {pred});


/***[ Monoid ]****************************************************************/


const predAppend = tp => tq =>
  Pred(x => tp.pred(x) && tq.pred(x));


const predPrepend = tq => tp =>
  Pred(x => tp.pred(x) && tq.pred(x));


const predEmpty = Pred(_ => true);


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = f => record("State", {state: f});


/***[Applicative]*************************************************************/


const stateAp = tf => tx =>
  State(s => {
    const [f, s_] = tf.state(s),
      [x, s__] = tx.state(s_);

    return [f(x), s__];
  });


const stateOf = x => State(s => [x, s]);


/***[Functor]*****************************************************************/


const stateMap = f => tx =>
  State(s => {
    const [x, s_] = tx.state(s);
    return [f(x), s_];
  });


/***[Monad]*******************************************************************/


const stateChain = mx => fm =>
  State(s => {
    const [x, s_] = mx.state(s);
    return fm(x).state(s_);
  });


/***[Misc. Combinators]*******************************************************/


const stateEval = tf =>
  s => tf.state(s) [0];


const stateExec = tf =>
  s => tf.state(s) [1];


const stateGet = State(s => [s, s]);


const stateGets = f =>
  State(s => [f(s), s]);


const stateModify = f =>
  State(s => [null, f(s)]);


const statePut = s =>
  State(_ => [null, s]);


/******************************************************************************
***********************************[ TASK ]************************************
******************************************************************************/


const Task = task => record(
  Task,
  thisify(o => {
    o.task = (res, rej) =>
      task(x => {
        o.task = k => k(x);
        return res(x);
      }, rej);
    
    return o;
  }));


/***[ Applicative ]***********************************************************/


const taskAp = tf => tx =>
  Task((res, rej) =>
     tf.task(f =>
       tx.task(x =>
         res(f(x)), rej), rej));


// taskLiftA2 @Derived


// taskLiftA3 @Derived


// taskLiftA4 @Derived


// taskLiftA5 @Derived


// taskLiftA6 @Derived


const taskOf = x => Task((res, rej) => res(x));


/***[ Foldable ]**************************************************************/


const taskAll = append =>
  arrFold(acc => tx =>
    taskMap(([xs, x]) =>
      xs.concat([x]))
        (taskAppend(append) (acc) (tx)))
          (taskOf([]));


/***[ Functor ]***************************************************************/


const taskMap = f => tx =>
  Task((res, rej) =>
    tx.task(x => res(f(x)), rej));


/***[ Monad ]*****************************************************************/


const taskChain = mx => fm =>
  Task((res, rej) =>
    mx.task(x =>
      fm(x).task(res, rej), rej));


/***[ Monoid ]****************************************************************/


const taskAppend = append => tx => ty =>
  Task((res, rej) =>
    tx.task(x =>
      ty.task(y =>
        res(append(x) (y)), rej), rej));


const taskPrepend = taskAppend; // pass prepend as type dictionary


const taskEmpty = empty =>
  Task((res, rej) => res(empty));


/***[ Derived ]***************************************************************/


const taskLiftA2 = liftA2({map: taskMap, ap: taskAp});


const taskLiftA3 = liftA3({map: taskMap, ap: taskAp});


const taskLiftA4 = liftA4({map: taskMap, ap: taskAp});


const taskLiftA5 = liftA5({map: taskMap, ap: taskAp});


const taskLiftA6 = liftA6({map: taskMap, ap: taskAp});


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = pair => record(Writer, {writer: pair});


/***[Applicative]*************************************************************/


const writerAp = append => ({writer: [f, w]}) => ({writer: [x, w_]}) =>
  Writer([f(x), append(w) (w_)]);


const writerOf = empty => x =>
  Writer([x, empty]);


/***[Functor]*****************************************************************/


const writerMap = f => ({writer: [x, w]}) =>
  Writer([f(x), w]);


/***[Monad]*******************************************************************/


const writerChain = append => ({writer: [x, w]}) => fm => {
  const [x_, w_] = fm(x).writer;
  return Writer([x_, append(w) (w_)]);
};


/***[Misc. Combinators]*******************************************************/


const writerCensor = ({append, empty}) => f => tx =>
  writerPass(
    writerChain(append) (tx) (x =>
      writerOf(empty) ([x, f])))


const writerExec = ({writer: [_, w]}) => w;


const writerListen = ({writer: [x, w]}) =>
  Writer([[x, w], w]);


const writerListens = f => ({writer: [x, w]}) =>
  Writer([[x, f(w)], w]);


const writerMapBoth = f => tx =>
  Writer(f(tx.writer));


const writerPass = ({writer: [[x, f], w]}) =>
  Writer([x, f(w)]);


const writerTell = w => Writer([null, w]);


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


const fileRead = opt => path =>
  Task((res, rej) =>
    fs.readFile(path, opt, (e, x) =>
      e ? rej(e) : res(x)));


const fileWrite = opt => path => s =>
  Task((res, rej) =>
    fs.writeFile(path, s, opt, e =>
      e ? rej(e) : res()));


const scanDir = path =>
  Task((res, rej) =>
    fs.readdir(path, (e, xs) =>
      e ? rej(e) : res(xs)));


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


const optmEmpty = None;


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  and,
  andf,
  allAppend,
  allEmpty,
  allPrepend,
  anyAppend,
  anyEmpty,
  anyPrepend,
  app,
  app_,
  appr,
  appRest,
  appSpread,
  arrAp,
  arrAppend,
  arrChain,
  arrClone,
  arrCons,
  arrCons_,
  arrFold,
  arrFoldk,
  arrFoldr,
  arrJoin,
  arrLiftA2,
  arrLiftA3,
  arrLiftA4,
  arrLiftA5,
  arrLiftA6,
  arrMap,
  arrOf,
  arrPrepend,
  arrSnoc,
  arrSnoc_,
  arrUncons,
  arrUnfold,
  arrUnfoldr,
  arrUnsnoc,
  Base,
  Call,
  Chain,
  ceil,
  cmpAppend,
  cmpEmpty,
  cmpPrepend,
  comp,
  comp3,
  comp4,
  comp5,
  comp6,
  comp2nd,
  Compare,
  compBin,
  compk,
  compk3,
  compk4,
  compk5,
  compk6,
  compkn,
  compn,
  compOn,
  Cons,
  cons,
  cons_,
  _const,
  const_,
  Cont,
  contAp,
  contAppend,
  contEmpty,
  contLiftA2,
  contLiftA3,
  contLiftA4,
  contLiftA5,
  contLiftA6,
  contMap,
  contOf,
  contPrepend,
  ctorAppend,
  ctorEmpty,
  ctorPrepend,
  curry,
  curry3,
  curry4,
  curry5,
  curry6,
  debug,
  delayParallel,
  delayTask,
  drop,
  dropr,
  dropk,
  droprk,
  dropWhile,
  dropWhiler,
  dropWhilek,
  dropWhilerk,
  eff,
  Either,
  endoAppend,
  endoEmpty,
  endoPrepend,
  EQ,
  fileRead,
  fileWrite,
  filter,
  filterr,
  filterk,
  filterrk,
  fix,
  flip,
  floor,
  foldMap,
  formatDate,
  formatDay,
  formatFrac,
  formatInt,
  formatMonth,
  formatNum,
  formatWeekday,
  formatYear,
  fromNullable,
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
  getTree,
  getTreeOr,
  GT,
  guard,
  Hamt,
  Hamt_,
  hamtDel,
  hamtGet,
  hamtHas,
  hamtSet,
  hamtUpd,
  id,
  implies,
  impliesf,
  infix,
  infix3,
  infix4,
  infix5,
  infix6,
  infixn,
  infixr3,
  infixr4,
  infixr5,
  infixr6,
  infixrn,
  introspect,
  isUnit,
  iterate,
  join,
  lazy,
  lazyProp,
  Left,
  _let,
  liftA2,
  liftA3,
  liftA4,
  liftA5,
  liftA6,
  List,
  listAp,
  listAppend,
  listEmpty,
  listFold,
  listFoldr,
  listLiftA2,
  listLiftA3,
  listLiftA4,
  listLiftA5,
  listLiftA6,
  listMap,
  listMap_,
  listOf,
  listPrepend,
  log,
  LT,
  mapDel,
  mapHas,
  mapGet,
  mapMod,
  mapSet,
  map,
  mapr,
  mapk,
  maprk,
  match,
  modTree,
  monadRec,
  Mutu,
  mutuRec,
  _new,
  Nil,
  None,
  not,
  notf,
  NOT_FOUND,
  objClone,
  objEntries,
  objGet,
  objGetOr,
  objKeys,
  objValues,
  Option,
  optAppend,
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
  optPrepend,
  or,
  orf,
  Pair,
  pairMap,
  pairMapFirst,
  Parallel,
  parAnd,
  parAp,
  parAppend,
  parEmpty,
  parLiftA2,
  parLiftA3,
  parLiftA4,
  parLiftA5,
  parLiftA6,
  parMap,
  parOf,
  parOr,
  parPrepend,
  partial,
  partialProps,
  pipe,
  pipe3,
  pipe4,
  pipe5,
  pipe6,
  pipe2nd,
  pipeBin,
  pipek,
  pipek3,
  pipek4,
  pipek5,
  pipek6,
  pipekn,
  pipen,
  pipeOn,
  postRec,
  Pred,
  predAppend,
  predEmpty,
  predPrepend,
  PREFIX,
  prodAppend,
  prodEmpty,
  prodPrepend,
  raceAppend,
  raceEmpty,
  racePrepend,
  rec,
  recChain,
  recOf,
  record,
  Rex,
  Rexf,
  Rexg,
  Rexu,
  Right,
  round,
  scanDir,
  ScriptumError,
  select,
  setDel,
  setHas,
  setSet,
  setTree,
  Some,
  Step,
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
  strict,
  strict1,
  strFold,
  strFoldChunk,
  strFoldChunkr,
  strFoldk,
  strFoldr,
  strMatch,
  strMatchAll,
  strMatchLast,
  strMatchNth,
  strMatchSection,
  strParse,
  strReplace,
  strReplaceBy,
  sumAppend,
  sumEmpty,
  sumPrepend,
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
  taskAll,
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
  taskOf,
  taskPrepend,
  thisify,
  _throw,
  throwOn,
  throwOnEmpty,
  throwOnFalse,
  throwOnUnit,
  thunk,
  trace,
  transduce,
  Triple,
  TYPE,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  uncurry6,
  union,
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
  writerTell
};

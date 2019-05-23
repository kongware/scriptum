/*
                                                                                      
                                                   I8                                 
                                                   I8                                 
                                 gg             88888888                              
                                 ""                I8                                 
   ,g,       ,gggg,   ,gggggg,   gg   gg,gggg,     I8   gg      gg   ,ggg,,ggg,,ggg,  
  ,8'8,     dP"  "Yb  dP""""8I   88   I8P"  "Yb    I8   I8      8I  ,8" "8P" "8P" "8, 
 ,8'  Yb   i8'       ,8'    8I   88   I8'    ,8i  ,I8,  I8,    ,8I  I8   8I   8I   8I 
,8'_   8) ,d8,_    _,dP     Y8,_,88,_,I8 _  ,d8' ,d88b,,d8b,  ,d8b,,dP   8I   8I   Yb,
P' "YY8P8PP""Y8888PP8P      `Y88P""Y8PI8 YY88888P8P""Y88P'"Y88P"`Y88P'   8I   8I   `Y8
                                      I8                                              
                                      I8                                              
                                      I8                                              
*/


/******************************************************************************
*******************************************************************************
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const ARGS = Symbol("args"); // used for debugging


const TAG = Symbol("tag"); // the tag property of tagged unions


const TYPE = Symbol.toStringTag; // used for debugging


/******************************************************************************
*******************************************************************************
**********************************[ ERRORS ]***********************************
*******************************************************************************
******************************************************************************/


// I actually do subtying in scriptum :D

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


class UnionError extends ScriptumError {};


/******************************************************************************
*******************************************************************************
*******************************[ INTROSPECTION ]*******************************
*******************************************************************************
******************************************************************************/


const introspect = x =>
  x && TYPE in x
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


/******************************************************************************
*******************************************************************************
********************************[ TRAMPOLINES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


const loop = f => {
  let step = f();

  while (step && step.type === recur)
    step = f(...step.args);

  return step;
};


const recur = (...args) =>
  ({type: recur, args});


/******************************************************************************
*****************************[ MUTUAL RECURSION ]******************************
******************************************************************************/


const tramp = f => (...args) => {
  let step = f(...args);

  while (step && step.type === recur) {
    let [f, ...args_] = step.args;
    step = f(...args_);
  }

  return step;
};


/******************************************************************************
*******************************************************************************
*******************************[ CONSTRUCTORS ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ UNION TYPE ]*********************************
******************************************************************************/


const union = type => (tag, x) => ({
  ["run" + type]: x,
  tag,
  [TYPE]: type
});


const match = ({[TYPE]: type, tag}) => o =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(tag in o) ? _throw(new UnionError("invalid tag"))
    : o[tag];


const match2 = ({[TYPE]: type1, tag1}) => ({[TYPE]: type2, tag2}) => o =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(type2 in o) ? _throw(new UnionError("invalid type"))
    : !(tag1 in o) ? _throw(new UnionError("invalid tag"))
    : !(tag2 in o) ? _throw(new UnionError("invalid tag"))
    : tag1 !== tag2 ? _throw(new UnionError("tag mismatch"))
    : o[tag];


/******************************************************************************
********************************[ RECORD TYPE ]********************************
******************************************************************************/


const struct = type => cons => {
  const f = x => ({
    ["run" + type]: x,
    [TYPE]: type,
  });

  return cons(f);
};


const structMemo = type => cons => {
  const f = (thunk, args) => ({
    get ["run" + type] () {
      delete this["run" + type];
      return this["run" + type] = thunk();
    },
    [TYPE]: type
  });

  return cons(f);
};


/******************************************************************************
*******************************************************************************
****************************[ TYPECLASS FUNCTIONS ]****************************
*******************************************************************************
******************************************************************************/


/***[Functor]*****************************************************************/


const mapn = map => {
  const go = x =>
    Object.assign(y => go(map(x) (y)), {runMap: x, [TYPE]: "Map"});

  return go;
};


/***[Applicative]*************************************************************/


// TODO


/***[Monad]*******************************************************************/


const kleisli = chain => fm => gm => x =>
  chain(fm) (gm(x));


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Clonable]****************************************************************/


const arrClone = xs => {
  const ys = [];

  for (let i = 0; i < xs.length; i++)
    ys[i] = xs[i];

  return ys;
};


/***[Foldable]****************************************************************/


const arrFold = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (xs[i]);

  return acc;
};


const arrFoldp = p => alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++) {
    if (!p([xs[i], acc])) break;
    acc = alg(acc) (xs[i]);
  }

  return acc;
};


/***[Monoid]******************************************************************/


const arrAppend = xs => ys => xs.concat(ys);


const arrPrepend = ys => xs => xs.concat(ys);


/***[Transduce]***************************************************************/


const arrTransduce = alg => reduce =>
  arrFold(alg(reduce));


const arrTransducep = p => alg => reduce =>
  arrFoldp(p) (alg(reduce));


/******************************************************************************
*********************************[ FUNCTIONS ]*********************************
******************************************************************************/


const app = f => x => f(x);


const appr = f => y => x => f(x) (y);


const _const = x => y => x;


const flip = f => y => x => f(x) (y);


const id = x => x;


const infix = (x, f, y) => f(x) (y); // simulates function calls in infix position


const _let = f => f(); // simulates let binding as an expression


/***[Composition]*************************************************************/


// TODO


/***[Conditional Branching]***************************************************/


const cond = x => y => b =>
  b ? x : y;


const cond_ = b => x => y =>
  b ? x : y;


const guard = p => f => x =>
  p(x) ? f(x) : x;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


/***[Currying]****************************************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const curry5 = f => v => w => x => y => z =>
  f(v, w, x, y, z);


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


const uncurry5 = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);


/***[Impure]******************************************************************/


const eff = f => x => (f(x), x); // aka tap


const memoThunk = (f, memo) => () =>
  memo === undefined
    ? (memo = f(), memo)
    : memo;


const _throw = e => {
  throw e;
};


const tryCatch = f => g => x => {
  try {
    return f(x);
  }

  catch(e) {
    return g([x, e]);
  }
};


/***[Partial Application]*****************************************************/


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const pcurry = (f, n, ...args) => {
  const go = (acc, m) =>
    m === 0
      ? f(...args, ...acc)
      : x => go((acc.push(x), acc), m - 1);

  return go([], n);
};


/***[Transducer]**************************************************************/


const mapper = f => reduce => acc => x =>
  reduce(acc) (f(x));


const filterer = p => reduce => acc => x =>
  p(x) ? reduce(acc) (x) : acc;


/***[Typeclass Functions]*****************************************************/


const funAp = f => g => x =>
  f(x) (g(x));


const funChain = f => g => x =>
  f(g(x)) (x);


const funContra = g => f => x => f(g(x));


const funJoin = f => x =>
  f(x) (x);


const funLiftA2 = f => g => h => x =>
  f(g(x)) (h(x));


const funMap = f => g => x => f(g(x));


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


// asynchronous computations in parallel

const Parallel = struct("Parallel")
  (Parallel => k => Parallel((res, rej) => k(res, rej)));


/***[Foldable]****************************************************************/


const parCata = alg => (res, rej) =>
  tf.runParallel(res, rej);


/***[Applicative]*************************************************************/


// TODO: parAp


const parOf = x => Parallel((res, rej) => res(x));


/***[Combinators]*************************************************************/


const parAnd = tf => tg => {
  const r = []

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

  let isRes = false,
    isRej = false;

  return Parallel(
    (res, rej) => (
      tf.runParallel(...guard(res, rej, 0)),
      tg.runParallel(...guard(res, rej, 1))));
};


const parOr = tf => tg => {
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
      tf.runParallel(...guard(res, rej)),
      tg.runParallel(...guard(res, rej))))
};


const parAll = ts => // eta abstraction to create a new tOf([]) for each invocation
  arrFold(acc => tf =>
    parMap(([xs, x]) =>
      (xs.push(x), xs))
        (parAnd(acc) (tf)))
          (parOf([])) (ts);


const parAny =
  arrFold(acc => tf =>
    parOr(acc) (tf))
      (parEmpty);


/***[Functor]*****************************************************************/


const parMap = f => tg =>
  Parallel((res, rej) => tg.runParallel(x => res(f(x)), rej));


/***[Monoid]******************************************************************/


const parEmpty = Parallel((res, rej) => null);


/***[Semigroup]***************************************************************/


const parAppend = parOr;


const parPrepend = parOr;


/******************************************************************************
***********************************[ TASK ]************************************
******************************************************************************/


// asynchronous computations in sequence

const Task = struct("Task") (Task => k => Task((res, rej) => k(res, rej)));


/***[Applicative]*************************************************************/


const tAp = tf => tg =>
  Task((res, rej) => tf.runTask(f => tg.runTask(x => res(f(x)), rej), rej));


const tOf = x => Task((res, rej) => res(x));


/***[Combinators]*************************************************************/


const tAnd = tf => tg =>
  Task((res, rej) =>
    tf.runTask(f =>
      tg.runTask(g =>
        res([f, g]), rej),
        rej));


const tAll = ts => // eta abstraction to create a new tOf([]) for each invocation
  arrFold(acc => tf =>
    tMap(([xs, x]) =>
      (xs.push(x), xs))
        (tAnd(acc) (tf)))
          (tOf([])) (ts);


/***[Foldable]****************************************************************/


const tCata = alg => (res, rej) =>
  tf.runTask(res, rej);


/***[Functor]*****************************************************************/


const tMap = f => tg =>
  Task((res, rej) => tg.runTask(x => res(f(x)), rej));


/***[Monad]*******************************************************************/


const tChain = mx => fm =>
  Task((res, rej) => mx.runTask(x => fm(x).runTask(res, rej), rej));


const tChainf = fm => mx =>
  Task((res, rej) => mx.runTask(x => fm(x).runTask(res, rej), rej));


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  // CONSTANTS
  
  ARGS,
  TAG,
  TYPE,
  
  // INTROSPECTION
  
  introspect,
  
  // TRAMPOLINES
  
  loop,
  recur,
  tramp,
  
  // CONSTRUCTORS
  
  union,
  match,
  match2,
  struct,
  structMemo,
  
  // BUILT-IN TYPES
  
  // Array
  
  arrClone,
  arrFold,
  arrFoldp,
  arrAppend,
  arrPrepend,
  arrTransduce,
  arrTransducep,
  
  // Function
  
  app,
  appr,
  _const,
  flip,
  id,
  infix,
  _let,
  comp,
  compn,
  compm,
  comp2nd,
  contra,
  contran,
  contram,
  kleisli,
  kleislin,
  kleislim,
  on,
  cond,
  cond_,
  guard,
  select,
  curry,
  curry3,
  curry4,
  curry5,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  eff,
  memoThunk,
  _throw,
  tryCatch,
  partial,
  pcurry,
  mapper,
  filterer,
  funAp,
  funChain,
  funJoin,
  funLiftA2,
  
  // CUSTOM TYPES
  
  // Parallel
  
  Parallel,
  parCata,
  parOf,
  parAnd,
  parOr,
  parAll,
  parAny,
  parMap,
  parEmpty,
  parAppend,
  parPrepend,
  
  // Task
  
  Task,
  tAp,
  tOf,
  tAnd,
  tAll,
  tCata,
  tMap,
  tChain,
  tChainf,
}

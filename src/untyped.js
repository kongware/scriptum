/*
      ___           ___           ___                       ___           ___           ___           ___     
     /\  \         /\  \         /\  \          ___        /\  \         /\  \         /\__\         /\__\    
    /::\  \       /::\  \       /::\  \        /\  \      /::\  \        \:\  \       /:/  /        /::|  |   
   /:/\ \  \     /:/\:\  \     /:/\:\  \       \:\  \    /:/\:\  \        \:\  \     /:/  /        /:|:|  |   
  _\:\~\ \  \   /:/  \:\  \   /::\~\:\  \      /::\__\  /::\~\:\  \       /::\  \   /:/  /  ___   /:/|:|__|__ 
 /\ \:\ \ \__\ /:/__/ \:\__\ /:/\:\ \:\__\  __/:/\/__/ /:/\:\ \:\__\     /:/\:\__\ /:/__/  /\__\ /:/ |::::\__\
 \:\ \:\ \/__/ \:\  \  \/__/ \/_|::\/:/  / /\/:/  /    \/__\:\/:/  /    /:/  \/__/ \:\  \ /:/  / \/__/~~/:/  /
  \:\ \:\__\    \:\  \          |:|::/  /  \::/__/          \::/  /    /:/  /       \:\  /:/  /        /:/  / 
   \:\/:/  /     \:\  \         |:|\/__/    \:\__\           \/__/     \/__/         \:\/:/  /        /:/  /  
    \::/  /       \:\__\        |:|  |       \/__/                                    \::/  /        /:/  /   
     \/__/         \/__/         \|__|                                                 \/__/         \/__/    
*/




/******************************************************************************
*******************************************************************************
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


const PREFIX = "$_"; // avoid property name collisions


export const TAG = Symbol.toStringTag;


const TICK_TRESHOLD = 0.01; // treshold for next microtask


/******************************************************************************
*******************************************************************************
***************************[ CROSS-CUTTING ASPECTS ]***************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ APPLICATOR ]*********************************
******************************************************************************/


/* Enables flat syntax by utilizing method chaining without relying on methods
and `this`. */


export const App = t => ({
  app: x => App(t(x)), // applies the boxed fun
  app_: y => App(x => t(x) (y)), // applies the 2nd arg of the boxed fun
  appVar: (...args) => App(args.reduce((f, x) => f(x), t)), // uncurries the boxed fun
  appLazy: x => App_({get run() {return t(x)}}), // applies the boxed fun lazily
  map: f => App(f(t)),  // applies the fun
  map_: f => App(x => f(x) (t)), // applies the 2nd arg of the fun
  get: t // gets the boxed value
});


/******************************************************************************
******************************[ LAZY EVALUATION ]******************************
******************************************************************************/


/* Encodes lazy evaluated thunks. Thunks are expressions that are only
evaluated if actually needed and only once. If evaluation kicks in, Javascript's
normal run-to.completion rule applies. As soon as a thunk is used within a
normal and thus eagerly evaluated expression, it is automatically evaluated.
Hence you can use thunks as if they were normal expressions. They are
completely transparent to the code. */


/***[ Constants ]*************************************************************/


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/***[ API ]*******************************************************************/


export const strict = x =>
  x && x[THUNK] ? x[EVAL] : x;


export const lazy = thunk =>
  new Proxy(thunk, new ThunkProxy(true));


export const defer = thunk =>
  new Proxy(thunk, new ThunkProxy(false));


/***[ Implementation ]********************************************************/


class ThunkProxy {
  constructor(share) {
    this.memo = NULL;
    this.share = share;
  }

  apply(f, that, args) {

    // force evalutation to WHNF

    if (this.memo === NULL) {
      let g = f();
      
      while (g && g[THUNK] === true)
        g = g[EVAL];

      if (this.share) this.memo = g;

      if (typeof g !== "function")
        throw new TypeError(`cannot invoke thunk of type "${introspect(g)}"`);

      return g(...args);
    }

    else return this.memo(...args);
  }

  get(f, k, p) {

    // prevent evaluation in case of introspection
    
    if (k === THUNK) return true;

    else if (k === Symbol.toStringTag) return "Proxy";

    // force evaluation of one layer

    else if (k === EVAL) {
      if (this.memo === NULL) {
        let o = f();
        if (this.share) this.memo = o;
        return o;
      }

      else return this.memo;
    }

    // force evaluation to WHNF due to array context

    else if (k === Symbol.isConcatSpreadable) {
      if (this.memo === NULL) {
        let o = f();

        while (o && o[THUNK] === true)
          o = o[EVAL];

        if (this.share) this.memo = o;

        if (Array.isArray(o) || o[Symbol.isConcatSpreadable]) return true;
        else return false;
      }

      else {
        if (Array.isArray(this.memo) || this.memo[Symbol.isConcatSpreadable]) return true;
        else return false;
      }
    }

    // force evaluation to WHNF due to property access

    else {
      if (this.memo === NULL) {
        let o = f();

        while (o && o[THUNK] === true)
          o = o[EVAL];

        // take method binding into account

        if (o === Object(o) && o[k] && o[k].bind) o[k] = o[k].bind(o);

        if (this.share) this.memo = o;

        // restrict duck typing

        if (typeof k !== "symbol" && o[k] === undefined)
          throw new TypeError(`unknown property "${k}" access`);

        else return o[k];
      }

      else return this.memo[k];
    }
  }

  getOwnPropertyDescriptor(f, k) {

    // force evaluation to WHNF

    if (this.memo === NULL) {
      let o = f();

      while (o && o[THUNK] === true)
        o = o[EVAL];

      if (this.share) this.memo = o;
      return Reflect.getOwnPropertyDescriptor(o, k);
    }

    else return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(f, k) {

    // prevent evaluation in case of introspection

    if (k === THUNK) return true;

    // force evaluation to WHNF

    if (this.memo === NULL) {
      let o = f();

      while (o && o[THUNK] === true)
        o = o[EVAL];

      if (this.share) this.memo = o;
      return k in o;
    }

    else return k in this.memo;
  }

  ownKeys(o) {

    // force evaluation to WHNF

    if (this.memo === NULL) {
      let o = f();

      while (o && o[THUNK] === true)
        o = o[EVAL];

      if (this.share) this.memo = o;
      return Reflect.ownKeys(o);
    }

    else return Reflect.ownKeys(this.memo);
  }

  set(o) {
    throw new TypeError("must not mutate thunk");
  }
}


/******************************************************************************
*******************************[ STACK SAFETY ]********************************
******************************************************************************/


/***[ Tail Recursion ]********************************************************/


/* Stack-safe tail-recursion and mutual tail-recursion using a trampoline. The
`next` and `done` tags are used to encode recursive and the base cases
respectively. In addition, the `call` tag can be used to defer function
invokations. */


export const Loop = f => x => {
  let o = f(x);

  while (o[TAG] !== "Done") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x);
        break;
      }

      case "Next": {
        o = f(o.x);
        break;
      }

      default: throw new TypeError("invalid constructor");
    }
  }

  return o.x;
};


export const Loop2 = f => (x, y) => {
  let o = f(x, y);

  while (o[TAG] !== "Done") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x, o.y);
        break;
      }

      case "Next": {
        o = f(o.x, o.y);
        break;
      }

      default: throw new TypeError("invalid constructor");
    }
  }

  return o.x;
};


export const Loop3 = f => (x, y, z) => {
  let o = f(x, y, z);

  while (o[TAG] !== "Done") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x, o.y, o.z);
        break;
      }

      case "Next": {
        o = f(o.x, o.y, o.z);
        break;
      }

      default: throw new TypeError("invalid constructor");
    }
  }

  return o.x;
};


// Tags


Loop.call = (f, x) => ({[TAG]: "Call", f, x});


Loop.next = x => ({[TAG]: "Next", x});


Loop.done = x => ({[TAG]: "Done", x});


Loop2.call = (f, x, y) => ({[TAG]: "Call", f, x, y});


Loop2.next = (x, y) => ({[TAG]: "Next", x, y});


Loop2.done = x => ({[TAG]: "Done", x});


Loop3.call = (f, x, y, z) => ({[TAG]: "Call", f, x, y, z});


Loop3.next = (x, y, z) => ({[TAG]: "Next", x, y, z});


Loop3.done = x => ({[TAG]: "Done", x});


/***[ Loop Stack-based ]******************************************************/


/* Stack-based trampoline to enable recursive cases not in tail call position.

The original Fibbonacci algorithm

  const fib_ = n =>
    n <= 1 ? n
      : fib_(n - 1) + fib_(n - 2);

is transformed into a trampolining version:

  const add = x => y => x + y;

  const fib = Loops(n =>
    n <= 1
      ? Loops.done(n)
      : Loops.call2(
          Loops.next(n - 1),
          add,
          Loops.next(n - 2))); */


const Loops = f => x => {
  const stack = [f(x)];

  while (stack.length > 1 || stack[0] [TAG] !== "Done") {
    let o = stack[stack.length - 1];

    switch (o[TAG]) {
      case "Call":      
      case "Call2": {
        o = f(o.x.x); // 1st x of call and 2nd x of next tag
        stack.push(o);
        break;
      }

      case "Next": {
        o = f(o.x);
        break;
      }

      case "Done": {
        while (stack.length > 1 && stack[stack.length - 1] [TAG] === "Done") {
          const p = (stack.pop(), stack.pop());

          switch (p[TAG]) {
            case "Call": {
              o = Loops.done(p.f(o.x));
              stack.push(o);

              break;
            }

            case "Call2": {
              o = Loops.call(p.f(o.x), p.y);
              stack.push(o);
              break;
            }

            default: throw new TypeError("unexpected tag");
          }
        }

        break;
      }

      default: throw new TypeError("unexpected tag");
    }
  }

  return stack[0].x;
};


// Tags


Loops.call = (f, x) => ({[TAG]: "Call", f, x});


Loops.call2 = (x, f, y) => ({[TAG]: "Call2", f, x, y});


Loops.next = x => ({[TAG]: "Next", x});


Loops.done = x => ({[TAG]: "Done", x});



/******************************************************************************
*******************************************************************************
**************************[ TYPE CLASS COMBINATORS ]***************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ FOLDABLE ]**********************************
******************************************************************************/


export const fold = ({fold}, {append, empty}) => tx =>
  A.fold(append) (empty) (tx);


export const foldMapl = ({foldl}, {append, empty}) => f =>
  A.foldl(compSnd(append) (f)) (empty);


export const foldMapr = ({foldr}, {append, empty}) => f =>
  A.foldr(comp(append) (f)) (empty);


/******************************************************************************
**********************************[ FUNCTOR ]**********************************
******************************************************************************/


export const mapEff = ({map}) => x => map(_ => x);


/******************************************************************************
*****************************[ FUNCTOR :: APPLY ]******************************
******************************************************************************/


export const apEff1 = ({map, ap}) => tx => ty => ap(map(_const) (tx)) (ty);


export const apEff2 = ({map, ap}) => tx => ty => ap(mapEff({map}) (id) (tx)) (ty);


export const liftA2 = ({map, ap}) => f => tx => ty => ap(map(f) (tx)) (ty);


/******************************************************************************
*************************[ FUNCTOR :: APPLY :: CHAIN ]*************************
******************************************************************************/


export const chain2 = ({chain}) => mx => my => fm =>
  chain(mx) (x => chain(my) (y => fm(x) (y)));


export const chain3 = ({chain}) => mx => my => mz => fm =>
  chain(mx) (x => chain(my) (y => chain(mz) (z => fm(x) (y) (z))));


/***[ Interpretation ]********************************************************/


export const join = ({chain}) => ttx => chain(ttx) (id);


/***[ Kleisli ]***************************************************************/


export const komp = ({chain}) => fm => gm => x => chain(fm(x)) (gm);


export const kipe = ({chain}) => gm => fm => x => chain(fm(x)) (gm);


/******************************************************************************
***********************************[ MONAD ]***********************************
******************************************************************************/


/******************************************************************************
*******************************************************************************
***********************************[ TYPES ]***********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


/* Represents synchronous computations encoded in continuation passing style.
  Use `Serial`/`Parallel` for asynchronous evaluation.

  The type has the following properties:

  * synchronous, serial evaluation
  * pure core/impure shell concept
  * lazy by deferred nested functions
  * reliable return values
  * not stack-safe but in tail position
  * flat composition/monadic chaining syntax
  * delimited scopes */


export const Cont = k => ({
  [TAG]: "Cont",
  run: k,
  unwind: x => Loop.call(k, x) // may prevent the stack from exhausting
});


/***[ Delimited ]*************************************************************/


Cont.abrupt = x => Cont(k => x);


Cont.callcc = f => Cont(k => f(Cont.reify(k)) (k));


Cont.reify = k => x => Cont(k2 => k(x));


Cont.reset = mx => Cont(k => k(mx.run(id)));


Cont.shift = fm => Cont(k => fm(k).run(id));


/***[ Functor ]***************************************************************/


Cont.map = f => tx => Cont(k => tx.run(x => k(f(x))));


Cont.Functor = {map: Cont.map};


/***[ Functor :: Apply ]******************************************************/


Cont.ap = tf => tx => Cont(k => tf.run(f => tx.run(x => k(f(x)))));


Cont.Apply = {
  ...Cont.Functor,
  ap: Cont.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Cont.of = x => Cont(k => k(x));


Cont.Applicative = {
  ...Cont.Apply,
  of: Cont.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Cont.chain = mx => fm => Cont(k => mx.run(x => fm(x).run(k)));


Cont.Chain = {
  ...Cont.Apply,
  chain: Cont.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Cont.Monad = {
  ...Cont.Applicative,
  chain: Cont.chain
};


/***[ Semigroup ]*************************************************************/


Cont.append = ({append}) => tx => ty =>
  Cont(k =>
    tx.run(x =>
      ty.run(y =>
        k(append(x) (y)))));


Cont.prepend = ({append}) => ty => tx =>
  Cont(k =>
    tx.run(x =>
      ty.run(y =>
        k(append(x) (y)))));


Cont.Semigroup = {
  append: Cont.append,
  prepend: Cont.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Cont.empty = empty => Cont(k => k(empty));


Cont.Monoid = {
  ...Cont.Semigroup,
  empty: Cont.empty
};


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


export const Fun = k => ({
  [TAG]: "Function",
  run: k
});


export const F = Fun; // shortcut


/***[ Applicators ]***********************************************************/


export const app = f => x => f(x);


export const appk = f => x => F(k => f(x).run(k));


export const app_ = x => f => f(x);


export const appk_ = x => f => F(k => f(x).run(k));


export const appr = (f, y) => x => f(x) (y);


export const appkr = (f, y) => x => F(k => f(x) (y).run(k));


export const contify = f => x => F(k => k(f(x)));


export const curry = f => x => y => f(x, y);


export const curryk = f => x => y => F(k => f(x, y).run(k));


export const uncurry = f => (x, y) => f(x) (y);


export const uncurryk = f => (x, y) => F(k => f(x) (y).run(k));


export const flip = f => y => x => f(x) (y);


export const flipk = f => y => x => F(k => f(x) (y).run(k));


export const infix = (...args) => { // variadic
  if (args.length === 0) throw new TypeError("no argument found");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else x = args[i++] (x) (args[i++]);
  }

  return x;
};


export const infixk = (...args) => F(k => { // variadic
  if (args.length === 0) throw new TypeError("no argument");

  else if (args.length % 2 === 0)
    throw new TypeError("invalid no. of arguments")

  let i = 1, x = args[0], tf;

  while (i < args.length) {
    if (i === 1) tf = args[i++] (x) (args[i++]);
    else tf = tf.run(args[i++]) (args[i++]);
  }

  return i === 1 ? k(x) : tf.run(k);
});


// enable `let` bindings as expressions in a readable form

export const _let = (...args) => ({in: f => f(...args)});


export const letk = (...args) => ({in: f => F(k => f(...args).run(k))});


/***[ Category ]**************************************************************/


export const id = x => x;


F.Category = () => {
  comp,
  id
};


/***[ Composition ]***********************************************************/


export const comp = f => g => x => f(g(x));


export const compk = f => g => x => F(k => g(x).run(f).run(k));


export const comp3 = f => g => h => x => f(g(h(x)));


export const compk3 = f => g => h => x => F(k => h(x).run(g).run(f).run(k));


export const compSnd = f => g => x => y => f(x) (g(y));


export const compkSnd = f => g => x => y => F(k => g(y).run(f(x)).run(k));


export const compThd = f => g => x => y => z => f(x) (y) (g(z));


export const compkThd = f => g => x => y => z => F(k => g(z).run(f(x) (y)).run(k));


export const compBin = f => g => x => y => f(g(x) (y));


export const compkBin = f => g => x => y => F(k => g(x) (y).run(f).run(k));


export const compBoth = f => g => x => y => f(g(x)) (g(y));


export const compkBoth = f => g => x => y =>
  F(k => g(y).run(g(x).run(f)).run(k));


export const liftFst = f => g => x => f(g(x)) (x);


export const liftkFst = f => g => x => F(k => g(x).run(f) (x).run(k));


export const liftSnd = f => g => x => f(x) (g(x));


export const liftkSnd = f => g => x => F(k => g(x).run(f(x)).run(k));


export const pipe = g => f => x => f(g(x));


export const pipek = g => f => x => F(k => f(x).run(g).run(k));


export const pipe3 = h => g => f => x => f(g(h(x)));


export const pipek3 = h => g => f => x => F(k => f(x).run(g).run(h).run(k));


/***[ Contravariant ]*********************************************************/


F.contramap = () => pipe;


F.Contra = () => {contramap: F.contramap};


/***[ Debugging ]*************************************************************/


export const debug = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


export const log = (x, tag = "") => {
  const s = JSON.stringify(x);

  if (tag) {
    if (s) console.log(tag + ":", x, "=JSON=>",s);
    else console.log(tag + ":", x);
  }

  else {
    if (s) console.log(x, "=JSON=>", s);
    else console.log(tag + ":", x);
  }
  
  return x;
};


export const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/***[ Functor ]***************************************************************/


F.map = compk;


F.Functor = {map: F.map};


/***[ Functor :: Apply ]******************************************************/


// identical to Chain


F.ap = liftkSnd;


F.Apply = {
  ...F.Functor,
  ap: F.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


export const _const = x => y => x;


export const const_ = x => y => y;


F.Applicative = {
  ...F.Apply,
  of: _const
};


/***[ Functor :: Apply :: Chain ]*********************************************/


/* Encodes the effect of implicitly threading an argument through a large
function composition. */ 


F.chain = liftkFst;


F.Chain = {
  ...F.Apply,
  chain: F.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


F.join = f => x => F(k => k(f(x) (x)));


F.Monad = {
  ...F.Applicative,
  chain: F.chain
};


/***[ Functor :: Extend ]*****************************************************/


F.extend = ({append}) => f => g => x => f(y => g(append(x) (y)));


F.Extend = {
  ...F.Functor,
  extend: F.extend
};


/***[ Functor :: Extend :: Comonad ]******************************************/


F.extract = ({empty}) => f => f(empty);


F.Comonad = {
  ...F.Extend,
  extract: F.extract
};


/***[ Impure ]****************************************************************/


export const introspect = x =>
  Object.prototype.toString.call(x).slice(8, -1);


export const _throw = e => {
  throw e;
};


/***[ Semigroup ]*************************************************************/


F.append = ({append}) => f => g => x => append(f(x)) (g(x));


F.prepend = ({prepend}) => g => f => x => prepend(f(x)) (g(x));


F.Semigroup = {
  append: F.append,
  prepend: F.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


F.empty = ({empty}) => _ => empty;


F.Monoid = {
  ...F.Semigroup,
  empty: F.empty
};


/***[ Transducer ]************************************************************/


export const drop = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, acc)
      : append(acc) (x);
};


export const dropk = n => append => { 
  let m = 0;

  return acc => x => k =>
      m < n
        ? (m++, k(acc))
        : append(acc) (x) (k)
};


export const dropr = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, acc)
      : append(x) (acc);
};


export const dropWhile = p => append => {
  let drop = true;

  return acc => x => 
    drop && p(x)
      ? acc
      : (drop = false, append(acc) (x));
};


export const dropWhilek = p => append => {
  let drop = true;

  return acc => x => k =>
    drop && p(x)
      ? k(acc)
      : (drop = false, append(acc) (x) (k))
};


export const dropWhiler = p => append => {
  let drop = true;

  return x => acc =>
    drop && p(x)
      ? acc
      : (drop = false, append(x) (acc));
};


export const filter = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


export const filterk = p => append => acc => x => k =>
  p(x)
    ? append(acc) (x) (k)
    : k(acc);


export const filterr = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


export const map = f => append => acc => x =>
  append(acc) (f(x));


export const mapk = f => append => acc => x => k =>
  append(acc) (f(x)) (k);


export const mapr = f => append => x => acc =>
  append(f(x)) (acc);


export const take = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, append(acc) (x))
      : acc;
};


export const takek = n => append => { 
  let m = 0;

  return acc => x => k =>
    m < n
      ? (m++, append(acc) (x) (k))
      : acc;
};


export const taker = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, append(x) (acc))
      : acc;
};


export const takeWhile = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


export const takeWhilek = p => append => acc => x => k =>
  p(x)
    ? append(acc) (x)(k)
    : acc;


export const takeWhiler = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


export const transduce = ({append}, {fold}) => f =>
  fold(f(append));


/***[ Resolve Deps ]**********************************************************/


F.Category = F.Category();


F.contramap = F.contramap();


F.Contra = F.Contra();


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/* Enocodes the effect of computations that may have no, one or several results.
Array is not a functional data type, because it isn't defined recursifely. As a
consequence, you cannot combine them with other monads in a lawful/predictable
manner. */


export const Arr = k => ({ // CPS version
  [TAG]: "Cont.Array",
  run: k
});


export const A = Arr; // shortcut


A.arr = () => A.foldl; // elimination rule


/***[ Clonable ]**************************************************************/


A.clone = xs => xs.concat();


A.Clonable = {clone: A.clone};


/***[ Con-/Deconstruction ]***************************************************/


A.cons = x => xs => [x].concat(xs);


A.cons_ = xs => x => [x].concat(xs);


A.head = xs => xs.length === 0 ? null : xs[0];


A.headOr = x => xs => xs.length === 0 ? x : xs[0];


A.index = i => xs => (i in xs) ? xs[i] : null;


A.indexOr = x => i => xs => (i in xs) ? xs[i] : x;


A.init = xs => xs.length === 0 ? null : xs.slice(0, -1);


A.last = xs => xs.length === 0 ? null : xs[xs.length - 1];


A.lastOr = x => xs => xs.length === 0 ? x : xs[xs.length - 1];


A.push = x => xs => (xs.push(x), xs);


A.pushn = ys => xs => (xs.push.apply(xs, ys), xs);


A.push_ = xs => x => (xs.push(x), xs);


A.pushn_ = xs => ys => (xs.push.apply(xs, ys), xs);


A.pop = xs => Pair(xs.length === 0 ? null : xs.pop(), xs);


A.shift = xs => Pair(xs.length === 0 ? null : xs.shift(), xs);


A.singleton = x => [x];


A.snoc = x => xs => xs.concat([x]);


A.snoc_ = xs => x => xs.concat([x]);


A.tail = xs => xs.length === 0 ? null : xs.slice(1);


A.uncons = xs => Pair(xs.length === 0 ? null : xs[0], xs.slice(1));


A.unshift = x => xs => (xs.unshift(x), xs);


A.unshiftn = ys => xs => (xs.unshift.apply(xs, ys), xs);


A.unshift_ = xs => x => (xs.unshift(x), xs);


A.unshiftn_ = xs => ys => (xs.unshift.apply(xs, ys), xs);


A.unsnoc = xs => Pair(
  xs.length === 0 ? null : xs[xs.length - 1],
  xs.slice(-1));


/***[ Filterable ]************************************************************/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/***[ Foldable ]**************************************************************/


A.foldl = f => init => xs => { // left-associative
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


A.foldi = f => init => xs => { // left-associative with index
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


A.foldk = ft => init => xs => // short circuitable
  Loop2((acc, i) =>
    i === xs.length
      ? Loop2.done(acc)
      : ft(acc) (xs[i]) (acc2 => Loop2.next(acc2, i + 1)))
        (init, 0);


A.foldr = f => init => xs => function go(i) { // lazy, right-associative
  if (i === xs.length) return init;
  else return f(xs[i]) (lazy(() => go(i + 1)));
} (0);


A.Foldable = {
  foldl: A.foldl,
  foldr: A.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


A.mapA = ({map, ap, of}) => ft => xs => {
  const liftA2_ = liftA2({map, ap});

  return A.foldl(ys => y =>
    liftA2_(A.push) (ft(y)) (ys))
      (of([])) (xs);
};


A.seqA = ({map, ap, of}) => xs =>
  A.foldl(liftA2({map, ap}) (A.push_)) (of([])) (xs);


A.Traversable = () => ({
  ...A.Foldable,
  ...A.Functor,
  mapA: A.mapA,
  seqA: A.seqA
});


/***[ Functor ]***************************************************************/


A.map = f => tx => tx.map(f);


A.mapk = f => tx => A(k => // CPS version
  tx.run(xs => k(xs.map(f))));


A.Functor = {map: A.map};


/***[ Functor :: Alt ]********************************************************/


A.alt = () => A.append;


A.Alt = {
  ...A.Functor,
  alt: A.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


A.zero = () => A.empty;


A.Plus = {
  ...A.Alt,
  zero: A.zero
};


/***[ Functor :: Apply ]******************************************************/


A.ap = fs => xs =>
  fs.reduce((acc, f) =>
    xs.reduce((acc2, x) =>
      (acc2.push(f(x)), acc2), acc), []);


A.apk = ft => tx => A(k => // CPS version
  ft.run(fs =>
    k(fs.reduce((acc, f) =>
      tx.run(xs =>
        xs.reduce((acc2, x) =>
          (acc2.push(f(x)), acc2), acc)), []))));


A.Apply = {
  ...A.Functor,
  ap: A.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


A.of = A.singleton;


A.ofk = x => A(k => k([x]));


A.fromNativek = xs => A(k => k(xs));


A.Applicative = {
  ...A.Apply,
  of: A.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


A.chain = xs => fm =>
  xs.reduce((acc, x) =>
    (acc.push.apply(acc, fm(x)), acc), []);


/* `fm` needs to be eagerly evaluated because Javascript arrays don't form a
lawful monad. */

A.chaink = mx => fm => A(k => // CPS version
  mx.run(xs => k(xs.flatMap(x => fm(x).run(id)))));


A.Chain = {
  ...A.Apply,
  chain: A.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


A.Alternative = {
  ...A.Plus,
  ...A.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


A.Monad = {
  ...A.Applicative,
  chain: A.chain
};


/***[ Recursion Schemes ]*****************************************************/


A.ana = A.unfold;


A.apo = f => init => {
  let acc = [], x = init, next;

  do {
    next = false;

    acc = f(x).run({
      none: acc,

      some: ([y, tx]) =>
        tx.run({
          left: _ => (acc.push(y), acc),

          right: z => {
            x = z;
            next = true;
            return (acc.push(y), acc);
          }
        })
    });
  } while (next);

  return acc;
};


A.cata = A.foldr;


A.para = f => init => xs => {
  let acc = init, x;

  while (true) {
    x = xs.pop();
    if (x === undefined) break;
    else acc = f(x) (xs) (acc);
  }

  return acc;
};


/***[ Semigroup ]*************************************************************/


A.append = xs => ys => xs.concat(ys);


A.prepend = ys => xs => xs.concat(ys);


A.Semigroup = {
  append: A.append,
  prepend: A.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


A.empty = [];


A.Monoid = {
  ...A.Semigroup,
  empty: A.empty
};


/***[ Unfoldable ]************************************************************/


A.unfold = f => init => {
  let acc = [], x = init, next;

  do {
    next = false;

    acc = f(x).run({
      none: acc,

      some: ([y, z]) => {
        x = z;
        next = true;
        return (acc.push(y), acc);
      }
    });
  } while (next);

  return acc;
};


A.Unfoldable = {unfold: A.unfold};



/***[ Resolve Deps ]**********************************************************/


A.alt = A.alt();


A.arr = A.arr();


A.Traversable = A.Traversable();


A.zero = A.zero();


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


// encodes the composition of functors


export const Comp = ttx => ({
  [TAG]: "Comp",
  run: ttx
});


/***[ Foldable ]**************************************************************/


/***[ Functor ]***************************************************************/


Comp.map = ({map}, {map: map2}) => f => ttx =>
  Comp(map(map2(f)) (ttx));


Comp.Functor = {map: Comp.map};


/***[ Functor :: Apply ]******************************************************/


Comp.ap = ({map, ap}, {ap: ap2}) => ttf => ttx =>
  Comp(ap(map(ap2) (ttf)) (ttx));


Comp.Apply = {
  ...Comp.Functor,
  ap: Comp.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Comp.of = ({of}, {of: of2}) => x => Comp(of(of2(x)));


Comp.Applicative = {
  ...Comp.Apply,
  of: Comp.of
};


/******************************************************************************
***********************************[ CONST ]***********************************
******************************************************************************/


// encodes constant behavior in the realm of functors/monads


export const Const = x => ({
  [TAG]: "Const",
  run: x
});


export const Constk = k => ({ // CPS version
  [TAG]: "Cont.Const",
  run: k
});


/***[ Functor ]***************************************************************/


Const.map = const_;


Const.mapk = _ => tx => Constk(k => tx.run(k));


Const.Functor = {map: Const.map};


/***[ Functor :: Apply ]******************************************************/


Const.ap = ({append}) => tf => tx => Const(append(tf.run) (tx.run));


Const.apk = ({append}) => tf => tx =>
  Constk(k => k(tx.run(tf.run(append)))); // CPS version


Const.Apply = {
  ...Const.Functor,
  ap: Const.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Const.of = ({empty}) => _ => Const(empty);


Const.ofk = ({empty}) => _ => Constk(k => k(empty)); // CPS verison


Const.Applicative = {
  ...Const.Apply,
  of: Const.of
};


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


// encodes the most fundamental sum type - logical or - A || B


export const Either = {};


Either.Left = x => ({
  [TAG]: "Either",
  run: ({left}) => left(x)
});


Either.Right = x => ({
  [TAG]: "Either",
  run: ({right}) => right(x)
});


Either.cata = left => right => tx => tx.run({left, right});


/***[ Foldable ]**************************************************************/


Either.foldl = f => acc => tx => tx.run({
  left: x => f(acc) (x),
  right: y => f(acc) (y)
});


Either.foldr = f => acc => tx => tx.run({
  left: x => f(x) (acc),
  right: y => f(y) (acc)
});


Either.Foldable = {
  left: Either.foldl,
  right: Either.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


Either.mapA = ({map, of}) => ft => tx => tx.run({
  left: x => map(Either.Left) (ft(x)),
  right: y => map(Either.Right) (ft(y))
});


Either.seqA = ({of}) => tx => tx.run({
  left: x => of(Either.Left(x)),
  right: y => of(Either.Right(y))
});


Either.Traversable = () => ({
  ...Either.Foldable,
  ...Either.Functor,
  mapA: Either.mapA,
  seqA: Either.seqA
});


/***[ Functor ]***************************************************************/


Either.map = f => tx =>
  tx.run({
    left: x => Either.Left(f(x)),
    right: y => Either.Right(f(y))
  });


Either.Functor = {map: Either.map};


/***[ Functor :: Apply ]******************************************************/


Either.ap = tf => tx =>
  tf.run({
    left: f => tx.run({
      left: x => Either.Left(f(x)),
      get right() {throw new TypeError("unexpected Either.Right")}
    }),

    right: f => tx.run({
      get left() {throw new TypeError("unexpected Either.Left")},
      right: y => Either.Right(f(y))
    })
  });


Either.Apply = {
  ...Either.Functor,
  ap: Either.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


// omit the ambiguous type class


Either.ofLeft = x => Either.Left(x);


Either.ofRight = x => Either.Right(x);


/***[ Functor :: Apply :: Chain ]*********************************************/


Either.chain = mx => fm =>
  mx.run({
    left: x => fm(x),
    right: y => fm(y)
  });


Either.Chain = {
  ...Either.Apply,
  chain: Either.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Either.Monad = {
  ...Either.Applicative,
  chain: Either.chain
};


/***[ Resolve Dependencies ]**************************************************/


Either.Traversable = Either.Traversable();


/******************************************************************************
******************************[ CONT :: XEITHER ]******************************
******************************************************************************/


// encodes a fundamental sum type - logical xor - (A && !B) || (!A && B)


/******************************************************************************
*******************************[ CONT :: THESE ]*******************************
******************************************************************************/


// encodes a fundamental sum type - logical and/or - (A & B) || A || B


/******************************************************************************
**********************************[ EXCEPT ]***********************************
******************************************************************************/


// encodes the effect of computations that might throw an exception


export const Except = k => ({ // CPS version
  [TAG]: "Cont.Except",
  run: k
});


export const E = Except; // shortcut


E.catak = _throw => proceed => tx => // eliminiation rule
  tx.run({throw: _throw, proceed});


/***[ Foldable ]**************************************************************/


E.foldl = f => acc => tx => introspect(tx) === "Error" ? acc : f(acc) (tx);


E.foldr = f => acc => tx => introspect(tx) === "Error" ? acc : f(tx) (acc);


E.Foldable = {
  foldl: E.foldl,
  foldr: E.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


E.mapA = ({of}) => ft => tx => introspect(tx) === "Error" ? of(tx) : ft(tx);


E.seqA = ({of}) => tx => of(tx);


E.Traversable = () => ({
  ...E.Foldable,
  ...E.Functor,
  mapA: E.mapA,
  seqA: E.seqA
});


/***[ Functor ]***************************************************************/


E.map = f => tx =>
  introspect(tx) === "Error" ? tx : f(tx);


E.mapk = f => tx => E(({throw: k, proceed: k2}) => // CPS version
  tx.run({
    throw: x => k(x),
    proceed: y => k2(f(y))
  }));


E.Functor = {map: E.map};


/***[ Functor :: Alt ]********************************************************/


/***[ Functor :: Alt :: Plus ]************************************************/


/***[ Functor :: Apply ]******************************************************/


E.ap = tf => tx =>
  introspect(tf) === "Error" ? tf
    : introspect(tx) === "Error" ? tx
    : tf(tx);


E.apk = tf => tx => E(({throw: k, proceed: k2}) => // CPS version
  tf.run({
    throw: x => k(x),
    
    proceed: f => tx.run({
      throw: y => k(y),
      proceed: z => k2(f(z))
    })
  }));


E.Apply = {
  ...E.Functor,
  ap: E.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


E.of = x => introspect(x) === "Error" ? _throw("unexpected exception") : x;


E.ofk = x => E(ks => ks.proceed(x)); // CPS version


E.Applicative = {
  ...E.Apply,
  of: E.of
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


/***[ Functor :: Apply :: Chain ]*********************************************/


E.chain = mx => fm => introspect(mx) === "Error" ? mx : fm(mx);


E.chaink = mx => fm => E(({throw: k, proceed: k2}) => // CPS version
  mx.run({
    throw: x => k(x),
    proceed: y => k2(fm(y))
  }));


E.Chain = {
  ...E.Apply,
  chain: E.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


E.Monad = {
  ...E.Applicative,
  chain: E.chain
};


/***[ Semigroup ]*************************************************************/


/***[ Semigroup :: Monoid ]***************************************************/


/******************************************************************************
************************************[ ID ]*************************************
******************************************************************************/


// encodes the absence of any effects in the realm of functors/monads


export const Id = x => ({
  [TAG]: "Id",
  run: x
});


export const Idk = k => ({
  [TAG]: "Cont.Id",
  run: k
});


/***[Functor]*****************************************************************/


Id.map = f => tx => Id(f(tx.run));


Id.mapk = f => tx => Idk(k => k(tx.run(f))); // CPS version


Id.Functor = {map: Id.map};


/***[ Functor :: Apply ]******************************************************/


Id.ap = tf => tx => Id(tf.run(tx.run));


Id.ap = tf => tx => Idk(k => k(tf.run(tx.run))); // CPS version


Id.Apply = {
  ...Id.Functor,
  ap: Id.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Id.of = Id;


Id.of = x => Idk(k => k(x)); // CPS version


Id.Applicative = {
  ...Id.Apply,
  of: Id.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Id.chain = mx => fm => fm(mx.run);


Id.chain = mx => fm => Idk(k => k(mx.run(fm))); // CPS version


Id.Chain = {
  ...Id.Apply,
  chain: Id.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Id.Monad = {
  ...Id.Applicative,
  chain: Id.chain
};


/******************************************************************************
************************************[ MAP ]************************************
******************************************************************************/


const _Map = {};


/***[ Getter/Setter ]*********************************************************/


_Map.get = k => m => m.get(k);


_Map.set = k => v => m => m.set(k, v);


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


export const Obj = {}; // namespace


export const O = Obj; // shortcut;


/***[ Clonable ]**************************************************************/


O.clone = o => {
  const p = {};

  for (const k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


O.Clonable = {clone: O.clone};


/***[ Generators ]************************************************************/


O.entries = function* (o) {
  for (let prop in o) {
    yield Pair(prop, o[prop]);
  }
}


O.keys = function* (o) {
  for (let prop in o) {
    yield prop;
  }
}


O.values = function* (o) {
  for (let prop in o) {
    yield o[prop];
  }
}


/***[ Getter/Setter ]*********************************************************/


O.add = ({append}) => k => v => o => {
  if (k in o) return (o[k] = append(o[k]) (v), o);
  else return (o[k] = v, o);
}


O.del = k => o => (delete o[k], o);


O.get = k => o => k in o ? o[k] : null;


O.getOr = x => k => o => k in o ? o[k] : x;


O.set = k => v => o => (o[k] = v, o);


O.upd = k => f => o => {
  if (k in o) (o[k] = f(o[k]), E.right(o));
  else return E.left(o);
};


O.updOr = x => k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return (o[k] = x, o);
};


/***[ Misc. ]*****************************************************************/


O.lazyProp = k => thunk => o => // create lazy property that shares its result
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true});


// self referencing during object creation

O.thisify = f => f({});


/******************************************************************************
***********************************[ OPTIC ]***********************************
******************************************************************************/


/* Encodes composable getters/setters where the latter keep the root reference.
The type itself is immutable but the overall property depends on the purity or
impurity of involved getters/setters. */


export const Optic = (ref, path) => ({
  [TAG]: "Optic",
  ref,
  path
});


/***[ Composition ]***********************************************************/


Optic.compGet = comp;


Optic.compSet = setter => setter2 => x => optic => {
  const optic2 = setter2(x) (optic);
  return setter(optic2.ref) (optic2.path);
};


Optic.pipeGet = pipe;


Optic.pipeSet = setter2 => setter => x => optic => {
  const optic2 = setter2(x) (optic);
  return setter(optic2.ref) (optic2.path);
};


/***[ Functor ]***************************************************************/


Optic.map = () => Optic.upd(id);


Optic.Functor = {map: Optic.map};


/***[ Functor :: Apply ]******************************************************/


/* If the innermost values of two `Optic`s are combined, there is no meaningful
rule to decide which path to keep. For the functor instance keeping the first
is assumed as a convention. */


Optic.apFst = ft => tx => Optic(ft.ref(tx.ref), ft.path);


Optic.apSnd = ft => tx => Optic(ft.ref(tx.ref), tx.path);


Optic.Apply = {
  ...Optic.Functor,
  ap: Optic.apFst
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Optic.of = ref => Optic(ref, null);


Optic.Applicative = {
  ...Optic.Apply,
  of: Optic.of
};


/***[ Getter/Setter ]*********************************************************/


/* Use to delete the innermost reference value from inside a nested structure.
If the innermost value is a scalar, use the parent reference value. */

Optic.del = optic => optic.path === null ? optic : optic.path;


Optic.get = getter => optic => Optic(getter(optic.ref), optic);


Optic.set = setter => x => optic =>
  optic.path === null
    ? Optic(setter(x) (optic.ref), null)
    : Optic(setter(x) (optic.path.ref), optic.path.path);


Optic.upd = setter => f => optic =>
  optic.path === null
    ? Optic(setter(f(optic.ref)) (optic.ref), null)
    : Optic(setter(f(optic.ref)) (optic.path.ref), optic.path.path);


Optic.unnest = optic => optic.path


Optic.unpath = optic => optic.ref


/***[ Resolve Dependencies ]**************************************************/


Optic.map = Optic.map();


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


// encodes the effect of computations that might not yield a result


export const Option = k => ({ // CPS version
  [TAG]: "Cont.Option",
  run: k
});


export const Opt = Option; // shortcut


Opt.none = Opt(ks => ks.none);


Opt.some = x => Opt(ks => ks.some(x));


Opt.optionk = none => some => tx => tx.run({none, some}); // elimination rule


/***[ Foldable ]**************************************************************/


Opt.foldl = f => acc => tx => tx === null ? acc : f(acc) (tx);


Opt.foldr = f => acc => tx => tx === null ? acc : f(tx) (acc);


Opt.Foldable = {
  foldl: Opt.foldl,
  foldr: Opt.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


Opt.mapA = ({of}) => ft => tx => tx === null ? of(tx) : ft(tx);


Opt.seqA = ({of}) => tx => of(tx);


Opt.Traversable = () => ({
  ...Opt.Foldable,
  ...Opt.Functor,
  mapA: Opt.mapA,
  seqA: Opt.seqA
});


/***[ Functor ]***************************************************************/


Opt.map = f => tx => tx === null ? null : f(tx);


Opt.mapk = f => tx => Opt(({none: k, some: k2}) => // CPS version
  tx.run({
    none: null,
    some: y => k2(f(y))
  }));


Opt.Functor = {map: Opt.map};


/***[ Functor :: Alt ]********************************************************/


Opt.alt = tx => ty => tx === null ? ty : tx;

Opt.Alt = {
  ...Opt.Functor,
  alt: Opt.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


Opt.zero = null;


Opt.Plus = {
  ...Opt.Alt,
  zero: Opt.zero
};


/***[ Functor :: Apply ]******************************************************/


Opt.ap = tf => tx =>
  tf === null ? null
    : tx === null ? null
    : tf(tx);


Opt.ap = tf => tx => Opt(({none: k, some: k2}) => // CPS version
  tf.run({
    none: null,
    
    some: tf => tx.run({
      none: null,
      some: z => k2(tf(z))
    })
  }));


Opt.Apply = {
  ...Opt.Functor,
  ap: Opt.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Opt.of = x => x === null ? _throw("unexpected null") : x;


Opt.ofk = Opt.some; // CPS version


Opt.Applicative = {
  ...Opt.Apply,
  of: Opt.of
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


Opt.Alternative = {
  ...Opt.Plus,
  ...Opt.Applicative
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Opt.chain = mx => fm => mx === null ? null : fm(mx);


Opt.chaink = mx => fm => Opt(({none: k, some: k2}) => // CPS version
  mx.run({
    none: null,
    some: y => k2(fm(y))
  }));


Opt.Chain = {
  ...Opt.Apply,
  chain: Opt.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Opt.Monad = {
  ...Opt.Applicative,
  chain: Opt.chain
};


/***[ Semigroup ]*************************************************************/


Opt.append = ({append}) => tx => ty =>
  tx === null ? ty
    : ty === null ? tx
    : append(tx) (ty);


Opt.Semigroup = {
  append: Opt.append,
  prepend: Opt.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Opt.empty = null;


Opt.Monoid = {
  ...Opt.Semigroup,
  empty: Opt.empty
};


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


/* Represents asynchronous computations evaluated in parallel. Use `Serial` for
  asynchronous computations evaluated in serial. Use `Cont` for synchronous
  computations encoded in CPS.

  It has the following properties:

  * asynchronous, parallel evaluation
  * pure core/impure shell concept
  * lazy by deferred nested functions
  * non-reliable return values
  * stack-safe due to asynchronous calls
  * flat composition/monadic chaining syntax */


export const Parallel = k => ({
  [TAG]: "Parallel",
  run: k,

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => k(f));

    else k(f);
  }
});


/***[ Conjunction ]***********************************************************/


Parallel.and = tx => ty => {
  const guard = (k, i) => x => {
    pair[i] = x;

    return settled || !("0" in pair) || !("1" in pair)
      ? false
      : (settled = true, k(Pair(pair[0], pair[1])));
  };

  const pair = [];
  let settled = false;

  return Parallel(k => (
    tx.run(guard(k, 0)),
    ty.run(guard(k, 1))));
};


Parallel.allArr = () =>
  A.seqA({
    map: Parallel.map,
    ap: Parallel.ap,
    of: Parallel.of});


/***[ Disjunction ]***********************************************************/


Parallel.or = tx => ty => {
  const guard = k => x =>
    settled
      ? false
      : (settled = true, k(x));

  let settled = false;

  return Parallel(k => (
    tx.run(guard(k)),
    ty.run(guard(k))));
};


Parallel.anyArr = () =>
  A.foldl(acc => tx =>
    Parallel.Race.append(acc) (tx))
      (Parallel.Race.empty);


/***[ Functor ]***************************************************************/


Parallel.map = f => tx =>
  Parallel(k => tx.run(x => k(f(x))));


Parallel.Functor = {map: Parallel.map};


/***[ Functor :: Apply ]******************************************************/


Parallel.ap = tf => tx =>
  Parallel(k =>
    Parallel.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


Parallel.Apply = {
  ...Parallel.Functor,
  ap: Parallel.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Parallel.of = x => Parallel(k => k(x));


Parallel.Applicative = {
  ...Parallel.Apply,
  of: Parallel.of
};


/***[ Natural Transformations ]***********************************************/


// TODO: fromSerial/toSerial


/***[ Semigroup ]*************************************************************/


Parallel.append = append => tx => ty =>
  Parallel(k =>
    Parallel.and(tx) (ty)
      .run(([x, y]) =>
        k(append(x) (y))));


Parallel.prepend = Parallel.append;


Parallel.Semigroup = {
  append: Parallel.append,
  prepend: Parallel.prepend
};

  
/***[ Semigroup :: Monoid ]***************************************************/


Parallel.empty = empty =>
  Parallel(k => k(empty));


Parallel.Monoid = {
  ...Parallel.Semigroup,
  empty: Parallel.empty
};


/***[ Semigroup (race) ]******************************************************/


Parallel.Race = {};


Parallel.Race.append = Parallel.or;


Parallel.Race.prepend = Parallel.or;


/***[ Semigroup :: Monoid (race) ]********************************************/


Parallel.Race.empty = Parallel(k => null);


/***[ Misc. ]*****************************************************************/


/* The type doesn't implement monad, hence some combinators for monad-like
behavior. */


Parallel.flatmap = mx => fm =>
  Parallel(k => mx.run(x => fm(x).run(k)));


Parallel.flatten = mmx =>
  Parallel(k => mmx.run(mx => mx.run(k)));


/***[ Resolve Dependencies ]**************************************************/


Parallel.allArr = Parallel.allArr();


Parallel.anyArr = Parallel.anyArr();


/******************************************************************************
**********************************[ PARSER ]***********************************
******************************************************************************/

/* Parser are broadly distinguished by their context type (simplified): 

  * applicative: newtype Parser a = P (String -> (String, Either Error a))
  * monadic:     newtype Parser m a = P (String -> (String, m a))

`Parser` is an applicative variant. */


const Parser = f => ({
  [TAG]: "Parser",
  run: f
});


Parser.Result = {}; // namespace


// value constructors


Parser.Result.Error = ({rest, state, msg}) => ({
  [TAG]: "ParserResult",
  run: ({error}) => error(x)
});


Parser.Result.Some = ({res, rest, state}) => ({
  [TAG]: "ParserResult",
  run: ({some}) => some(x)
});


Parser.Result.None = ({rest, state}) => ({
  [TAG]: "ParserResult",
  run: ({none}) => none(x)
});


/***[ Character Classes ]*****************************************************/


const CHAR_CLASSES = {
  letter: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(/[a-z]/, "i");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(/[a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/, "i");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/\p{L}/, "u");
      return this.utf8;
    },

    uc: {
      get ascii() {
        delete this.ascii;
        this.ascii = new RegExp(/[A-Z]/, "");
        return this.ascii;
      },

      get latin1() {
        delete this.latin1;
        this.latin1 = new RegExp(/[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/, "");
        return this.latin1;
      },

      get utf8() {
        delete this.utf8;
        this.utf8 = new RegExp(/\p{Lu}/, "u");
        return this.utf8;
      }
    },

    lc: {
      get ascii() {
        delete this.ascii;
        this.ascii = new RegExp(/[A-Z]/, "");
        return this.ascii;
      },

      get latin1() {
        delete this.latin1;
        this.latin1 = new RegExp(/[a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/, "");
        return this.latin1;
      },

      get utf8() {
        delete this.utf8;
        this.utf8 = new RegExp(/\p{Lu}/, "u");
        return this.utf8;
      }
    }
  },

  number: {
    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/\p{N}/, "u");
      return this.utf8;
    },

    decimal: {
      get ascii() {
        delete this.ascii;
        this.ascii = new RegExp(/[0-9]/, "");
        return this.ascii;
      },

      get latin1() {
        delete this.latin1;
        this.latin1 = new RegExp(/[0-9]/, "");
        return this.latin1;
      },

      get utf8() {
        delete this.utf8;
        this.utf8 = new RegExp(/\p{Nd}/, "u");
        return this.utf8;
      }
    }
  },

  alphanum: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(`${this.number.ascii.source}|${this.letter.ascci.source}`, "");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(`${this.number.latin1.source}|${this.letter.latin1.source}`, "");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(`${this.number.utf8.source}|${this.letter.utf8.source}`, "u");
      return this.utf8;
    }
  },

  control: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(/[\0\a\b\t\v\f\r\n\cZ]/, "");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(/[\0\a\b\t\v\f\r\n\cZ]/, "");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/[\p{C}\p{Zl}\p{Zp}]/, "u");
      return this.utf8;
    }
  },
  
  punctuation: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(/[!"#$%&'()*+,-./:;<=>?@\[\]\\^_`{|}~]/, "");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(/[!"#$%&'()*+,-./:;<=>?@\[\]\\^_`{|}~€‚„…†‡ˆ‰‹‘’“”•–­—˜™›¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/, "");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/[\p{P}\p{S}\p{F}]/, "u");
      return this.utf8;
    }
  },
  
  currency: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(/[$]/, "");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(/[¤$€£¥¢]/, "");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/\p{Sc}/, "u");
      return this.utf8;
    }
  },
  
  space: {
    get ascii() {
      delete this.ascii;
      this.ascii = new RegExp(/ /, "");
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;
      this.latin1 = new RegExp(/  /, "");
      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      this.utf8 = new RegExp(/\p{Zs}/, "u");
      return this.utf8;
    }
  },

  nonalphanum: {
    get ascii() {
      delete this.ascii;
      
      this.ascii = new RegExp(
        `${this.control.ascii.source}|${this.punctuation.ascci.source}|${this.currency.ascci.source}|${this.space.ascci.source}`, "");
      
      return this.ascii;
    },

    get latin1() {
      delete this.latin1;

      this.latin1 = new RegExp(
        `${this.control.latin1.source}|${this.punctuation.latin1.source}|${this.currency.latin1.source}|${this.space.latin1.source}`, "");

      return this.latin1;
    },

    get utf8() {
      delete this.utf8;
      
      this.utf8 = new RegExp(
        `${this.control.utf8.source}|${this.punctuation.utf8.source}|${this.currency.utf8.source}|${this.space.utf8.source}`, "u");

      return this.utf8;
    }
  },
};


/***[ Combinator ]************************************************************/


Parser.accept = Parser(({text, i}) => state =>
  i < text.length
    ? [Parser.Result.Some({res: text[i], rest: {text, i: i + 1}, state})]
    : [Parser.Result.Error({rest: {text, i}, state, msg: "end of text"})]);


Parser.fail = msg => Parser(({text, i}) => state =>
  [Parser.Result.Error({rest: {text, i}, state, msg})]);
 

Parser.satisfy = msg => p => Parser(({text, i}) => state => {
  if (i < text.length) {
    return [
      p(text[i])
        ? Parser.Result.Some({res: text[i], rest: {text, i: i + 1}, state})
        : Parser.Result.Error({rest: {text, i}, state, msg})
    ];
  }

  else return [Parser.Result.Error({rest: {text, i}, state, msg: "end of text"})];
});
 

Parser.alt = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => {
      return parser2(o.rest) (o.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Error(o), Parser.Result.Error(o2)],
        some: p2 => [Parser.Result.Some(p2)],
        none: q2 => [Parser.Result.None(q2)]
      }));
    },

    some: p => [Parser.Result.Some(p)],
    none: q => [Parser.Result.None(q)]
  }));
});


Parser.xalt = parser => parser2 => Parser(rest => state => { // exclusive alternative
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => {
      return parser2(rest) (state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Error(o), Parser.Result.Error(o2)],
        some: p2 => [Parser.Result.Some(p2)],
        none: q2 => [Parser.Result.None(q2)]
      }));
    },

    some: p => {
      return parser2(rest) (state).map(ty => ty.run({
        error: o2 => Parser.Result.Some(p),
        some: p2 => Parser.Result.Error({rest: p2.rest, state: p2.state, msg: "non-exclusive alt"}),
        none: q2 => Parser.Result.Error({rest: q2.rest, state: q2.state, msg: "non-exclusive alt"})
      }));
    },

    none: p => {
      return parser2(rest) (state).map(ty => ty.run({
        error: o2 => Parser.Result.Some(p),
        some: p2 => Parser.Result.Error({rest: p2.rest, state: p2.state, msg: "non-exclusive alt"}),
        none: q2 => Parser.Result.Error({rest: q2.rest, state: q2.state, msg: "non-exclusive alt"})
      }));
    }
  }));
});


Parser.amb = parser => parser2 => Parser(rest => state => { // ambiguity
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => {
      return parser2(o.rest) (o.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Error(o), Parser.Result.Error(o2)],
        some: p2 => [Parser.Result.Some(p2)],
        none: q2 => [Parser.Result.None(q2)]
      }));
    },

    some: p => {
      return parser2(p.rest) (p.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Some(p)],
        some: p2 => [Parser.Result.Some(p), Parser.Result.Some(p2)],
        none: q2 => [Parser.Result.Some(p), Parser.Result.None(q2)]
      }));
    },

    none: q => {
      return parser2(q.rest) (q.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.None(q)],
        some: p2 => [Parser.Result.None(q), Parser.Result.Some(p2)],
        none: q2 => [Parser.Result.None(q), Parser.Result.None(q2)]
      }));
    }
  }));
});


Parser.seq = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some({res: Pair(p.res, p2.res), rest: p2.rest, state: p2.state}),
        none: q2 => Parser.Result.Some({res: p.res, rest: q2.rest, state: q2.state})
      }));
    },

    none: q => {
      return parser2(q.rest) (q.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some({res: p2.res, rest: p2.rest, state: p2.state}),
        none: q2 => Parser.Result.None({rest: q2.rest, state: q2.state})
      }));
    }
  }));
});


Parser.seqLeft = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some({res: p.res, rest: p2.rest, state: p2.state}),
        none: q2 => Parser.Result.Some({res: p.res, rest: q2.rest, state: q2.state})
      }));
    },

    none: q => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.None({rest: p2.rest, state: p2.state}),
        none: q2 => Parser.Result.None({rest: q2.rest, state: q2.state})
      }));
    }
  }));
});
 

Parser.notSeqLeft = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Some({res: p.res, rest: o2.rest, state: o2.state}),
        some: p2 => Parser.Result.Error({rest: p2.rest, state: p2.state, msg: "unexpected sequence"}),
        none: q2 => Parser.Result.Error({rest: q2.rest, state: q2.state, msg: "unexpected sequence"})
      }));
    },

    none: q => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.None({rest: o2.rest, state: o2.state}),
        some: p2 => Parser.Result.Error({rest: p2.rest, state: p2.state, msg: "unexpected sequence"}),
        none: q2 => Parser.Result.Error({rest: q2.rest, state: q2.state, msg: "unexpected sequence"})
      }));
    },
  }));
});


Parser.seqRight = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some(p2),
        none: q2 => Parser.Result.None(q2)
      }));
    },

    none: p => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some(p2),
        none: q2 => Parser.Result.None(q2)
      }));
    }
  }));
});


Parser.notSeqRight = parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => {
      return parser2(p.rest) (p.state).map(ty => ty.run({
        error: o2 => Parser.Result.Error(o2),
        some: p2 => Parser.Result.Some(p2),
        none: q2 => Parser.Result.None(q2)
      }));
    },

    some: p => [Parser.Result.Error({rest: p.rest, state: p.state, msg: "unexpected sequence"})],
    none: q => [Parser.Result.Error({rest: q.rest, state: q.state, msg: "unexpected sequence"})]
  }));
});


Parser.seqMid = parser => parser2 => parser3 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Error(o2)],

        some: p2 => {
          return parser3(p2.rest) (p2.state).map(tz => tz.run({
            error: o3 => Parser.Result.Error(o3),
            some: p3 => Parser.Result.Some({res: p2.res, rest: p3.rest, state: p3.state}),
            none: q3 => Parser.Result.Some({res: p2.res, rest: q3.rest, state: q3.state})
          }));
        },

        none: q2 => {
          return parser3(q2.rest) (q2.state).map(tz => tz.run({
            error: o3 => Parser.Result.Error(o3),
            some: p3 => Parser.Result.None({rest: p3.rest, state: p3.state}),
            none: q3 => Parser.Result.None({rest: q3.rest, state: q3.state})
          }));
        }
      }));
    }
  }));
});
 

Parser.notSeqMid = parser => parser2 => parser3 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => {
      return parser2(o.rest) (o.state).flatMap(ty => ty.run({
        error: o2 => [Parser.Result.Error(o2)],

        some: p2 => {
          return parser3(p2.rest) (p2.state).map(tz => tz.run({
            error: o3 => Parser.Result.Some({res: p2.res, rest: o3.rest, state: o3.state}),
            some: p3 => Parser.Result.Error({rest: p3.rest, state: q3.state, msg: "unexpected sequence"}),
            none: q3 => Parser.Result.Error({rest: q3.rest, state: q3.state, msg: "unexpected sequence"})
          }));
        },

        none: q2 => {
          return parser3(q2.rest) (q2.state).map(tz => tz.run({
            error: o3 => Parser.Result.None({rest: o3.rest, state: o3.state}),
            some: p3 => Parser.Result.Error({rest: p3.rest, state: q3.state, msg: "unexpected sequence"}),
            none: q3 => Parser.Result.Error({rest: q3.rest, state: q3.state, msg: "unexpected sequence"})
          }));
        }
      }));
    },

    some: p => [Parser.Result.Error({rest: q.rest, state: q.state, msg: "unexpected sequence"})],
    none: q => [Parser.Result.Error({rest: q.rest, state: q.state, msg: "unexpected sequence"})]
  }));
});


Parser.append = ({append}) => parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty =>
        ty.run({
          error: o2 => Parser.Result.Error(o2),
          some: p2 => Parser.Result.Some({res: append(p.res) (p2.res), rest: p2.rest, state: p2.state}),
          none: q2 => Parser.Result.Some({res: p.res, rest: q2.rest, state: q2.state})
        })
      );
    },

    none: p => {
      return parser2(p.rest) (p.state).map(ty =>
        ty.run({
          error: o2 => Parser.Result.Error(o2),
          some: p2 => Parser.Result.Some({res: p2.res, rest: p2.rest, state: p2.state}),
          none: q2 => Parser.Result.None({rest: q2.rest, state: q2.state})
        })
      );
    }
  }));
});


Parser.empty = Parser.of = ({empty}) => Parser(rest => state =>
  [Parser.Result.Some({res: empty, rest, state})]);


Parser.map = f => parser => Parser(rest => state => {
  return parser(rest) (state).map(tx => tx.run({
    error: o => Parser.Result.Error(o),
    some: p => Parser.Result.Some({res: f(p.res), rest: p.rest, state: p.state}),
    none: q => Parser.Result.None({rest: q.rest, state: q.state})
  }));
});


Parser.ap = ({empty}) => parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => parser2(p.rest) (p.state).map(ty => ty.run({
      error: o2 => Parser.Result.Error(o2),
      some: p2 => Parser.Result.Some({res: p.res(p2.res), rest: p2.rest, state: p2.state}),
      none: q2 => Parser.Result.Some({res: p.res(empty), rest: q2.rest, state: q2.state})
    }))
  }));
});


Parser.of = x => Parser(rest => state =>
  [Parser.Result.Some({res: x, rest, state})]);


Parser.chain = ({empty}) => fm => parser => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],
    some: p => fm(p.res) (p.rest) (p.state),
    none: q => fm(empty) (q.rest) (q.state)
  }));
});


Parser.eof = Parser(rest => rest =>
  rest.i === text.length
    ? Parser.Result.Some({res: "", rest, state})
    : Parser.Result.Error({rest, state, msg: "not end of file"}));


Parser.const = x => parser => Parser(rest => state =>
  [Parser.Result.Some({res: x, rest, state})]);


Parser.opt = parser => Parser(rest => state => {
  return parser(rest) (state).map(tx => tx.run({
    error: o => Parser.Result.None({rest: o.rest, state: o.state}),
    some: p => Parser.Result.Some(p),
    none: q => Parser.Result.None(q)
  }));
});


Parser.optOr = res => parser => Parser(rest => state => {
  return parser(rest) (state).map(tx => tx.run({
    error: o => Parser.Result.Some({res, rest: o.rest, state: o.state}),
    some: p => Parser.Result.Some(p),
    none: q => Parser.Result.Some({res, rest: q.rest, state: q.state})
  }));
});


Parser.take = n => Parser(({text, i}) => state => {
  const j = n + i < text.length ? n + i : text.length;
  return [Parser.Result.Some({res: text.slice(0, j), rest: {text: text.slice(j), i: j}, state})];
});


Parser.take1 = n => Parser(({text, i}) => state => {
  if (i + 1 === text.length)
    return [Parser.Result.Error({rest, state, msg: "cannot take at least one element"})]

  else {
    const j = n + i < text.length ? n + i : text.length;
    return [Parser.Result.Some({res: text.slice(0, j), rest: {text: text.slice(j), i: j}, state})];
  }
});


Parser.takeWhile = f => init => parser => Parser(rest => state => {
  return Loop3((acc, rest2, state2) => {
    return parser(rest2) (state2).map(tx => tx.run({
      error: o => Loop3.done(Parser.Result.Some({res: acc, rest: o.rest, state: o.state})),
      some: p => Loop3.next(f(p.res) (acc), p.rest, p.state),
      none: q => Loop3.next(acc, q.rest, q.state)
    }));
  }) (init, rest, state);
});


Parser.takeWhile1 = f => init => parser => Parser(rest => state => {
  return parser(rest2) (state2).map(tx => tx.run({
    error: o => Parser.Result.Some({res: init, rest: o.rest, state: o.state}),
    
    some: p => {
      return Loop3((acc, rest2, state2) => {
        return parser(rest2) (state2).map(tx => tx.run({
          error: o2 => Loop3.done(Parser.Result.Some({res: acc, rest: o2.rest, state: o2.state})),
          some: p2 => Loop3.next(f(p2.res) (acc), p2.rest, p2.state),
          none: q2 => Loop3.next(acc, q2.rest, q2.state)
        }));
      }) (f(p.res) (init), p.rest, p.state);
    },

    none: q => {
      return Loop3((acc, rest2, state2) => {
        return parser(rest2) (state2).map(tx => tx.run({
          error: o2 => Loop3.done(Parser.Result.Some({res: acc, rest: o2.rest, state: o2.state})),
          some: p2 => Loop3.next(f(p2.res) (acc), p2.rest, p2.state),
          none: q2 => Loop3.next(acc, q2.rest, q2.state)
        }));
      }) (init, p.rest, p.state);
    }
  }));
});


Parser.drop = n => Parser(({text, i}) => state => {
  const j = n + i < text.length ? n + i : text.length;
  return [Parser.Result.None({rest: {text, i: j}, state})];
});


Parser.dropWhile = parser => Parser(rest => state => {
  return Loop2((rest2, state2) => {
    return parser(rest2) (state2).map(tx => tx.run({
      error: o => Loop2.done(Parser.Result.None({rest: o.rest, state: o.state})),
      some: p => Loop2.next(p.rest, p.state),
      none: q => Loop2.next(q.rest, q.state)
    }));
  }) (rest, state);
});


Parser.dropUntil = parser => Parser(rest => state => {
  return Loop2((rest2, state2) => {
    return parser(rest2) (state2).map(tx => tx.run({
      error: o => Loop2.next(o.rest, o.state),
      some: p => Loop2.done(Parser.Result.None({rest: p.rest, state: p.state})),
      none: q => Loop2.done(Parser.Result.None({rest: p.rest, state: p.state}))
    }));
  }) (rest, state);
});


/******************************************************************************
**********************************[ SERIAL ]***********************************
******************************************************************************/


/* Represents asynchronous computations evaluated in serial. Use `Parallel` for
  asynchronous computations evaluated in parallel. Use `Cont` for synchronous
  computations encoded in CPS.

  It has the following properties:

  * asynchronous, serial evaluation
  * pure core/impure shell concept
  * lazy by deferred nested functions
  * non-reliable return values
  * stack-safe due to asynchronous calls
  * flat composition/monadic chaining syntax */


export const Serial = k => ({
  [TAG]: "Serial",
  run: k,

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => k(f));

    else k(f);
  }
});


/***[ Conjunction ]***********************************************************/


Serial.and = tx => ty =>
  Serial(k =>
    tx.run(x =>
      ty.run(y =>
        k(Pair(x, y)))));


Serial.allArr = () =>
  A.seqA({
    map: Serial.map,
    ap: Serial.ap,
    of: Serial.of});


/***[ Functor ]***************************************************************/


Serial.map = f => tx =>
  Serial(k => tx.run(x => k(f(x))));


Serial.Functor = {map: Serial.map};


/***[ Functor :: Apply ]******************************************************/


Serial.ap = tf => tx =>
  Serial(k =>
    Serial.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


Serial.Apply = {
  ...Serial.Functor,
  ap: Serial.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Serial.of = x => Serial(k => k(x));


Serial.Applicative = {
  ...Serial.Apply,
  of: Serial.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Serial.chain = mx => fm =>
  Serial(k => mx.run(x => fm(x).run(k)));


Serial.Chain = {
  ...Serial.Apply,
  chain: Serial.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Serial.Monad = {
  ...Serial.Applicative,
  chain: Serial.chain
};


/***[ Natural Transformations ]***********************************************/


// TODO: fromParallel/toParallel


/***[ Semigroup ]*************************************************************/


Serial.append = append => tx => ty =>
  Serial(k => Serial.and(tx) (ty)
    .run(([x, y]) => k(append(x) (y))));


Serial.prepend = Serial.append;


Serial.Semigroup = {
  append: Serial.append,
  prepend: Serial.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Serial.empty = empty => Serial(k => k(empty));


Serial.Monoid = {
  ...Serial.Semigroup,
  empty: Serial.empty
};


/***[ Misc. ]*****************************************************************/


Serial.once = tx => {
  let x = lazy(() => {
    throw new TypeError("race condition detected");
  });

  let done = false;

  const k = f => {
    if (done) {
      f(x);
      return k;
    }

    else {
      tx.run(y => {
        x = y; f(y);
        return k;
      });

      done = true; // sync
      return k;
    }
  };

  return Serial(k);
};


/***[ Resolve Dependencies ]**************************************************/


Serial.allArr = Serial.allArr();


/******************************************************************************
************************************[ SET ]************************************
******************************************************************************/


const _Set = {};


/***[ Getter/Setter ]*********************************************************/


_Set.get = k => s => s.get(k);


_Set.set = k => v => s => s.set(k, v);


/******************************************************************************
**********************************[ STREAM ]***********************************
******************************************************************************/


const Stream = {}; // namespace


Stream.Step = x => f => ({
  [TAG]: "Stream",

  run: ({step}) => step({
    yield: x,
    get next() {return f(x)}
  })
});


Stream.Done = x => ({
  [TAG]: "Stream",
  run: ({done}) => done({yield: x})
});


Stream.None = ({
  [TAG]: "Stream",
  run: ({none}) => none
});


Stream.Step.lazy = o => ({
  [TAG]: "Stream",
  run: ({step}) => step(o)
});


/***[ Filterable ]************************************************************/


Stream.filter = pred => function go(tx) {
  return tx.run({
    step: o => {
      if (pred(o.yield)) {
        return Stream.Step.lazy({
          yield: o.yield,
          get next() {return go(o.next)}
        });
      }

      else return go(o.next);
    },

    done: p => {
      if (pred(p.yield)) return Stream.Done(p.yield);
      else return Stream.None;
    },

    none: Stream.None
  });
};


/***[ Functor ]***************************************************************/


Stream.map = f => function go(tx) {
  return tx.run({
    step: o => Stream.Step.lazy({
      yield: f(o.yield),
      get next() {return go(o.next)}
    }),

    done: p => Stream.Done(f(p.yield)),
    none: Stream.None
  });
};


/***[ Conversion ]************************************************************/


Stream.takeArr = n => tx => function go(acc, ty, m) {
  if (m <= 0) return acc;

  else {
    return ty.run({
      step: o => {
        acc.push(o.yield)
        return go(acc, o.next, m - 1);
      },
      
      done: p => (acc.push(p.yield), acc),
      none: acc
    });
  }
} ([], tx, n);


// TODO: Stream.takeList


/******************************************************************************
*******************************[ TREE (N-ARY) ]********************************
******************************************************************************/


/* Represents a usual Javascript tree where nodes are encoded as objects with
two fields, one for the value and another for the branch. The latter is encoded
as an array. It is unbalanced and thus has no unambigious construction rule. It
is merely meant as a proof of concept you can infer your own trees from. */


const Tree = {};


Tree.Node = x => branch => ({
  [TAG]: "Tree",
  x,
  branch
});


/***[ Catamorphism ]**********************************************************/


/* Tree traversal is considered stack-safe, because the depth of a balanced
tree usually doesn't exhaust the call stack except for a functional list, which
is a varaint of an unbalanced tree and thus an edge case. */


Tree.cata = node => function go({x, branch}) {
  return node(x) (branch.map(go));
};


// extended catamorphism

Tree.catax = node => tx => function go({x, branch}, depth, i, length) {
  return node(x) 
    ({depth, i, length})
      (branch.map((ty, i, xs) => go(ty, depth + 1, i, xs.length)));
} (tx, 0, 0, 1);


/***[ Foladable ]*************************************************************/


// left-associative fold with depth, index and length of respective branch

Tree.foldi = f => init => tx => function go({x, branch}, acc, depth, i, length) {
  return branch.reduce((acc2, ty, i, ys) => {
    return go(ty, acc2, depth + 1, i, ys.length);
  }, f(acc) (x, {depth, i, length}));
} (tx, init, 0, 0, 1);


Tree.foldl = compThd(A.foldl) (Tree.linearize); // pre-order


Tree.foldLevel = tx => Tree.levels(tx) // level-order
  .reduce((acc, xs) => (acc.push.apply(acc, xs), acc));


Tree.foldr = compThd(A.foldr) (Tree.linearize); // post-order


/***[ Functor ]***************************************************************/


Tree.map = f => Tree.cata(x => xs => Tree.Node(f(x)) (xs));


/***[ Induction ]*************************************************************/


Tree.height = Tree.foldi(acc => (x, {depth}) => acc < depth ? depth : acc) (0);


Tree.levels = Tree.foldi(acc => (x, {depth}) => {
  if (!(depth in acc)) acc[depth] = [];
  return (acc[depth].push(x), acc);
}) ([]);


Tree.paths = tx => {
  const {x, branch: xs} = tx;

  if (xs.length === 0) return [[x]];

  else return A.mapDS(A.unshift(x))
    (foldMapl(
      {fold: A.foldl},
      {append: A.append, empty: []})
        (treePaths) (xs));
};


/***[ Misc. ]*****************************************************************/


Tree.linearize = Tree.cata(x => xss => {
  const xs = [x];
  xs.push.apply(xs, xss);
  return xs;
});


/******************************************************************************
***********************************[ TUPLE ]***********************************
******************************************************************************/


// encodes the most fundamental product type


export const Tuple = k => ({ // CPS version
  [TAG]: "Tuple",
  run: k
});


Tuple.pairk = (x, y) => Tuple(k => k(x, y));


/******************************************************************************
*******************************[ TUPLE :: PAIR ]*******************************
******************************************************************************/


export const Pair = (x, y) => ({
  [TAG]: "Pair",
  1: x,
  2: y,
  length: 2,

 [Symbol.iterator]: function*() {
    yield x;
    yield y;
  }  
});


/***[ Bifunctor ]*************************************************************/


Pair.bimap = f => g => tx => Pair(f(tx[1]), g(tx[2]));


Pair.bimapk = f => g => tx => // CPS version
  Tuple(k => tx.run((x, y) => Pair(f(x), g(y))));


Pair.Bifunctor = () => ({
  ...Pair.Functor,
  bimap: Pair.bimap
});


/***[ Extracting ]************************************************************/


Pair.fst = tx => tx[1];


Pair.snd = tx => tx[2];


/***[ Foldable ]**************************************************************/


Pair.foldl = f => acc => tx => f(acc) (tx);


Pair.foldr = f => acc => tx => f(tx) (acc);


Pair.Foldable = {
  foldl: Pair.foldl,
  foldr: Pair.foldr
};


/***[ Functor ]***************************************************************/


Pair.map = f => ({1: x, 2: y}) => Pair(x, f(y));


Pair.mapk = f => tx =>
  Tuple(k => tx.run((x, y) => k(x, f(y)))); // CPS version
  

Pair.Functor = {map: Pair.map};


/***[ Functor :: Apply ]******************************************************/


Pair.ap = ({append}) => ({1: x, 2: f}) => ({1: y, 2: z}) =>
  Pair(append(x) (y), f(z));


Pair.apk = ({append}) => tf => tx => // CPS version
  Tuple(k => tf.run((x, f) => tx.run((y, z) => k(append(x) (y), f(z)))));


Pair.Apply = {
  ...Pair.Functor,
  ap: Pair.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Pair.of = ({empty}) => x => Tuple(k => k(empty) (x));


Pair.Applicative = {
  ...Pair.Apply,
  of: Pair.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Pair.chain = ({append}) => fm => ({1: x, 2: y}) => {
  const {1: x2, 2: y2} = fm(y);
  return Pair(append(x) (x2), y2);
};


Pair.chaink = ({append}) => fm => mx => mx.run((x, y) => // CPS version
  Tuple(k => fm(y).run((x2, y2) => k(append(x) (x2), y2))));


Pair.Chain = {
  ...Pair.Apply,
  chain: Pair.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Pair.Monad = {
  ...Pair.Applicative,
  chain: Pair.chain
};


/***[ Functor :: Extend ]*****************************************************/


Pair.extend = fw => wx => Pair(wx[1], fw(wx));


Pair.Extend = {
  ...Pair.Functor,
  extend: Pair.extend
};


/***[ Functor :: Extend :: Comonad ]******************************************/


Pair.extract = Pair.snd;


Pair.Comonad = {
  ...Pair.Extend,
  extract: Pair.extract
};


/***[ Getter/Setter ]*********************************************************/


Pair.setFst = x => tx => Pair(x, tx[2]);


Pair.setSnd = x => tx => Pair(tx[1], x);


/***[ Writer ]****************************************************************/


Pair.censor = f => tx => Pair(tx[0], f(tx[1]));


Pair.listen = tx => Pair(Pair(tx[0], tx[1]), tx[1]);


Pair.listens = f => tx => Pair(Pair(tx[0], f(tx[1])), tx[1]);


Pair.pass = f => tx => Pair(tx[0] [0], tx[0] [1] (tx[1]));


Pair.tell = x => Pair(null, x);


/***[ Misc. ]*****************************************************************/


Pair.mapFst = f => tx => Tuple(k => tx.run((x, y) => Pair(f(x), y)));


Pair.swap = tx => Pair(tx[1], tx[0]);


/***[ Resolve Deps ]**********************************************************/


Pair.Bifunctor = Pair.Bifunctor();


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************[ CHILD PROCESS ]*******************************
******************************************************************************/


export const Process_ = cp => cons => ({
  exec: opts => cmd =>
    EitherT(cons(k =>
      cp.exec(cmd, opts, (e, stdout, stderr) =>
        e ? _throw(new TypeError(e))
          : stderr ? k(Either.Left(stderr))
          : k(Either.Right(stdout))))),


  execFile: opts => args => cmdName =>
    EitherT(cons(k =>
      cp.execFile(cmdName, args, opts, (e, stdout, stderr) =>
        e ? _throw(new TypeError(e))
          : stderr ? k(Either.Left(stderr))
          : k(Either.Right(stdout))))),


  spawn: opts => args => cmdName => Emitter(k => {
    const cmd = cp.spawn(cmdName, args, opts);

    const stdoutOb = Emitter.observe({
      emitters: [
        Pair(cmd.stdout, "Node.Stream.In.data"),
        Pair(cmd, "Node.CP.error"),
        Pair(cmd, "Node.CP.exit")
      ],

      init: "",
      
      listener: args => k => {
        switch (args.type) {
          case "Node.CP.error":
          case "Node.CP.exit": return k(args);
          
          case "Node.Stream.In.data":
            return args.state + args.dyn[0];
        }
      }
    });

    const stderrOb = Emitter.observe({
      emitters: [
        Pair(cmd.stderr, "Node.Stream.In.data"),
        Pair(cmd, "Node.CP.error"),
        Pair(cmd, "Node.CP.exit")
      ],
      
      init: "",

      listener: args => k => {
        switch (args.type) {
          case "Node.CP.error":
          case "Node.CP.exit": return k(args);
          
          case "Node.Stream.In.data":
            return args.state + args.dyn[0];
        }
      }
    });

    return Emitter.or(stdoutOb) (stderrOb).run(k);
  })
});


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


// TODO: allow variants with alternative error handling

export const FS_ = fs => cons => thisify(o => {
  o.copy = src => dest =>
    cons(k =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e =>
        e ? _throw(new TypeError(e)) : k(Pair(src, dest))));


  o.move = src => dest =>
    cons.chain(
      cons.chain(o.copy(src) (dest))
        (([src2]) => o.unlink(src2)))
          (src => Serial.of(Pair(src, dest)));


  o.read = opt => path =>
    cons(k =>
      fs.readFile(path, opt, (e, x) =>
        e ? _throw(new TypeError(e)) : k(x)));


  o.scanDir = path =>
    cons(k =>
      fs.readdir(path, (e, xs) =>
        e ? _throw(new TypeError(e)) : k(xs)));


  o.stat = path =>
    cons(k =>
      fs.stat(path, (e, o) =>
        e ? _throw(new TypeError(e)) : k(o)));


  o.unlink = path =>
    cons(k =>
      fs.unlink(path, e =>
        e ? _throw(new TypeError(e)) : k(path)));


  o.write = opt => path => s =>
    cons(k =>
      fs.writeFile(path, s, opt, e =>
        e ? _throw(new TypeError(e)) : k(s)));


  return o;
});


/******************************************************************************
*******************************************************************************
***********************************[ TODO ]************************************
*******************************************************************************
******************************************************************************/

/*

  * add logical and type
  * add logical andOr type
  * add logical or type
  * add logical xor type
  * add memo monad
  * add List
  * add DList
  * add ListZ
  * add NEList
  * add ZList
  * add State type/monad
  * add monad combinators
  * add Either CPS version

*/

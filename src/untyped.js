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




/* Scriptum doesn't have type classes, hence type dictionaries have to be
passed to polymorphic functions explicitly. Type classes of the same type
are passed as a single type dictionary. If type classes of more than one
type are needed, several dictionaries are supplied:

Comp.map = ({map}, {map: map2}) => f => ttx => Comp(map(map2(f)) (ttx));
            ^^^^^  ^^^^^^^^^^^
             td1       td2

The lib encodes effects as values of monadic types. Monad composition is
alliviated by monad transformers, which are functions that take a type 
dictionary of type classes of the outer monad and then return the transformer
operations of the combined outer and inner monad:

({...type classes}) => ({map: ..., ap: ..., of: ..., chain: ...})

The schematic type of the most simplext monad transformer is `m (n a)` but
more complex types like `m (Option (n m a)`

where m is the outer monad and n the inner base monad that mainly determines
the transformer's behavior. For instance the Array monad transformer has the
type: m [a] */




/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


const PREFIX = "$_"; // avoid property name collisions


export const TAG = Symbol.toStringTag;


const TICK_TRESHOLD = 0.01; // treshold for next microtask


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████ CROSS-CUTTING ASPECTS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ APPLICATOR ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// enables flat syntax by utilizing method chaining without relying on `this`

export const App = t => ({
  app: x => App(t(x)), // applies the boxed fun
  app_: y => App(x => t(x) (y)), // applies the 2nd arg of the boxed fun
  map: f => App(f(t)),  // applies the fun
  map_: f => App(x => f(x) (t)), // applies the 2nd arg of the fun
  get: t // gets the boxed value
});


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ EXCEPTION ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export class ExtendableError extends Error {
  constructor(s) {
    super(s);
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
    
    else
      this.stack = (new Error(s)).stack;
  }
};


export class Exception extends ExtendableError {};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LAZY EVALUATION ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes either deferred or lazy evaluated thunks in an ad-hoc manner:

  * deferred thunks are only evaluated when needed
  * lazy thunks are only evaluated when needed and only once (sharing)

If you want deferred or lazy evaluation wihtin functors, applicatives and
monads use the `Defer` and `Lazy` data types. */


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/*
█████ API █████████████████████████████████████████████████████████████████████*/


export const strict = x =>
  x && x[THUNK] ? x[EVAL] : x;


export const lazy = thunk =>
  new Proxy(thunk, new ThunkProxy(true));


export const defer = thunk =>
  new Proxy(thunk, new ThunkProxy(false));


/*
█████ Implementation ██████████████████████████████████████████████████████████*/


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


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ OVERLOADED ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// Javascript built-in overloaded operators as functions


export const max = x => y => x >= y ? x : y;


export const min = x => y => x <= y ? x : y;


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ STACK SAFETY █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Tail Recursion ██████████████████████████████████████████████████████████*/


/* Stack-safe tail-recursion and mutual tail-recursion using a trampoline. The
`next` and `done` tags are used to encode recursive and the base cases
respectively. In addition, the `call` tag can be used to defer function
invokations. */


export const Loop = f => x => {
  let o = f(x);

  while (o[TAG] !== "Base") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x);
        break;
      }

      case "Rec": {
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

  while (o[TAG] !== "Base") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x, o.y);
        break;
      }

      case "Rec": {
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

  while (o[TAG] !== "Base") {
    switch (o[TAG]) {
      case "Call": {
        o = o.f(o.x, o.y, o.z);
        break;
      }

      case "Rec": {
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


Loop.rec = x => ({[TAG]: "Rec", x});


Loop.base = x => ({[TAG]: "Base", x});


Loop2.call = (f, x, y) => ({[TAG]: "Call", f, x, y});


Loop2.rec = (x, y) => ({[TAG]: "Rec", x, y});


Loop2.base = x => ({[TAG]: "Base", x});


Loop3.call = (f, x, y, z) => ({[TAG]: "Call", f, x, y, z});


Loop3.rec = (x, y, z) => ({[TAG]: "Rec", x, y, z});


Loop3.base = x => ({[TAG]: "Base", x});


/*
█████ Loop Stack-based ████████████████████████████████████████████████████████*/


/* Stack-based trampoline to enable recursive cases not in tail call position.
This way we can mimick Haskell's guarded recursion using tail recursion modulo
cons and beyond.

The original Fibbonacci algorithm

  const fib_ = n =>
    n <= 1 ? n
      : fib_(n - 1) + fib_(n - 2);

is transformed into a trampolining version:

  const add = x => y => x + y;

  const fib = Loops(n =>
    n <= 1
      ? Loops.base(n)
      : Loops.call2(
          Loops.rec(n - 1),
          add,
          Loops.rec(n - 2))); */


const Loops = f => x => {
  const stack = [f(x)];

  while (stack.length > 1 || stack[0] [TAG] !== "Base") {
    let o = stack[stack.length - 1];

    switch (o[TAG]) {
      case "Call":      
      case "Call2": {
        o = f(o.x.x); // 1st x of call and 2nd x of next tag
        stack.push(o);
        break;
      }

      case "Rec": {
        o = f(o.x);
        break;
      }

      case "Base": {
        while (stack.length > 1 && stack[stack.length - 1] [TAG] === "Base") {
          const p = (stack.pop(), stack.pop());

          switch (p[TAG]) {
            case "Call": {
              o = Loops.base(p.f(o.x));
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


const Loops2 = f => (x, y) => {
  const stack = [f(x, y)];

  while (stack.length > 1 || stack[0] [TAG] !== "Base") {
    let o = stack[stack.length - 1];

    switch (o[TAG]) {
      case "Call":      
      case "Call2": {
        o = f(o.x.x, o.x.y);
        stack.push(o);
        break;
      }

      case "Rec": {
        o = f(o.x, o.y);
        break;
      }

      case "Base": {
        while (stack.length > 1 && stack[stack.length - 1] [TAG] === "Base") {
          const p = (stack.pop(), stack.pop());

          switch (p[TAG]) {
            case "Call": {
              o = Loops.base(p.f(o.x, o.y));
              stack.push(o);

              break;
            }

            case "Call2": {
              o = Loops.call(p.f(o.x, o.y), p.y);
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


Loops.call2 = (f, x, y) => ({[TAG]: "Call2", f, x, y});


Loops.rec = x => ({[TAG]: "Rec", x});


Loops.base = x => ({[TAG]: "Base", x});


Loops2.call = (f, x) => ({[TAG]: "Call", f, x});


Loops2.call2 = (f, x, y) => ({[TAG]: "Call2", f, x, y});


Loops2.rec = x => y => ({[TAG]: "Rec", x, y});


Loops2.base = x => ({[TAG]: "Base", x});



/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ TYPE CLASS COMBINATORS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FOLDABLE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const fold = ({fold}, {append, empty}) => tx =>
  A.fold(append) (empty) (tx);


export const foldMapl = ({foldl}, {append, empty}) => f =>
  A.foldl(compSnd(append) (f)) (empty);


export const foldMapr = ({foldr}, {append, empty}) => f =>
  A.foldr(comp(append) (f)) (empty);


export const foldMax = ({foldl1}, {max}) => tx => foldl1(max) (tx);


export const foldMin = ({foldl}, {min}) => tx => foldl1(min) (tx);


/*█████████████████████████████████████████████████████████████████████████████
*██████████████████████████████████ FUNCTOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const mapEff = ({map}) => x => map(_ => x);


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ FUNCTOR :: APPLY ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const apEff1 = ({map, ap}) => tx => ty => ap(map(_const) (tx)) (ty);


export const apEff2 = ({map, ap}) => tx => ty => ap(mapEff({map}) (id) (tx)) (ty);


export const liftA2 = ({map, ap}) => f => tx => ty => ap(map(f) (tx)) (ty);


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████ FUNCTOR :: APPLY :: CHAIN ██████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const chain2 = ({chain}) => mx => my => fm =>
  chain(mx) (x => chain(my) (y => fm(x) (y)));


export const chain3 = ({chain}) => mx => my => mz => fm =>
  chain(mx) (x => chain(my) (y => chain(mz) (z => fm(x) (y) (z))));


// variadic chaining

export const chainn = ({chain}) => (...ms) => fm => function go(fm, mx, ...ms) {
  return chain(mx) (x => ms.length === 0 ? fm(x) : go(fm(x), ms));
} (fm, ms);


/*
█████ Interpretation ██████████████████████████████████████████████████████████*/


export const join = ({chain}) => ttx => chain(ttx) (id);


/*
█████ Kleisli █████████████████████████████████████████████████████████████████*/


export const komp = ({chain}) => fm => gm => x => chain(fm(x)) (gm);


export const kipe = ({chain}) => gm => fm => x => chain(fm(x)) (gm);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ MONAD ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FUNCTION ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Fun = k => ({
  [TAG]: "Function",
  run: k
});


export const F = Fun; // shortcut


/*
█████ Applicators █████████████████████████████████████████████████████████████*/


export const app = f => x => f(x);


export const app_ = x => f => f(x);


export const appr = (f, y) => x => f(x) (y);


export const contify = f => x => F(k => k(f(x)));


export const curry = f => x => y => f(x, y);


export const uncurry = f => (x, y) => f(x) (y);


export const flip = f => y => x => f(x) (y);


// enables `let` bindings as expressions in a readable form

export const _let = (...args) => ({in: f => f(...args)});


/* Allows the application of several binary combinators in sequence while
maintaining a flat syntax. Describes the following function call stacks:

  (x, f, y, g, z) => g(f(x) (y)) (z)
  (x, f, y, g, z) => g(z) (f(x) (y))

Which stack emerges from a combinator depends on the argument the computation
is nested in. The applicative `ap`, for instance, defines its nested call
within the first argument, whereas the functorial `map` nests in the second one. */

const makeInfix = nestFirst => (...args) => {
  if (args.length === 0) throw new TypeError("no argument found");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else if (nestFirst) x = args[i++] (x) (args[i++]);
    else x = args[i++] (args[i++]) (x);
  }

  return x;
};


export const infix = makeInfix(true);


export const infix_ = makeInfix(false);


/*
█████ Category ████████████████████████████████████████████████████████████████*/


export const id = x => x;


F.Category = () => {
  comp,
  id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


export const comp = f => g => x => f(g(x));


export const comp3 = f => g => h => x => f(g(h(x)));


export const compSnd = f => g => x => y => f(x) (g(y));


export const compThd = f => g => x => y => z => f(x) (y) (g(z));


export const compBin = f => g => x => y => f(g(x) (y));


export const compBoth = f => g => x => y => f(g(x)) (g(y));


export const liftFst = f => g => x => g(f(x)) (x); // chain


export const liftSnd = f => g => x => f(x) (g(x)); // ap


export const liftBoth = f => g => h => x => f(g(x)) (h(x));


export const pipe = g => f => x => f(g(x));


export const pipe3 = h => g => f => x => f(g(h(x)));


/*
█████ Contravariant ███████████████████████████████████████████████████████████*/


F.contramap = () => pipe;


F.Contra = () => {contramap: F.contramap};


/*
█████ Debugging ███████████████████████████████████████████████████████████████*/


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
    if (s) {
      console.log(tag + ":", x);
      console.log("");
      console.log("=JSON=>")
      console.log("");
      console.log(tag + ":", s);
    }
    
    else console.log(tag + ":", x);
  }

  else {
    if (s) {
      console.log(x);
      console.log("");
      console.log("=JSON=>");
      console.log("");
      console.log(s);
    }
    
    else console.log(x);
  }
  
  return x;
};


export const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


F.map = comp;


F.Functor = {map: F.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


// identical to Chain


F.ap = liftSnd;


F.Apply = {
  ...F.Functor,
  ap: F.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


export const _const = x => y => x;


export const const_ = x => y => y;


F.Applicative = {
  ...F.Apply,
  of: _const
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* Encodes the effect of implicitly threading an argument through a large
function composition. */ 


F.chain = liftFst;


F.Chain = {
  ...F.Apply,
  chain: F.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


F.join = f => x => F(k => k(f(x) (x)));


F.Monad = {
  ...F.Applicative,
  chain: F.chain
};


/*
█████ Functor :: Bifunctor ████████████████████████████████████████████████████*/


F.bimap = f => g => x => k => k(f(x)) (g(x));


F.Bifunctor = ({
  ...F.Functor,
  bimap: F.bimap
});


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


F.extend = ({append}) => f => g => x => f(y => g(append(x) (y)));


F.Extend = {
  ...F.Functor,
  extend: F.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


F.extract = ({empty}) => f => f(empty);


F.Comonad = {
  ...F.Extend,
  extract: F.extract
};


/*
█████ Functor :: Profunctor ███████████████████████████████████████████████████*/


/* bimap/dimap comparison:

  bimap :: (a -> b) -> (c -> d) -> bifunctor  a c -> bifunctor  b d
            ^^^^^^
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d
            ^^^^^^                                                  */


F.dimap = h => g => f => x => g(f(h(x)));
          

F.lmap = pipe;


F.rmap = comp;


F.Profunctor = {
  ...F.Functor,
  dimap: F.dimap,
  lmap: F.lmap,
  rmap: F.rmap
};


/*
█████ Impure ██████████████████████████████████████████████████████████████████*/


export const introspect = x =>
  Object.prototype.toString.call(x).slice(8, -1);


/* takes an arbitrary number of expressions and returns the evaluated value
of the last one. The omitted expressions are merely evaluated for their
effects. */

export const eff = (...exps) => exps[exps.length - 1];


export const _throw = e => { // throw as a first class expression
  throw e;
};


// try/catch block as an expression

export const _try = f => x => ({
  catch: handler => {
    try {return f(x)}
    catch(e) {return handler(x) (e)};
  }
});


/* As _try but expects a thunk instead of a function as argument. The thunk is
just a means to defer evaluation of the expression to be passed. */

export const try_ = thunk => ({
  catch: handler => {
    try {return thunk()}
    catch(e) {return handler(x) (e)};
  }
});


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


F.append = ({append}) => f => g => x => append(f(x)) (g(x));


F.prepend = ({prepend}) => g => f => x => prepend(f(x)) (g(x));


F.Semigroup = {
  append: F.append,
  prepend: F.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


F.empty = ({empty}) => _ => empty;


F.Monoid = {
  ...F.Semigroup,
  empty: F.empty
};


/*
█████ Transducer ██████████████████████████████████████████████████████████████*/


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


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


export const xor = x => y => !!(!!x ^ !!y);


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


F.Category = F.Category();


F.contramap = F.contramap();


F.Contra = F.Contra();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████ FUNCTION :: READER :: TRANSFORMER ██████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: a -> m b

/* Unlike other monad transformers Reader gets its own type wrapper to
distinguish normal function calls from monadic ones. */


export const Reader = fmm => ({ // constructor
  [TAG]: "Reader",
  run: fmm
});


export const R = Reader; // shortcut


R.T = outer => thisify(o => { // outer monad's type classes


  o.map = f => mmx => Reader(r => outer.map(f) (mmx.run(r));


  o.ap = mmf => mmx => Reader(r => outer.ap(mmf.run(r)) (mmx.run(r)))


  o.of = x => Reader(_ => outer.of(x));


  o.chain = mmx => fmm =>
    Reader(r => outer.chain(mmx.run(r)) (x => fmm(x).run(r)));


  o.lift = mx => Reader(_ => mx);


  o.ask = Reader(outer.of);


  o.reader = f => Reader(r => outer.of(f(r)));


  o.withReader = f => mmx => Reader(r => mmx.run(f(r));

  
  o.mapBase = f => mmx => Reader(r => f(mmx.run(r)));
  

  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████ FUNCTION :: STATE :: TRANSFORMER ███████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: b -> m (a, b)


export const State = fmm => ({ // constructor
  [TAG]: "State",
  run: fmm
});


export const St = State; // shortcut


St.T = outer => thisify(o => { // outer monad's type classes

  // TODO

  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Enocodes the effect of computations that may have no, one or several results.
Array is not a functional data type, because it has a non recursive definition.
While it has a valid monad instance, there is no valid transformer. Use list or
streams instead.

When to use which immutable collection type:

  * Array: random element read access
  * List: cons/uncons operations
  * DList: append operation
  * Vector: insert/delete/update operations */



export const Arr = {}; // namespace


export const A = Arr; // shortcut


A.arr = () => A.foldl; // elimination rule (see `Either.cata` for explanation)


/*
█████ Clonable ████████████████████████████████████████████████████████████████*/


A.clone = xs => xs.concat();


A.Clonable = {clone: A.clone};


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


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


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


A.foldl = f => init => xs => { // left-associative
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


A.foldl1 = f => xs => { // left-associative
  let acc = xs.length === 0
    ? _throw(new TypeError("empty array")) : xs[0];

  for (let i = 1; i < xs.length; i++)
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
      ? Loop2.base(acc)
      : ft(acc) (xs[i]) (acc2 => Loop2.rec(acc2, i + 1)))
        (init, 0);


A.foldr = f => init => xs => function go(i) { // lazy, right-associative
  if (i === xs.length) return init;
  else return f(xs[i]) (lazy(() => go(i + 1)));
} (0);


A.foldr1 = f => xs => {
  const go = i => {
    if (i === xs.length - 1) return xs[i];
    else return f(xs[i]) (lazy(() => go(i + 1)));
  };

  return xs.length === 0
    ? _throw(new TypeError("empty array"))
    : go(0);
};


A.Foldable = {
  foldl: A.foldl,
  foldl1: A.foldl1,
  foldr: A.foldr,
  foldr1: A.foldr1
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


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


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


A.map = f => tx => tx.map(f);


A.Functor = {map: A.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


A.alt = () => A.append;


A.Alt = {
  ...A.Functor,
  alt: A.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


A.zero = () => A.empty;


A.Plus = {
  ...A.Alt,
  zero: A.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


A.ap = fs => xs =>
  fs.reduce((acc, f) =>
    xs.reduce((acc2, x) =>
      (acc2.push(f(x)), acc2), acc), []);


A.Apply = {
  ...A.Functor,
  ap: A.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


A.of = A.singleton;


A.Applicative = {
  ...A.Apply,
  of: A.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


A.chain = xs => fm =>
  xs.reduce((acc, x) =>
    (acc.push.apply(acc, fm(x)), acc), []);


A.Chain = {
  ...A.Apply,
  chain: A.chain
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


A.Alternative = {
  ...A.Plus,
  ...A.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


A.Monad = {
  ...A.Applicative,
  chain: A.chain
};


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


/* Since arrays are an imperative data type, all schemes are strictly evaluated.
`List` provides lazy evaluated recursion schemes. */

A.ana = A.unfold;


A.apo = f => init => { 
  let acc = [], x = init, next;

  do {
    const pair = f(x);
    next = false;

    if (pair === null) continue;

    else {
      const [y, tz] = pair;

      tz.run({
        left: _ => (acc.push(y), acc),

        right: z => {
          x = z;
          next = true;
          return (acc.push(y), acc);
        }
      });
    }
  } while (next);

  return acc;
};


A.cata = A.foldl;


A.para = f => init => xs => { 
  let acc = init, x;

  while (true) {
    x = xs.pop();
    if (x === undefined) break;
    else acc = f(x) (xs) (acc);
  }

  return acc;
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


A.append = xs => ys => xs.concat(ys);


A.prepend = ys => xs => xs.concat(ys);


A.Semigroup = {
  append: A.append,
  prepend: A.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


A.empty = [];


A.Monoid = {
  ...A.Semigroup,
  empty: A.empty
};


/*
█████ Streaming ███████████████████████████████████████████████████████████████*/


A.stream = xs => {
  return function go(i) {
    if (i === xs.length - 1) return Stream.Done(Pair(i, xs[i]));
    else return Stream.Step(Pair(i, xs[i])) (_ => go(i + 1));
  } (0);
};


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


A.unfold = f => init => { // strict
  let acc = [], x = init, next;

  do {
    const r = f(x);
    next = false;

    if (pair === null) continue;

    else {
      const [y, z] = pair;
      x = z;
      next = true;
      return (acc.push(y), acc);
    }
  } while (next);

  return acc;
};


A.Unfoldable = {unfold: A.unfold};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


A.alt = A.alt();


A.arr = A.arr();


A.Traversable = A.Traversable();


A.zero = A.zero();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ ARRAY :: TRANSFORMER █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Array` and `List` transformer are equivalent hence there is only an
implementation for the latter but arrays can be easily processed:

L.fromFoldable({foldr: A.foldr}) ([1,2,3]) */


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ ARRAY :: NEARRAY ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* The non-empty array type. Since in dynamically typed Javascript there is no
means to ensure non-emtyness, the type comes with a more rigid constraint:
Once constructed only new elements can be added but none deleted. Since the
constructor enforces at least one element the non-empty property holds. From
a functional perspective the biggest drawback of this approach is the lack of
a filter and slice function. */


class NEArray extends Array {
  constructor(xs) {
    if (xs.length === 0) throw new TypeError("cannot construct empty array");

    else {
      super(0);
      this.push.apply(this, xs);
    }
  }

  filter() {throw new TypeError("illegal operation")}
  pop() {throw new TypeError("illegal operation")}
  shift() {throw new TypeError("illegal operation")}
  slice() {throw new TypeError("illegal operation")}
  splice() {throw new TypeError("illegal operation")}
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// TODO: extend entailing index on focused element + entire array


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// TODO: extract extracting the focused element


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ BEHAVIOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes a time changing value that is asynchronously mutated over time by
events. It is implemented as an object property defined as a lazy getter. As
opposed to normal streams a time changing value or the property holding it
always has a current value, either by initialization or by the latest processed
event. The type has the following properties:

  * multicast
  * async
  * pull
  * lazy
  * cancelable

A behavior takes an initial value and a function that in turn takes this
initial value and returns an intermediate object:

initialValue => {state: {run: actualState}, cancel: () => {...}}

The intermediate object (A) must have two properties holding the state object (A) and a nullary
cancellation function (B). Here is a simple example:

  const secCounter = Behavior(0) (init => {
    const state = {run: init}, // (B)
      id = setInterval(state2 => state2.run++, 1000, state); // event source

    return {state, cancel: () => clearInterval(id)}; // (A)
  });

Since behaviors are multicast cancelation is an issue since other parts of the
code base may rely on them. Usually, cancelation just means the behavior keeps
holding the value of the last processed event. It is more safe to throw an
exception in case of post cancellation access, though. This can be easily
defined inside the nullary `cancel` function.

Use `Stream` for synchronous data streams and `Observable` for asynchronous
event streams. */


const Behavior = init => behave => ({ // constructor
  [Symbol.toStringTag]: "Behavior",
  
  get run() {
    delete this.run;
    const  {state, cancel} = behave(init);
    Object.defineProperty(this, "run", {get() {return state.run}});
    this.cancel = cancel;
    return init;
  },

  cancel() {}
});


const Be = Behavior; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ COMPOSE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the composition of functors


export const Comp = ttx => ({
  [TAG]: "Comp",
  run: ttx
});


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Comp.map = ({map}, {map: map2}) => f => ttx =>
  Comp(map(map2(f)) (ttx));


Comp.Functor = {map: Comp.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Comp.ap = ({map, ap}, {ap: ap2}) => ttf => ttx =>
  Comp(ap(map(ap2) (ttf)) (ttx));


Comp.Apply = {
  ...Comp.Functor,
  ap: Comp.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Comp.of = ({of}, {of: of2}) => x => Comp(of(of2(x)));


Comp.Applicative = {
  ...Comp.Apply,
  of: Comp.of
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ CONST ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes constant behavior in the realm of functors/monads


export const Const = x => ({
  [TAG]: "Const",
  run: x
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Const.map = const_;


Const.Functor = {map: Const.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Const.ap = ({append}) => tf => tx => Const(append(tf.run) (tx.run));


Const.Apply = {
  ...Const.Functor,
  ap: Const.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Const.of = ({empty}) => _ => Const(empty);


Const.Applicative = {
  ...Const.Apply,
  of: Const.of
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ CONT █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes synchronous I/O computations. Use `Serial`/`Parallel` for
asynchronous evaluation either in serial or in parallel.

  The type has the following properties:

  * synchronous, serial evaluation
  * pure core/impure shell concept
  * lazy by deferred nested function call stack
  * reliable return values
  * not stack-safe but can be unwinded
  * delimited scopes

Calling `unwind` is possible due to reliable return values. It returns the
`call` trampoline tag, hence the involved computation must be wrapped in one of
the available trampoline interpeters, `Loop` for instance. */


export const Cont = k => ({
  [TAG]: "Cont",
  run: k,
  unwind: x => Loop.call(k, x) // the stack from exhausting
});


/*
█████ Delimited ███████████████████████████████████████████████████████████████*/


Cont.abrupt = x => Cont(k => x);


Cont.callcc = f => Cont(k => f(Cont.reify(k)) (k));


Cont.reify = k => x => Cont(k2 => k(x));


Cont.reset = mx => Cont(k => k(mx.run(id)));


Cont.shift = fm => Cont(k => fm(k).run(id));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Cont.map = f => tx => Cont(k => tx.run(x => k(f(x))));


Cont.Functor = {map: Cont.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Cont.ap = tf => tx => Cont(k => tf.run(f => tx.run(x => k(f(x)))));


Cont.Apply = {
  ...Cont.Functor,
  ap: Cont.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Cont.of = x => Cont(k => k(x));


Cont.Applicative = {
  ...Cont.Apply,
  of: Cont.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Cont.chain = mx => fm => Cont(k => mx.run(x => fm(x).run(k)));


Cont.Chain = {
  ...Cont.Apply,
  chain: Cont.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Cont.Monad = {
  ...Cont.Applicative,
  chain: Cont.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


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


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Cont.empty = empty => Cont(k => k(empty));


Cont.Monoid = {
  ...Cont.Semigroup,
  empty: Cont.empty
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const DateTime = {}; // namespace


export const D = DateTime; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


D.fromString = s => {
  const d = new Date(s);

  if (Number.isNaN(d.valueOf()))
    throw new TypeError("invalid date string");

  else return d;
};


/*
█████ Format ██████████████████████████████████████████████████████████████████*/


D.format = sep => (...fs) => d =>
  fs.map(f => f(d))
    .join(sep);


D.formatDay = mode => d => {
  switch (mode) {
    case 1: return String(d.getUTCDate());
    case 2: return String(d.getUTCDate()).padStart(2, "0");
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatMonth = ({names = [], mode}) => d => {
  switch (mode) {
    case 1: return String(d.getUTCMonth() + 1);
    case 2: return String(d.getUTCMonth() + 1).padStart(2, "0");
    case 3: return names[String(d.getUTCMonth())];
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatWeekday = ({names = [], mode}) => d => {
  switch (mode) {
    case 1: return String(d.getUTCDay());
    case 2: return String(d.getUTCDay()).padStart(2, "0");
    case 3: return names[String(d.getUTCDay())];
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatYear = mode => d => {
  switch (mode) {
    case 2: return String(d.getUTCFullYear()).slice(2);
    case 4: return String(d.getUTCFullYear());
    default: throw new RangeError("invalid formatting mode");
  }
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DEFER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes deferred evaluated thunks in a more principled manner than the 
proxy-based `defer` and `lazy` combinators. Since the type on its own is not
particularly useful, it is mainly supplied as a monad transformer. Use the
`Lazy` type if you need sharing.

  * deferred thunks are only evaluated if and when needed
  * lazy thunks are only evaluated when needed and only once (sharing) */


export const Defer = thunk => ({ // constructor
  [TAG]: "Defer",
  get run() {return thunk()}
});


Defer.of = x => Defer(x); // minimal context


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ DEFER :: TRANSFORMER █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (Defer a)


Defer.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


  o.foldl = f => acc => outer.map(mx => f(acc) (mx.run));


  o.foldr = f => acc => outer.map(mx => f(mx.run) (acc));


  o.Foldable = {
    foldl: o.foldl,
    foldr: o.foldr
  };


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


  // schematic process: [Defer a] -> a -> f b -> f [Defer b]

  o.mapA = ({map}) => ft => mmx => outer.chain(mmx) (mx =>
    map(comp(outer.of) (x => Defer(() => x))) (ft(mx.run)));


  // schematic process: [Defer (f a)] -> f [Defer a]

  o.seqA = ({map}) => mmx => outer.chain(mmx) (mx =>
    map(comp(outer.of) (x => Defer(() => x))) (mx.run));


  o.Traversable = () => ({
    ...o.Foldable,
    ...o.Functor,
    mapA: o.mapA,
    seqA: o.seqA
  });


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => outer.map(mx => Defer(() => f(mx.run))) (mmx);


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => outer.chain(mmf) (mf =>
    outer.chain(mmx) (mx =>
      outer.of(Defer(() => mf.run(mx.run)))));


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  of: x => outer.of(Defer.of(x)),


  Applicative = {
    ...o.Apply,
    of: o.of
  },


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx => Defer(() => fmm(mx.run).run));


  o.Chain = {
    ...o.Apply,
    chain: o.chain
  };


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


  o.Monad = {
    ...o.Applicative,
    chain: o.chain
  };


});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EITHER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the most fundamental sum type - logical or - A || B


export const Either = {}; // namespace


// value constructors


Either.Left = x => ({
  [TAG]: "Either",
  run: ({left}) => left(x)
});


Either.Right = x => ({
  [TAG]: "Either",
  run: ({right}) => right(x)
});


/* The elimination rule of the type. Catamorphisms are more general and thus
more expressive than folds, because they factor all value constructors in.
`Either` has two constructors and the catamorphism receives two functions
accordingly, one for each constructor. A fold on the other hand has only a
single function `f` and a constant `acc`, i.e. it is one function short to
fully cover `Either`'s cases. For this reason catamorphism and fold coincide
for `List` and `Option`, because both types comprise one type constructor
(`Cons`/`Some`) and one type constant (`Nil`/`None`). */


Either.cata = left => right => tx => tx.run({left, right});


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


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


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


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


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Either.map = f => tx =>
  tx.run({
    left: x => Either.Left(f(x)),
    right: y => Either.Right(f(y))
  });


Either.Functor = {map: Either.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


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


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


// omit the ambiguous type class


Either.ofLeft = x => Either.Left(x);


Either.ofRight = x => Either.Right(x);


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Either.chain = mx => fm =>
  mx.run({
    left: x => fm(x),
    right: y => fm(y)
  });


Either.Chain = {
  ...Either.Apply,
  chain: Either.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Either.Monad = {
  ...Either.Applicative,
  chain: Either.chain
};


/*
█████ Functor :: Bifunctor ████████████████████████████████████████████████████*/


/* bimap/dimap comparison:

  bimap :: (a -> b) -> (c -> d) -> bifunctor  a c -> bifunctor  b d
            ^^^^^^
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d
            ^^^^^^                                                  */


Either.bimap = f => g => tx => tx.run({left: f, right: g}); 


Either.Bifunctor = ({
  ...Either.Functor,
  bimap: Either.bimap
});



/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


/* TODO:

instance (Monoid a, Monoid b) => Monoid (Either a b) where
    mempty = Right mempty
    Left x  `mappend` Left y  = Left (x <> y)
    Left x  `mappend` _       = Left x
    _       `mappend` Left y  = Left y
    Right x `mappend` Right y = Right (x <> y)*/


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Either.Traversable = Either.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ERROR ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Err = TypeError; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EXCEPT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes the effect of computations that might raise an exception. Since
Javascript comprises an error class, it isn't defined as a sum type but relies
on error class objects. This approach makes it both less cumbersome to use but
also less explicit.

Throughout this lib a new error subclass `Exception` is used to indicate an
exception. */


export const Except = {}; // namespace


export const E = Except; // shortcut


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


E.foldl = f => acc => tx => introspect(tx) === "Error" ? acc : f(acc) (tx);


E.foldr = f => acc => tx => introspect(tx) === "Error" ? acc : f(tx) (acc);


E.Foldable = {
  foldl: E.foldl,
  foldr: E.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


E.mapA = ({of}) => ft => tx => introspect(tx) === "Error" ? of(tx) : ft(tx);


E.seqA = ({of}) => tx => introspect(tx) === "Error" ? of(tx) : tx;


E.Traversable = () => ({
  ...E.Foldable,
  ...E.Functor,
  mapA: E.mapA,
  seqA: E.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

E.map = f => tx => introspect(tx) === "Error" ? tx : f(tx);


E.Functor = {map: E.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


E.ap = tf => tx =>
  introspect(tf) === "Error" ? tf
    : introspect(tx) === "Error" ? tx
    : tf(tx);


E.Apply = {
  ...E.Functor,
  ap: E.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


E.of = x => introspect(x) === "Error" ? _throw("unexpected exception") : x;


E.Applicative = {
  ...E.Apply,
  of: E.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


E.chain = mx => fm => introspect(mx) === "Error" ? mx : fm(mx);


E.Chain = {
  ...E.Apply,
  chain: E.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


E.Monad = {
  ...E.Applicative,
  chain: E.chain
};


/*
█████ Functor :: Bifunctor ████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ ID ██████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the absence of any effects in the realm of functors/monads


export const Id = x => ({
  [TAG]: "Id",
  run: x
});


//███Functor███████████████████████████████████████████████████████████████████*/


Id.map = f => tx => Id(f(tx.run));


Id.Functor = {map: Id.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Id.ap = tf => tx => Id(tf.run(tx.run));


Id.Apply = {
  ...Id.Functor,
  ap: Id.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Id.of = Id;


Id.Applicative = {
  ...Id.Apply,
  of: Id.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Id.chain = mx => fm => fm(mx.run);


Id.Chain = {
  ...Id.Apply,
  chain: Id.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Id.Monad = {
  ...Id.Applicative,
  chain: Id.chain
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ IMAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const IMap_ = cmp => {
  const IMap = (tree, size) => ({
    [TAG]: "IMap",
    tree,
    size
  });


  IMap.empty = IMap(RBT.Leaf, 0);


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


  IMap.get = k => m => {
    const r = RBT.get(m.tree, k, cmp);
    return r === undefined ? null : r;
  };


  IMap.has = k => m =>
    RBT.has(m.tree, k, cmp);


  IMap.upd = k => f => m => {
    if (IMap.has(k) (m)) {
      const v = RBT.get(m.tree, k, cmp);

      return IMap(
        RBT.set(m.tree, k, f(v), cmp),
        m.size);
    }

    else return m;
  };


  IMap.del = k => m => {
    let size = m.size;

    if (IMap.has(k) (m))
      size = m.size - 1;
    
    else return m;

    return IMap(
      RBT.del(m.tree, k, cmp),
      size);
  };


  IMap.set = k => v => m => {
    let size = m.size;

    if (!IMap.has(k) (m))
      size = m.size + 1;

    return IMap(
      RBT.set(m.tree, k, v, cmp),
      size);
  };


/*
█████ Traversal ███████████████████████████████████████████████████████████████*/


  IMap.inOrder = ({append, empty}) => f => m =>
    RBT.inOrder({append, empty}) (f) (m.tree);


  IMap.inOrder_ = ({append, empty}) => f => m =>
    RBT.inOrder_({append, empty}) (f) (m.tree);


  return IMap;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ IOMAP ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const IOMap_ = cmp => {
  const IOMap = (tree, keys, size, counter) => ({
    [TAG]: "IOMap",
    tree,
    keys,
    size,
    counter
  });


  IOMap.empty = IOMap(RBT.Leaf, RBT.Leaf, 0, 0);


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


  IOMap.get = k => m => {
    const r = RBT.get(m.tree, k, cmp);
    return r === undefined ? null : r;
  };


  IOMap.has = k => m =>
    RBT.has(m.tree, k, cmp);


  IOMap.upd = k => f => m => {
    if (IOMap.has(k) (m)) {
      const v = RBT.get(m.tree, k, cmp);

      return IOMap(
        RBT.set(m.tree, k, f(v), cmp),
        m.keys,
        m.size,
        m.counter);
    }

    else return m;
  };


  IOMap.del = k => m => {
    let size = m.size;

    if (IOMap.has(k) (m))
      size = m.size - 1;
    
    else return m;

    return IOMap(
      RBT.del(m.tree, k, cmp),
      m.keys, // no key removal
      size,
      m.counter);
  };


  IOMap.set = k => v => m => {
    let size = m.size,
      counter = m.counter;

    if (!IOMap.has(k) (m)) {
      size = m.size + 1;
      counter = m.counter + 1;
    }

    return IOMap(
      RBT.set(m.tree, k, v, cmp),
      RBT.set(m.keys, m.counter, k, RBT.cmp),
      size,
      counter);
  };


/*
█████ Traversal ███████████████████████████████████████████████████████████████*/


  IOMap.inOrder = ({append, empty}) => f => m =>
    RBT.inOrder({append, empty}) (f) (m.tree);


  IOMap.inOrder_ = ({append, empty}) => f => m =>
    RBT.inOrder_({append, empty}) (f) (m.tree);


  IOMap.insertOrder = f => init => m => function go(acc, i) {
    if (i >= m.counter) return acc;

    else {
      const k = RBT.get(m.keys, i, RBT.cmp),
        v = IOMap.get(k) (m);

      if (v === null) return go(acc, i + 1);
      else return go(f(acc) (Pair(k, v)), i + 1)
    }
  } (init, 0);


  IOMap.insertOrder_ = f => acc => m => function go(i) {
    if (i >= m.counter) return acc;

    else {
      const k = RBT.get(m.keys, i, RBT.cmp),
        v = IOMap.get(k) (m);

      if (v === null) return go(i + 1);
      else return f(Pair(k, v)) (lazy(() => go(i + 1)));
    }
  } (0);


  return IOMap;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ISET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const ISet_ = cmp => {
  const ISet = (tree, size) => ({
    [TAG]: "ISet",
    tree,
    size
  });


  ISet.empty = ISet(RBT.Leaf, 0);


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


  ISet.has = k => s =>
    RBT.has(s.tree, k, cmp);


  ISet.upd = k => f => s => {
    if (ISet.has(k) (s)) {
      return ISet(
        RBT.set(s.tree, f(k), null, cmp),
        s.size);
    }

    else return s;
  };


  ISet.del = k => s => {
    let size = s.size;

    if (ISet.has(k) (s))
      size = s.size - 1;
    
    else return s;

    return ISet(
      RBT.del(s.tree, k, cmp),
      size);
  };


  ISet.set = k => s => {
    let size = s.size;

    if (!ISet.has(k) (s))
      size = s.size + 1;

    return ISet(
      RBT.set(s.tree, k, null, cmp),
      size);
  };


/*
█████ Traversal ███████████████████████████████████████████████████████████████*/


  ISet.inOrder = ({append, empty}) => f => s =>
    RBT.inOrder({append, empty}) (f) (s.tree);


  ISet.inOrder_ = ({append, empty}) => f => s =>
    RBT.inOrder_({append, empty}) (f) (s.tree);


  return ISet;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ IOSET ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const IOSet_ = cmp => {
  const IOSet = (tree, keys, size, counter) => ({
    [TAG]: "IOSet",
    tree,
    keys,
    size,
    counter
  });


  IOSet.empty = IOSet(RBT.Leaf, RBT.Leaf, 0, 0);


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


  IOSet.has = k => s =>
    RBT.has(s.tree, k, cmp);


  IOSet.upd = k => f => s => {
    if (IOSet.has(k) (s)) {
      return IOSet(
        RBT.set(s.tree, f(k), null, cmp),
        s.keys,
        s.size,
        s.counter);
    }

    else return s;
  };


  IOSet.del = k => s => {
    let size = s.size;

    if (IOSet.has(k) (s))
      size = s.size - 1;
    
    else return s;

    return IOSet(
      RBT.del(s.tree, k, cmp),
      s.keys, // no key removal
      size,
      s.counter);
  };


  IOSet.set = k => s => {
    let size = s.size,
      counter = s.counter;

    if (!IOSet.has(k) (s)) {
      size = s.size + 1;
      counter = s.counter + 1;
    }

    return IOSet(
      RBT.set(s.tree, k, null, cmp),
      RBT.set(s.keys, s.counter, k, RBT.cmp),
      size,
      counter);
  };


/*
█████ Traversal ███████████████████████████████████████████████████████████████*/


  IOSet.inOrder = ({append, empty}) => f => s =>
    RBT.inOrder({append, empty}) (f) (s.tree);


  IOSet.inOrder_ = ({append, empty}) => f => s =>
    RBT.inOrder_({append, empty}) (f) (s.tree);


  IOSet.insertOrder = f => init => s => function go(acc, i) {
    if (i >= s.counter) return acc;

    else {
      const k = RBT.get(s.keys, i, RBT.cmp),
        v = IOSet.get(k) (s);

      if (v === null) return go(acc, i + 1);
      else return go(f(acc) (v), i + 1);
    }
  } (init, 0);


  IOSet.insertOrder_ = f => acc => s => function go(i) {
    if (i >= s.counter) return acc;

    else {
      const k = RBT.get(s.keys, i, RBT.cmp),
        v = IOSet.get(k) (s);

      if (v === null) return go(i + 1);
      else return f(v) (lazy(() => go(i + 1)));
    }
  } (0);


  return IOSet;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ LAZY █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes lazy evaluated thunks in a more principled manner than the 
proxy-based `defer` and `lazy` combinators. Since the type on its own is not
particularly useful, it is mainly supplied as a monad transformer. Use the
`Defer` type if you don't need sharing.

  * deferred thunks are only evaluated when needed
  * lazy thunks are only evaluated when needed and only once (sharing) */


export const Lazy = thunk => ({
  [TAG]: "Lazy",

  get run() {
    const r = thunk(); // sharing
    delete this.run;
    return this.run = r;
  }
});


Lazy.of = x => Lazy(x); // minimal context


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ LAZY :: TRANSFORMER █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (Lazy a)


Lazy.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


  o.foldl = f => acc => outer.map(mx => f(acc) (mx.run));


  o.foldr = f => acc => outer.map(mx => f(mx.run) (acc));


  o.Foldable = {
    foldl: o.foldl,
    foldr: o.foldr
  };


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


  // schematic process: [Lazy a ] -> a -> f b -> f [Lazy b]

  o.mapA = ({map}) => ft => mmx => outer.chain(mmx) (mx =>
    map(comp(outer.of) (x => Lazy(() => x)))) (ft(mx.run));


  // schematic process: [Lazy (f a)] -> f [Lazy a]

  o.seqA = ({map}) => mmx => outer.chain(mmx) (mx =>
    map(comp(outer.of) (x => Lazy(() => x)))) (mx.run);


  o.Traversable = () => ({
    ...o.Foldable,
    ...o.Functor,
    mapA: o.mapA,
    seqA: o.seqA
  });


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => outer.map(mx => Lazy(() => f(mx.run))) (mmx);
  

  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => outer.chain(mmf) (mf =>
    outer.chain(mmx) (mx =>
      outer.of(Lazy(() => mf.run(mx.run)))));
  

  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => outer.of(Lazy.of(x));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx => Lazy(() => fmm(mx.run).run));


  o.Chain = {
    ...o.Apply,
    chain: o.chain
  };


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


  o.Monad = {
    ...o.Applicative,
    chain: o.chain
  };


});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ LIST █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes non-determinism just like arrays but is recursively defined and
forms a completely unbalanced tree structure. There are two trchniques to make
operations on the type stack-safe:

  * guarded recursion through lazy evaluation
  * tail recursion modulo cons using a stack based trampoline

When to use which immutable collection type:

  * Array: random element read access
  * List: cons/uncons operations
  * DList: append operation
  * Vector: insert/delete/update operations */


export const List = {}; // namespace


export const L = List; // shortcut


// value constructors


L.Cons = x => xs => ({
  [TAG]: "List",
  run: ({cons}) => cons(x) (xs)
});


L.Cons_ = xs => x => ({
  [TAG]: "List",
  run: ({cons}) => cons(x) (xs)
});


L.Nil = ({
  [TAG]: "List",
  run: ({nil}) => nil
});


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


List.foldl = f => init => xs => Loop2((ys, acc) =>
  ys.run({
    nil: acc,

    cons: z => zs => Loop2.rec(zs, f(acc) (z))
  })) (xs, init);


List.foldr = f => acc => function go(xs) {
  return xs.run({
    nil: acc,
    cons: y => ys => f(y) (lazy(() => go(ys)))
  });
};


L.Foldable = {
  foldl: L.foldl,
  foldr: L.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


L.map = f => Loops(tx => 
  tx.run({
    cons: y => ty => Loops.call(
      L.Cons(f(y)),
      Loops.rec(ty)),
    get nil() {return Loops.base(L.Nil)}
  }));


L.mapLazy = f => function go(tx) {
  return tx.run({
    cons: y => ty => L.Cons(f(y)) (lazy(() => go(ty))),
    nil: L.Nil
  });
};


L.Functor = {map: L.map};


/*
█████ Functor :: Apply (Non-Determinism) ██████████████████████████████████████*/


// TODO


/*L.Apply = {
  ...L.Functor,
  ap: L.ap
};*/


/*
█████ Functor :: Apply (Zip List) █████████████████████████████████████████████*/


L.ZipList = {};


L.ZipList.ap = tf => tx => Loops2((tf, tx) => 
  tf.run({
    cons: g => tg =>
      tx.run({
        cons: y => ty => Loops2.call(
          L.Cons(g(y)),
          Loops2.call2(L.ZipList.ap, tg, ty)),

        get nil() {return Loops2.base(L.Nil)}
      }),

    get nil() {return Loops2.base(L.Nil)}
  })) (tf, tx);


L.ZipList.apLazy = tf => tx =>
  tf.run({
    cons: g => tg =>
      tx.run({
        cons: y => ty => L.Cons(g(y)) (lazy(() => L.ZipList.apLazy(tg) (ty))),
        nil: L.Nil
      }),

    nil: L.Nil
  });


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


L.of = L.Nil;


L.Applicative = {
  ...L.Apply,
  of: L.of
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ LIST :: TRANSFORMER █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (List m a)


L.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromFoldable = ({foldr}) => foldr(L.Cons) (o.empty);


  o.toList = mmx =>
    outer.of(o.foldr(x => mx => L.Cons(x) (mx)) (L.Nil) (mmx));


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


  o.foldl = f => acc => mmx => Loop2((mmx, acc) => {
    return outer.chain(mmx) (mx =>
      mx.run({
        cons: y => mmy => Loop2.next(mmy, f(acc) (y)),
        nil: Loop2.done(acc)
      }));
  }) (mmx, []);


  o.foldr = f => acc => function go(mmx) {
    return outer.chain(mmx) (mx =>
      mx.run({
        cons: y => mmy => f(y) (lazy(() => go(mmy))),
        nil: acc
      }));
  };


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


  o.mapA = ({map, ap, of}) => ft => {
    const liftA2_ = liftA2({map, ap});
    
    return o.foldr(x =>
      liftA2_(x => mmx =>
        outer.of(L.Cons(x) (mmx))) (ft(x))) (of(o.empty));
  };


  o.seqA = ({map, ap, of}) => {
    const liftA2_ = liftA2({map, ap});

    return o.foldr(liftA2_(x => mmx =>
      outer.of(L.Cons(x) (mmx)))) (of(o.empty));
  };


  o.Traversable = () => ({
    ...o.Foldable,
    ...o.Functor,
    mapA: o.mapA,
    seqA: o.seqA
  });


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx =>
    o.foldr(x => mx => outer.of(L.Cons(f(x)) (mx))) (outer.of(L.Nil)) (mmx);


  o.Functor = {map: o.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


  o.alt = () => o.append;


  o.Alt = {
    ...o.Functor,
    alt: o.alt
  };


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


  o.zero = () => o.empty;


  o.Plus = {
    ...o.Alt,
    zero: o.zero
  };


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx =>
    o.foldr(f => my =>
      o.foldr(x => mx =>
        outer.of(L.Cons(f(x)) (mx))) (my) (mmx))
          (outer.of(L.Nil))
            (mmf);


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => outer.of(L.Cons(x) (outer.of(L.Nil)));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm =>
    o.foldr(x => o.append(fmm(x))) (outer.of(L.Nil)) (mmx);


  o.Chain = {
    ...o.Apply,
    chain: o.chain
  };


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


  o.Alternative = {
    ...o.Plus,
    ...o.Applicative
  };


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


  o.Monad = {
    ...o.Applicative,
    chain: o.chain
  };


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  o.append = mmx => mmy =>
    o.foldr(x => mx => outer.of(L.Cons(x) (mx))) (mmx) (mmy);


  o.prepend = mmy => mmx =>
    o.foldr(x => mx => outer.of(L.Cons(x) (mx))) (mmx) (mmy);


  o.Semigroup = {
    append: o.append,
    prepend: o.prepend
  };


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = outer.of(L.Nil);


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  // List a -> m (List m a)
  o.liftList = tx => L.foldr(x => mx => outer.of(L.Cons(x) (mx))) (o.empty) (tx);


  // m a -> m (List m a)
  o.lift = mx => outer.chain(mx) (o.of);


  // (m a -> n a) -> m (List m a) -> n (List n a)
  // o.mapBase = fm => mmx => TODO


  // (m a -> n (List n a)) -> m (List m a) => n (List n a)
  //o.chainBase = fmm => TODO


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


  // TODO


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


  o.alt = o.alt();


  o.Traversable = o.Traversable();


  o.zero = o.zero();


  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ LIST :: DLIST ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const DList = f => ({
  [TAG]: "DList",
  run: f
});


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


DList.cons = x => xs => app(DList) (comp(List.Cons(x)) (xs.run));


DList.singleton = comp(DList) (List.Cons);


DList.snoc = x => xs => app(DList) (comp(xs.run) (List.Cons(x)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


DList.fromList = xs => comp(DList) (List.append);


DList.toList = xs => comp(app_(List.Nil)) (xs.run);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


DList.append = xs => ys => app(DList) (comp(xs.run) (ys.run));


DList.prepend = ys => xs => app(DList) (comp(xs.run) (ys.run));


DList.Semigroup = {
  append: DList.append,
  prepend: DList.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


DList.empty = DList(id);


DList.Monoid = {
  ...DList.Semigroup,
  empty: DList.empty
};


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


DList.unfold = f => function go(y) {
  return f(y).run({
    none: DList.empty,
    some: ([x, y2]) => DList.Cons(x) (lazy(() => go(y2)))
  })
};


DList.Unfoldable = {unfold: DList.unfold};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const _Map = {}; // namespace


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


_Map.add = ({append}) => k => v => m => {
  if (m.has(k)) return m.set(k, append(m.get(k)) (v));
  else return m.set(k, v);
};


_Map.get = k => m => m.has(k) ? m.get(k) : null;


_Map.getOr = x => k => m => m.has(k) ? m.get(k) : x;


_Map.has = k => m => m.has(k);


_Map.set = k => v => m => m.set(k, v);


_Map.del = k => m => m.delete(k);


_Map.upd = k => f => m => {
  if (m.has(k)) (o[k] = f(o[k]), o);
  else return new Exception("missing property to be updated");
};


_Map.updOr = x => k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return (o[k] = x, o);
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ NUMBER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Num = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Num.fromString = s => {
  if (s.search(/^(?:\+|\-)?\d+(?:\.\d+)?$/) === 0) return Number(s);
  else throw new TypeError(`invalid number string: ${s}`);
};


/*
█████ Serialization ███████████████████████████████████████████████████████████*/


Num.format = (...fs) => n =>
  fs.map(f => f(n))
    .join("");


Num.formatFrac = digits => n =>
  String(n)
    .replace(/^[^.]+\.?/, "")
    .padEnd(digits, "0");


Num.formatInt = sep => n =>
  String(Num.trunc(0) (n))
    .replace(/^-/, "")
    .replace(new RegExp("(\\d)(?=(?:\\d{3})+$)", "g"), `$1${sep}`);


Num.formatSign = (pos, neg) => n =>
  n > 0 ? pos : n < 0 ? neg : "";


Num.formatSep = sep => n => sep;


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ NUMBER :: NATURAL ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/



export const Natural = {}; // namespace


export const Nat = Natural; // shortcut


/* The elemination rule of the type. Applying structural recursion on natural
numbers might be a little unusual but is quite powerful. Here is an
implementaiton of the fibonacci sequence:

  const fib = comp(Pair.fst)
    (Nat.cata(Pair(0, 1)) (([a, b]) => Pair(b, a + b))); */

Nat.cata = zero => succ => n => {
  let r = zero;

  while (n > 0) {
    r = succ(r);
    n -= 1;
  }

  return r;
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ NUMBER :: DECIMAL ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Decimal = {}; // namespace


export const Dec = Decimal; // shortcut


/*
█████ Precision ███████████████████████████████████████████████████████████████*/


Dec.decimalAdjust = (k, n, digits) => {
  const p = Math.pow(10, digits);

  if (Math.round(n * p) / p === n)
    return n;

  const m = (n * p) * (1 + Number.EPSILON);
  return Math[k] (m) / p;
};


Dec.ceil = digits => n =>
  Dec.decimalAdjust("ceil", n, digits);


Dec.floor = digits => n =>
  Dec.decimalAdjust("floor", n, digits);


Dec.round = digits => n =>
  Dec.decimalAdjust("round", n, digits);


Dec.trunc = digits => n =>
  Dec.decimalAdjust("trunc", n, digits);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OBJECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Obj = {}; // namespace


export const O = Obj; // shortcut;


/*
█████ Clonable ████████████████████████████████████████████████████████████████*/


O.clone = o => {
  const p = {};

  for (const k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


O.Clonable = {clone: O.clone};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


O.fromPairs = pairs => pairs.reduce((acc, [k, v]) => (acc[k] = v, acc), {});


O.toPairs = Object.entries;


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


O.add = ({append}) => k => v => o => {
  if (k in o) return (o[k] = append(o[k]) (v), o);
  else return (o[k] = v, o);
};


O.del = k => o => (delete o[k], o);


O.get = k => o => k in o ? o[k] : null;


O.getOr = x => k => o => k in o ? o[k] : x;


O.set = k => v => o => (o[k] = v, o);


O.upd = k => f => o => {
  if (k in o) (o[k] = f(o[k]), o);
  else return new Exception("missing property to be updated");
};


O.updOr = x => k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return (o[k] = x, o);
};


/*
█████ Streaming ███████████████████████████████████████████████████████████████*/


O.keyStream = o => {
  const keys = Object.entries(o);

  return function go(i) {
    if (i === keys.length - 1) return Stream.Done(keys[i]);
    else return Stream.Step(keys[i]) (_ => go(i + 1));
  } (0);
};


O.propStream = o => {
  const props = Object.entries(o);

  return function go(i) {
    if (i === props.length - 1) return Stream.Done(props[i]);
    else return Stream.Step(props[i]) (_ => go(i + 1));
  } (0);
};


O.valueStream = o => {
  const values = Object.values(o);

  return function go(i) {
    if (i === values.length - 1) return Stream.Done(values[i]);
    else return Stream.Step(values[i]) (_ => go(i + 1));
  } (0);
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


export const lazyProp = k => thunk => o => // create lazy property that shares its result
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true});


O.lazyProp = lazyProp;


// self referencing during object creation

export const thisify = f => f({});


O.thisify = thisify;


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ OBSERVABLE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes asynchronos event streams. It has the following properties:

  * unicast
  * sync/async
  * push
  * lazy
  * cancelable

Use `Stream` for synchronous data streams and `Behavior` for asynchronous time
chaging values. */


export const Observable = observe => ({ // constructor
  [TAG]: "Observable",
  run: observe
});


export const Ob = Observable; // shortcut


Ob.subscribe = observer => observable => observable.run(observer);


Ob.fromEvent = target => event => Ob(observer => {
  const handler = e => observer.next(e);
  target.addEventListener(event, handler);
  return () => {target.removeEventListener(event, handler)};
});


Ob.fromPormise = p => Ob(observer =>
  p.then(x => {
    observer.next(x);
    observer.done();
  }).catch(e => {
    observer.error(e);
    observer.done();
  }));


Ob.map = f => tx => Ob(observer =>
  tx.run({
    next: x => observer.next(f(x)),
    error: e => observer.error(e),
    done: y => observer.done(y)
  })
);


Ob.ap = tf => tx => Ob(observer =>
  tf.run({
    next: f => tx.run({
      next: x => observer.next(f(x)),
      error: e2 => observer.error(e2),
      done: y => observer.done(y)
    }),

    error: e => observer.error(e),
    done: y => observer.done(y)
  })
);


Ob.chain = tx => fm => Ob(observer =>
  tx.run({
    next: x => {
      return fm(x).run({
        next: x2 => observer.next(x2),
        error: e2 => observer.error(e2),
        done: y2 => observer.done(y2)
      })
    },
    
    error: e => observer.error(e),
    done: y => observer.done(y)
  })
);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ OPTIC ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes composable getters/setters where the latter keep the root reference.
The type itself is immutable but the overall property depends on the purity or
impurity of involved getters/setters. */


export const Optic = (ref, path) => ({
  [TAG]: "Optic",
  ref,
  path
});


/*
█████ Composition █████████████████████████████████████████████████████████████*/


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


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Optic.map = () => Optic.upd(id);


Optic.Functor = {map: Optic.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


/* If the innermost values of two `Optic`s are combined, there is no meaningful
rule to decide which path to keep. For the functor instance keeping the first
is assumed as a convention. */


Optic.apFst = ft => tx => Optic(ft.ref(tx.ref), ft.path);


Optic.apSnd = ft => tx => Optic(ft.ref(tx.ref), tx.path);


Optic.Apply = {
  ...Optic.Functor,
  ap: Optic.apFst
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Optic.of = ref => Optic(ref, null);


Optic.Applicative = {
  ...Optic.Apply,
  of: Optic.of
};


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


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


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Optic.map = Optic.map();


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OPTION ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes the effect of computations that might not yield a result. Since
Javascript comprises a `null` value, it isn't defined as a sum type but relies
on this value. This approach makes it both less cumbersome to use but also less
explicit. */


export const Option = {}; // namespace


export const Opt = Option; // shortcut


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


Opt.foldl = f => acc => tx => tx === null ? acc : f(acc) (tx);


Opt.foldr = f => acc => tx => tx === null ? acc : f(tx) (acc);


Opt.Foldable = {
  foldl: Opt.foldl,
  foldr: Opt.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


Opt.mapA = ({of}) => ft => tx => tx === null ? of(tx) : ft(tx);


Opt.seqA = ({of}) => tx => tx === null ? of(tx) : tx;


Opt.Traversable = () => ({
  ...Opt.Foldable,
  ...Opt.Functor,
  mapA: Opt.mapA,
  seqA: Opt.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Opt.map = f => tx => tx === null ? null : f(tx);


Opt.Functor = {map: Opt.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


Opt.alt = tx => ty => tx === null ? ty : tx;

Opt.Alt = {
  ...Opt.Functor,
  alt: Opt.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Opt.zero = null;


Opt.Plus = {
  ...Opt.Alt,
  zero: Opt.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Opt.ap = tf => tx =>
  tf === null ? null
    : tx === null ? null
    : tf(tx);


Opt.Apply = {
  ...Opt.Functor,
  ap: Opt.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

Opt.of = x => x === null ? _throw("unexpected null") : x;


Opt.Applicative = {
  ...Opt.Apply,
  of: Opt.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


Opt.Alternative = {
  ...Opt.Plus,
  ...Opt.Applicative
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Opt.chain = mx => fm => mx === null ? null : fm(mx);


Opt.Chain = {
  ...Opt.Apply,
  chain: Opt.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Opt.Monad = {
  ...Opt.Applicative,
  chain: Opt.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Opt.append = ({append}) => tx => ty =>
  tx === null ? ty
    : ty === null ? tx
    : append(tx) (ty);


Opt.Semigroup = {
  append: Opt.append,
  prepend: Opt.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Opt.empty = null;


Opt.Monoid = {
  ...Opt.Semigroup,
  empty: Opt.empty
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ PARALLEL ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes asynchronous I/O computations evaluated in parallel. Use `Serial` for
  serial evaluation. Use `Cont` to encode synchronous I/O effects.

  It has the following properties:

  * asynchronous, parallel evaluation
  * pure core/impure shell concept
  * lazy by deferred nested function call stack
  * non-reliable return values
  * stack-safe due to asynchronous calls */


export const Parallel = k => ({
  [TAG]: "Parallel",
  run: k,

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => k(f));

    else k(f);
  }
});


export const P = Parallel; // shortcut


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


P.and = tx => ty => {
  const guard = (k, i) => x => {
    pair[i] = x;

    return settled || !("0" in pair) || !("1" in pair)
      ? false
      : (settled = true, k(Pair(pair[0], pair[1])));
  };

  const pair = [];
  let settled = false;

  return P(k => (
    tx.run(guard(k, 0)),
    ty.run(guard(k, 1))));
};


P.allArr = () =>
  A.seqA({
    map: P.map,
    ap: P.ap,
    of: P.of});


// TODO: P.allList


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


P.or = tx => ty => {
  const guard = k => x =>
    settled
      ? false
      : (settled = true, k(x));

  let settled = false;

  return P(k => (
    tx.run(guard(k)),
    ty.run(guard(k))));
};


P.anyArr = () =>
  A.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


P.map = f => tx =>
  P(k => tx.run(x => k(f(x))));


P.Functor = {map: P.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


P.ap = tf => tx =>
  P(k =>
    P.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


P.Apply = {
  ...P.Functor,
  ap: P.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


P.of = x => P(k => k(x));


P.Applicative = {
  ...P.Apply,
  of: P.of
};


/*
█████ Natural Transformations █████████████████████████████████████████████████*/


/* Values of type Parallel/Serial are structurally equal but differ in their
logical conjunctions/disjunctions. Hence, natural transformations are merely
documenting for improved comprehensibility. */


P.fromSerial = tx => ({
  [TAG]: "Parallel",
  run: tx.run,
  runAsync: tx.runAsync
});


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


P.append = ({append}) => tx => ty =>
  P(k =>
    P.and(tx) (ty)
      .run(([x, y]) =>
        k(append(x) (y))));


P.prepend = P.append;


P.Semigroup = {
  append: P.append,
  prepend: P.prepend
};

  
/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


P.empty = empty =>
  P(k => k(empty));


P.Monoid = {
  ...P.Semigroup,
  empty: P.empty
};


/*
█████ Semigroup (race) ████████████████████████████████████████████████████████*/


P.Race = {};


P.Race.append = P.or;


P.Race.prepend = P.or;


/*
█████ Semigroup :: Monoid (race) ██████████████████████████████████████████████*/


P.Race.empty = P(k => null);


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


/* The type doesn't implement monad, hence some combinators for monad-like
behavior. */


P.flatmap = mx => fm =>
  P(k => mx.run(x => fm(x).run(k)));


P.flatten = mmx =>
  P(k => mmx.run(mx => mx.run(k)));


P.once = tx => {
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

  return S(k);
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


P.allArr = P.allArr();


P.anyArr = P.anyArr();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ PARALLEL :: EXCEPT ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Parallel` extended to asynchronous exceptions. A similar behavior can be
achieved by using `Parallel` as a monad transformer and handling exceptions
inside the `run` method (the impure shell) using the `Except` type. */


export const ParallelExcept = ks => ({
  [TAG]: "Parallel.Except",
  run: ks,

  runAsync: o => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => ks(o));

    else ks(o);
  }
});


export const Pex = ParallelExcept; // shortcut


// TODO


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ PARSER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/

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


/*
█████ Character Classes ███████████████████████████████████████████████████████*/


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


/*
█████ Combinator ██████████████████████████████████████████████████████████████*/


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
      error: o => Loop3.base(Parser.Result.Some({res: acc, rest: o.rest, state: o.state})),
      some: p => Loop3.rec(f(p.res) (acc), p.rest, p.state),
      none: q => Loop3.rec(acc, q.rest, q.state)
    }));
  }) (init, rest, state);
});


Parser.takeWhile1 = f => init => parser => Parser(rest => state => {
  return parser(rest2) (state2).map(tx => tx.run({
    error: o => Parser.Result.Some({res: init, rest: o.rest, state: o.state}),
    
    some: p => {
      return Loop3((acc, rest2, state2) => {
        return parser(rest2) (state2).map(tx => tx.run({
          error: o2 => Loop3.base(Parser.Result.Some({res: acc, rest: o2.rest, state: o2.state})),
          some: p2 => Loop3.rec(f(p2.res) (acc), p2.rest, p2.state),
          none: q2 => Loop3.rec(acc, q2.rest, q2.state)
        }));
      }) (f(p.res) (init), p.rest, p.state);
    },

    none: q => {
      return Loop3((acc, rest2, state2) => {
        return parser(rest2) (state2).map(tx => tx.run({
          error: o2 => Loop3.base(Parser.Result.Some({res: acc, rest: o2.rest, state: o2.state})),
          some: p2 => Loop3.rec(f(p2.res) (acc), p2.rest, p2.state),
          none: q2 => Loop3.rec(acc, q2.rest, q2.state)
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
      error: o => Loop2.base(Parser.Result.None({rest: o.rest, state: o.state})),
      some: p => Loop2.rec(p.rest, p.state),
      none: q => Loop2.rec(q.rest, q.state)
    }));
  }) (rest, state);
});


Parser.dropUntil = parser => Parser(rest => state => {
  return Loop2((rest2, state2) => {
    return parser(rest2) (state2).map(tx => tx.run({
      error: o => Loop2.rec(o.rest, o.state),
      some: p => Loop2.base(Parser.Result.None({rest: p.rest, state: p.state})),
      none: q => Loop2.base(Parser.Result.None({rest: p.rest, state: p.state}))
    }));
  }) (rest, state);
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ SERIAL ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes asynchronous I/O computations evaluated in serial. Use `Serial` for
  parallel evaluation. Use `Cont` to encode synchronous I/O effects.

  It has the following properties:

  * asynchronous, serial evaluation
  * pure core/impure shell concept
  * lazy by deferred nested function call stacks
  * non-reliable return values
  * stack-safe due to asynchronous calls */


export const Serial = k => ({
  [TAG]: "Serial",
  run: k,

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => k(f));

    else k(f);
  }
});


export const S = Serial; // shortcut


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


S.and = tx => ty =>
  S(k =>
    tx.run(x =>
      ty.run(y =>
        k(Pair(x, y)))));


S.allArr = () =>
  A.seqA({
    map: S.map,
    ap: S.ap,
    of: S.of});


// TODO: S.allList


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


S.map = f => tx =>
  S(k => tx.run(x => k(f(x))));


S.Functor = {map: S.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


S.ap = tf => tx =>
  S(k =>
    S.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


S.Apply = {
  ...S.Functor,
  ap: S.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


S.of = x => S(k => k(x));


S.Applicative = {
  ...S.Apply,
  of: S.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


S.chain = mx => fm =>
  S(k => mx.run(x => fm(x).run(k)));


S.Chain = {
  ...S.Apply,
  chain: S.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


S.Monad = {
  ...S.Applicative,
  chain: S.chain
};


/*
█████ Natural Transformations █████████████████████████████████████████████████*/


/* Values of type Parallel/Serial are structurally equal but differ in their
logical conjunctions/disjunctions. Hence, natural transformations are merely
documenting for improved comprehensibility. */


S.fromParallel = tx => ({
  [TAG]: "Serial",
  run: tx.run,
  runAsync: tx.runAsync
});


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


S.append = ({append}) => tx => ty =>
  S(k => S.and(tx) (ty)
    .run(([x, y]) => k(append(x) (y))));


S.prepend = S.append;


S.Semigroup = {
  append: S.append,
  prepend: S.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


S.empty = empty => S(k => k(empty));


S.Monoid = {
  ...S.Semigroup,
  empty: S.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


S.once = tx => {
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

  return S(k);
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


S.allArr = S.allArr();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ SERIAL :: EXCEPT ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Serail` extended to asynchronous exceptions. A similar behavior can be
achieved by using `Serial` as a monad transformer and handling exceptions
inside the `run` method (the impure shell) using the `Except` type. */


export const SerialExcept = ks => ({
  [TAG]: "Serial.Except",
  run: ks,

  runAsync: o => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_TRESHOLD)
      Promise.resolve(null).then(_ => ks(o));

    else ks(o);
  }
});


export const Sex = SerialExcept; // shortcut


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


Sex.and = tx => ty =>
  Sex(({raise: k, proceed: k2}) =>
    tx.run({
      raise: k,
      proceed: x =>
        ty.run({
          raise: k,
          proceed: y => k2(Pair(x, y))
        })
    }));


Sex.allArr = () =>
  A.seqA({
    map: Sex.map,
    ap: Sex.ap,
    of: Sex.of});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Sex.map = f => tx =>
  Sex(({raise: k, proceed: k2}) =>
    tx.run({
      raise: k,
      proceed: x => k2(f(x))
    }));


Sex.Functor = {map: Sex.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Sex.ap = tf => tx =>
  Sex(({raise: k, proceed: k2}) =>
    Sex.and(tf) (tx)
      .run({
        raise: k,
        proceed: ([f, x]) => k(f(x))
      }));


Sex.Apply = {
  ...Sex.Functor,
  ap: Sex.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Sex.of = x => Sex(({raise: k, proceed: k2}) => k2(x));


Sex.Applicative = {
  ...Sex.Apply,
  of: Sex.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Sex.chain = mx => fm =>
  Sex(({raise: k, proceed: k2}) =>
    mx.run({
      raise: k,
      proceed: x => fm(x).run(k2)
    }));


Sex.Chain = {
  ...Sex.Apply,
  chain: Sex.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Sex.Monad = {
  ...Sex.Applicative,
  chain: Sex.chain
};


/*
█████ Natural Transformations █████████████████████████████████████████████████*/


// TODO: fromParallel/toParallel


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Sex.append = ({append}) => tx => ty =>
  Sex(({raise: k, proceed: k2}) =>
    Sex.and(tx) (ty).run({
      raise: k,
      proceed: ([x, y]) => k(append(x) (y))
    }));


Sex.prepend = Sex.append;


Sex.Semigroup = {
  append: Sex.append,
  prepend: Sex.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Sex.empty = empty => Sex(({raise: k, proceed: k2}) => k2(empty));


Sex.Monoid = {
  ...Sex.Semigroup,
  empty: Sex.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Sex.once = tx => {
  let x = lazy(() => {
    throw new TypeError("race condition detected");
  });

  let done = false;

  const ks = {
    raise: id, // don't memoize exception case

    proceed: f => {
      if (done) {
        f(x);
        return ks;
      }

      else {
        tx.run({
          raise: y => {
            x = y; f(y);
            return ks;
          },

          proceed: z => {
            x = z; f(z);
            return ks;
          }
        });

        done = true; // sync
        return ks;
      }
    }
  };

  return Sex(ks);
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Sex.allArr = Sex.allArr();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const _Set = {}; // namespace


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


_Set.has = k => s => s.has(k);


_Set.set = k => s => s.add(k);


_Set.del = k => s => s.delete(k);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STREAM ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes the concept of supplying a meaningful chunk of data synchronously
one at a time from a potentially infinite source along with a function to
request the next chunk. The type uses a lazy object getter to  suspend the
process. It has the following properties:

  * unicast
  * sync
  * pull
  * lazy
  * cancelable (pull)

Use `Observable` for asynchronous event streams and `Behavior` for asynchronous
time chaging values. */


export const Stream = {}; // namespace


// value constructors


Stream.Step = x => f => ({
  [TAG]: "Stream",

  run: ({step}) => step({
    yield: x,
    get next() {return f(x)}
  })
});


Stream.Done = ({
  [TAG]: "Stream",
  run: ({done}) => done
});


Stream.Step.lazy = o => ({
  [TAG]: "Stream",
  run: ({step}) => step(o)
});


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Stream.fromArr = xs => function go(i) {
  if (i === xs.length) return Stream.Done;
  else return Stream.Step(xs[i]) (_ => go(i + 1));
} (0);


Stream.takeArr = n => tx => function go(acc, ty, m) {
  if (m <= 0) return acc;

  else {
    return ty.run({
      step: o => {
        acc.push(o.yield)
        return go(acc, o.next, m - 1);
      },
      
      done: acc
    });
  }
} ([], tx, n);


// TODO: Stream.takeList


Stream.toArr = tx => Loop2((ty, acc) => {
  ty.run({
    step: o => {
      acc.push(o.yield);
      return Loop2.rec(o.next);
    },

    done: Loop2.base(acc)
  });
}) (tx, []);


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


Stream.foldl = f => init => tx => function go(ty, acc) {
  return ty.run({
    step: o => {
      acc = f(acc) (o.yield);

      Stream.Step.lazy({
        yield: acc,
        get next() {return go(o.next, acc)}
      })
    },

    done: acc
  });
} (tx, init);


Stream.foldr = f => init => tx => function go(ty, acc) {
  return ty.run({
    step: o => {
      acc = f(o.yield) (acc);

      Stream.Step.lazy({
        yield: acc,
        get next() {return go(o.next, acc)}
      })
    },

    done: acc
  });
} (tx, init);


Stream.Foldable = {
  foldl: Stream.foldl,
  foldr: Stream.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


Stream.mapA = ({map, of}) => ft => function go(tx) {
  return tx.run({
    step: o => map(x => Stream.Step.lazy({
      yield: x,
      get next() {return go(o.next)}
    }) (ft(o.yield))),

    done: of(Stream.Done)
  });
};


Stream.seqA = ({map, of}) => function go(ttx) {
  return ttx.run({
    step: tx => map(o => Stream.Step.lazy({
      yield: o.yield,
      get next() {return go(o.next)}
    })) (tx),

    done: of(Stream.Done)
  });
};


Stream.Traversable = () => ({
  ...Stream.Foldable,
  ...Stream.Functor,
  mapA: Stream.mapA,
  seqA: Stream.seqA
});


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


/* If the data source is infinite the combinator can lead to infinite recursion
provided no data chunk satisfies the predicate. */

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

    done: Stream.Done
  });
};


Stream.Filterable = {filter: Stream.filter};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Stream.map = f => function go(tx) {
  return tx.run({
    step: o => Stream.Step.lazy({
      yield: f(o.yield),
      get next() {return go(o.next)}
    }),

    done: Stream.Done
  });
};


Stream.Functor = {map: Stream.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


/* Takes two streams and exhauts the first and then the second one directly one
after the other. This is the way the traversable list instance  works. */

Stream.alt = tx => ty => function go(tz, done_) {
  return tz.run({
    step: o => Stream.Step.lazy({
      yield: o.yield,
      get next() {return go(o.next, done_)}
    }),

    get done() {
      if (done_) return Stream.Done; 

      else return Stream.Step.lazy({
        yield: p.yield,
        get next() {return go(ty, true)}
      });
    }
  });
} (tx, false);


A.Alt = {
  ...A.Functor,
  alt: A.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Stream.zero = Stream.Done;


Stream.Plus = {
  ...Stream.Alt,
  zero: Stream.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


/* Takes two streams one yielding partially applied functions and another
yielding values and applies the function to the value. Both streams don't need
to have the same length, even though this may lead to information loss. */

Stream.ap = ft => tx => function go(gt, ty) {
  return gt.run({
    step: o => ty.run({
      step: o2 => Stream.Step.lazy({
        yield: o.yield(o2.yield),
        get next() {return go(o.next, o2.next)}
      }),

      done: Stream.Done
    }),

    done: Stream.Done
  }) (ft, tx);
};


Stream.Apply = {
  ...Stream.Functor,
  ap: Stream.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Stream.of = x => Stream.Step.lazy({ // infinite stream
  yield: x,
  get next() {return Stream.of(x)}
});


Stream.Applicative = {
  ...Stream.Apply,
  of: Stream.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* For each iteration, creates a new stream by applying `fm` with the current
element of the original stream. Then yields its elements until the new stream
is exhausted and starts a new iteration until the original stream is exhausted
as well. */

Stream.chain = fm => function go(mx) {
  return mx.run({
    step: o => {
      const my = fm(o.yield);

      my.run({
        step: o2 => Stream.Step.lazy({
          yield: o2.yield,
          get next() {return go(o2.next)}
        }),

        get done() {return go(o.next)}
      });
    },

    done: Stream.Done
  });
};


Stream.Chain = {
  ...Stream.Apply,
  chain: Stream.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Stream.Monad = {
  ...Stream.Applicative,
  chain: Stream.chain
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// TODO: head of the stream


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// TODO: f applied to each tail of the stream (i.e. stream.next)


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Stream.append = ({append}) => tx => ty => function go(tx2, ty2) {
  return tx2.run({
    step: o => ty2.run({
      step: o2 => Stream.Step.lazy({
        yield: append(o.yield) (o2.yield),
        get next() {return go(o.next, o2.next)}
      }),
      
      get done() {
        return Stream.Step.lazy({
          yield: o.yield,
          get next() {return go(o.next, Stream.Done)}
        });
      }
    }),

    get done() {
      return ty2.run({
        step: o2 => Stream.Step.lazy({
          yield: o2.yield,
          get next() {return go(Stream.Done, o2.next)}
        }),
        
        done: Stream.Done
      });
    }
  });
} (tx, ty);


Stream.Semigroup = {
  append: Stream.append,
  prepend: Stream.prepend
};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Stream.empty = Stream.Nis;


Stream.Monoid = {
  ...Stream.Semigroup,
  empty: Stream.empty
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Str = {}; // namespace


Str.NORMALIZER = {

  // map all letters derived from the latin alphabet to their ASCII representation

  get derivedLetters() {
    return new Map([
      ["Æ", "AE"], ["æ", "ae"], ["Œ", "OE"], ["œ", "oe"], ["ẞ", "ss"], ["Ⱥ", "A"], ["ⱥ", "a"], ["Ɑ", "A"], ["ɑ", "a"], ["ɐ", "a"],
      ["ɒ", "a"], ["Ƀ", "B"], ["ƀ", "b"], ["Ɓ", "B"], ["ɓ", "b"], ["Ƃ", "b"], ["ƃ", "b"], ["ᵬ", "b"], ["ᶀ", "b"], ["Ƈ", "C"],
      ["ƈ", "c"], ["Ȼ", "C"], ["ȼ", "c"], ["Ɗ", "D"], ["ɗ", "d"], ["Ƌ", "D"], ["ƌ", "d"], ["ƍ", "d"], ["Đ", "D"], ["đ", "d"],
      ["ɖ", "d"], ["ð", "d"], ["Ɇ", "E"], ["ɇ", "e"], ["ɛ", "e"], ["ɜ", "e"], ["ə", "e"], ["Ɠ", "G"], ["ɠ", "g"], ["Ǥ", "G"],
      ["ǥ", "g"], ["ᵹ", "g"], ["Ħ", "H"], ["ħ", "h"], ["Ƕ", "H"], ["ƕ", "h"], ["Ⱨ", "H"], ["ⱨ", "h"], ["ɥ", "h"], ["ɦ", "h"],
      ["ı", "i"], ["Ɩ", "I"], ["ɩ", "i"], ["Ɨ", "I"], ["ɨ", "i"], ["Ɉ", "J"], ["ɉ", "j"], ["ĸ", "k"], ["Ƙ", "K"], ["ƙ", "k"],
      ["Ⱪ", "K"], ["ⱪ", "k"], ["Ł", "L"], ["ł", "l"], ["Ƚ", "L"], ["ƚ", "l"], ["ƛ", "l"], ["ȴ", "l"], ["Ⱡ", "L"], ["ⱡ", "l"],
      ["Ɫ", "L"], ["ɫ", "l"], ["Ľ", "L"], ["ľ", "l"], ["Ɯ", "M"], ["ɯ", "m"], ["ɱ", "m"], ["Ŋ", "N"], ["ŋ", "n"], ["Ɲ", "N"],
      ["ɲ", "n"], ["Ƞ", "N"], ["ƞ", "n"], ["Ø", "O"], ["ø", "o"], ["Ɔ", "O"], ["ɔ", "o"], ["Ɵ", "O"], ["ɵ", "o"], ["Ƥ", "P"],
      ["ƥ", "p"], ["Ᵽ", "P"], ["ᵽ", "p"], ["ĸ", "q"], ["Ɋ", "Q"], ["ɋ", "q"], ["Ƣ", "Q"], ["ƣ", "q"], ["Ʀ", "R"], ["ʀ", "r"],
      ["Ɍ", "R"], ["ɍ", "r"], ["Ɽ", "R"], ["ɽ", "r"], ["Ƨ", "S"], ["ƨ", "s"], ["ȿ", "s"], ["ʂ", "s"], ["ᵴ", "s"], ["ᶊ", "s"],
      ["Ŧ", "T"], ["ŧ", "t"], ["ƫ", "t"], ["Ƭ", "T"], ["ƭ", "t"], ["Ʈ", "T"], ["ʈ", "t"], ["Ʉ", "U"], ["ʉ", "u"], ["Ʋ", "V"],
      ["ʋ", "v"], ["Ʌ", "V"], ["ʌ", "v"], ["ⱴ", "v"], ["ⱱ", "v"], ["Ⱳ", "W"], ["ⱳ", "w"], ["Ƴ", "Y"], ["ƴ", "y"], ["Ɏ", "Y"],
      ["ɏ", "y"], ["ɤ", "Y"], ["Ƶ", "Z"], ["ƶ", "z"], ["Ȥ", "Z"], ["ȥ", "z"], ["ɀ", "z"], ["Ⱬ", "Z"], ["ⱬ", "z"], ["Ʒ", "Z"],
      ["ʒ", "z"], ["Ƹ", "Z"], ["ƹ", "z"], ["Ʒ", "Z"], ["ʒ", "z"]
    ]);
  }
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THESE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes a fundamental sum type - logical and/or - (A & B) || A || B


export const These = {}; // namespace


// value constructors


These.This = x => ({
  [TAG]: "These",
  run: ({this: _this}) => _this(x)
});


These.That = y => ({
  [TAG]: "These",
  run: ({that}) => that(y)
});


These.Both = x => y => ({
  [TAG]: "These",
  run: ({both}) => both(x) (y)
});


These.cata = _this => that => both => tx => tx.run({ // elimination rule
  this: _this,
  that,
  both
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


These.map = f => tx => tx.run({
  this: These.This,
  that: y => These.That(f(y)),
  both: x => y => These.Both(x) (f(y))
});


These.Functor = {map: These.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


These.ap = ({append}) => tf => tx => tf.run({
  this: These.This,

  that: f => tx.run({
    this: These.This,
    that: y => These.That(f(y)),
    both: x => y => These.Both(x) (f(y))
  }),

  both: x => f => tx.run({
    this: x2 => These.This(append(x) (x2)),
    that: y => These.Both(x) (f(y)),
    both: x2 => y => These.Both(append(x) (x2)) (f(y))
  })
});


These.Apply = {
  ...These.Functor,
  ap: These.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


These.of = These.That;


These.Applicative = {
  ...These.Apply,
  of: These.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


These.chain = ({append}) => mx => fm => mx.run({
  this: These.This,
  that: y => fm(y),

  both: x => y => fm(y).run({
    this: x2 => These.This(append(x) (x2)),
    that: y2 => These.Both(x) (y2),
    both: x2 => y2 => These.Both(append(x) (x2)) (y2)
  })
});


These.Chain = {
  ...These.Apply,
  chain: These.chain
};


/*
█████ Functor :: Applicative :: Monad █████████████████████████████████████████*/


These.Monad = {
  ...These.Applicative,
  chain: These.chain
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TREE (N-ARY) █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


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


/* The elimination rule of the type (see `Either.cata` for full explanation).
The catamorphism is recursively encoded because the depth of a balanced tree
should regularly not exhaust the call stack. Usually the combinator would be
defined as an imperative loop. */

Tree.cata = node => function go({x, branch}) {
  return node(x) (branch.map(go));
};


/*
█████ Foladable ███████████████████████████████████████████████████████████████*/


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


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Tree.map = f => Tree.cata(x => xs => Tree.Node(f(x)) (xs));


/*
█████ Induction ███████████████████████████████████████████████████████████████*/


Tree.height = Tree.foldi(acc => (x, {depth}) => acc < depth ? depth : acc) (0);


// alternative implementation using the tree catamorphism

Tree.height_ = function (foldMax_) {
  return Tree.cata(_ => branch => 1 + foldMax_(branch))
} (foldMax({foldl1: A.foldl1}, {max}));


Tree.levels = Tree.foldi(acc => (x, {depth}) => {
  if (!(depth in acc)) acc[depth] = [];
  return (acc[depth].push(x), acc);
}) ([]);


Tree.paths = tx => {
  const {x, branch: xs} = tx;

  if (xs.length === 0) return [[x]];

  else return A.map(A.unshift(x))
    (foldMapl(
      {fold: A.foldl},
      {append: A.append, empty: []})
        (treePaths) (xs));
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Tree.linearize = Tree.cata(x => xss => {
  const xs = [x];
  xs.push.apply(xs, xss);
  return xs;
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TUPLE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the most fundamental product type


export const Tuple = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TUPLE :: PAIR ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


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


/*
█████ Extracting ██████████████████████████████████████████████████████████████*/


Pair.fst = tx => tx[1];


Pair.snd = tx => tx[2];


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


Pair.foldl = f => acc => tx => f(acc) (tx);


Pair.foldr = f => acc => tx => f(tx) (acc);


Pair.Foldable = {
  foldl: Pair.foldl,
  foldr: Pair.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Pair.map = f => ({1: x, 2: y}) => Pair(x, f(y));


Pair.Functor = {map: Pair.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Pair.ap = ({append}) => ({1: x, 2: f}) => ({1: y, 2: z}) =>
  Pair(append(x) (y), f(z));


Pair.Apply = {
  ...Pair.Functor,
  ap: Pair.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Pair.of = ({empty}) => x => Pair(empty, x);


Pair.Applicative = {
  ...Pair.Apply,
  of: Pair.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Pair.chain = ({append}) => fm => ({1: x, 2: y}) => {
  const {1: x2, 2: y2} = fm(y);
  return Pair(append(x) (x2), y2);
};


Pair.Chain = {
  ...Pair.Apply,
  chain: Pair.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Pair.Monad = {
  ...Pair.Applicative,
  chain: Pair.chain
};


/*
█████ Functor :: Bifunctor ████████████████████████████████████████████████████*/


/* bimap/dimap comparison:

  bimap :: (a -> b) -> (c -> d) -> bifunctor  a c -> bifunctor  b d
            ^^^^^^
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d
            ^^^^^^                                                  */


Pair.bimap = f => g => tx => Pair(f(tx[1]), g(tx[2]));


Pair.Bifunctor = ({
  ...Pair.Functor,
  bimap: Pair.bimap
});


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


Pair.extend = fw => wx => Pair(wx[1], fw(wx));


Pair.Extend = {
  ...Pair.Functor,
  extend: Pair.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


Pair.extract = Pair.snd;


Pair.Comonad = {
  ...Pair.Extend,
  extract: Pair.extract
};


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


Pair.setFst = x => tx => Pair(x, tx[2]);


Pair.setSnd = x => tx => Pair(tx[1], x);


/*
█████ Writer ██████████████████████████████████████████████████████████████████*/


Pair.censor = f => tx => Pair(tx[0], f(tx[1]));


Pair.listen = tx => Pair(Pair(tx[0], tx[1]), tx[1]);


Pair.listens = f => tx => Pair(Pair(tx[0], f(tx[1])), tx[1]);


Pair.pass = f => tx => Pair(tx[0] [0], tx[0] [1] (tx[1]));


Pair.tell = x => Pair(null, x);


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Pair.mapFst = f => tx => Tuple(k => tx.run((x, y) => Pair(f(x), y)));


Pair.swap = tx => Pair(tx[1], tx[0]);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████ TUPLE :: PAIR :: TRANSFORMER █████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (a, b)


Pair.T = outer => thisify(o => { // outer monad's type classes

  // TODO
  
  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ YONEDA ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes dynamic function composition within a functor. Useful in cases when
the composition cannot be defined manually upfront but only at runtime. */


export const Yoneda = k => ({
  [TAG]: "Yoneda",
  run: k
});


export const Yo = Yoneda; // shortcut


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Yo.map = f => tx => Yo(g => tx.run(comp(g) (f)));


Yo.Functor = {map: Yo.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Yo.ap = ({ap}) => tf => tx => Yo(f => ap(tf.run(comp(f))) (tx.run(id)));


Yo.Apply = {
  ...Yo.Functor,
  ap: Yo.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Yo.of = ({of}) => x => Yo(f => of(f(x)));


Yo.Applicative = {
  ...Yo.Apply,
  of: Yo.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Yo.chain = ({chain}) => mx => fm =>
  Yo(f => chain(mx.run(id)) (x => fm(x).run(f)));
    

Yo.Chain = {
  ...Yo.Apply,
  chain: Yo.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Yo.Monad = {
  ...Yo.Applicative,
  chain: Yo.chain
};


/*
█████ Lift/Unlift █████████████████████████████████████████████████████████████*/


Yo.lift = ({map}) => tx => Yo(f => map(f) (tx));


Yo.lower = tx => tx.run(id);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ IO ██████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ FILE SYSTEM █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* The library avoids the node.js file system dependency by encoding it as a
parameter. The file system can be accessed within a continuation monad using
different encodings that yield oposing semantics:

  * error throwing vs. exeption handling
  * serial vs. parallel processing

The first choice has to be made by picking the respective object in the
`FileSys` namespace. The second one depends on the passed `cons` constructor. */


export const FileSys = {}; // namespace


FileSys.error = fs => cons => thisify(o => {
  o.copy = src => dest =>
    cons(k =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e =>
        e ? _throw(new TypeError(e)) : k(Pair(src, dest))));


  o.move = src => dest =>
    cons.and(
      o.copy(src) (dest))
        (o.unlink(src));


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


FileSys.except = fs => cons => thisify(o => {
  o.copy = src => dest =>
    cons(({raise: k, proceed: k2}) =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e =>
        e ? k(new TypeError(e)) : k2(Pair(src, dest))));


  o.move = src => dest =>
    cons.and(
      o.copy(src) (dest))
        (o.unlink(src));


  o.read = opt => path =>
    cons(({raise: k, proceed: k2}) =>
      fs.readFile(path, opt, (e, x) =>
        e ? k(new TypeError(e)) : k2(x)));


  o.scanDir = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.readdir(path, (e, xs) =>
        e ? k(new TypeError(e)) : k2(xs)));


  o.stat = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.stat(path, (e, o) =>
        e ? k(new TypeError(e)) : k2(o)));


  o.unlink = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.unlink(path, e =>
        e ? k(new TypeError(e)) : k2(path)));


  o.write = opt => path => s =>
    cons(({raise: k, proceed: k2}) =>
      fs.writeFile(path, s, opt, e =>
        e ? k(new TypeError(e)) : k2(s)));


  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████ PERSISTANT DATA STRUCTURES ██████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// self-balancing red/black tree to construct persistent data structures


const RB = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


RB.RED = true;
RB.BLACK = false;


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ CONSTRUCTORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


RB.Leaf = {[Symbol.toStringTag]: "Leaf"};


RB.Node = (c, h, l, k, v, r) =>
  ({[Symbol.toStringTag]: "Node", c, h, l, k, v, r});


RB.singleton = (k, v) =>
  RB.Node(RB.BLACK, 1, RB.Leaf, k, v, RB.Leaf);


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ BALANCING ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


RB.balanceL = (c, h, l, k, v, r) => {
  if (c === RB.BLACK
    && l[TAG] === "Node"
    && l.c ===RB.RED
    && l.l[TAG] === "Node"
    && l.l.c === RB.RED)
      return RB.Node(
        RB.RED, h + 1, RB.turnB(l.l), l.k, l.v, RB.Node(RB.BLACK, h, l.r, k, v, r));

  else return RB.Node(c, h, l, k, v, r);
};


RB.balanceR = (c, h, l, k, v, r) => {
  if (c === RB.BLACK
    && l[TAG] === "Node"
    && r[TAG] === "Node"
    && l.c === RB.RED
    && r.c === RB.RED)
      return RB.Node(
        RB.RED, h + 1, RB.turnB(l), k, v, RB.turnB(r));

  else if (r[TAG] === "Node"
    && r.c === RB.RED)
      return RB.Node(
        c, h, RB.Node(RB.RED, r.h, l, k, v, r.l), r.k, r.v, r.r);

  else return RB.Node(c, h, l, k, v, r);
};


RB.isBLB = t =>
  t[TAG] === "Node"
    && t.c === RB.BLACK
    && (t.l[TAG] === "Leaf" || t.l.c === RB.BLACK)
      ? true : false;


RB.isBLR = t =>
  t[TAG] === "Node"
    && t.c === RB.BLACK
    && t.l[TAG] === "Node"
    && t.l.c === RB.RED
      ? true : false;


RB.rotateR = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === RB.RED)
      return RB.balanceR(
        t.c, t.h, t.l.l, t.l.k, t.l.v, RB.delMax_(RB.Node(RB.RED, t.h, t.l.r, t.k, t.v, t.r)));

  else throw new TypeError("unexpected branch");
};


RB.turnR = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return RB.Node(
    RB.RED, h, l, k, v, r);
};


RB.turnB = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return RB.Node(
    RB.BLACK, h, l, k, v, r);
};


RB.turnB_ = t => {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;
    case "Node": return RB.Node(RB.BLACK, t.h, t.l, t.k, t.v, t.r);
    default: throw new TypeError("invalid value constructor");
  }
}


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ API █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


RB.cata = node => leaf => function go(t) {
  return k => {
    switch (t[TAG]) {
      case "Leaf": return k(leaf);
      
      case "Node": return go(t.l) (t2 =>
        go(t.r) (t3 =>
          k(node([t.k, t.v]) (t2) (t3))));

      default: throw new TypeError("invalid constructor");
    }
  }
};


RB.cata_ = node => leaf => function go(t) { // lazy version
  switch (t[TAG]) {
    case "Leaf": return leaf;
    
    case "Node": return node([t.k, t.v])
      (lazy(() => go(t.l)))
        (lazy(() => go(t.r)));

    default: throw new TypeError("invalid constructor");
  }
};


/*
█████ Deletion ████████████████████████████████████████████████████████████████*/


RB.del = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;
    
    case "Node": {
      const t2 = RB.del_(RB.turnR(t), k, cmp);

      switch (t2[TAG]) {
        case "Leaf": return RB.Leaf;
        case "Node": return RB.turnB(t2);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RB.delLT = (k, c, h, l, k2, v2, r, cmp) => {
  if (c === RB.RED
    && RB.isBLB(l)
    && RB.isBLR(r))
      return RB.Node(
        RB.RED,
        h,
        RB.Node(RB.BLACK, r.h, RB.del_(RB.turnR(l), k, cmp), k2, v2, r.l.l),
        r.l.k,
        r.l.v,
        RB.Node(RB.BLACK, r.h, r.l.r, r.k, r.v, r.r));

  else if (c === RB.RED
    && RB.isBLB(l))
      return RB.balanceR(
        RB.BLACK, h - 1, RB.del_(tunrR(l), k, cmp), k2, v2, RB.turnR(r));

  else return RB.Node(c, h, RB.del_(l, k, cmp), k2, v2, r);
};


RB.delEQ = (k, c, h, l, k2, v2, r, cmp) => {
  if (c === RB.RED
    && l[TAG] === "Leaf"
    && r[TAG] === "Leaf")
      return RB.Leaf;

  else if (l[TAG] === "Node"
    && l.c === RB.RED)
      return RB.balanceR(
        c, h, l.l, l.k, l.v, RB.del_(RB.Node(RB.RED, h, l.r, k2, v2, r), k, cmp));

  else if (c === RB.RED
    && RB.isBLB(r)
    && RB.isBLR(l))
      return RB.balanceR(
        RB.RED,
        h,
        RB.turnB(l.l),
        l.k,
        l.v,
        RB.balanceR(RB.BLACK, l.h, l.r, ...RB.min(r), RB.delMin_(RB.turnR(r))));

  else if (c === RB.RED
    && RB.isBLB(r))
      return RB.balanceR(RB.BLACK, h - 1, RB.turnR(l), ...RB.min(r), RB.delMin_(RB.turnR(r)));

  else if (c === RB.RED
    && r[TAG] === "Node"
    && r.c === RB.BLACK)
      return RB.Node(
        RB.RED, h, l, ...RB.min(r), RB.Node(RB.BLACK, r.h, RB.delMin_(r.l), r.k, r.v, r.r));

  else throw new TypeError("unexpected branch");
};


RB.delGT = (k, c, h, l, k2, v2, r, cmp) => {
  if (l[TAG] === "Node"
    && l.c === RB.RED)
      return RB.balanceR(
        c, h, l.l, l.k, l.v, RB.del_(RB.Node(RB.RED, h, l.r, k2, v2, r)), k, cmp);

  else if (c === RB.RED
    && RB.isBLB(r)
    && RB.isBLR(l))
      return RB.Node(
        RB.RED,
        h,
        RB.turnB(l.l),
        l.k,
        l.v,
        RB.balanceR(RB.BLACK, l.h, l.r, k2, v2, RB.del_(RB.turnR(r), k, cmp)));

  else if (c === RB.RED
    && RB.isBLB(r))
      return RB.balanceR(
        RB.BLACK, h - 1, RB.turnR(l), k2, v2, RB.del_(RB.turnR(r), k, cmp));

  else if (c === RB.RED)
    return RB.Node(RB.RED, h, l, k2, v2, RB.del_(r, k, cmp));

  else throw new TypeError("unexpected branch");
};


RB.delMin = t =>{
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;

    case "Node": {
      const t2 = RB.delMin_(RB.turnR(t));

      switch (t2[TAG]) {
        case "Leaf": return RB.Leaf;
        case "Node": return RB.turnB(t2);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RB.delMax = t => {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;

    case "Node": {
      const t2 = RB.delMax_(RB.turnR(t));

      switch (t2[TAG]) {
        case "Leaf": return RB.Leaf;
        case "Node": return RB.turnB(t2);
        default: TypeError("invalid value constructor");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


// helper


RB.del_ = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RB.delLT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case EQ: return RB.delEQ(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case GT: return RB.delGT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RB.delMin_ = t => {
  if (t[TAG] === "Node"
    && t.c === RB.RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return RB.Leaf;

  else if (t[TAG] === "Node"
    && t.c === RB.RED)
      return RB.Node(RB.RED, t.h, RB.delMin_(t.l), t.k, t.v, t.r);

  else if (t[TAG] === "Node"
    && RB.isBLB(t.l)
    && RB.isBLR(t.r))
      return RB.delMin__(t);

  else if (t[TAG] === "Node"
    && RB.isBLB((t.l)))
      return RB.balanceR(
        RB.BLACK, t.h - 1, RB.delMin_(RB.turnR(t.l)), t.k, t.v, RB.turnR(t.r));

  else if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === RB.BLACK)
      return RB.Node(
        RB.RED, t.h, RB.Node(RB.BLACK, t.l.h, RB.delMin_(t.l.l), t.l.k, t.l.v, t.l.r), t.k, t.v, t.r);

  else throw new TypeError("unexpected branch");
};


RB.delMin__ = t => {
  if(t[TAG] === "Node"
    && t.c === RB.RED
    && t.r[TAG] === "Node"
    && t.r.c === RB.BLACK
    && t.r.l[TAG] === "Node"
    && t.r.l.c === RB.RED)
      return RB.Node(
        RB.RED,
        t.h,
        RB.Node(RB.BLACK, t.r.h, RB.delMin_(RB.turnR(t.l)), t.k, t.v, t.r.l.l),
        t.r.l.k,
        t.r.l.v,
        RB.Node( RB.BLACK, t.r.h, t.r.l.r, t.r.k, t.r.v, t.r.r));

  else throw new TypeError("unexpected branch");
};


RB.delMax_ = t => {
  if (t[TAG] === "Node"
    && t.c === RB.RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return RB.Leaf;

  else if (t[TAG] === "Node"
    && t.c === RB.RED
    && t.l[TAG] === "Node"
    && t.l.c === RB.RED)
      return RB.rotateR(t);

  else if (t[TAG] === "Node"
    && t.c === RB.RED
    && RB.isBLB(t.r)
    && RB.isBLR(t.l))
      return RB.delMax__(t);

  else if (t[TAG] === "Node"
    && t.c === RB.RED
    && RB.isBLB(t.r))
      return RB.balanceR(
        RB.BLACK, t.h - 1, RB.turnR(t.l), t.k, t.v, RB.delMax_(RB.turnR(t.r)));

  else if (t[TAG] === "Node"
    && t.c === RB.RED)
      return RB.Node(RB.RED, t.h, t.l, t.k, t.v, RB.rotateR(t.r));

  else throw new TypeError("unexpected branch");
};


RB.delMax__ = t => {
  if (t[TAG] === "Node"
    && t.c === RB.RED
    && t.l[TAG] === "Node"
    && t.l.c === RB.BLACK
    && t.l.l[TAG] === "Node"
    && t.l.l.c === RB.RED)
      return RB.Node(
        RB.RED, t.h, RB.turnB(t.l.l), t.l.k, t.l.v, RB.balanceR(RB.BLACK, t.l.h, t.l.r, t.k, t.v, RB.delMax_(RB.turnR(t.r))));

  else throw new TypeError("unexpected branch");
};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


RB.foldl = f => init => t => function go(acc, u) {
  switch (u[TAG]) {
    case "Leaf": return acc;
    
    case "Node": {
      const acc2 = go(acc, u.l);
      const acc3 = f(acc2) (u.v);
      return go(acc3, u.r);
    }

    default: throw new TypeError("invalid constructor");
  }
} (init, t);


RB.foldr = f => init => t => function go(acc, u) {
  switch (u[TAG]) {
    case "Leaf": return acc;
    
    case "Node": {
      const acc2 = lazy(() => go(acc, u.r));
      const acc3 = f(u.v) (acc2);
      return lazy(() => go(acc3, u.l));
    }

    default: throw new TypeError("invalid constructor");
  }
} (init, t);


RB.Foldable = {
  foldl: RB.foldl,
  foldr: RB.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


RB.map = f => function go(t) {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;
    
    case "Node": {
      return RB.Node(t.c, t.h, go(t.l), t.k, f(t.v), go(t.r));
    }

    default: throw new TypeError("invalid constructor");
  }
};


RB.Functor = {map: RB.map};


/*
█████ Getter ██████████████████████████████████████████████████████████████████*/


RB.get = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return undefined;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RB.get(t.l, k, cmp);
        case EQ: return t.v;
        case GT: return RB.get(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/*
█████ Member ██████████████████████████████████████████████████████████████████*/


RB.has = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return false;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RB.has(t.l, k, cmp);
        case EQ: return true;
        case GT: return RB.has(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/*
█████ Min/Max █████████████████████████████████████████████████████████████████*/


RB.min = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return RB.min(t.l);

  else throw new TypeError("unexpected Leaf");
};


RB.max = t => {
  if (t[TAG] === "Node"
    && t.r[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return RB.max(t.r);

  else throw new TypeError("unexpected Leaf");
};


/*
█████ Setter ██████████████████████████████████████████████████████████████████*/


RB.set = (t, k, v, cmp) =>
  RB.turnB(RB.set_(t, k, v, cmp));


// helper


RB.set_ = (t, k, v, cmp) => {
  switch (t[TAG]) {
    case "Leaf":
      return RB.Node(RB.RED, 1, RB.Leaf, k, v, RB.Leaf);

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RB.balanceL(
          t.c, t.h, RB.set_(t.l, k, v, cmp), t.k, t.v, t.r);

        case EQ: return RB.Node(t.c, t.h, t.l, k, v, t.r);

        case GT: return RB.balanceR(
          t.c, t.h, t.l, t.k, t.v, RB.set_(t.r, k, v, cmp));

        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/*
█████ SET OPERATIONS ██████████████████████████████████████████████████████████*/


RB.union = (t1, t2, cmp) => {
  if (t2[TAG] === "Leaf")
    return t1;

  else if (t1[TAG] === "Leaf")
    return RB.turnB_(t2);

  else {
    const [l, r] = RB.split(t1, t2.k, cmp);
    return RB.join(RB.union(l, t2.l, cmp), RB.union(r, t2.r, cmp), t2.k, t2.v, cmp);
  }
};


RB.intersect = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return RB.Leaf;

  else if (t2[TAG] === "Leaf")
    return RB.Leaf;

  else {
    const [l, r] = RB.split(t1, t2.k, cmp);

    if (RB.has(t1, t2.k, cmp))
      return RB.join(
        RB.intersect(l, t2.l, cmp), RB.intersect(r, t2.r, cmp), t2.k, t2.v, cmp);

    else return RB.merge(
      RB.intersect(l, t2.l, cmp), RB.intersect(r, t2.r, cmp), cmp);
  }
};


RB.diff = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return RB.Leaf;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    const [l, r] = RB.split(t1, t2.k, cmp);
    return RB.merge(RB.diff(l, t2.l, cmp), RB.diff(r, t2.r, cmp));
  }
};


// helper


RB.join = (t1, t2, k, v, cmp) => {
  if (t1[TAG] === "Leaf")
    return RB.set(t2, k, v, cmp);

  else if (t2[TAG] === "Leaf")
    return RB.set(t1, k, v, cmp);

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return RB.turnB(RB.joinLT(t1, t2, k, v, t1.h, cmp));
      case EQ: return RB.Node(RB.BLACK, t1.h + 1, t1, k, v, t2);
      case GT: return RB.turnB(RB.joinGT(t1, t2, k, v, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


RB.joinLT = (t1, t2, k, v, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RB.Node(RB.RED, t2.h + 1, t1, k, v, t2);

  else if (t2[TAG] === "Node")
    return RB.balanceL(t2.c, t2.h, RB.joinLT(t1, t2.l, k, v, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


RB.joinGT = (t1, t2, k, v, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RB.Node(RB.RED, t1.h + 1, t1, k, v, t2);

  else if (t1[TAG] === "Node")
    return RB.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RB.joinGT(t1.r, t2, k, v, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


RB.merge = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return t2;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return RB.turnB(RB.mergeLT(t1, t2, t1.h, cmp));
      case EQ: return RB.turnB(RB.mergeEQ(t1, t2, cmp));
      case GT: return RB.turnB(RB.mergeGT(t1, t2, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


RB.mergeLT = (t1, t2, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RB.mergeEQ(t1, t2, cmp);

  else if (t2[TAG] === "Node")
    return RB.balanceL(t2.c, t2.h, RB.mergeLT(t1, t2.l, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


RB.mergeEQ = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf"
    && t2[TAG] === "Leaf")
      return RB.Leaf;

  else if (t1[TAG] === "Node") {
    const t2_ = RB.delMin(t2),
      [k, v] = RB.min(t2);

    if (t1.h === t2_.h)
      return RB.Node(RB.RED, t1.h + 1, t1, k, v, t2_);

    else if (t1.l[TAG] === "Node"
      && t1.l.c === RB.RED)
        return RB.Node(
          RB.RED, t1.h + 1, RB.turnB(t1.l), t1.k, t1.v, RB.Node(RB.BLACK, t1.h, t1.r, k, v, t2_));

    else return RB.Node(
      RB.BLACK, t1.h, RB.turnR(t1), k, v, t2_);
  }

  else throw new TypeError("unexpected branch");
};


RB.mergeGT = (t1, t2, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RB.mergeEQ(t1, t2, cmp);

  else if (t1[TAG] === "Node")
    return RB.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RB.mergeGT(t1.r, t2, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


RB.split = (t, k, cmp) => {
  if (t[TAG] === "Leaf")
    return [RB.Leaf, RB.Leaf];

  else {
    switch (cmp(k, t.k)) {
      case LT: {
        const [lt, gt] = RB.split(t.l, k, cmp);
        return [lt, RB.join(gt, t.r, t.k, t.v, cmp)];
      }

      case EQ: return [RB.turnB_(t.l), t.r];

      case GT: {
        const [lt, gt] = RB.split(t.r, k, cmp);
        return [RB.join(t.l, lt, t.k, t.v, cmp), gt];
      }

      default: throw new TypeError("invalid comparator");
    }
  }
};


/*
█████ Traversal ███████████████████████████████████████████████████████████████*/


RB.preOrder = ({append, empty}) => f => t =>
  RB.cata(pair => l => r =>
    append(append(f(pair)) (l)) (r)) (empty) (t) (id);


RB.preOrder_ = ({append, empty}) => f => t => // lazy version
  RB.cata_(pair => l => r =>
    append(append(f(pair)) (l)) (r)) (empty) (t);


RB.inOrder = ({append, empty}) => f => t =>
  RB.cata(pair => l => r =>
    append(append(l) (f(pair))) (r)) (empty) (t) (id);


RB.inOrder_ = ({append, empty}) => f => t => // lazy version
  RB.cata_(pair => l => r =>
    append(append(l) (f(pair))) (r)) (empty) (t);


RB.postOrder = ({append, empty}) => f => t =>
  RB.cata(pair => l => r =>
    append(append(l) (r)) (f(pair))) (empty) (t) (id);


RB.postOrder_ = ({append, empty}) => f => t => // lazy version
  RB.cata_(pair => l => r =>
    append(append(l) (r)) (f(pair))) (empty) (t);


RB.levelOrder = f => init => t => function go(acc, i, ts) {
  if (i >= ts.length) return acc;
  else if (ts[i] [TAG] === "Leaf") return go(acc, i + 1, ts);
  
  else {
    ts.push(ts[i].l, ts[i].r);
    return go(f(acc) ([ts[i].k, ts[i].v]), i + 1, ts);
  }
} (init, 0, [t]);


RB.levelOrder_ = f => acc => t => function go(ts, i) { // lazy version
  if (i >= ts.length) return acc;
  else if (ts[i] [TAG] === "Leaf") return go(ts, i + 1);
  
  else {
    ts.push(ts[i].l, ts[i].r);
    return f([ts[i].k, ts[i].v]) (lazy(() => go(ts, i + 1)));
  }
} ([t], 0);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TODO █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/

/*

  * add Array Zip Applicative instance
  * add monad combinators
  * conceive async Stream
  * add foldl1/foldr1 to all container types
  * rename fold into cata for all non-container types
  * add cata for each sum type
  * add trampoline monad
  * study Haskell's STM

*/

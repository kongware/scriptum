/*
      ___           ___           ___                        ___          ___           ___           ___     
     /\  \         /\  \         /\  \          ___         /\  \        /\  \         /\__\         /\__\    
    /::\  \       /::\  \       /::\  \        /\  \       /::\  \       \:\  \       /:/  /        /::|  |   
   /:/\ \  \     /:/\:\  \     /:/\:\  \       \:\  \     /:/\:\  \       \:\  \     /:/  /        /:|:|  |   
  _\:\~\ \  \   /:/  \:\  \   /::\~\:\  \      /::\__\   /::\~\:\  \      /::\  \   /:/  /  ___   /:/|:|__|__ 
 /\ \:\ \ \__\ /:/__/ \:\__\ /:/\:\ \:\__\  __/:/\/__/  /:/\:\ \:\__\    /:/\:\__\ /:/__/  /\__\ /:/ |::::\__\
 \:\ \:\ \/__/ \:\  \  \/__/ \/_|::\/:/  / /\/:/  /    /:/  \:\/:/  /   /:/  \/__/ \:\  \ /:/  / \/__/~~/:/  /
  \:\ \:\__\    \:\  \          |:|::/  /  \::/__/    /:/  / \::/  /   /:/  /       \:\  /:/  /        /:/  / 
   \:\/:/  /     \:\  \         |:|\/__/    \:\__\   /:/  /   \/__/   /:/  /         \:\/:/  /        /:/  /  
    \::/  /       \:\__\        |:|  |       \/__/   \/__/            \/__/           \::/  /        /:/  /   
     \/__/         \/__/         \|__|                                                 \/__/         \/__/    
*/






/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const PREFIX = "$_"; // avoid property name collisions


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


export const TAG = Symbol.toStringTag;


const MICROTASK_CONTINGENCY = 0.01; // probability for next microtask


/*
█████ Order Protocol ██████████████████████████████████████████████████████████*/


// Javascript's order protocol but reference identity with a tagged object


export const LT = {
  [TAG]: "Ordering",
  run: -1,
  valueOf: () => -1,
  toString: () => "-1"
};


export const EQ = {
  [TAG]: "Ordering",
  run: 0,
  valueOf: () => 0,
  toString: () => "0"
};


export const GT = {
  [TAG]: "Ordering",
  run: 1,
  valueOf: () => 1,
  toString: () => "1"
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████ CROSS-CUTTING ASPECTS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ ALGEBRAIC DATA TYPES █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Variant(/sum) and product types to create flexible and safe variants(/sums)
of products.

  const Either = variant("Either", "Left", "Right") (cons, cons));

  Either.pattern = O.init("left", "right");

  const tx = Either.Right(5),
    ty = Either.Left;

  tx.run(Either.pattern(_ => 0, x => x * x)); // yields 25
  ty.run(Either.pattern(_ => 0, x => x * x)); // yields 0

`Either` is the type constructor and `Either.Left`/`Either.Right` are value constructors.
`Either.pattern` is a helper to create typed objects that are case exhaustive, i.e.
supply all necessary cases of the given type. */


// product types

export const product = type => p => lambda => {
  const o = {
    [TAG]: type,
    run: lambda
  };

  for (const k of Object.keys(p))
    Object.defineProperty( // getter/setter safe
      o, k, Object.getOwnPropertyDescriptor(p, k));

  return o;
};


// variant types (sum)

export const variant = (type, ...tags) => (...cons) => {
  if (tags.length !== cons.length)
    throw new Err("malformed variant type");

  return tags.reduce((acc, tag, i) => {
    acc[tag] = cons[i] (type, tag.toLowerCase());
    return acc;
  }, {});
};


export const cons0 = (type, tag) =>
  ({[TAG]: type, run: ({[tag]: x}) => x});



export const xcons0 = p => (type, tag) => {
  const o = {[TAG]: type, run: ({[tag]: x}) => x};

  for (const k of Object.keys(p))
    Object.defineProperty( // getter/setter safe
      o, k, Object.getOwnPropertyDescriptor(p, k));

  return o;
};


export const cons = (type, tag) => x =>
  ({[TAG]: type, run: ({[tag]: f}) => f(x)});


export const xcons = p => (type, tag) => x => {
  const o = {[TAG]: type, run: ({[tag]: f}) => f(x)};

  for (const k of Object.keys(p))
    Object.defineProperty( // getter/setter safe
      o, k, Object.getOwnPropertyDescriptor(p, k));

  return o;
};


export const cons2 = (type, tag) => x => y =>
  ({[TAG]: type, run: ({[tag]: f}) => f(x) (y)});


export const xcons2 = p => (type, tag) => x => y => {
  const o = {[TAG]: type, run: ({[tag]: f}) => f(x) (y)};

  for (const k of Object.keys(p))
    Object.defineProperty( // getter/setter safe
      o, k, Object.getOwnPropertyDescriptor(p, k));

  return o;
};


export const cons3 = (type, tag) => x => y => z =>
  ({[TAG]: type, run: ({[tag]: f}) => f(x) (y) (z)});


export const xcons3 = p => (type, tag) => x => y => z => {
  const o = {[TAG]: type, run: ({[tag]: f}) => f(x) (y) (z)};

  for (const k of Object.keys(p))
    Object.defineProperty( // getter/setter safe
      o, k, Object.getOwnPropertyDescriptor(p, k));

  return o;
};


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
███████████████████████████████████ ERRORS ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Err = TypeError; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ EXCEPTIONS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// indicates errors that are not thrown, at least not immediately

export class Exception extends Error {
  constructor(s) {super(s)}
}


// accumulated exceptions

export class Exceptions extends Error {
  constructor(...es) {
    const ess = [];
    super("exceptions");

    es.forEach(e => {
      if (e.constructor.name === "Exceptions") ess.push(e.es);
      else ess.push(e);
    });

    this.es = ess.flat();
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LAZY EVALUATION ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes either deferred or lazy evaluated thunks in an ad-hoc fashion. Both
tpyes have the following properties:

  * evaluate only when needed
  * evaluate only as far as necessary (to WHNF)

  Lazy thunks come with result sharing as an extra:

  * evaluate at most once

The technique is based on `Proxy` based thunks that behave like placeholders
for any expression in most cases. There are some known limitations, though:

  * `==`/`===` doesn't force evaluation of thunks
  * `throw` doesn't force evaluatio of thunks

The equality issue in particular is a serious issue. YOU NEED TO TAKE THIS
ISSUE INTO ACCOUNT IF YOU RELY ON PROXY-BASED THUNKS.

There will probably a thunk aware `Eq` type classe as a more robusr alternative
to the overloaded `==`/`===` operators.

If you need a more principled approach use `Defer`/`Lazy` types as monad
transformers. */


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/*
█████ API █████████████████████████████████████████████████████████████████████*/


export const strict = x => {
  while (x && x[THUNK]) x = x[EVAL];
  return x;
};


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

    // enforce evalutation to WHNF

    if (this.memo === NULL) {
      let g = f();

      while (g && g[THUNK] === true) g = g[EVAL];
      if (this.share) this.memo = g;

      if (typeof g !== "function")
        throw new Err("invocation of non-functional thunk");

      return g(...args);
    }

    else return this.memo(...args);
  }

  get(f, k, p) {

    // prevent evaluation in case of introspection
    
    if (k === THUNK) return true;
    else if (k === Symbol.toStringTag) return "Thunk";

    // enforce evaluation of a single layer

    else if (k === EVAL) {
      if (this.memo === NULL) {
        let o = f();
        if (this.share) this.memo = o;
        return o;
      }

      else if (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];

      else return this.memo;
    }

    // intercept implicit type casts

    else if (k === "valueOf" || k === "toString") {
      if (this.memo === NULL) {
        let o = f();
        
        while (o && o[THUNK] === true) o = o[EVAL];
        if (this.share) this.memo = o;
        if (Object(o) === o) return o[k];
        else if (k === "valueOf") return () => o;
        else return () => String(o);
      }

      else if (Object(this.memo) === this.memo) return this.memo[k];
      else if (k === "valueOf") return () => this.memo;
      else return () => String(this.memo);
    }

    // enforce evaluation to WHNF due to array context

    else if (k === Symbol.isConcatSpreadable) {
      if (this.memo === NULL) {
        let o = f();

        while (o && o[THUNK] === true) o = o[EVAL];
        if (this.share) this.memo = o;
        if (Array.isArray(o) || o[Symbol.isConcatSpreadable]) return true;
        else return false;
      }

      else {
        if (Array.isArray(this.memo) || this.memo[Symbol.isConcatSpreadable])
          return true;

        else return false;
      }
    }

    // enforce evaluation to WHNF due to property access

    else {
      if (this.memo === NULL) {
        let o = f();

        while (o && o[THUNK] === true) o = o[EVAL];

        // take method binding into account

        if (Object(o) === o && o[k] && o[k].bind) o[k] = o[k].bind(o);
        if (this.share) this.memo = o;
        return o[k];
      }

      else return this.memo[k];
    }
  }

  getOwnPropertyDescriptor(f, k) {

    // force evaluation to WHNF

    if (this.memo === NULL) {
      let o = f();

      while (o && o[THUNK] === true) o = o[EVAL];
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

      while (o && o[THUNK] === true) o = o[EVAL];
      if (this.share) this.memo = o;
      return k in o;
    }

    else return k in this.memo;
  }

  ownKeys(o) {

    // force evaluation to WHNF

    if (this.memo === NULL) {
      let o = f();

      while (o && o[THUNK] === true) o = o[EVAL];
      if (this.share) this.memo = o;
      return Reflect.ownKeys(o);
    }

    else return Reflect.ownKeys(this.memo);
  }

  set(o) {
    throw new Err("Thunk values must not be mutated");
  }
}


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ OVERLOADED ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// Javascript built-in overloaded operators as functions


export const compare = x => y => x < y ? LT : x > y ? GT : EQ;


const compareOn_ = () => compBoth(compare);


export const max = x => y => x >= y ? x : y;


export const min = x => y => x <= y ? x : y;


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ PATTERN MATCHING ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Utilizes destructuring assignments to realize a limited form of pattern
matching. Destructuring assignments are malformed for the job:

  * either they return `Undefined` if the outer layer of a shape doesn't exist
  * or they throw an error if a nested layer of a shape doesn't exist

The `match` combinator adjusts native destructuring assignment so that thrown
errors are catched and undefined as an assignment is rejected. Each case passed
to `match` is a function that destructures its arguments and offers the full
flexibility of functons to further inspect the assigned values. Each argument
are passed redundantly in an array at the end of the parameter list for the
case function to have access to the original not destructed values:

  match({baz: [5]}) (
    _if(({bar: s}) => s)
      .then(s => s.toUpperCase()),

    _if(([x, y, z]) => [x, y, z])
      .then(xs => xs.reverse()),

    _if(({foo: s}) => s)
      .then(s => s + "!"),

    _if(({baz: [n]}) => Number(n) === n ? n : undefined)
      .then(n => "*".repeat(n)),

    _if(id) // default case
      .then(_ => "otherwise"));

  // matches the 4th case and yields "*****"

The above pattern matching comes without pre-runtime exhaustiveness check. */


export const match = (...args) => (...cases) => {
  let r;

  for (_case of cases) {
    try {
      r = _case(...args, args);
      if (r === undefined) continue;
      else break;
    } catch(e) {continue}
  }

  if (r) return r()

  else throw new Err(
    "pattern match expression must yield a value");
};


export const match_ = (...cases) => (...args) => {
  let r;

  for (_case of cases) {
    try {
      r = _case(...args, args);
      if (r === undefined) continue;
      else break;
    } catch(e) {continue}
  }

  if (r) return r()

  else throw new Err(
    "pattern match expression must yield a value");
};


export const _if = _case => ({
  then: f => (...args) => {
    const r = _case(...args);

    switch (introspect(r)) {
      case "Array": {
        for (let y of r) {
          if (y === undefined) return y;
        }

        return () => f(r);
      }

      case "Object": {
        for (let y of O.values(r)) {
          if (y === undefined) return y;
        }

        return () => f(r);
      }

      case "Undefined": return r;
      default: return () => f(r);
    }
  }
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ STACK SAFETY █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Monad Recursion █████████████████████████████████████████████████████████*/


/* The `Loopm` monad allows stack-safe monad recursion through a trampoline
mechanism. It is the little brother of the continuation monad and thus doesn't
have a valid monad transformer, i.e. it can only be used as the outermost base
monad of a transformer stack. */


export const Loopm = o => {
  while (o.tag === "Rec")
    o = o.f(o.x);

  return o.tag === "Base"
    ? o.x
    : _throw(new Err("invalid tag"));
};


// Functor


Loopm.map = f => tx =>
  Loopm.chain(tx) (x => Loopm.of(f(x)));


Loopm.Functor = {map: Loopm.map};


// Functor :: Apply

Loopm.ap = tf => tx =>
  Loopm.chain(tf) (f =>
    Loopm.chain(tx) (x =>
      Loopm.of(f(x))));


Loopm.Apply = {
  ...Loopm.Functor,
  ap: Loopm.ap
};


// Functor :: Apply :: Applicative


Loopm.of = () => Loopm.done;


Loopm.Applicative = {
  ...Loopm.Apply,
  of: Loopm.of
};


// Functor :: Apply :: Chain


Loopm.chain = mx => fm =>
  mx.tag === "Rec" ? Loopm.next(mx.x) (y => Loopm.chain(mx.f(y)) (fm))
    : mx.tag === "Base" ? fm(mx.x)
    : _throw(new Err("invalid tag"));


Loopm.Chain = {
  ...Loopm.Apply,
  chain: Loopm.chain
};


// Functor :: Apply :: Applicative :: Monad


Loopm.Monad = {
  ...Loopm.Applicative,
  chain: Loopm.chain
};


// Tags


Loopm.next = x => f =>
  ({tag: "Rec", f, x});


Loopm.done = x =>
  ({tag: "Base", x});


/*
█████ Tail Recursion ██████████████████████████████████████████████████████████*/


/* Stack-safe tail-recursion and mutual tail-recursion using a trampoline. The
`next` and `done` tags are used to encode recursive and the base cases
respectively. In addition, the `call` tag can be used to defer function
invocations. */


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

      default: throw new Err("invalid tag");
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

      default: throw new Err("invalid tag");
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

      default: throw new Err("invalid tag");
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
█████ Tail Recurson Modulo Cons & Beyond ██████████████████████████████████████*/


/* Stack-based trampoline to enable recursive cases not in tail call position.
It can emulate tail recursion modulo cons and even modulo more complex
operations.

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
          add,
          Loops.rec(n - 1),
          Loops.rec(n - 2))); */


export const Loops = f => x => {
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

            default: throw new Err("invalid tag");
          }
        }

        break;
      }

      default: throw new Err("invalid tag");
    }
  }

  return stack[0].x;
};


export const Loops2 = f => (x, y) => {
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

            default: throw new Err("invalid tag");
          }
        }

        break;
      }

      default: throw new Err("invalid tag");
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


export const foldAll = ({foldr}) => p => foldr(x => acc =>
  p(x) ? acc : false) (true);


export const foldAnd = ({foldr}) => foldr(b => acc => b && acc) (true);


export const foldAny = ({foldr}) => p => foldr(x => acc =>
  p(x) ? true : acc) (false);


export const foldMapl = ({foldl}, {append, empty}) => f =>
  A.foldl(compSnd(append) (f)) (empty);


export const foldMapr = ({foldr}, {append, empty}) => f =>
  A.foldr(comp(append) (f)) (empty);


export const foldMax = ({foldl1}, {max}) => tx => foldl1(max) (tx);


export const foldMin = ({foldl1}, {min}) => tx => foldl1(min) (tx);


export const foldOr = ({foldr}) => foldr(b => acc => b || acc) (false);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ FUNCTOR ███████████████████████████████████
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


/* It is possible to chain several monads of the same type in a principled
fashion while maintaining a flat composition syntax, provided all subsequent
invocations of the partially applied Kleisli action are wrapped in a minimal
functiorial context.

This means the technique leaks into the call side and adds some syntactical
noise but it is the best we can hope for. Please note that the following isn't
possible with the classic `liftM2` combinator, which is merely applicative
effect combination in disguise.

  const chain2_ = chain2({chain: A.chain, of: A.of});
                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
                                 type class

  chain2_([1,2,3]) ([4,5,6]) (x => x & 1 ? of(y => [x + y]) : []);
          ^^^^^^^   ^^^^^^^                ^^^^^^^^^^^^^^^^
           monad     monad         next computation depends on x */


export const chain2 = ({chain}) => mx => my => fm =>
  chain(mx) (x => chain(fm(x)) (gm => chain(my) (gm)));


export const chain3 = ({chain}) => mx => my => mz => fm =>
  chain(mx) (x =>
    chain(fm(x)) (gm =>
      chain(my) (y =>
        chain(gm(y)) (hm =>
          chain(mz) (hm)))));


export const chainn = ({chain}) => (...ms) => fm => function go(gm, i) {
  if (i === ms.length) return gm;
  else return chain(ms[i]) (x => chain(gm(x)) (hm => go(hm, i + 1)));
} (fm, 0);


/*
█████ Interpretation ██████████████████████████████████████████████████████████*/


// collapsing two monadic contexts (of the same type) is the essence of a monad

export const join = ({chain}) => ttx => chain(ttx) (id);


/*
█████ Kleisli █████████████████████████████████████████████████████████████████*/


// composing of monadic actions: `a -> m a`


export const komp = ({chain}) => fm => gm => x => chain(fm(x)) (gm);


export const kipe = ({chain}) => gm => fm => x => chain(fm(x)) (gm);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ MONAD ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const foldM = ({foldl}, {chain, of}) => fm => init => mx =>
  foldl(gm => x => acc => chain(fm(acc) (x)) (gm)) (of) (mx) (init);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FUNCTION ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Fun = {}; // namespace


export const F = Fun; // shortcut


/*
█████ Applicators █████████████████████████████████████████████████████████████*/


export const app = f => x => f(x);


export const app_ = x => f => f(x);


export const appr = (f, y) => x => f(x) (y);


export const contify = f => x => k => k(f(x));


export const curry = f => x => y => f(x, y);


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
  if (args.length === 0) throw new Err("no argument found");

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


// more readable immediately invoked functon expression

export const scope = f => f();


export const uncurry = f => (x, y) => f(x) (y);


export const uncurryArr = f => xs => xs.reduce((acc, x) => acc(x), f);


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


export const asyncPar = f => msecs => x => P(k =>
  setTimeout(comp(k) (f), msecs, x));


export const asyncSer = f => msecs => x => S(k =>
  setTimeout(comp(k) (f), msecs, x));


export const debug = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


export const log = (x, tag = "") => {
  if (tag) console.log(
    "███ LOG ███████████████████████████████████████████████████████████████████████",
    "\r\n", `${tag}:`, x, "\r\n");

  else console.log(
    "███ LOG ███████████████████████████████████████████████████████████████████████",
    "\r\n", x, "\r\n");

  return x;
};


export const trace = x => {
  const s = JSON.stringify(x);

  console.log("███ TRACE LOG █████████████████████████████████████████████████████████████████", "\r\n", x, "\r\n");
  console.log("███ TRACE JSON ████████████████████████████████████████████████████████████████", "\r\n", s," \r\n");
  return x;
};


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


F.join = f => x => f(x) (x);


F.Monad = {
  ...F.Applicative,
  chain: F.chain
};


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
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d */


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


/* `NaN`/`Infinity`/`Invalid Date` are treaded as bottom, because they aren't
the neutral elements of their respective types but rather cover exceptions.
`null` on the other hand is part of the `Option` monad and just a nullary
value constructor, not a bottom value. */

export const isBottom = x => {
  if (x === undefined) return true;
  else if (x !== x) return true // NaN
  
  else if (typeof x === "object"
    && x !== null
    && "getTime" in x
    && Number.isNaN(x.getTime()))
      return true;  
};


/* takes an arbitrary number of expressions and returns the evaluated value
of the last one. The omitted expressions are merely evaluated for their
effects. */

export const eff = (...exps) => exps[exps.length - 1];


export const eff0 = (...exps) => exps[0];


export const _throw = e => { // throw as a first class expression
  throw strict(e);
};


export const throwAt = p => e => x => {
  if (p(x)) throw strict(e);
  else return x;
};


export const throwAtBottom = throwAt(
  isBottom) (new Err("unexpected bottom type"));


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
█████ Logic ███████████████████████████████████████████████████████████████████*/


/* Converging all sorts of values into boolean ones allows logic operators to
accept values of all types. */


// if and only if

export const iff = x => y => !!x && !!y || !x && !y;


// either x is false or y must be true

export const implies = x => y => !x || !!y === true;


export const not = x => !x;


export const xor = x => y => !!(!!x ^ !!y);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


F.append = ({append}) => f => g => x => append(f(x)) (g(x));


F.Semigroup = {append: F.append};


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
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


F.Category = F.Category();


F.contramap = F.contramap();


F.Contra = F.Contra();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████ FUNCTION :: READER :: TRANSFORMER ██████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* With the reader transformer `a -> m b` the base monad `m` isn't on the
outside but in the codomain of the function. This way the inner monad (`a ->`)
is applied before the base monad. Applying the inner monad means to implicitly
pass an argument, which from the perspetive of the base monad acts like a
read-only environment. */


export const Reader = fmm => ({ // constructor
  [TAG]: "Reader",
  run: fmm
});


export const R = Reader; // shortcut


// transformer type: a -> m b


R.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromFun = f => Reader(r => outer.of(f(r)));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => Reader(r => outer.map(f) (mmx.run(r)));


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => Reader(r => outer.ap(mmf.run(r)) (mmx.run(r)));


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => Reader(_ => outer.of(x));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => Reader(r =>
    outer.chain(mmx.run(r)) (x => fmm(x).run(r)));


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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  o.append = ({append}) => mmx => mmy => Reader(r =>
    outer.chain(append(mmx.run(r))) (mx =>
      outer.map(my => append(mx) (my)) (mmy.run(r))));
  

  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = ({empty}) => Reader(_ => outer.of(empty));


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  o.lift = mx => Reader(_ => mx);


  // TODO


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


  o.ask = Reader(outer.of);


  o.runReader = f => mmx => Reader(r => f(mmx.run(r)));


  o.withReader = f => mmx => Reader(r => mmx.run(f(r)));

  
  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████ FUNCTION :: STATE :: TRANSFORMER ███████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const State = fmm => ({ // constructor
  [TAG]: "State",
  run: fmm
});


export const St = State; // shortcut


// transformer type: b -> m (a, b)


St.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromFun = f => State(x => outer.of(f(x)));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => State(s =>
    outer.map(mx => Pair(f(mx[0]), mx[1])) (mmx.run(s)));


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => State(s =>
    outer.chain(mmf.run(s)) (mf =>
      outer.map(mx => Pair(mf[0] (mx[0]), mx[1])) (mmx.run(mf[1]))));


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => State(s => outer.of(Pair(x, s)));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => State(s =>
    outer.chain(mmx.run(s)) (mx =>
      fmm(mx[0]).run(mx[1])));


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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  o.append = ({append}) => mmx => mmy => State(s =>
    outer.chain(append(mmx.run(s))) (mx =>
      outer.map(my => Pair(append(mx[0]) (my[0]), my[1])) (mmy.run(mx[1]))));
  

  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = ({empty}) => State(s => outer.of(Pair(empty, s)));


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  o.lift = mx => State(s => outer.map(x => Pair(x, s)) (mx));


  // TODO


/*
█████ Misc. ████████████████████████████████████████████████████████████*/


  o.exec = mmx => s => outer.map(mx => mx[1]) (mmx.run(s));


  o.eval = mmx => s => outer.map(mx => mx[0]) (mmx.run(s));


  o.get = State(s => outer.of(Pair(s, s)));


  o.gets = f => State(s => outer.of(Pair(f(s), s)));


  o.mod = f => State(s => outer.of(Pair(null, f(s))))


  o.modM = fm => State(s => outer.map(s2 => Pair(null, s2)) (fm(s)));


  o.put = s => State(_ => outer.of(Pair(null, s)))


  o.with = f => mmx => State(s => mmx.run(f(s)));


  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Enocodes the effect of computations that may have no, one or several results.
Array is not a functional data type, because it has a non recursive definition.
While it has a valid monad instance, there is no valid transformer. Use list or
streams instead.

Efficient operation guide:

  * Array: random element access, mutations
  * List: cons/uncons
  * DList: append, cons/snoc
  * Vector: element update, snoc/unsnoc, init/last
  * Sequence: element insert/delete */


export const Arr = {}; // namespace


export const A = Arr; // shortcut


/*
█████ Clonable ████████████████████████████████████████████████████████████████*/


A.clone = xs => xs.concat();


A.Clonable = {clone: A.clone};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


A.fromList = xss => xss.flat(Number.POSITIVE_INFINITY);


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
█████ Creation ████████████████████████████████████████████████████████████████*/


/* mapAccum isn't required for arrays because the last element representing the
final value can be easily accessed through its index. */


A.scanl = f => init => A.foldl(acc => x =>
  (acc.push(f(acc[acc.length - 1]) (x)), acc)) ([init]);


A.scanr = f => init => A.foldr(x => acc =>
  (acc.unshift(f(x) (acc[0])), acc)) ([init]);


/*
█████ Eq ██████████████████████████████████████████████████████████████████████*/


A.eq = ({eq}) => xs => ys => {
  if (xs.length !== ys.length) return false;

  else return Loop(i => {
    if (i === xs.length) return Loop.base(true);

    else {
      const b = eq(xs[i]) (ys[i]);
      return b === true ? Loop.rec(i + 1) : Loop.base(false);
    }
  }) (0);
};


A.Eq = {eq: A.eq};


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


/* Sets a focus on the first element that satisfies the given predicate and
holds references to the left/right remainders. The reminders are lazy, i.e.
only evaluated when actually needed and only once. */

A.focusAt = p => xs => Loop(i => {
  if (i === xs.length || p(xs[i])) {
    return Loop.base(Triple_({
      get "1"() {
        delete this["1"];
        this["1"] = xs.slice(0, i);
        return this["1"];
      },

      2: i in xs ? xs[i] : null,
      
      get "3"() {
        delete this["3"];
        this["3"] = xs.slice(i + 1);
        return this["3"];
      }
    }));
  }

  else Loop.rec(i + 1);
}) (0);
  

/* Sets a focus on the first consecutive elements satisfying the given predicate
and holds references to the left/right remainders. All fields of the resulting
triple are lazy, i.e. only evaluated when actually needed and only once. */

A.focusOn = p => xs => Loop2((i, j) => {
  if (i === xs.length) return Loop2.base(Triple(xs, [], []));

  else if (j === 0) {
    if (p(xs[i])) return Loop2.rec(i, i + 1);
    else return Loop2.rec(i + 1, j);
  }

  else {
    if (j < xs.length && p(xs[j])) return Loop2.rec(i, j + 1);
    
    else {
      return Loop2.base(Triple_({
        get "1"() {
          delete this["1"];
          this["1"] = xs.slice(0, i);
          return this["1"];
        },

        get "2"() {
          delete this["2"];
          this["2"] = xs.slice(i, j);
          return this["2"];
        },

        get "3"() {
          delete this["3"];
          this["3"] = xs.slice(j);
          return this["3"];
        }
      }));
    }
  }
}) (0, 0);


// like `takeWhile` but keeps the tail

A.focusInit = p => xs => Loop(i => {
  if (i < xs.length && p(xs[i])) return Loop.rec(i + 1);

  else {
    return Loop.base(Pair_({
      get "1"() {
        delete this["1"];
        this["1"] = xs.slice(0, i);
        return this["1"];
      },

      get "2"() {
        delete this["2"];
        this["2"] = xs.slice(i);
        return this["2"];
      }
    }));
  }
}) (0);


// like `dropWhile` but keeps the init

A.focusTail = p => xs => Loop(i => {
  if (i >= 0 && p(xs[i])) return Loop.rec(i - 1);

  else {
    return Loop.base(Pair_({
      get "1"() {
        delete this["1"];
        this["1"] = xs.slice(0, i);
        return this["1"];
      },

      get "2"() {
        delete this["2"];
        this["2"] = xs.slice(i);
        return this["2"];
      }
    }));
  }
}) (xs.length - 1);


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/*
█████ Filter-like █████████████████████████████████████████████████████████████*/


A.find = p => xs => xs.find(x => p(x) ? x : null);


A.findIndex = p => xs => xs.findIndex(i => p(i) ? i : null);


A.partition = p => xs => xs.reduce((pair, x)=> {
  if (p(x)) return (pair[1].push(x), pair);
  else return (pair[2].push(x), pair);
}, Pair([], []));


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
    ? _throw(new Err("empty array")) : xs[0];

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


/* A fold with `f` encoded in continuation passing style so that it can decide
whether to continue or abort the left-associative fold. */

A.foldk = f => init => xs =>
  Loop2((acc, i) =>
    i === xs.length
      ? Loop2.base(acc)
      : f(acc) (xs[i]) (acc2 => Loop2.rec(acc2, i + 1)))
        (init, 0);


// eager, right-associative and yet stack-safe fold

A.foldr = f => acc => xs => Loops(i => {
  if (i === xs.length) return Loops.base(acc);

  else return Loops.call(
    f(xs[i]),
    Loops.rec(i + 1));
}) (0);


/* Lazy, right-associative fold. Stack-safe, if `f` is non-strict in its second
argument. This only works for folds that result type isn't an imperative array
because array construction is always strict in both its arguments. */

A.foldr_ = f => acc => xs => function go(i) { // lazy, right-associative
  if (i === xs.length) return acc;
  else return f(xs[i]) (lazy(() => go(i + 1)));
} (0);


A.foldr1 = f => xs => {
  const go = i => {
    if (i === xs.length - 1) return xs[i];
    else return f(xs[i]) (lazy(() => go(i + 1)));
  };

  return xs.length === 0
    ? _throw(new Err("empty array"))
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


A.Alt = () => ({
  ...A.Functor,
  alt: A.alt
});


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Object.defineProperty(A, "zero", { // due to mutable arrays
  get() {return []},
  enumerable: true,
  configurable: true
});


A.Plus = {
  ...A.Alt
};


Object.defineProperty(A.Plus, "zero", { // due to mutable arrays
  get() {return []},
  enumerable: true,
  configurable: true
});


/*
█████ Functor :: Apply (Non-Determinism) ██████████████████████████████████████*/


A.ap = fs => xs =>
  fs.reduce((acc, f) =>
    (acc.push.apply(acc, xs.map(x => f(x))), acc), []);


A.Apply = {
  ...A.Functor,
  ap: A.ap
};


/*
█████ Functor :: Apply (ZipArr) ███████████████████████████████████████████████*/


A.ZipArr = {}; // namespace


A.ZipArr.ap = () => A.zipWith(app);


/*
█████ Functor :: Apply :: Applicative (Non-Determinism) ███████████████████████*/


/* There is no applicative `ZipArr` instance because we cannot construct an
infinite array for the most minimal context. */


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
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// there seems to be no useful instance


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// there seems to be no useful instance


/*
█████ Non-Empty ███████████████████████████████████████████████████████████████*/


/* Non-empty arrays are just regular arrays wrapped in a proxy that cannot be
empty. Usually, each method that creates a new array returns a non-empty one
exept for `filter`, which may return an empty array and thus must not rely on
non-emptyness. */


A.nonEmpty = xs => {
  if (xs.length === 0)
    throw new Err("empty non-empty array");

  return new Proxy(xs, {
    deleteProperty(_, i) {
      if (xs.length === 1)
        throw new Err("empty non-empty array");

      else return delete xs[i];
    },

    get(_, k, proxy) {
      switch (k) {
        case "concat": return ys => A.nonEmpty(xs.concat(ys));
        case "map": return (f, i, ys) => A.nonEmpty(xs.map(f, i, ys));
        case "slice": return (i, j) => A.nonEmpty(xs.slice(i, j));
        default: return xs[k];
      }
    },

    set(_, k, v, proxy) {
      if (k === "length" && v === 0)
        throw new Err("empty non-empty");

      else {
        xs[k] = v;
        return proxy;
      }
    }
  });
};


/*
█████ Getter ██████████████████████████████████████████████████████████████████*/


A.at = i => xs => xs[i]; // curried `at` non-reliant on `this`


/*
█████ Ordering ████████████████████████████████████████████████████████████████*/


A.sort = ({compare}) => xs => xs.sort(uncurry(compare));


A.sortBy = f => xs => xs.sort(uncurry(f));


A.sortOn = ({compare}) => f => xs => xs.sort(uncurry(compBoth(compare) (f)));


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


// strict due to imperative arrays


A.ana = A.unfold;


A.apo = f => init => { 
  let acc = [], x = init, next;

  do {
    const r = f(x);
    next = false;

    if (r === null) continue;

    else {
      const [y, tz] = r;

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


A.append = xs => ys => (xs.push.apply(xs, ys), xs);


A.Semigroup = {append: A.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Object.defineProperty(A, "empty", { // due to mutable arrays
  get() {return []},
  enumerable: true,
  configurable: true
});


A.Monoid = {
  ...A.Semigroup
};


Object.defineProperty(A.Monoid, "empty", { // due to mutable arrays
  get() {return []},
  enumerable: true,
  configurable: true
});


/*
█████ Set Operations ██████████████████████████████████████████████████████████*/


A.dedupe = xs => Array.from(new Set(xs));


// ignores duplicates 

A.diff = xs => ys => {
  const s = new Set(xs),
    s2 = new Set(ys),
    acc = new Set();

  for (const x of s)
    if (!s2.has(x)) acc.add(x);

  for (const y of s2)
    if (!s.has(y)) acc.add(y);

  return Array.from(acc);
};


// ignores duplicates 

A.diffl = xs => ys => {
  const s = new Set(xs),
    s2 = new Set(ys),
    acc = [];

  for (const x of s)
    if (!s2.has(x)) acc.push(x);

  return acc;
};


// ignores duplicates 

A.diffr = xs => ys => {
  const s = new Set(xs),
    s2 = new Set(ys),
    acc = [];

  for (const y of s2)
    if (!s.has(y)) acc.push(y);

  return acc;
};


// ignores duplicates 

A.intersect = xs => ys => {
  const s = new Set(ys);

  return Array.from(xs.reduce(
    (acc, x) => s.has(x) ? acc.add(x) : acc, new Set()));
};


// ignores duplicates 

A.union = xs => ys => Array.from(new Set(xs.concat(ys)));


/*
█████ Streaming ███████████████████████████████████████████████████████████████*/


A.stream = xs => {
  return function go(i) {
    if (i === xs.length) return Stream.Done;
    else return Stream.Step(Pair(i, xs[i])) (_ => go(i + 1));
  } (0);
};


/*
█████ Subarrays ███████████████████████████████████████████████████████████████*/


// `slice` method is used instead of `A.drop`


A.dropWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else return p(xs[i]) ? Loop2.rec(acc, i + 1) : Loop2.base(xs.slice(i));
}) ([], 0);


// `slice` method is used instead of `A.take`


A.takeWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else return p(xs[i]) ? Loop2.rec((acc.push(xs[i]), acc), i + 1) : Loop2.base(acc);
}) ([], 0);


/*
█████ Transformation ██████████████████████████████████████████████████████████*/


/* Groups all consecutive elements by applying a binary predicate to the
pervious/next element. If the predicate fails, a new subgroup is created
otherwise the element is pushed on the current subgroup. */

A.groupBy = p => xs => Loop2((acc, i) => {
  if (i >= xs.length) return Loop2.base(acc);
  if (acc.length === 0) acc.push([xs[0]]);

  if (p(xs[i - 1]) (xs[i])) {
    acc[acc.length - 1].push(xs[i]);
    return Loop2.rec(acc, i + 1);
  }
  
  else {
    acc.push([xs[i]]);
    return Loop2.rec(acc, i + 1);
  }
}) ([], 1);


/* A more general version of `A.partition` that allows key generation and value
accumulation to be passed as arguments. */

A.partitionBy = f => g => xs => xs.reduce((acc, x) => {
  const k = f(x);
  return acc.set(k, g(x) (acc.get(k)));
}, new Map());


/* Determines permutations of a given array. If an array includes duplicates,
so will the list of array permutations. Stack-safety isn't required because a
large array would exhaust the heap before the call stack. */

A.perms = xs => {
  if (xs.length === 0) return [[]];
  
  else return xs.flatMap((x, i) =>
    A.perms(xs.filter((y, j) => i !== j))
      .map(ys => [x, ...ys]));
};


/* Collects all possible subsequences of an array. If it includes duplicates,
so will the list of array subsequences. Stack-safety isn't required because a
large array would exhaust the heap before the call stack. */

A.subseqs = xs => function go(i) {
  if (i === xs.length) return [[]];
  
  else {
    const yss = go(i + 1);

    const zss = yss.map(ys => {
      const zs = [xs[i]];
      return (zs.push.apply(zs, ys), zs);
    });

    return (zss.push.apply(zss, yss), zss);
  }
} (0);


A.transpose = xss =>
  xss.reduce((acc, xs) =>
    xs.map((x, i) => {
      const ys = acc[i] || [];
      return (ys.push(x), ys);
    }), []);


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


// left associative, eager unfold due to non-recursive array data type

A.unfold = f => init => {
  let acc = [], x = init, next;

  do {
    const r = f(x);
    next = false;

    if (r === null) continue;

    else {
      const [y, z] = r;
      x = z;
      next = true;
      return (acc.push(y), acc);
    }
  } while (next);

  return acc;
};


A.Unfoldable = {unfold: A.unfold};


/*
█████ Zipping █████████████████████████████████████████████████████████████████*/


A.zip = () => xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else if (i === ys.length) return Loop2.base(acc);

  else {
    acc.push(Pair(xs[i], ys[i]));
    return Loop2.rec(acc, i + 1);
  }
}) ([], 0);


A.zipWith = f => xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else if (i === ys.length) return Loop2.base(acc);
  else return Loop2.rec((acc.push(f(xs[i]) (ys[i])), acc), i + 1);
}) ([], 0);


A.unzip = () => A.foldl(([x, y]) => ([xs, ys]) =>
  Pair((xs.push(x), xs), (ys.push(y), ys))) (Pair([], []));


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


A.mapSucc = f => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc.push(f(Pair(xs[i], xs[j])));

  return acc;
};


// like `A.foldl` but with multi-argument reducer

A.reduce = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i]);

  return acc;
};


A.reduceSucc = f => acc => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc = f(acc) (Pair(xs[i], xs[j]));

  return acc;
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


A.alt = A.alt();


A.Alt = A.Alt();


A.Traversable = A.Traversable();


A.ZipArr.ap = A.ZipArr.ap();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ ARRAY :: LIST ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* List-like array in the form of nested `[head, [head, [...[]]]]` structures.
Please note that you cannot use its array methods but the combinators provided
with the type.

Encodes non-determinism just like arrays but is recursively defined and
forms a completely unbalanced tree structure. There are two techniques to make
operations on the type stack-safe:

  * guarded recursion through lazy evaluation
  * tail recursion modulo cons using a stack based trampoline

For most type class member functions both variants are implemented with a bias
on modulo cons.

Which list like structure for what task:

  * Array: random element access, length, mutations (push/pop, shift/unshift)
  * Iarray: random element access, length, push/pop, concat
  * List: cons/uncons, init/tail
  * DList: append, cons/snoc */


export const List = {};


export const L = List;


scope(() => {
  class Cons extends Array {
    constructor(x, xs) {
      super(x, xs);
      Object.defineProperty(this, TAG, {value: "Cons"});
    }
    
    static [Symbol.isConcatSpreadable] = true;

    [Symbol.iterator] () {
      const _this = this;

      return function* () {
        let xss = _this;

        do {
          switch (xss[TAG]) {
            case "Nil": return;

            case "Cons": {
              yield xss[0];
              xss = xss[1];
              break;
            }

            default: throw new Err("malformed list-like array");
          }
        } while (true);
      } ();
    }

    map() {throw new Err("invalid method invocation")}
  };
  
  class Nil extends Array {
    constructor() {
      super();
      Object.defineProperty(this, TAG, {value: "Nil"});
      Object.freeze(this);
    }
    
    static [Symbol.isConcatSpreadable] = true;

    [Symbol.iterator] () {
      return function* () {return} ();
    }

    map() {throw new Err("invalid method invocation")}
  };
  
  L.Cons = Cons;
  
  L.Nil = new Nil();
});


L.Cons_ = x => xs => new L.Cons(x, xs); // curried version


L._Cons = xs => x => new L.Cons(x, xs);


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


L.head = xss => {
  switch (xss[TAG]) {
    case "Nil": return null;
    case "Cons": return xss[0];
    default: throw new Err("malformed list-like array");
  }
}


L.singleton = x => [x, L.Nil];


L.tail = xss => {
  switch (xss[TAG]) {
    case "Nil": return null;
    case "Cons": return xss[1];
    default: throw new Err("malformed list-like array");
  }
};


// uncons is redundant


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


L.fromArr = xs => {
  let xss = L.Nil;

  for (let i = xs.length - 1; i >= 0; i--) {
    xss = new L.Cons(xs[i], xss);
  }

  return xss;
};


/*
█████ Infinity ████████████████████████████████████████████████████████████████*/


L.iterate = f => function go(x) {
  return new L.Cons(x, lazy(() => go(f(x))));
}


L.repeat = x => new L.Cons(x, lazy(() => repeat(x)));


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


L.foldl = f => init => xss => {
  let acc = init, done = false;

  do {
    switch (xss[TAG]) {
      case "Nil": {
        done = true;
        break;
      }

      case "Cons": {
        const [x, yss] = xss;
        acc = f(acc) (x);
        xss = yss;
        break;
      }

      default: throw new Err("malformed list-like array");
    }
  } while (!done);

  return acc;
};


// stack-safe even if `f` is strict in its second argument

L.foldr = f => acc => Loops(xss => {
  switch (xss[TAG]) {
    case "Nil": return Loops.base(acc);

    case "Cons": {
      const [x, yss] = xss;
      return Loops.call(f(x), Loops.rec(yss));
    }

    default: throw new Err("malformed list-like array");
  }
});


// stack-safe only if `f` is non-strict in its second argument

L.foldr_ = f => acc => function go(xss) {
  switch (xss[TAG]) {
    case "Nil": return acc;

    case "Cons": {
      const [x, yss] = xss;
      return f(x) (lazy(() => go(yss)));
    }

    default: throw new Err("malformed list-like array");
  }
};


L.Foldable = {
  foldl: L.foldl,
  foldr: L.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


L.mapA = ({map, ap, of}) => {
  const liftA2_ = liftA2({map, ap}) (L.Cons_);
  return f => L.foldr(x => acc => liftA2_(f(x)) (acc)) (of(L.Nil));
};


L.mapA_ = ({map, ap, of}) => {
  const liftA2_ = liftA2({map, ap}) (L.Cons_);
  return f => L.foldr_(x => acc => liftA2_(f(x)) (acc)) (of(L.Nil));
};


L.seqA = ({map, ap, of}) => {
  const liftA2_ = liftA2({map, ap}) (L.Cons_);
  return L.foldr(x => acc => liftA2_(x) (acc)) (of(L.Nil));
};


L.seqA_ = ({map, ap, of}) => {
  const liftA2_ = liftA2({map, ap}) (L.Cons_);
  return L.foldr_(x => acc => liftA2_(x) (acc)) (of(L.Nil));
};


L.Traversable = () => ({
  ...L.Foldable,
  ...L.Functor,
  mapA: L.mapA,
  seqA: L.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


L.map = f => L.foldr(x => acc => new L.Cons(f(x), acc)) (L.Nil);


L.map_ = f => L.foldr_(x => acc => new L.Cons(f(x), acc)) (L.Nil);


L.Functor = {map: L.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


L.alt = () => L.append;


L.Alt = () => ({
  ...L.Functor,
  alt: L.alt
});


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


L.zero = L.Nil;


L.Plus = {
  ...L.Alt,
  zero: L.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


L.ap = tf => tx =>
  L.foldr(f => acc =>
    L.append(L.map(f) (tx)) (acc)) (L.Nil) (tf);


L.ap_ = tf => tx =>
  L.foldr_(f => acc =>
    L.append_(L.map_(f) (tx)) (acc)) (L.Nil) (tf);


L.Apply = {
  ...L.Functor,
  ap: L.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


L.of = L.singleton;


L.Applicative = {
  ...L.Apply,
  of: L.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


L.chain = mx => fm => L.foldr(x => acc =>
  L.append(fm(x)) (acc)) (L.Nil) (mx);


L.chain_ = mx => fm => L.foldr_(x => acc =>
  L.append_(fm(x)) (acc)) (L.Nil) (mx);


L.Chain = {
  ...L.Apply,
  chain: L.chain
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


L.Alternative = {
  ...L.Plus,
  ...L.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


L.Monad = {
  ...L.Applicative,
  chain: L.chain
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// there is no valid instance because of the empty list


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// there is no valid instance because if the empty list


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


L.append = flip(L.foldr(L.Cons_));


L.append_ = flip(L.foldr_(L.Cons_));


L.Semigroup = {append: L.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


L.empty = L.Nil;


L.Monoid = {
  ...L.Semigroup,
  empty: L.empty
};


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


L.unfold = f => function go(y) {
  const r = f(y);

  if (r === null) return L.Nil;

  else {
    const [x, y2] = r;
    return new L.Cons(x, lazy(() => go(y2)));
  }
};


L.Unfoldable = {unfold: L.unfold};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


L.alt = L.alt();


L.Alt = L.Alt();


L.Traversable = L.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████ ARRAY :: LIST :: NON-EMPTY ██████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const NonEmptyList = {};


export const Nea = NonEmptyList;


scope(() => {
  class Cons extends Array {
    constructor(x, xs) {
      super(x, xs);
      Object.defineProperty(this, TAG, {value: "Cons"});
    }
    
    static [Symbol.isConcatSpreadable] = true;

    [Symbol.iterator] () {
      const _this = this;

      return function* () {
        let xss = _this;

        do {
          switch (xss[TAG]) {
            case "Eol": {
              yield xss[0];
              return;
            }

            case "Cons": {
              yield xss[0];
              xss = xss[1];
              break;
            }

            default: throw new Err("malformed list-like array");
          }
        } while (true);
      } ();
    }

    map() {throw new Err("invalid method invocation")}
  };
  
  class Eol extends Array {
    constructor(x) {
      if (x === undefined) throw new Err("value expected");
      
      else {
        super(x, []);
        Object.defineProperty(this, TAG, {value: "Eol"});
        Object.freeze(this[1]);
      }
    }
    
    static [Symbol.isConcatSpreadable] = true;

    [Symbol.iterator] () {
      const _this = this;
      return function* () {yield _this[0]; return} ();
    }

    map() {throw new Err("invalid method invocation")}
  };
  
  Nea.Cons = Cons;
  
  Nea.Eol = Eol;
});


Nea.Cons_ = x => xs => new Nea.Cons(x, xs); // curried version


Nea._Cons = xs => x => new Nea.Cons(x, xs);


/* TODO:

  * head/tail
  * Comonad (several instances)
  * Foldable/Unfoldable
  * Functor/Applicative/Monad
  * Traversable
  * Semigroup/Monoid */


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████ ARRAY :: LIST :: TRANSFORMER █████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// transformer type: m (List m a)


L.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromFoldable = ({foldr}) => foldr(L.Cons_) (outer.of(L.Nil));


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


  // (m a -> b -> m a) -> m a -> m (List m b) -> m a
  o.foldl = f => acc => mmx => Loop2((mmx, acc) => {
    return outer.chain(mmx) (mx => {
      switch (mx[TAG]) {
        case "Nil": return Loop2.base(acc)

        case "Cons": {
          const [x, mmy] = mx;
          return Loop2.rec(mmy, f(acc) (x))
        }

        default: throw new Err("malformed list-like array");
      }
    });
  }) (mmx, acc);


  // (a -> m b -> m b) -> m b -> m (List m a) -> m b
  o.foldr = f => acc => Loops(mmx => {
    return outer.chain(mmx) (mx => {
      switch (mx[TAG]) {
        case "Nil": return Loops.base(acc);

        case "Cons": {
          const [x, mmy] = mx;
          return Loops.call(f(x), Loops.rec(mmy));
        }

        default: throw new Err("malformed list-like array");
      }
    });
  });


  o.Foldable = {
    foldl: o.foldl,
    foldr: o.foldr
  };


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


  // (a -> t b) -> m (List m a) -> t (m (List m b))
  o.mapA = ({map, ap, of}) => ft => {
    const liftA2_ = liftA2({map, ap});
    
    return o.foldr(x =>
      liftA2_(y => mmx =>
        outer.of(L.Cons(y, mmx))) (ft(x))) (of(o.empty));
  };


  // m (List m (t a)) -> t (m (List m a))
  o.seqA = ({map, ap, of}) => {
    const liftA2_ = liftA2({map, ap});

    return o.foldr(liftA2_(x => mmx =>
      outer.of(L.Cons(x, mmx)))) (of(o.empty));
  };


  o.Traversable = () => ({
    ...o.Foldable,
    ...o.Functor,
    mapA: o.mapA,
    seqA: o.seqA
  });


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  // (a -> b) -> m (List m a) -> m (List m b)
  o.map = f => mmx => o.foldr(x => mx =>
    outer.of(L.Cons(f(x), mx))) (o.empty) (mmx);


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  // m (List m (a -> b)) -> m (List m a) -> m (List m b)
  o.ap = mmf => mmx =>
    o.foldr(f => my =>
      o.foldr(x => mx =>
        outer.of(L.Cons(f(x), mx)))
          (my) (mmx)) (o.empty) (mmf);


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  // a -> m (List m a)
  o.of = x => outer.of(L.Cons(x, outer.of(L.Nil)));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  // m (List m a) -> (a -> m (List m b)) -> m (List m b)
  o.chain = mmx => fmm => o.foldr(x =>
    o.append(fmm(x))) (o.empty) (mmx);


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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  // m (List m a) -> m (List m a) -> m (List m a)
  o.append = mmx => mmy =>
    o.foldr(x => mx => outer.of(L.Cons(x, mx))) (mmy) (mmx);


  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  // m (List m a)
  o.empty = outer.of(L.Nil);


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  // m a -> m (List m a)
  o.lift = mx => outer.chain(mx) (o.of);


  // (m a -> n a) -> m (List m a) => n (List n a)
  o.hoist = f => Loops(mmx => {
    return f(outer.map(mmx) (mx => {
      switch (mx[TAG]) {
        case "Nil": return Loops.base(L.Nil);

        case "Cons": {
          const [x, mmy] = mx;
          return Loops.call(L.Cons_(x), Loops.rec(mmy));
        }

        default: throw new Err("malformed list-like array");
      }
    }));
  });


  // (m a -> n  (List n a)) -> m (List m a) -> n (List n a)
  o.embed = fm => function go(mmx) { // TODO: switch to trampoline (maybe with lazy)
    return outer.chain(fm(mmx)) (mx => {
      switch (mx[TAG]) {
        case "Nil": return o.empty;

        case "Cons": {
          const [x, mmy] = mx;
          return outer.of(L.Cons(x, go(mmy)));
          //     ^^^^^^^^ Cons isn't the tail call
        }

        default: throw new Err("malformed list-like array");
      }
    });
  };


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


  // (b -> (a, b)) -> b -> ListT m a
  o.unfold = f => function go(y) {
    const r = f(y);

    if (r === null) return o.empty;

    else {
      const [x, y2] = r;
      return new outer.of(L.Cons(x, lazy(() => go(y2))));
    }
  };


  o.Unfoldable = {unfold: o.unfold};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


  o.Traversable = o.Traversable();


  return o;
});


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

A `Behavior` takes an initial value and a function that in turn takes this
initial value and returns an intermediate object. The intermediate object (A)
must have two properties holding the state (A) and a nullary cancellation
function (B). Here is a simple example:

  const secCounter = Behavior(0) (init => {
    const state = {run: init}, // (B)
      id = setInterval(state2 => state2.run++, 1000, state); // event source

    return {state, cancel: () => clearInterval(id)}; // (A)
  });

As behaviors are multicast, cancelation is an issue because other parts of the
code might rely on them. Usually, cancelation just means the behavior keeps
holding the value of the last processed event. It is more safe to throw an
exception in case of post cancellation access, though. This can be easily
defined inside the nullary `cancel` function.

Use `Stream` for synchronous data streams and `Observable` for asynchronous
event streams. */


export const Behavior = init => behave => ({ // constructor
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


export const Be = Behavior; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ COMPOSE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the composition of functors


export const Comp = ttx => ({
  [TAG]: "Comp",
  run: ttx
});


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
  * no transformer available (only as base monad)

Calling `defer` is possible due to reliable return values. It returns the
`call` trampoline tag, hence the involved computation must be wrapped in one
of the available trampoline interpeters like `Loop`, for instance. */


export const Cont = k => ({
  [TAG]: "Cont",
  run: k,
  defer: x => Loop.call(k, x) // stack safety
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


Cont.Semigroup = {append: Cont.append};


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


D.fromStr = s => {
  const d = new Date(s);

  if (Number.isNaN(d.valueOf()))
    return new Exception("invalid date string");

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
████████████████████████████████████ DLIST ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Function based difference list for efficient append operations.

Which list like structure for what task:

  * Array: random element access, length, mutations (push/pop, shift/unshift)
  * Iarray: random element access, length, push/pop, concat
  * List: cons/uncons, init/tail
  * DList: append, cons/snoc */


export const DList = f => ({
  [TAG]: "DList",
  run: f
});


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


DList.cons = x => xss => DList(comp(L.Cons(x)) (xss));


DList.singleton = comp(DList) (L.Cons_);


DList.snoc = x => xss => DList(comp(xss) (L.Cons_(x)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


DList.fromList = xss => comp(DList) (L.append);


DList.fromArr = xs => comp(DList) (A.append);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


DList.append = xss => yss => DList(comp(xss) (yss));


DList.Semigroup = {append: DList.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


DList.empty = DList(id);


DList.Monoid = {
  ...DList.Semigroup,
  empty: DList.empty
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EXCEPT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes the effect of computations that might raise an exception. Since
Javascript includes an error class, it isn't defined as an algebraic  sum type
but specializes on the error type. This approach makes it both less cumbersome
to use but also less explicit. There is a special `Excdeptions` error subclass
that allows colleting one or several exceptions, thus additionally providing
the behavior of `Either`'s validation applicative instance. */


export const Except = {}; // namespace


export const E = Except; // shortcut


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


E.cata = x => f => tx => introspect(tx) === "Error" ? x : f(tx);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

E.map = f => tx => introspect(tx) === "Error" ? tx : f(tx);


E.Functor = {map: E.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


/* Encodes the semantics of left biased picking. In case of errors in both
arguments, the non-empty error is picked with a left bias again. */

E.alt = tx => ty => {
  if (introspect(tx) === "Error") {
    if (introspect(ty) === "Error") return new Exceptions(tx, ty);
    else return ty;
  }

  else return tx;
};


E.Alt = {
  ...E.Functor,
  alt: E.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


E.zero = new Exceptions();


E.Plus = {
  ...E.Alt,
  zero: E.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


E.ap = tf => tx => {
  if (introspect(tf) === "Error") {
    if (introspect(tx) === "Error") return new Exceptions(tf, tx);
    else return tf;
  }

  else if (introspect(tx) === "Error") return tx;
  else return tf(tx);
};


E.Apply = {
  ...E.Functor,
  ap: E.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


E.of = x => {
  if (introspect(x) === "Error") throw new Err("invalid value");
  else return x;
}


E.Applicative = {
  ...E.Apply,
  of: E.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


E.Alternative = {
  ...E.Plus,
  ...E.Applicative
};


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
█████ Semigroup ███████████████████████████████████████████████████████████████*/


E.append = ({append}) => tx => ty => {
  if (introspect(tx) === "Error") {
    if (introspect(ty) === "Error") return new Exceptions(tx, ty);
    else return tx;
  }

  else if (introspect(ty) === "Error") return ty;
  else return append(tx) (ty);
};


E.Semigroup = {append: E.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


E.empty = ({empty}) => empty;


E.Monoid = {
  ...E.Semigroup,
  empty: E.empty
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ EXCEPT :: TRANSFORMER ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// transformer type: m (Except Error | a)


E.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromEither = mx => outer.of(mx);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => outer.map(mx => introspect(mx) === "Error" ? mx : f(mx));


  o.Functor = {map: o.map};
  

/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


  o.alt = mmx => mmy => outer.chain(mmx) (mx => {
    if (introspect(mx) === "Error") {
      return outer.map(my => {
        if (introspect(my) === "Error") return new Exceptions(mx, my);
        else return my;
      }) (mmy)
    }
      
    else return mmx;
  });


  o.Alt = {
    ...o.Functor,
    alt: o.alt
  };


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


  o.zero = outer.of(new Exceptions());


  o.Plus = {
    ...o.Alt,
    zero: o.zero
  };


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => {
    return outer.chain(mmf) (mf => {
      return outer.map(mx => {
        if (introspect(mf) === "Error") {
          if (introspect(mx) === "Error") return new Exceptions(mf, mx);
          else return mf;
        }

        else if (introspect(mx) === "Error") return mx;
        else return mf(mx);
      }) (mmx);
    });
  };


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = mmx => outer.map(mx => {
    if (introspect(mx) === "Error") throw new Err("invalid value");
    else return mx;
  }) (mmx);


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx => {
    if (introspect(mx) === "Error") return mmx;
    else return fmm(mx);
  });
  

  o.Chain = {
    ...o.Apply,
    chain: o.chain
  };


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


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


  o.append = ({append}) => mmx => mmy => {
    return outer.chain(mmx) (mx => {
      return outer.map(my => {
        if (introspect(mx) === "Error") {
          if (introspect(my) === "Error") return new Exceptions(mx, my);
          else return mx;
        }

        else if (introspect(my) === "Error") return my;
        else return append(mx) (my);
      }) (mmy);
    });
  };


  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = ({empty}) => outer.of(empty);


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  // TODO


  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ IARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Immutable arrays based on a persistent data structure. They type offers the
following operations:

  * push
  * pop
  * concat

It doesn't support in-place settings of elements (`xs[3] = ...`) or deletions
(`delete xs[3]`) bc these operations are rather uncommon for array in the
context of functional programming.

You can create a new `Iarray` instance as soon as you need to push, pop or
concat an existing mutable array but without altering or copying it. Given the
new `Iarray` value you can either apply a single or a batch of mutations to it.
The `Iarray` value is rendered immutable again when you invoke its `own` method.
`own` freezes the existing elements but allows new mutations without altering
the existing value. It is up to you and your algorithm at what points you invoke
`own`. Under the hood each `own` invocation creates a new layer of a nested
`Iarray` chain.

There are two ways to further process an `Iarray` value after all mutations are
completed:

  * invoke `unown` to creat a normal array
  * invoke the iterable protocol

`unown` simply creates a normal array that features all accumulated mutations
of the original array. Alternatively, you can call the `Symbol.iterator`
function and use one of the combinators of the `Iterator` type. */


export const Iarray = xs => {
  const go = (prev, curr, offset) => {
    const o = {};
    let immutable = false;

    o[TAG] = "Iarray";
    o[Symbol.isConcatSpreadable] = true;
    o[Symbol.iterator] = () => o.unown();

    o.at = i => Loop(i2 => o.at_(i2)) (i);

    o.at_ = i => {
      const i2 = o.length - i;

      if (i2 <= o.curr.length) return Loop.base(o.curr[o.curr.length - i2]);

      else {
        const i3 = i2 - o.curr.length - o.offset;

        if (o.prev === xs) {
          if (o.prev.length === 0) return Loop.base(undefined);
          else if (o.prev.length < i3) return Loop.base(undefined);
          else return Loop.base(o.prev[o.prev.length - i3]);
        }

        else return Loop.call(o.prev.at_, i3);
      }
    };

    o.concat = ys => {
      if (immutable) throw new Err("concat op on immutable array");

      else {
        o.curr.push.apply(o.curr, ys);
        o.length += ys.length;
        return o;
      }
    };

    o.curr = curr;
    o.offset = offset;

    o.own = () => {
      immutable = true;
      return go(o, [], 0);
    }

    o.length = prev.length;

    o.pop = () => {
      if (immutable) throw new Err("pop op on immutable array");
      else if (o.length === 0) return Pair(undefined, o);

      else if (o.curr.length === 0) {
        o.length--;
        o.offset--;

        const x = o.prev === xs
          ? xs[xs.length - 1 + o.offset]
          : Loop(() => o.prev.at_(o.length - 1 + o.offset)) ();

        return Pair(x, o);
      }

      else {
        o.length--;
        return Pair(o.curr.pop(), o);
      }
    };

    o.prev = prev;

    o.push = x => {
      if (immutable) throw new Err("push op on immutable array");

      else {
        o.curr.push(x);
        o.length++;
        return o;
      }
    };

    o.unown = (xss = [], offset = 0) =>
      Loop2((xss2, offset2) => o.unown_(xss2, offset2)) (xss, offset);

    o.unown_ = (xss, offset) => {
      if (o.curr.length === 0) {}

      else if (offset < 0) {
        if (o.curr.length + offset < 0) offset += o.curr.length;
        
        else if (o.curr.length + offset > 0) {
          xss.push(o.curr.slice(0, offset));
          offset = 0;
        }

        else offset = 0;
      }

      else xss.push(o.curr);

      if (o.prev === xs) {
        const offset2 = offset + o.offset

        if (xs.length === 0) {}

        else if (offset2 < 0) {
          if (xs.length + offset2 < 0)
            throw new Err("invalid persistent array offset");
          
          else if (xs.length + offset2 > 0)
            xss.push(xs.slice(0, offset2));

          else {}
        }

        else xss.push(xs);

        return Loop2.base(function* () {
          for (let i = xss.length - 1; i >= 0; i--) {
            for (let x of xss[i]) yield x;
          }
        } ());
      }

      else return Loop2.call(o.prev.unown_, xss, offset + o.offset);
    };

    return new Proxy(o, {
      deleteProperty(_, i) {
        throw new Err("delete op on immutable array");
      },

      get(_, i, proxy) {
        if (typeof i === "symbol") return o[i];
        else if (String(Number(i)) === i) return Loop(i2 => o.at_(Number(i2))) (i);
        else return o[i];
      },

      has(_, i, proxy) {
        if (typeof i === "symbol") return i in o;
        else if (String(Number(i)) === i) return Number(i) < o.length;
        else return i in o;
      },

      set(_, i, v, proxy) {
        throw new Err("set op on immutable array");
      }
    });
  };

  return go(xs, [], 0);
};


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


/* Immutable `Imap` type based on a persistent data structure. See `Iarray` for
detailed information on its usage. */

export const Imap = m => {
  const go = (prev, curr, del) => {
    const o = {};
    let immutable = false;

    o[TAG] = "Imap";
    o[Symbol.iterator] = () => o.unown();
    o.curr = curr;
    o.del = del;

    o.delete = k => {
      if (immutable) throw new Err("delete op on immutable map");

      else if (o.curr.has(k)) {
        o.curr.delete(k);
        o.size--;
        return o;
      }

      else if (Loop(k2 => o.prev.has_(k2)) (k)) {
        o.del.add(k);
        o.size--;
        return o;
      }

      else return o;
    };

    o.get = k => Loop(k2 => o.get_(k2)) (k);

    o.get_ = k => {
      if (o.curr.has(k)) return Loop.base(o.curr.get(k));
      else if (o.del.has(k)) return Loop.base(undefined);

      else {
        if (o.prev === m) return Loop.base(o.prev.get(k));
        else return Loop.call(o.prev.get_, k);
      }
    };

    o.has = k => Loop(k2 => o.has_(k2)) (k);

    o.has_ = k => {
      if (o.curr.has(k)) return Loop.base(true);
      else if (o.del.has(k)) return Loop.base(false);
      
      else {
        if (o.prev === m) return Loop.base(o.prev.has(k));
        else return Loop.call(o.prev.has_, k);
      }
    };

    o.own = () => {
      immutable = true;
      return go(o, new Map(), new Set());
    }

    o.prev = prev;

    o.set = (k, v) => {
      if (immutable) throw new Err("set op on immutable map");
      else if (o.del.has(k)) o.del.delete(k);
      else if (!Loop(k2 => o.has_(k2)) (k)) o.size++;
      o.curr.set(k, v);
      return o;
    };

    o.size = o.prev.size;

    o.unown = (ms = [], ss = []) =>
      Loop2((ms2, ss2) => o.unown_(ms2, ss2)) (ms, ss);

    o.unown_ = (ms, ss) => {
      ms.unshift(o.curr);
      ss.unshift(o.del);
      
      if (o.prev === p) {
        ms.push(o.prev);
        ss.push(new Set());

        return Loop2.base(function* () {
          for (let i = ms.length - 1; i >= 0; i--) {
            for (let [k, v] of ms[i]) {
              if (ss[i].has(k)) continue;
              else yield [k, v];
            }
          }
        } ());
      }

      else return Loop2.call(o.prev.unown_, ms, ss);
    };

    return o;
  };

  return go(m, new Map(), new Set());
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ IOBJECT ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Immutable `Iobject` type based on a persistent data structure. See `Iarray`
for detailed information on its usage. */


export const Iobject = p => {
  const go = (prev, curr, del) => {
    const o = {};
    let immutable = false;

    o[Symbol.iterator] = () => o.unown();
    o[TAG] = "Iobject";
    o.curr = curr;
    o.del = del;

    o.delete = k => {
      if (immutable) throw new Err("delete op on immutable object");

      else if (o.curr.has(k)) {
        o.curr.delete(k);
        o.size--;
        return o;
      }

      else if (o.prev === p) {
        if (k in o.prev) {
          o.del.add(k);
          o.size--;
          return o;
        }

        else return o;
      }

      else if (Loop(k2 => o.prev.has_(k2)) (k)) {
        o.del.add(k);
        o.size--;
        return o;
      }

      else return o;
    };

    o.get = k => Loop(k2 => o.get_(k2)) (k);

    o.get_ = k => {
      if (o.curr.has(k)) return Loop.base(o.curr.get(k));
      else if (o.del.has(k)) return Loop.base(undefined);

      else {
        if (o.prev === p) return Loop.base(o.prev[k]);
        else return Loop.call(o.prev.get_, k);
      }
    };

    o.has = k => Loop(k2 => o.has_(k2)) (k);

    o.has_ = k => {
      if (o.curr.has(k)) return Loop.base(true);
      else if (o.del.has(k)) return Loop.base(false);
      
      else {
        if (o.prev === p) return Loop.base(k in o.prev);
        else return Loop.call(o.prev.has_, k);
      }
    };

    o.own = () => {
      immutable = true;
      return go(o, new Map(), new Set());
    }

    o.prev = prev;

    o.set = (k, v) => {
      if (immutable) throw new Err("set op on immutable object");
      else if (o.del.has(k)) o.del.delete(k);
      else if (!Loop(k2 => o.has_(k2)) (k)) o.size++;
      o.curr.set(k, v);
      return o;
    };

    o.size = o.prev === p ? Object.keys(p).length : o.prev.size;

    o.unown = (ms = [], ss = []) =>
      Loop2((ms2, ss2) => o.unown_(ms2, ss2)) (ms, ss);

    o.unown_ = (ms = [], ss = []) => {
      ms.push(o.curr);
      ss.push(o.del);
      
      if (o.prev === p) {
        ms.push(o.prev);
        ss.push(new Set());

        return Loop2.base(function* () {
          for (let i = ms.length - 1; i >= 0; i--) {
            if (i === ms.length - 1) {
              for (let k in ms[i]) {
                if (ss[i].has(k)) continue;
                else yield [k, ms[i] [k]];
              }
            }

            else {
              for (let [k, v] of ms[i]) {
                if (ss[i].has(k)) continue;
                else yield [k, v];
              }
            }
          }
        } ());
      }

      else return Loop2.call(o.prev.unown_, ms, ss);
    };

    return new Proxy(o, {
      deleteProperty(_, k) {
        if (k[0] === "_") return o[k.slice(1)];
         
         else if (k === Symbol.iterator
          || k === TAG) return o[k];

        else return o.delete(k)
      },
      
      get(_, k, proxy) {
        if (k[0] === "_") return o[k.slice(1)];
        
        else if (k === Symbol.iterator
          || k === TAG) return o[k];

        else return o.get(k)
      },
      
      has(_, k, proxy) {
        if (k[0] === "_") return o[k.slice(1)];
        
        else if (k === Symbol.iterator
          || k === TAG) return o[k];
        
        else return o.has(k)
      },
      
      set(_, k, v, proxy) {
        if (k[0] === "_") return o[k.slice(1)];

        else if (k === Symbol.iterator
          || k === TAG) return o[k];
        
        else return o.set(k, v)
      }
    });
  };

  return go(p, new Map(), new Set());
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ISET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Immutable `Iset` type based on a persistent data structure. See `Iarray` for
detailed information on its usage. */

export const Iset = s => {
  const go = (prev, curr, del) => {
    const o = {};
    let immutable = false;

    o[TAG] = "Iset";
    o[Symbol.iterator] = () => o.unown();

    o.add = k => {
      if (immutable) throw new Err("add op on immutable set");
      else if (o.del.has(k)) o.del.delete(k);
      else if (!Loop(k2 => o.has_(k2)) (k)) o.size++;
      o.curr.add(k);
      return o;
    };

    o.curr = curr;
    o.del = del;

    o.delete = k => {
      if (immutable) throw new Err("delete op on immutable set");

      else if (curr.has(k)) {
        o.curr.delete(k);
        o.size--;
        return o;
      }

      else if (prev.has(k)) {
        o.del.add(k);
        o.size--;
        return o;
      }

      else return o;
    };

    o.has = k => Loop(k2 => o.has_(k2)) (k);

    o.has_ = k => {
      if (o.curr.has(k)) return Loop.base(true);
      else if (o.del.has(k)) return Loop.base(false);
      
      else {
        if (o.prev === s) return Loop.base(o.prev.has(k));
        else return Loop.call(o.prev.has_, k);
      }
    };

    o.own = () => {
      immutable = true;
      return go(o, new Set(), new Set());
    }

    o.prev = prev;
    o.size = o.prev.size;

    o.unown = (ss = [], ss2 = []) =>
      Loop2((ss3, ss4) => o.unown_(ss3, ss4)) (ss, ss2);

    o.unown_ = (ss, ss2) => {
      ss.push(o.curr);
      ss2.push(o.del);
      
      if (o.prev === s) {
        ss.push(o.prev);
        ss2.push(new Set());

        return Loop2.base(function* () {
          for (let i = ss.length - 1; i >= 0; i--) {
            for (let k of ss[i]) {
              if (ss2[i].has(k)) continue;
              else yield k;
            }
          }
        } ());
      }

      else return Loop2.call(o.prev.unown_, ss, ss2);
    };

    return o;
  };

  return go(s, new Set(), new Set());
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ ITERATOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const It = {};


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


It.all = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();
    if (done) return;
  } while (f(x));

  return false;
};


/*
█████ Consumption █████████████████████████████████████████████████████████████*/


It.exhaust = ix => {
  let x;
  for (x of ix) continue;
  return x;
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


It.drop = ({empty, append}, {of}) => n => function* (ix) {
  const tx = empty;

  while (n-- > 0) {
    const {done} = ix.next();
    if (done) return tx;
  };

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield append(tx) (of(x));
  } while (true);
};


It.dropWhile = ({empty, append}, {of}) => p => function* (ix) {
  const tx = empty;

  while (true) {
    const {value: x, done} = ix.next();
    if (done) return;

    else if (!p(x)) {
      append(tx) (of(x));
      break;
    }
  };

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield append(tx) (of(x));
  } while (true);
};


It.take = ({empty, append}, {of}) => n => function* (ix) {
  const tx = empty;

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield append(tx) (of(x));
  } while (--n > 0);
};


It.takeWhile = ({empty, append}, {of}) => p => function* (ix) {
  const tx = empty;

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else if (p(x)) yield append(tx) (of(x));
    else return;
  } while (true);
};


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


It.any = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
  } while (!f(x));

  return true;
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


It.filter = p => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else if (p(x)) yield x;
  } while (true);
};


It.Filterable = {filter: It.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


It.foldl = f => acc => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield f(acc) (x);
  } while (true);
};


It.foldr = f => acc => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield f(acc) (x);
  } while (true);
};


It.Foldable = {
  foldl: It.foldl,
  foldr: It.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


It.mapA = ({map, of}) => ft => function* (tx) {
  const {value: x, done} = tx.next();

  if (done) return;
  else return map(y => function* () {yield y} ()) (ft(x));
};


It.seqA = ({map, of}) => function* (ttx) {
  const {value: tx, done} = ttx.next();

  if (done) return;
  else return map(x => function* () {yield x} ()) (tx);
};


It.Traversable = () => ({
  ...It.Foldable,
  ...It.Functor,
  mapA: It.mapA,
  seqA: It.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


It.map = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield f(x);
  } while (true);
};


It.Functor = {map: It.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


It.alt = ix => function* (iy) {
  const {value: x, done} = ix.next(),
    {value: y, done: done2} = iy.next();

  if (!done) yield x;
  else if (!done2) yield y;
  else return;
};


It.Alt = {
  ...It.Functor,
  alt: It.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


It.zero = function* () {} ();


It.Plus = {
  ...It.Alt,
  zero: It.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


It.ap = tf => function* (ix) {
  do {
    const {value: f, done} = tf.next(),
      {value: x, done: done2} = ix.next();

    if (done || done2) return;
    else yield function* () {yield f(x)} ();
  } while (true);
};


It.Apply = {
  ...It.Functor,
  ap: It.ap
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


It.chain = mx => function* (fm) {
  do {
    const {value: x, done} = mx.next();

    if (done) return;
    else yield* fm(x);
  } while (true);
};


It.Chain = {
  ...It.Apply,
  chain: It.chain
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


It.of = x => function* () {yield x} ();


It.Applicative = {
  ...It.Apply,
  of: It.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


It.Alternative = {
  ...It.Plus,
  ...It.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


It.Monad = {
  ...It.Applicative,
  chain: It.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


It.append = ({append}) => ix => function* (iy) {
  const {value: x, done} = ix.next(),
    {value: y, done: done2} = iy.next();

  if (done || done2) return;
  else yield append(x) (y);
};


It.Semigroup = {append: It.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


It.empty = function* () {} ();


It.Monoid = {
  ...It.Semigroup,
  empty: It.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


It.foldSucc = f => acc => function* (ix) {
  let {value: x} = ix.next();

  do {
    const {value: y, done} = ix.next();

    if (done) return;
    
    else {
      yield f(acc) (Pair(x, y));
      x = y;
    }
  } while (true);
};


It.mapSucc = f => function* (ix) {
  let {value: x} = ix.next();

  do {
    const {value: y, done} = ix.next();

    if (done) return;
    
    else {
      yield f(Pair(x, y));
      x = y;
    }
  } while (true);
};


It.reduce = f => acc => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield f(acc, x);
  } while (true);
};


It.reduceSucc = f => acc => function* (ix) {
  let {value: x} = ix.next();

  do {
    const {value: y, done} = ix.next();

    if (done) return;

    else {
      yield f(acc, Pair(x, y));
      x = y;
    }
  } while (true);
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


It.Traversable = It.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const _Map = {}; // namespace


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


_Map.entries = m => m[Symbol.iterator] ();


_Map.keys = function* (m) {
  for (let [k] of m) {
    yield k;
  }
}


_Map.values = function* (m) {
  for (let [, v] in m) {
    yield v;
  }
}


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


_Map.get = k => m => m.has(k) ? m.get(k) : null;


_Map.getOr = x => k => m => m.has(k) ? m.get(k) : x;


_Map.has = k => m => m.has(k);


_Map.set = k => v => m => m.set(k, v);


_Map.del = k => m => m.delete(k);


_Map.upd = k => f => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return new Exception("missing property to be updated");
};


_Map.updOr = x => k => f => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return m.set(k, x);
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ NUMBER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Num = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Num.fromString = s => {
  if (/^(?:\+|\-)?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  else return new Exception(`invalid number string: "${s}"`);
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
█████ Instantiation ███████████████████████████████████████████████████████████*/


O.new = (tag = null) => (...ks) => (...vs) => {
  if (ks.length !== vs.length)
    throw new Err("malformed object literal");

  return ks.reduce((acc, k, i) => {
    acc[k] = vs[i];
    return acc;
  }, tag === null ? {} : {[TAG]: tag});
};


O.init = O.new();


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


O.del = k => o => (delete o[k], o);


O.get = k => o => k in o ? o[k] : null;


O.getOr = x => k => o => k in o ? o[k] : x;


O.set = k => v => o => (o[k] = v, o);


O.upd = k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return new Exception("missing property to be updated");
};


O.updOr = x => k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return (o[k] = x, o);
};


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


O.entries = function* (o) {
  for (let prop in o) {
    yield [prop, o[prop]];
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


/*
█████ Streaming ███████████████████████████████████████████████████████████████*/


O.keyStream = o => {
  const keys = Object.entries(o);

  return function go(i) {
    if (i === keys.length) return Stream.Done;
    else return Stream.Step(keys[i]) (_ => go(i + 1));
  } (0);
};


O.propStream = o => {
  const props = Object.entries(o);

  return function go(i) {
    if (i === props.length) return Stream.Done;
    else return Stream.Step(props[i]) (_ => go(i + 1));
  } (0);
};


O.valueStream = o => {
  const values = Object.values(o);

  return function go(i) {
    if (i === values.length) return Stream.Done;
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


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


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


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// folds only work for finite event streams


Ob.foldl = f => init => tx => Ob(observer => function go(acc) {
  tx.run({
    next: x => go(f(acc) (x)),
    error: e => observer.error(e),
    done: y => eff0(observer.next(acc), observer.done(y))
  })} (init));


Ob.foldr = f => acc => tx => Ob(observer => function go(g) {
  tx.run({
    next: x => go(y => f(x) (lazy(() => g(y)))),
    error: e => observer.error(e),
    done: y => eff0(observer.next(g(acc)), observer.done(y))
  })} (id));


Ob.Foldable = {
  foldl: Ob.foldl,
  foldr: Ob.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


// TODO


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Ob.map = f => tx => Ob(observer =>
  tx.run({
    next: x => observer.next(f(x)),
    error: e => observer.error(e),
    done: y => observer.done(y)
  })
);


Ob.Functor = {map: Ob.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


/*Ob.Alt = {
  ...Ob.Functor,
  alt: Ob.alt
};*/


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


/*Ob.Plus = {
  ...Ob.Alt,
  zero: Ob.zero
};*/


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


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


Ob.Apply = {
  ...Ob.Functor,
  ap: Ob.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Ob.of = x => Ob(observer => observer.next(x));


Ob.Applicative = {
  ...Ob.Apply,
  of: Ob.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


Ob.Alternative = {
  ...Ob.Plus,
  ...Ob.Applicative
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


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


Ob.Chain = {
  ...Ob.Apply,
  chain: Ob.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Ob.Monad = {
  ...Ob.Applicative,
  chain: Ob.chain
};


/*
█████ Semigroup (Argument) ████████████████████████████████████████████████████*/


Ob.append = ({append}) => tx => ty => Ob(observer =>
  tx.run({
    next: x => ty.run({
      next: x2 => observer.next(append(x) (x2)),
      error: e2 => observer.error(e2),
      done: y2 => observer.done(y2)
    }),

    error: e => observer.error(e),
    done: y => observer.done(y)
  }));


Ob.Semigroup = {append: Ob.append};


/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


Ob.Race = {}; // namespace


/* TODO: race for every data chunk not onyl the 1st. Maybe make it the
Alternative type class. */

Ob.Race.append = tx => ty => Ob(observer => {
  const o = {
    next: x => {
      p.next = () => {};
      return observer.next(x);
    },
    
    error: e => observer.error(e),

    done: y => {
      p.done = y2 => observer.done(y2);
    }
  };

  const p = {
    next: x => {
      o.next = () => {};
      return observer.next(x);
    },
    
    error: e => observer.error(e),

    done: y => {
      o.done = y2 => observer.done(y2);
    }
  };
});


/*
█████ Semigroup :: Monoid (Argument) ██████████████████████████████████████████*/


Ob.empty = ({empty}) => Ob(observer => observer.next(empty));


Ob.Monoid = {
  ...Ob.Semigroup,
  empty: Ob.empty
};


/*
█████ Semigroup :: Monoid (Race) ██████████████████████████████████████████████*/


Ob.Race.empty = Ob(observer => observer.done(null));


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Ob.subscribe = observer => observable => observable.run(observer);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ OPTIC ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Defines a focus inside a composite data structure using composable pairs of
getters/setters. Normal function composition is used to define foci several
layers deep inside the structure. The type implicitly holds a description how
to reconstruct the data structure up to its root layer. The description is
only evaluated when needed, i.e. when a focused subelement of the structure
is actually modified or deleted. The type itself is designed to be immutable
but it depends on the provided setters whether this property holds for the 
entire operation.

const o = {foo: {bar: 5}};

// set operation

const tx = comp(
  Optic.focus(O.get("bar"), O.set("bar")))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(Optic.set(55) (tx)); // {foo: {bar: 55}}

// update operation

const ty = comp(
  Optic.focus(O.get("bar"), O.upd("bar")))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(Optic.set(x => x * x) (ty)); // {foo: {bar: 25}}

// delete operation

const tz = comp(
  Optic.focus(O.get("bar"), _const(O.del("bar"))))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(tz); // {foo: {}} */


export const Optic = (x, parent) => ({
  [TAG]: "Optic",
  run: x,
  parent
});


/*
█████ Defocus █████████████████████████████████████████████████████████████████*/


// reconstruct the composite data structure and takes any change into account

Optic.defocus = tx =>
  tx.parent === null ? tx : Optic.defocus(tx.parent(tx.run));


// like `Optic.defocus` but only reconstructs a single layer

Optic.defocus1 = tx =>
  tx.parent === null ? tx : tx.parent(tx.run);


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


// set a composable focus on a subelement of a composite data structure

Optic.focus = (getter, setter) => tx => Optic(
  getter(tx.run),
  x => Optic(setter(x) (tx.run), tx.parent));


// try to focus or use a composite default value

Optic.tryFocus = ty => (getter, setter) => tx => Optic(
  getter(tx === null ? ty : tx.run),
  x => Optic(setter(x) (tx === null ? ty : tx.run), tx.parent));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Optic.map = f => tx => Optic(f(tx.run), tx.parent);


Optic.Functor = {map: Optic.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


/* The combination of two optics require a choice which parent property to pick
for the resulting optic, since two optics cannot be appended in a meaningful in
general. The current implementation is left-biased. */


Optic.ap = tf => tx => Optic(tf.run(tx.run), tf.parent);


Optic.ap_ = tf => tx => Optic(tf.run(tx.run), tx.parent); // right-biased


Optic.Apply = {
  ...Optic.Functor,
  ap: Optic.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Optic.of = x => Optic(x, null);


Optic.Applicative = {
  ...Optic.Apply,
  of: Optic.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* Discards the parent of the next monadic computation but takes the current
one. */

Optic.chain = mx => fm =>  Optic(fm(mx.run).run, mx);


Optic.Chain = {
  ...Optic.Apply,
  chain: Optic.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Optic.Monad = {
  ...Optic.Applicative,
  chain: Optic.chain
};


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


/* Immutable modifying operations on the focused element of a given optic.
Deletion operation is skipped because it doesn't modify the focused element. */


Optic.add = ({append}) => x => tx => Optic(append(tx.run) (x), tx.parent);


Optic.set = x => tx => Optic(x, tx.parent);


Optic.upd = f => tx => Optic(f(tx.run), tx.parent);


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
█████ Catamorphism ████████████████████████████████████████████████████████████*/


Opt.cata = x => f => tx => tx === null ? x : f(tx);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Opt.map = f => tx => strict(tx) === null ? null : f(tx);


Opt.Functor = {map: Opt.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


Opt.alt = tx => ty => strict(tx) === null ? ty : tx;


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
  strict(tf) === null ? null
    : strict(tx) === null ? null
    : tf(tx);


Opt.Apply = {
  ...Opt.Functor,
  ap: Opt.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

Opt.of = x => x === null ? _throw("invalid value") : x;


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


Opt.chain = mx => fm => strict(mx) === null ? null : fm(mx);


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
  strict(tx) === null ? ty
    : strict(ty) === null ? tx
    : append(tx) (ty);


Opt.Semigroup = {append: Opt.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Opt.empty = null;


Opt.Monoid = {
  ...Opt.Semigroup,
  empty: Opt.empty
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ OPTION :: TRANSFORMER ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// transformer type: m (Option null | a)


Opt.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromOption = mx => outer.of(mx);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => outer.map(mx => mx === null ? mx : f(mx));


  o.Functor = {map: o.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


  o.alt = mmx => mmy => outer.chain(mmx) (mx => {
    if (mx === null) return mmy;
    else return mmx;
  });


  o.Alt = {
    ...o.Functor,
    alt: o.alt
  };


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


  o.zero = outer.of(null);


  o.Plus = {
    ...o.Alt,
    zero: o.zero
  };


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => outer.chain(mf => {
    if (mf === null) return mf;

    else return outer.map(mx =>
      mx === null ? mx : mf(mx)) (mmx);
  });


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => x === null ? _throw("invalid value") : outer.of(x);


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx =>
    mx === null ? mx : fmm(mx));


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


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


  o.Alternative = {
    ...o.Plus,
    ...o.Applicative
  };


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  o.append = ({append}) => mmx => mmy => outer.chain(mmx) (mx => {
    if (mx === null) return mmy;

    else return outer.map(my =>
      my === null ? mx : append(mx) (my)) (mmy);
  });


  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = outer.of(null);


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  // TODO


  return o;
});


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
  * stack-safe due to asynchronous calls
  * no transformer available (only as base monad)

`runAsync` wraps the value of type `Parallel` in a `Promise` for every xth
invocation. Promise handlers are executed within the next microtask queue and
thus stack safe by design. Since `Parallel` doesn't rely on return values but
only on continuations, wrapping them into another data type is a transparent
operation. */


export const Parallel = k => ({
  [TAG]: "Parallel",
  run: k,

  get runOnce() {
    delete this.runOnce;

    Object.defineProperty(this, "runOnce", {
      get() {throw new Err("race condition")},
      configurable: true,
      enumerable: true
    });
    
    return f => k(x => {
      const r = f(x);
      delete this.runOnce;
      this.runOnce = _ => f(x);
      return r;
    });
  },

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_CONTINGENCY)
      return Promise.resolve(null).then(_ => k(f));

    else return k(f);
  }
});


export const P = Parallel; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


P.fromPex = k => tx => ({
  [TAG]: "Parallel",
  run: k2 => tx.run({raise: id, proceed: k2}),
  runAsync: f => tx.runAsync({raise: k, proceed: f})
});


P.fromSerial = tx => ({
  [TAG]: "Parallel",
  run: tx.run,
  runAsync: tx.runAsync
});


P.fromSex = k => tx => ({
  [TAG]: "Parallel",
  run: k2 => tx.run({raise: k, proceed: k2}),
  runAsync: f => tx.runAsync({raise: k, proceed: f})
});


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


P.and = tx => ty => {
  return P(k => {
    const pair = Array(2);
    let i = 0;

    return [tx, ty].map((tz, j) => {
      return tz.run(z => {
        if (i < 2) {
          if (pair[j] === undefined) {
            pair[j] = z;
            i++;
          }

          if (i === 2) return k(Pair(pair[0], pair[1]));
          else return null;
        }

        else return null;
      });
    });
  });
};


P.all = () =>
  A.seqA({
    map: P.map,
    ap: P.ap,
    of: P.of});


// TODO: P.allList


P.allObj = o => {
  const keys = Object.keys(o);

  return P(k => {
    const xs = Array(keys.length),
      p = Object.assign({}, o); // preserve prop order

    let i = 0;

    return keys.map((key, j) => {
      return o[key].run(x => {
        if (i < keys.length) {
          if (xs[j] === undefined) {
            p[key] = x;
            xs[j] = null;
            i++;
          }

          if (i === keys.length) return k(p);
          else return null;
        }

        else return null;
      });
    });
  });
};


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


P.or = tx => ty => {
  return P(k => {
    let i = 0;

    return [tx, ty].map(tz => {
      return tz.run(z => {
        if (i === 0) {
          i++;
          return k(z);
        }

        else return null;
      });
    });
  });
};


P.any = () =>
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
█████ Semigroup (Argument) ████████████████████████████████████████████████████*/


P.append = ({append}) => tx => ty =>
  P(k =>
    P.and(tx) (ty)
      .run(([x, y]) =>
        k(append(x) (y))));


P.Semigroup = {append: P.append};

  
/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


P.Race = {};


P.Race.append = P.or;


/*
█████ Semigroup :: Monoid (Argument) ██████████████████████████████████████████*/


P.empty = empty =>
  P(k => k(empty));


P.Monoid = {
  ...P.Semigroup,
  empty: P.empty
};


/*
█████ Semigroup :: Monoid (Race) ██████████████████████████████████████████████*/


P.Race.empty = P(k => null);


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


P.capture = tx => P(k => tx.run(x => k(Pair(k, x))));


P.flatmap = mx => fm => // monad-like
  P(k => mx.run(x => fm(x).run(k)));


P.flatten = mmx => // monad like
  P(k => mmx.run(mx => mx.run(k)));


P.once = tx => {
  let x = lazy(() => {
    throw new Err("race condition");
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


P.reify = k => x => P(k2 => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


P.all = P.all();


P.any = P.any();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ PARALLEL :: EXCEPT ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Parallel` extended to asynchronous exceptions. A similar behavior can be
achieved by using `Parallel` as a monad transformer and handling exceptions
inside the `run` method (the impure shell) using the `Except` type. As with
all continuation based monads there is no transformer available. */


export const ParallelExcept = ks => ({
  [TAG]: "Parallel.Except",
  run: ks,

  get runOnce() {
    delete this.runOnce;

    Object.defineProperty(this, "runOnce", {
      get() {throw new Err("race condition")},
      configurable: true,
      enumerable: true
    });
    
    return o => ks({
      raise: o.raise,

      proceed: x => {
        const r = o.proceed(x);
        delete this.runOnce;
        this.runOnce = _ => o.proceed(x);
        return r;
      }
    });
  },

  runAsync: o => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_CONTINGENCY)
      return Promise.resolve(null).then(_ => ks(o));

    else return ks(o);
  }
});


export const Pex = ParallelExcept; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Pex.fromParallel = tx => ({
  [TAG]: "Parallel.Except",
  run: ({raise: k, proceed: k2}) => tx.run(k2),
  runAsync: ({proceed: f}) => tx.runAsync(f)
});


Pex.fromSerial = tx => ({
  [TAG]: "Parallel.Except",
  run: ({raise: k, proceed: k2}) => tx.run(k2),
  runAsync: ({proceed: f}) => tx.runAsync(f)
});


Pex.fromSex = tx => ({
  [TAG]: "Parallel.Except",
  run: tx.run,
  runAsync: tx.runAsync
});


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
█████ Constants ███████████████████████████████████████████████████████████████*/


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


/* map all letters derived from the latin alphabet to their most appropriate
ASCII representation. */

Object.defineProperty(Parser, "DERIVED_LETTERS", {
  get() {
    const m = new Map([
      ["Æ", "AE"], ["æ", "ae"], ["Ä", "Ae"], ["ä", "ae"], ["Œ", "OE"],
      ["œ", "oe"], ["Ö", "Oe"], ["ö", "oe"], ["ß", "ss"], ["ẞ", "ss"],
      ["Ü", "Ue"], ["ü", "ue"], ["Ⱥ", "A"], ["ⱥ", "a"], ["Ɑ", "A"],
      ["ɑ", "a"], ["ɐ", "a"], ["ɒ", "a"], ["Ƀ", "B"], ["ƀ", "b"],
      ["Ɓ", "B"], ["ɓ", "b"], ["Ƃ", "b"], ["ƃ", "b"], ["ᵬ", "b"],
      ["ᶀ", "b"], ["Ƈ", "C"], ["ƈ", "c"], ["Ȼ", "C"], ["ȼ", "c"],
      ["Ɗ", "D"], ["ɗ", "d"], ["Ƌ", "D"], ["ƌ", "d"], ["ƍ", "d"],
      ["Đ", "D"], ["đ", "d"], ["ɖ", "d"], ["ð", "d"], ["Ɇ", "E"],
      ["ɇ", "e"], ["ɛ", "e"], ["ɜ", "e"], ["ə", "e"], ["Ɠ", "G"],
      ["ɠ", "g"], ["Ǥ", "G"], ["ǥ", "g"], ["ᵹ", "g"], ["Ħ", "H"],
      ["ħ", "h"], ["Ƕ", "H"], ["ƕ", "h"], ["Ⱨ", "H"], ["ⱨ", "h"],
      ["ɥ", "h"], ["ɦ", "h"], ["ı", "i"], ["Ɩ", "I"], ["ɩ", "i"],
      ["Ɨ", "I"], ["ɨ", "i"], ["Ɉ", "J"], ["ɉ", "j"], ["ĸ", "k"],
      ["Ƙ", "K"], ["ƙ", "k"], ["Ⱪ", "K"], ["ⱪ", "k"], ["Ł", "L"],
      ["ł", "l"], ["Ƚ", "L"], ["ƚ", "l"], ["ƛ", "l"], ["ȴ", "l"],
      ["Ⱡ", "L"], ["ⱡ", "l"], ["Ɫ", "L"], ["ɫ", "l"], ["Ľ", "L"],
      ["ľ", "l"], ["Ɯ", "M"], ["ɯ", "m"], ["ɱ", "m"], ["Ŋ", "N"],
      ["ŋ", "n"], ["Ɲ", "N"], ["ɲ", "n"], ["Ƞ", "N"], ["ƞ", "n"],
      ["Ø", "O"], ["ø", "o"], ["Ɔ", "O"], ["ɔ", "o"], ["Ɵ", "O"],
      ["ɵ", "o"], ["Ƥ", "P"], ["ƥ", "p"], ["Ᵽ", "P"], ["ᵽ", "p"],
      ["ĸ", "q"], ["Ɋ", "Q"], ["ɋ", "q"], ["Ƣ", "Q"], ["ƣ", "q"],
      ["Ʀ", "R"], ["ʀ", "r"], ["Ɍ", "R"], ["ɍ", "r"], ["Ɽ", "R"],
      ["ɽ", "r"], ["Ƨ", "S"], ["ƨ", "s"], ["ȿ", "s"], ["ʂ", "s"],
      ["ᵴ", "s"], ["ᶊ", "s"], ["Ŧ", "T"], ["ŧ", "t"], ["ƫ", "t"],
      ["Ƭ", "T"], ["ƭ", "t"], ["Ʈ", "T"], ["ʈ", "t"], ["Ʉ", "U"],
      ["ʉ", "u"], ["Ʋ", "V"], ["ʋ", "v"], ["Ʌ", "V"], ["ʌ", "v"],
      ["ⱴ", "v"], ["ⱱ", "v"], ["Ⱳ", "W"], ["ⱳ", "w"], ["Ƴ", "Y"],
      ["ƴ", "y"], ["Ɏ", "Y"], ["ɏ", "y"], ["ɤ", "Y"], ["Ƶ", "Z"],
      ["ƶ", "z"], ["Ȥ", "Z"], ["ȥ", "z"], ["ɀ", "z"], ["Ⱬ", "Z"],
      ["ⱬ", "z"], ["Ʒ", "Z"], ["ʒ", "z"], ["Ƹ", "Z"], ["ƹ", "z"],
      ["Ʒ", "Z"], ["ʒ", "z"]
    ]);

    delete this.DERIVED_LETTERS;
    this.DERIVED_LETTERS = m;
    return m;
  }
});


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
  * stack-safe due to asynchronous calls
  * no transformer available (only as base monad)

`runAsync` wraps the value of type `Serial` in a `Promise` for every xth
invocation. Promise handlers are executed within the next microtask queue and
thus stack safe by design. Since `Serial` doesn't rely on return values but
only on continuations, wrapping them into another data type is a transparent
operation. */


export const Serial = k => ({
  [TAG]: "Serial",
  run: k,

  get runOnce() {
    delete this.runOnce;

    Object.defineProperty(this, "runOnce", {
      get() {throw new Err("race condition")},
      configurable: true,
      enumerable: true
    });
    
    return f => k(x => {
      const r = f(x);
      delete this.runOnce;
      this.runOnce = _ => f(x);
      return r;
    });
  },

  runAsync: f => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_CONTINGENCY)
      return Promise.resolve(null).then(_ => k(f));

    else return k(f);
  }
});


export const S = Serial; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


S.fromPex = k => tx => ({
  [TAG]: "Serial",
  run: k2 => tx.run({raise: k, proceed: k2}),
  runAsync: f => tx.runAsync({raise: k, proceed: f})
});


S.fromParallel = tx => ({
  [TAG]: "Serial",
  run: tx.run,
  runAsync: tx.runAsync
});


S.fromSex = k => tx => ({
  [TAG]: "Serial",
  run: k2 => tx.run({raise: k, proceed: k2}),
  runAsync: f => tx.runAsync({raise: k, proceed: f})
});


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


S.and = tx => ty =>
  S(k =>
    tx.run(x =>
      ty.run(y =>
        k(Pair(x, y)))));


S.all = () =>
  A.seqA({
    map: S.map,
    ap: S.ap,
    of: S.of});


// TODO: S.allList


S.allObj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return S(k =>
      acc.run(p =>
        o[key].run(x =>
          k((p[key] = x, p)))));
  }, S.of({}));
};


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
█████ Semigroup ███████████████████████████████████████████████████████████████*/


S.append = ({append}) => tx => ty =>
  S(k => S.and(tx) (ty)
    .run(([x, y]) => k(append(x) (y))));


S.Semigroup = {append: S.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


S.empty = empty => S(k => k(empty));


S.Monoid = {
  ...S.Semigroup,
  empty: S.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


S.capture = tx => S(k => tx.run(x => k(Pair(k, x))));


S.once = tx => {
  let x = lazy(() => {
    throw new Err("race condition");
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


S.reify = k => x => S(k2 => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


S.all = S.all();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ SERIAL :: EXCEPT ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Serail` extended to asynchronous exceptions. A similar behavior can be
achieved by using `Serial` as a monad transformer and handling exceptions
inside the `run` method (the impure shell) using the `Except` type. As with
all continuation based monads there is no transformer available. */


export const SerialExcept = ks => ({
  [TAG]: "Serial.Except",
  run: ks,

  get runOnce() {
    delete this.runOnce;

    Object.defineProperty(this, "runOnce", {
      get() {throw new Err("race condition")},
      configurable: true,
      enumerable: true
    });
    
    return o => ks({
      raise: o.raise,

      proceed: x => {
        const r = o.proceed(x);
        delete this.runOnce;
        this.runOnce = _ => o.proceed(x);
        return r;
      }
    });
  },

  runAsync: o => { // extra stack-safety for edge cases
    if (Math.random() < MICROTASK_CONTINGENCY)
      return Promise.resolve(null).then(_ => ks(o));

    else return ks(o);
  }
});


export const Sex = SerialExcept; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Sex.fromParallel = tx => ({
  [TAG]: "Serial.Except",
  run: ({raise: k, proceed: k2}) => tx.run(k2),
  runAsync: ({raise: k, proceed: f}) => tx.runAsync(f)
});


Sex.fromPex = tx => ({
  [TAG]: "Serial.Except",
  run: tx.run,
  runAsync: tx.runAsync
});


Sex.fromSerial = tx => ({
  [TAG]: "Serial.Except",
  run: ({raise: k, proceed: k2}) => tx.run(k2),
  runAsync: ({raise: k, proceed: f}) => tx.runAsync(f)
});


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


Sex.all = () =>
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
        proceed: ([f, x]) => k2(f(x))
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
      proceed: x => fm(x).run({raise: k, proceed: k2})
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
      proceed: ([x, y]) => k2(append(x) (y))
    }));


Sex.Semigroup = {append: Sex.append};


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
    throw new Err("race condition");
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


Sex.reify = tx =>
  Sex(({raise: k, proceed: k2}) =>
    tx.run({raise: k, proceed: x => k2(Triple(x, k, k2))}));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Sex.all = Sex.all();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const _Set = {}; // namespace


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


_Set.entries = s => s[Symbol.iterator] ();


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


_Set.has = k => s => s.has(k);


_Set.set = k => s => s.add(k);


_Set.del = k => s => s.delete(k);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STREAM ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes the concept of supplying a meaningful chunk of data synchronously
one at a time from a potentially infinite source along with a function to
request the next chunk. The type uses a lazy object getter to suspend the
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


Stream.Alt = {
  ...Stream.Functor,
  alt: Stream.alt
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
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


Stream.Alternative = {
  ...Stream.Plus,
  ...Stream.Applicative
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


Stream.Semigroup = {append: Stream.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Stream.empty = Stream.Nis;


Stream.Monoid = {
  ...Stream.Semigroup,
  empty: Stream.empty
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Stream.Traversable = Stream.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Str = {}; // namespace


Str.catWith = s => (...xs) => xs.join(s);


Str.cat = Str.catWith("");


Str.cat_ = Str.catWith(" ");


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THESE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes a fundamental sum type - logical and/or - (A & B) || A || B


export const These = variant("These", "This", "That", "Both") (cons, cons, cons2);


These.pattern = O.init("this", "that", "both");


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


These.cata = _this => that => both => tx => tx.run({ // elimination rule
  this: _this,
  that,
  both
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


These.map = f => tx => tx.run({
  this: x => These.This(f(x)),
  that: _ => tx,
  both: x => y => These.Both(f(x)) (y)
});


These.Functor = {map: These.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


These.alt = tx => ty => tx.run({
  this: _ => tx,
  that: _ => ty,
  both: x => _ => These.This(x)
});


These.Alt = {
  ...These.Functor,
  alt: These.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


These.zero = ({empty}) => These.That(empty);


These.Plus = {
  ...These.Alt,
  zero: These.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


These.ap = ({append}) => tf => tx => tf.run({
  this: f => tx.run({
    this: x => These.This(f(x)),
    that: y => These.Both(f) (y),
    both: x => y => These.Both(f(x)) (y)
  }),

  that: y => tx.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(append(y) (y2)),
    both: x => y => These.Both(x) (append(y) (y2))
  }),

  both: f => y => tx.run({
    this: x => These.Both(f(x)) (y),
    that: y => These.Both(f) (y),
    both: x => y2 => These.Both(f(x)) (append(y) (y2))
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
  this: x => fm(x),
  that: _ => mx,

  both: x => y => fm(x).run({
    this: x2 => These.Both(x2) (y),
    that: y2 => These.Both(x) (append(y) (y2)),
    both: x2 => y2 => These.Both(x2) (append(y) (y2))
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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


These.append = ({append}, {append: append2}) => tx => ty => tx.run({
  this: x => ty.run({
    this: x2 => These.This(append(x) (x2)),
    that: y => These.Both(x) (y),
    both: x2 => y => These.Both(append(x) (x2)) (y),
  }),

  that: y => ty.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(append2(y) (y2)),
    both: x => y2 => These.Both(x) (append2(y) (y2)),
  }),

  both: x => y => ty.run({
    this: x2 => These.Both(append(x) (x2)) (y),
    that: y2 => These.Both(x) (append2(y) (y2)),
    both: x2 => y2 => These.Both(append(x) (x2)) (append2(y) (y2)),
  })
});


These.Semigroup = {append: These.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


These.empty = ({empty}) => These.That(empty);


These.Monoid = {
  ...These.Semigroup,
  empty: These.empty
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


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


/* The elimination rule of the type. Catamorphisms are more general and thus
more expressive than folds, because they factor all value constructors in.
`Either` has two constructors and the catamorphism receives two functions
accordingly, one for each constructor. A fold on the other hand has only a
single function `f` and a constant `acc`, i.e. it is one function short to
fully cover `Either`'s cases. For this reason catamorphism and fold coincide
for `List` and `Option`, because both types comprise one type constructor
(`Cons`/`Some`) and one type constant (`Nil`/`None`).

Catamorphisms are usually defined as a loop to avoid stack overflows. However,
the depth of a more or less balanced tree should regularly not exhaust the call
stack, hence it is recursively defined. */


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


Tree.Foldable = {
  foldl: Tree.foldl,
  foldr: Tree.foldr,
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Tree.map = f => Tree.cata(x => xs => Tree.Node(f(x)) (xs));


Tree.Functor = {map: Tree.map};


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
  0: x,
  1: y,
  length: 2,

 [Symbol.iterator]: function*() {
    yield x;
    yield y;
  }  
});


// constructor to define lazy getters

export const Pair_ = o => {
  o[TAG] = "Pair";
  o.length = 2;

  o[Symbol.iterator] = function*() {
    yield o[0];
    yield o[1];
  };

  return o;
};


/*
█████ Extracting ██████████████████████████████████████████████████████████████*/


Pair.fst = tx => tx[1];


Pair.snd = tx => tx[2];


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


Pair.bimap = f => g => tx => Pair(f(tx[0]), g(tx[1]));


Pair.Bifunctor = ({
  ...Pair.Functor,
  bimap: Pair.bimap
});


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


Pair.extend = fw => wx => Pair(wx[0], fw(wx));


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
█████ Getters/Setters █████████████████████████████████████████████████████████*/


Pair.setFst = x => tx => Pair(x, tx[1]);


Pair.setSnd = x => tx => Pair(tx[0], x);


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Pair.mapFst = f => tx => Tuple(k => tx.run((x, y) => Pair(f(x), y)));


Pair.swap = tx => Pair(tx[1], tx[0]);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████ TUPLE :: PAIR :: WRITER :: TRANSFORMER ████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Writer = mmx => ({ // constructor
  [TAG]: "Writer",
  run: mmx
});


// transformer type: m (a, b)


export const W = Writer; // shortcut


W.T = outer => thisify(o => { // outer monad's type classes


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromPair = pair => Writer(outer.of(pair));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => Writer(outer.map(mx => Pair(f(mx[0]), mx[1])) (mmx.run));


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = ({append}) => mmf => mmx =>
    Writer(outer.ap(outer.map(mx => my =>
      Pair(mx[0] (my[0]), append(mx[1]) (my[1])))
        (mmf.run)) (mmx.run));


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = ({empty}) => x => Writer(outer.of(Pair(x, empty)));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = ({append}) => mmx => fmm =>
    Writer(outer.chain(mmx.run) (mx =>
      outer.map(my =>
        Pair(my[0], append(mx[1]) (my[1])))
          (fmm(mx[0]).run)));


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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  o.append = ({append}, {append: append2}) => mmx => mmy =>
    Writer(outer.chain(mmx.run) (mx =>
      outer.map(my => Pair(
        append(mx[0]) (my[0]),
        append2(mx[1]) (my[1])))
          (mmy.run)));


  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = ({empty}, {empty: empty2}) => Writer(outer.of(Pair(empty, empty2)));


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  o.lift = ({empty}) => mx => Writer(chain(mx) (x => of(Pair(x, empty))));


  // TODO


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


  o.censor = f => mmx => Writer(outer.map(mx =>
    Pair(mx[0], f(mx[1]))) (mmx.run));

  o.censor = f => tx => Writer(of(Pair(tx[0], f(tx[1]))));


  o.exec = mmx => outer.map(mx => mx[1]) (mmx.run);


  o.listen = mmx => Writer(outer.map(mx =>
    Pair(Pair(mx[0], mx[1]), mx[1])) (mmx.run));


  o.listens = f => mmx => Writer(outer.map(mx =>
    Pair(Pair(mx[0], f(mx[1])), mx[1])) (mmx.run));


  o.pass = mmx => Writer(outer.map(mx =>
    Pair(Pair(mx[0] [0], mx[0] [1] (mx[1])))) (mmx.run));


  o.tell = x => Writer(of(Pair(null, x)));

  
  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ TUPLE :: TRIPLE ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Triple = (x, y, z) => ({
  [TAG]: "Triple",
  0: x,
  1: y,
  2: z,
  length: 3,

  [Symbol.iterator]: function*() {
    yield x;
    yield y;
    yield z;
  }
});


// constructor to define lazy getters

export const Triple_ = o => {
  o[TAG] = "Triple";
  o.length = 3;

  o[Symbol.iterator] = function*() {
    yield o[0];
    yield o[1];
    yield o[2];
  };

  return o;
};


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
█████████████████████████████████ RESOLVE DEP █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


A.unzip = A.unzip();


export const compareOn = compareOn_();

  
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


FileSys.error = fs => cons => thisify(o => { // cons = S | P
  if (cons.name !== "Serial" && cons.name !== "Parallel")
    throw new Err("invalid asynchronous constructor");

  o.copy = src => dest =>
    cons(k =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e => e
        ? _throw(new Err(e))
        : k(Pair(src, dest))));

  o.move = src => dest =>
    cons.and(
      o.copy(src) (dest))
        (o.unlink(src));

  o.read = opt => path =>
    cons(k =>
      fs.readFile(path, opt, (e, x) =>
        e ? _throw(new Err(e)) : k(x)));

  o.scanDir = path =>
    cons(k =>
      fs.readdir(path, (e, xs) =>
        e ? _throw(new Err(e)) : k(xs)));

  o.stat = path =>
    cons(k =>
      fs.stat(path, (e, o) =>
        e ? _throw(new Err(e)) : k(o)));

  o.unlink = path =>
    cons(k =>
      fs.unlink(path, e =>
        e ? _throw(new Err(e)) : k(path)));

  o.write = opt => path => s =>
    cons(k =>
      fs.writeFile(path, s, opt, e =>
        e ? _throw(new Err(e)) : k(s)));

  return o;
});


FileSys.except = fs => cons => thisify(o => { // cons = Sex / Pex
  if (cons.name !== "SerialExcept" && cons.name !== "ParallelExcept")
    throw new Err("invalid asynchronous constructor");

  o.copy = src => dest =>
    cons(({raise: k, proceed: k2}) =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e => e
        ? k({e: new Exception(e), k: k2, args: [src, dest]})
        : k2(Pair(src, dest))));

  o.move = src => dest =>
    cons.and(
      o.copy(src) (dest))
        (o.unlink(src));

  o.read = opt => path =>
    cons(({raise: k, proceed: k2}) =>
      fs.readFile(path, opt, (e, x) => e
        ? k({e: new Exception(e), k: k2, args: [opt, path]})
        : k2(x)));

  o.scanDir = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.readdir(path, (e, xs) => e
        ? k({e: new Exception(e), k:k2, args: [path]})
        : k2(xs)));

  o.stat = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.stat(path, (e, o) => e
        ? k({e: new Exception(e), k: k2, args: [path]})
        : k2(o)));

  o.unlink = path =>
    cons(({raise: k, proceed: k2}) =>
      fs.unlink(path, e => e
        ? k({e: new Exception(e), k: k2, args: [path]})
        : k2(path)));

  o.write = opt => path => s =>
    cons(({raise: k, proceed: k2}) =>
      fs.writeFile(path, s, opt, e => e
        ? k({e: new Exception(e), k: k2, args: [opt, path, s]})
        : k2(s)));

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

  else throw new Err("unexpected branch");
};


RB.turnR = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new Err("leaves cannot turn color");

  else return RB.Node(
    RB.RED, h, l, k, v, r);
};


RB.turnB = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new Err("leaves cannot turn color");

  else return RB.Node(
    RB.BLACK, h, l, k, v, r);
};


RB.turnB_ = t => {
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;
    case "Node": return RB.Node(RB.BLACK, t.h, t.l, t.k, t.v, t.r);
    default: throw new Err("invalid value constructor");
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

      default: throw new Err("invalid constructor");
    }
  }
};


RB.cata_ = node => leaf => function go(t) { // lazy version
  switch (t[TAG]) {
    case "Leaf": return leaf;
    
    case "Node": return node([t.k, t.v])
      (lazy(() => go(t.l)))
        (lazy(() => go(t.r)));

    default: throw new Err("invalid constructor");
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
        default: throw new Err("invalid value constructor");
      }
    }

    default: throw new Err("invalid value constructor");
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

  else throw new Err("unexpected branch");
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

  else throw new Err("unexpected branch");
};


RB.delMin = t =>{
  switch (t[TAG]) {
    case "Leaf": return RB.Leaf;

    case "Node": {
      const t2 = RB.delMin_(RB.turnR(t));

      switch (t2[TAG]) {
        case "Leaf": return RB.Leaf;
        case "Node": return RB.turnB(t2);
        default: throw new Err("invalid value constructor");
      }
    }

    default: throw new Err("invalid value constructor");
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
        default: Err("invalid value constructor");
      }
    }

    default: Err("invalid value constructor");
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
        default: throw new Err("invalid comparator");
      }
    }

    default: throw new Err("invalid value constructor");
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

  else throw new Err("unexpected branch");
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

  else throw new Err("unexpected branch");
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

  else throw new Err("unexpected branch");
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

  else throw new Err("unexpected branch");
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

    default: throw new Err("invalid constructor");
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

    default: throw new Err("invalid constructor");
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

    default: throw new Err("invalid constructor");
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
        default: throw new Err("invalid comparator");
      }
    }

    default: Err("invalid value constructor");
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
        default: throw new Err("invalid comparator");
      }
    }

    default: Err("invalid value constructor");
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

  else throw new Err("unexpected Leaf");
};


RB.max = t => {
  if (t[TAG] === "Node"
    && t.r[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return RB.max(t.r);

  else throw new Err("unexpected Leaf");
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

        default: throw new Err("invalid comparator");
      }
    }

    default: Err("invalid value constructor");
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
      default: throw new Err("invalid comparator");
    }
  }
};


RB.joinLT = (t1, t2, k, v, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RB.Node(RB.RED, t2.h + 1, t1, k, v, t2);

  else if (t2[TAG] === "Node")
    return RB.balanceL(t2.c, t2.h, RB.joinLT(t1, t2.l, k, v, h1, cmp), t2.k, t2.v, t2.r);

  else throw new Err("unexpected leaf");
};


RB.joinGT = (t1, t2, k, v, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RB.Node(RB.RED, t1.h + 1, t1, k, v, t2);

  else if (t1[TAG] === "Node")
    return RB.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RB.joinGT(t1.r, t2, k, v, h2, cmp));

  else throw new Err("unexpected leaf");
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
      default: throw new Err("invalid comparator");
    }
  }
};


RB.mergeLT = (t1, t2, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RB.mergeEQ(t1, t2, cmp);

  else if (t2[TAG] === "Node")
    return RB.balanceL(t2.c, t2.h, RB.mergeLT(t1, t2.l, h1, cmp), t2.k, t2.v, t2.r);

  else throw new Err("unexpected leaf");
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

  else throw new Err("unexpected branch");
};


RB.mergeGT = (t1, t2, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RB.mergeEQ(t1, t2, cmp);

  else if (t1[TAG] === "Node")
    return RB.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RB.mergeGT(t1.r, t2, h2, cmp));

  else throw new Err("unexpected leaf");
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

      default: throw new Err("invalid comparator");
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

  * add monad combinators: filterM
  * add Represantable type class
  * add Distributive type class
  * add foldl1/foldr1 to all container types
  * conversion: fromFoldable instead of fromList/fromArray
  * delete S.once/P.once etc. provided it is redundant

*/

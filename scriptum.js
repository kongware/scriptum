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
████████████████████████████ CROSS-CUTTING ASPECTS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const PREFIX = "$riptum_"; // avoid property name collisions


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


export const TAG = Symbol.toStringTag;


/*
█████ Native Order Protocol ███████████████████████████████████████████████████*/


export const LT = {[TAG]: "Ordering", tag: "LT", valueOf: () => -1};


export const EQ = {[TAG]: "Ordering", tag: "EQ", valueOf: () => 0};


export const GT = {[TAG]: "Ordering", tag: "GT", valueOf: () => 1};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ STATE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* The monadic types for asynchronous computation used in this library are not
stack safe by default. However, for large asynchronous computations you can run
these types with a special method that utilizes stack safe promises. Every time
the asynchronous counter is greater than a hundred, the monadic asynchronous
type is wrapped in a native promise and the counter is reset to zero. The
counter is shared between all running asynchronous operations.

TODO: use counters as free variables of closures to separate them for each
asynchrounous operation */

let asyncCounter = 0; // upper bound: 100


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ ALGEBRAIC DATA TYPES █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Product Type ████████████████████████████████████████████████████████████*/


/* Functions that mimic product types expect more than a single argument. The
library utilizes a plain old Javascript object to feed them into the function.
This approach has several advantages:

* arguments are annotated
* only one function call necessary
* tests for exhaustiveness

However, the partially applied function cannot be used in curried form anymore.

You can still use curried and uncurried functions that mimic product types, ofc:

* x => y => {...}
* (x, y) => {...} */

export const product = type => (...ks) => o => {
  for (const k of ks)
    if (!(k in o)) throw new Err(`missing parameter "${k}"`);

  return {
    [TAG]: type,
    get: o,
    run: f => f(o)
  };
};


/*
█████ Variant Types ███████████████████████████████████████████████████████████*/


/* Variant types encode the idea of logical exclusive or relation between cases
(variants) of a type and constructors. As with product types, scriptum mimics
variant types with functions. Here is an example:

  const Either = variant("Either", "Left", "Right") (cons0, cons);

  const tx = Either.Right(5),
    ty = Either.Left;

  tx.run(Either.match({left: 0, right: x => x * x})); // yields 25
  ty.run(Either.match({left: 0, right: x => x * x})); // yields 0

`Either` is the type constructor and `Either.Left`/`Either.Right` are value
constructors. `Either.match` is an auxiliary function to create typed objects
that include an exhaustiveness check. Alternatively, the bare case object can
be passed but it is the responsibility of the caller to supply all cases.

Variant types encoded with functions hide the data as free variables of
closures and thus make debugging more complicated. For this reason all data
is revealed through an object property.

The `consn` constructor encodes product within variant types, i.e. the idea
of variants of products and vice versa. */

export const variant = (type, ...tags) => (...cons) => {
  if (tags.length !== cons.length)
    throw new Err("malformed variant type");

  const o = tags.reduce((acc, tag, i) => {
    acc[tag] = cons[i] (type, tag, tag[0].toLowerCase() + tag.slice(1));
    return acc;
  }, {});

  o.match = O.matchPattern(...tags.map(tag =>
    tag[0].toLowerCase() + tag.slice(1)));

  return o;
};


// constant

export const cons0 = (type, tag, k) =>
  ({[TAG]: type, get: null, run: ({[k]: x}) => x, tag});


// single paremeter constructor

export const cons = (type, tag, k) => x =>
  ({[TAG]: type, get: x, run: ({[k]: f}) => f(x), tag});


// binary constructor

export const cons2 = (type, tag, k) => x => y =>
  ({[TAG]: type, get: [x, y], run: ({[k]: f}) => f(x) (y), tag});


// multi named parameter constructor (product)

export const consn = (...ks) => (type, tag, k) => o => {
  for (const k2 of ks)
    if (!(k2 in o)) throw new Err(`missing parameter "${k2}"`);

  return {
    [TAG]: type,
    get: o,
    run: ({[k]: f}) => f(o),
    tag
  };
};


// `consn` can also be used to create lazy properties using object getters

export const consLazy = consn;


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ ERRORS ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Err = Error; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ EXCEPTIONS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Exceptions denote errors that are not immediately thrown but dynamically
handled by the operation they occur in. Usually used along with the monadic
`Except` type. */

export class Exception extends Error {
  constructor(s) {
    super(s);
    Object.defineProperty(this, TAG, {value: "Exception"});
  }
};


/* Exception type that accumulates individual exceptions. Useful when you need
to log errors/exceptions for later reporting. */

export class Exceptions extends Exception {
  constructor(...es) {
    super();
    Object.defineProperty(this, TAG, {value: "Exceptions"});
    this.errors = []; // excepts `Error` and subclasses

    es.forEach(e => {
      if (e.constructor.name === "Exceptions")
        this.errors.push.apply(this.errors, e.errors);

      else this.errors.push(e);
    });
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LAZY EVALUATION ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Lazy evaluation has the following properties:

  * evaluate only when needed
  * evaluate only as far as necessary (to WHNF)
  * evaluate at most once (sharing)

scriptum realizes lazy evaluation using implicit thunks, i.e. thunks like
`() => expr` are hidden behind a proxy and thus are called implicitly:

  * expr + x
  * expr.foo
  * expr < x

In all three operations `expr` as an implicit thunk is evaluated. You can also
call implicit thunks as if it were explicit ones, i.e. `expr()` works even if
the expression within the implicit thunk isn't a function.

There are some limitations to this Proxy-based thunk approach:

  * `typeof` isn't intercepted by the proxy (thus yields `object`)
  * `===` doesn't trigger evaluation
  * `&&`/`||` doesn't trigger evaluation
  * `throw` doesn't trigger evaluation

These limitations are considered throughout the library. Please note that
besides implicit thunks scriptum also encodes a `Lazy` type that hides thunks
behind a monadic interface. */


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


const DETHUNK = PREFIX + "dethunk";


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/*
█████ API █████████████████████████████████████████████████████████████████████*/


export const strict = x => {
  if (x && x[THUNK]) return x[DETHUNK];
  else return x;
};


export const lazy = thunk =>
  new Proxy(thunk, new Thunk());


/*
█████ Implementation Details ██████████████████████████████████████████████████*/


class Thunk {
  constructor() {
    this.memo = NULL;
  }

  apply(f, that, args) {

    // enforce evalutation to WHNF

    if (this.memo === NULL) {
      this.memo = f();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    if (typeof this.memo === "function") this.memo = this.memo(...args);

    // allow implicit thunks to be called explicitly

    else if (args.length === 0) return this.memo;
    else throw Err("call of a non-callable thunk");
  }

  get(f, k, p) {

    // prevent evaluation in case of introspection
    
    if (k === THUNK) return true;
    else if (k === "constructor") return Thunk;

    // enforce evaluation of a single layer

    else if (k === EVAL) {
      if (this.memo === NULL) {
        this.memo = f();
        return this.memo;
      }

      else if (this.memo && this.memo[THUNK] === true) {
        this.memo = this.memo[EVAL];
        return this.memo;
      }

      else return this.memo;
    }

    // enforce evaluation to WHNF

    else if (k === DETHUNK) {
      if (this.memo === NULL) {
        this.memo = f();
        
        while (this.memo && this.memo[THUNK] === true)
          this.memo = this.memo[EVAL];
      }

      return this.memo;
    }

    // intercept implicit type casts

    else if (k === Symbol.toPrimitive
      || k === "valueOf"
      || k === "toString") {
        if (this.memo === NULL) {
          this.memo = f();
          
          while (this.memo && this.memo[THUNK] === true)
            this.memo = this.memo[EVAL];
        }

        if (Object(this.memo) === this.memo) return this.memo[k];
        
        else if (k === Symbol.toPrimitive) return hint =>
          hint === "string" ? String(this.memo) : this.memo;

        else if (k === "valueOf") return () => this.memo;
        else return () => String(this.memo);
    }

    // enforce evaluation to WHNF due to array context

    else if (k === Symbol.isConcatSpreadable) {
      if (this.memo === NULL) {
        this.memo = f();
        
        while (this.memo && this.memo[THUNK] === true)
          this.memo = this.memo[EVAL];
      }

      if (this.memo[Symbol.isConcatSpreadable]) return true;
      else return false;
    }

    // enforce evaluation to WHNF due to property access

    else {
      if (this.memo === NULL) {
        this.memo = f();
        
        while (this.memo && this.memo[THUNK] === true)
          this.memo = this.memo[EVAL];
      }

      // take method binding into account

      if (Object(this.memo) === this.memo 
        && this.memo[k]
        && this.memo[k].bind)
          return this.memo[k].bind(this.memo);

      else return this.memo[k];
    }
  }

  getOwnPropertyDescriptor(f, k) {

    // force evaluation to WHNF

    if (this.memo === NULL) {
      this.memo = f();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(f, k) {

    // prevent evaluation in case of introspection

    if (k === THUNK) return true;

    // enforce evaluation to WHNF

    if (this.memo === NULL) {
      this.memo = f();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return k in this.memo;
  }

  ownKeys(o) {

    // enforce evaluation to WHNF

    if (this.memo === NULL) {
      this.memo = f();
      
      while (this.memo && this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return Reflect.ownKeys(this.memo);
  }

  set(o) {
    throw new Err("set op on immutable value");
  }
}


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ OVERLOADED OPERATORS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Javascript built-in overloaded operators as functions. Some of them only
make sense with implicit/explicit thunks. For example, with `and` you would
lose the lazy evaluation property of the `&&` operator, if you pass them as
expressions not wrapped in a thunk/function. */


export const and = f => g => f() && g();


export const compare = x => y => x < y ? LT : x > y ? GT : EQ;


export const compareOn_ = () => compBoth(compare);


export const eq = x => y => x === y;


// works with implicit and explicit thunks

export const eqLazy = f => g => f() === g();


export const gt = x => y => x > y;


export const gte = x => y => x >= y;


export const iff = (t, f) => x => y => {
  if (x && y) return t;
  else if (!x && !y) return t;
  else return f;
}


export const implies = (t, f) => x => y => {
  if (x) {
    if (y) return t;
    else return f;
  }

  else return t;
}


export const lt = x => y => x < y;


export const lte = x => y => x <= y;


export const max = x => y => x >= y ? x : y;


export const min = x => y => x <= y ? x : y;


export const notEq = x => y => x !== y;


export const or = f => g => f() || g();


export const xor = x => y => {
  if (x && !y) return x;
  else if (!x && y) return y;
  else return null;
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ PATTERN MATCHING ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* scriptum's "pattern matching utilizes native destructuring assignment to
come as close as possible to real pattern matching. Destructuring assignment
is insufficient for the following reasons:

  * it returns `Undefined` if the assumed outer layer of a composite value doesn't exist
  * it throws an error if an assumed nested layer of a composite value doesn't exist

`match` fixes these shortcomings by wrapping destructuring assignment in a
try/catch block. If an assignment throws an error, it is catched
and the current pattern match is discarded. If it returns `Undefined`, the
current pattern match is discraded as well. Here is a simple example:

  const patternMatch = match(
    caseOf(([x, y, z]) => [x, y, z])
      .feed(xs => "1st case"),

    caseOf(({foo: s}) => s)
      .feed(s => "2nd case"),

    caseOf(({bar: s}) => s)
      .feed(s => "3rd case"),

    caseOf(({baz: [m, n]}) => typeof m === "number" && typeof n === "number" ? [m, n] : undefined)
      .feed(n => "4th case"),

    caseOf(id) // default case
      .feed(_ => "default case"))
    
    patternMatch({baz: [1, 2]});

  // yields "4th case"

The approach comes with the following limitations:

  * there is no exhaustiveness check
  * within the `caseOf` function argument, each value assigned by destructuring
    must be manually checked for `undefined`
  * exotic features like native `Map`/`Set` values cannot be assigned by
    destructuring

Regarding the second point, if we wouldn't check the type of `n`, for instance,
the mismatch would remain undetected, because both variables are wrapped in an
array `[1, undefined]`, that is `undefined` is hidden inside a composite value. */


export const match = (...cases) => (...args) => {
  let r;

  for (const _case of cases) {
    try {
      r = _case(...args);
      if (r === undefined) continue;
      else break;
    } catch(e) {continue}
  }

  if (r && PATTERN_MATCH in r) return r[PATTERN_MATCH];
  else throw new Err("non-exhaustive pattern matching");
};


export const caseOf = f => ({
  feed: g => (...args) => {
    const r = f(...args);

    if (r === undefined) return r;
    else return {[PATTERN_MATCH]: g(r)};
  }
});


const PATTERN_MATCH = PREFIX + "pattern_match";


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████ PERSISTANT DATA STRUCTURES ██████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* TODO: Persistat data structures based on a minimal deque that in turn is
based on a double linked list. */


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ REIFICATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Reifies the object within a method chain thus enabling flat method chaining
with access to the object itself by not relying on `this`. */

export const Reify = t => ({
  app: x => Reify(t(x)), // applies the boxed fun
  app_: x => Reify(y => t(y) (x)), // applies the 2nd arg of the boxed fun
  map: f => Reify(f(t)),  // applies the fun
  map_: f => Reify(x => f(x) (t)), // applies the 2nd arg of the fun
  get: t // gets the boxed value
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ STACK SAFETY █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Tail Recursion ██████████████████████████████████████████████████████████*/


/* Stack-safe tail-recursion and mutual tail-recursion using a trampoline. The
`next` and `done` constructors are used to encode the recursive case and base
cases, respectively. Additionally, the `call` constructor is used to defer
function invocations. */


export const Loop = f => x => {
  let o = f(x);

  while (o.constructor !== Loop.base) {
    switch (o.constructor) {
      case Loop.call: {
        o = o.f(o.x);
        break;
      }

      case Loop.rec: {
        o = f(o.x);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid constructor");
    }
  }

  return o.x;
};


export const Loop2 = f => (x, y) => {
  let o = f(x, y);

  while (o.constructor !== Loop2.base) {
    switch (o.constructor) {
      case Loop2.call: {
        o = o.f(o.x, o.y);
        break;
      }

      case Loop2.rec: {
        o = f(o.x, o.y);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid tag");
    }
  }

  return o.x;
};


export const Loop3 = f => (x, y, z) => {
  let o = f(x, y, z);

  while (o.constructor !== Loop3.base) {
    switch (o.constructor) {
      case Loop3.call: {
        o = o.f(o.x, o.y, o.z);
        break;
      }

      case Loop3.rec: {
        o = f(o.x, o.y, o.z);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid tag");
    }
  }

  return o.x;
};


// constructors


Loop.call = (f, x) => ({constructor: Loop.call, f, x});


Loop.rec = x => ({constructor: Loop.rec, x});


Loop.base = x => ({constructor: Loop.base, x});


Loop2.call = (f, x, y) => ({constructor: Loop2.call, f, x, y});


Loop2.rec = (x, y) => ({constructor: Loop2.rec, x, y});


Loop2.base = x => ({constructor: Loop2.base, x});


Loop3.call = (f, x, y, z) => ({constructor: Loop3.call, f, x, y, z});


Loop3.rec = (x, y, z) => ({constructor: Loop3.rec, x, y, z});


Loop3.base = x => ({constructor: Loop3.base, x});


/*
█████ Tail Recurson Modulo Cons & Beyond ██████████████████████████████████████*/


/* Stack-safe recursion not in tail position using a trampoline. It is capable
of mimicking tail recursion modulo cons and more complex operations not in
tail position like the original Fibbonacci algorithm:

  const fib_ = n =>
    n <= 1 ? n
      : fib_(n - 1) + fib_(n - 2);

Transformed into the trampoline version it becomes:

  const add = x => y => x + y;

  const fib = Loopx(n =>
    n <= 1
      ? Loopx.base(n)
      : Loopx.call2(
          add,
          Loopx.rec(n - 1),
          Loopx.rec(n - 2))); */


export const Loopx = f => x => {
  const stack = [f(x)];

  while (stack.length > 1 || stack[0].constructor !== Loopx.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Loopx.call:
      case Loopx.call2: {
        o = f(o.x.x); // 1st x of call and 2nd x of next tag
        stack.push(o);
        break;
      }

      case Loopx.rec: {
        o = f(o.x);
        break;
      }

      case Loopx.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Loopx.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Loopx.call: {
              o = Loopx.base(p.f(o.x));
              stack.push(o);

              break;
            }

            case Loopx.call2: {
              o = Loopx.call(p.f(o.x), p.y);
              stack.push(o);
              break;
            }

            default: throw new Err("invalid constructor");
          }
        }

        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid constructor");
    }
  }

  return stack[0].x;
};


export const Loopx2 = f => (x, y) => {
  const stack = [f(x, y)];

  while (stack.length > 1 || stack[0].constructor !== Loopx2.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Loopx2.call:      
      case Loopx2.call2: {
        o = f(o.x.x, o.x.y);
        stack.push(o);
        break;
      }

      case Loopx2.rec: {
        o = f(o.x, o.y);
        break;
      }

      case Loopx2.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Loopx2.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Loopx2.call: {
              o = Loopx2.base(p.f(o.x, o.y));
              stack.push(o);

              break;
            }

            case Loopx2.call2: {
              o = Loopx2.call(p.f(o.x, o.y), p.y);
              stack.push(o);
              break;
            }

            default: throw new Err("invalid constructor");
          }
        }

        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid constructor");
    }
  }

  return stack[0].x;
};


// constructors


Loopx.call = (f, x) => ({constructor: Loopx.call, f, x});


Loopx.call2 = (f, x, y) => ({constructor: Loopx.call2, f, x, y});


Loopx.rec = x => ({constructor: Loopx.rec, x});


Loopx.base = x => ({constructor: Loopx.base, x});


Loopx2.call = (f, x) => ({constructor: Loopx2.call, f, x});


Loopx2.call2 = (f, x, y) => ({constructor: Loopx2.call2, f, x, y});


Loopx2.rec = x => y => ({constructor: Loopx2.rec, x, y});


Loopx2.base = x => ({constructor: Loopx2.base, x});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ TYPE CLASS COMBINATORS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FOLDABLE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const foldAll = Foldable => p => Foldable.foldr(x => acc =>
  p(x) ? acc : false) (true);


export const foldAnd = Foldable => Foldable.foldr(b => acc => b && acc) (true);


export const foldAny = Foldable => p => Foldable.foldr(x => acc =>
  p(x) ? true : acc) (false);


export const foldMapl = (Foldable, Monoid) => f =>
  Foldable.foldl(compSnd(Monoid.append) (f)) (Monoid.empty);


export const foldMapr = (Foldable, Monoid) => f =>
  Foldable.foldr(comp(Monoid.append) (f)) (Monoid.empty);


export const foldMax = (Foldable, Order) => tx => Foldable.foldl1(Order.max) (tx);


export const foldMin = (Foldable, Order) => tx => Foldable.foldl1(Order.min) (tx);


export const foldOr = Foldable => Foldable.foldr(b => acc => b || acc) (false);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ FUNCTOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const mapEff = Functor => x => Functor.map(_ => x);


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ FUNCTOR :: APPLY ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const apEff1 = Apply => tx => ty => Apply.ap(Apply.map(_const) (tx)) (ty);


export const apEff2 = Apply => tx => ty => Apply.ap(mapEff(Apply) (id) (tx)) (ty);


export const liftA2 = Apply => f => tx => ty => Apply.ap(Apply.map(f) (tx)) (ty);


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████ FUNCTOR :: APPLY :: CHAIN ██████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* It is possible to chain several monads of the same type in a principled
fashion while maintaining a flat composition syntax, provided all subsequent
invocations of the partially applied Kleisli action are wrapped in a minimal
functiorial context.

The approach leaks into the call side and adds some syntactical noise but there
is no better alternative:

  const chain2_ = chain2(Monad);
                         ^^^^^
                       type class

  chain2_([1,2,3]) ([4,5,6]) (x => x & 1 ? of(y => [x + y]) : []);
          ^^^^^^^   ^^^^^^^                ^^^^^^^^^^^^^^^^
           monad     monad         next computation depends on x */


export const chain2 = Chain => mx => my => fm =>
  Chain.chain(mx) (x => Chain.chain(fm(x)) (gm => Chain.chain(my) (gm)));


export const chain3 = Chain => mx => my => mz => fm =>
  Chain.chain(mx) (x =>
    Chain.chain(fm(x)) (gm =>
      Chain.chain(my) (y =>
        Chain.chain(gm(y)) (hm =>
          Chain.chain(mz) (hm)))));


export const chainn = Chain => (...ms) => fm => function go(gm, i) {
  if (i === ms.length) return gm;
  else return Chain.chain(ms[i]) (x => Chain.chain(gm(x)) (hm => go(hm, i + 1)));
} (fm, 0);


// collapsing two monadic contexts (of the same type) is the essence of a monad

export const join = Chain => mmx => Chain.chain(mmx) (id);


// ignore the result of the first monad

export const seq = Chain => mmx => mmy => Chain.chain(mmx) (_ => mmy);


/*
█████ Kleisli █████████████████████████████████████████████████████████████████*/


// composing of monadic actions: `a -> m a`


export const komp = Chain => fm => gm => x => Chain.chain(fm(x)) (gm);


export const kipe = Chain => gm => fm => x => Chain.chain(fm(x)) (gm);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ MONAD ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/



// (a -> m Boolean) -> [a] -> m [a]
export const filterM = Applicative => p => mx =>
  A.foldr(x => 
    liftA2(Applicative) (b =>
      b ? A.cons(x) : id) (p(x))) (Applicative.of([]));


// (b -> a -> m b) -> b -> t a -> m b
export const foldlM = (Foldable, Monad) => fm => init => mx =>
  Foldable.foldr(x => gm => acc =>
    Monad.chain(fm(acc) (x)) (gm)) (Monad.of) (mx) (init);


// (a -> b -> m b) -> b -> t a -> m b
export const foldrM = (Foldable, Monad) => fm => init => mx =>
  Foldable.foldl(gm => x => acc =>
    Monad.chain(fm(x) (acc)) (gm)) (Monad.of) (mx) (init);


/* TODO: unfoldM :: Monad m => (s -> m (Maybe (a, s))) -> s -> m [a]
unfoldM f s = do
    mres <- f s
    case mres of
        Nothing      -> return []
        Just (a, s') -> liftM2 (:) (return a) (unfoldM f s')*/


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


/* Deconstructs a composite value of type object and applies a curried function
with the initial, whole value and the deconstructed sub values. */

export const matchAs = f => deconstruct => o =>
  deconstruct(o).reduce((acc, arg) => acc(arg), f(o));


/* Allows the application of several binary combinators in sequence while
maintaining a flat syntax. Creates the following function call structures:

  (x, f, y, g, z) => g(f(x) (y)) (z)
  (x, f, y, g, z) => g(z) (f(x) (y))

There are two alternatives because binary functions can be composed in their
first or second argument. `ap` of applicative, for instance, composes in the
first argument, whereas functorial's `map` composes in the second one. */

const _infix = compFst => (...args) => {
  if (args.length === 0) throw new Err("no argument found");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else if (compFst) x = args[i++] (x) (args[i++]);
    else x = args[i++] (args[i++]) (x);
  }

  return x;
};


export const infix = _infix(true);


export const infix_ = _infix(false);


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


export const between = f => h => g => x => h(g(f(x)));


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


F.extend = Semigroup => f => g => x => f(y => g(Semigroup.append(x) (y)));


F.Extend = {
  ...F.Functor,
  extend: F.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


F.extract = Monoid => f => f(Monoid.empty);


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
  (phrase -> [word]) -> ([word] -> phrase) -> ([word] -> [word]) -> (phrase -> phrase) */


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


export const eff = f => x => (f(x), x);


/* Takes an arbitrary number of expressions or statements and returns an array
of evaluated values of each one. Useful if statements are mixed with expressions
or destructive operations return a value but also modify the initial reference
value (e.g. `effAll(xs.pop(), xs)`). */

export const effs = (...exps) => exps;


// like `effAll` but only returns the first evaluated value

export const effFirst = (...exps) => exps[0];


// like `effAll` but only returns the last evaluated value

export const effLast = (...exps) => exps[exps.length - 1];


export const _throw = e => { // throw as a first class expression
  throw e;
};


export const throw_ = f => {
  return {
    on: p => x => {
      if (p(x)) throw f(x);
      else return x;
    },

    notOn: p => x => {
      if (!p(x)) throw f(x);
      else return x;
    }
  };
};


export const throwOnBottom = throw_(
  x => new Err(`unexpected bottom type "${x}"`))
    .on(isBottom);


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


// auxiliary function

export const yieldNull = () => null;


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


F.append = Semigroup => f => g => x => Semigroup.append(f(x)) (g(x));


F.Semigroup = {append: F.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


F.empty = Monoid => _ => Monoid.empty;


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


export const transducel = (Semigroup, Foldable) => f =>
  Foldable.foldl(f(Semigroup.append));


export const transducer = (Semigroup, Foldable) => f =>
  Foldable.foldr(f(Semigroup.append));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


F.Category = F.Category();


F.contramap = F.contramap();


F.Contra = F.Contra();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████ FUNCTION :: READER :: TRANSFORMER ██████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* With the reader transformer `r -> m a` the base monad `m` isn't on the
outside but in the codomain of the function. This way the inner monad (`r ->`)
is applied before the base monad. Applying the inner monad means to implicitly
pass an argument, which from the perspetive of the base monad acts like a
read-only environment. */


export const Reader = fmm => ({ // constructor
  [TAG]: "Reader",
  run: fmm
});


export const R = Reader; // shortcut


// structure: r -> m a


R.T = outer => thisify(o => { // outer monad's type dictionary


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


  o.append = Semigroup => mmx => mmy => Reader(r =>
    outer.chain(Semigroup.append(mmx.run(r))) (mx =>
      outer.map(my => Semigroup.append(mx) (my)) (mmy.run(r))));
  

  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = Monoid => Reader(_ => outer.of(Monoid.empty));


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


// structure: s -> m (a, s)


St.T = outer => thisify(o => { // outer monad's type dictionary


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


  o.append = Semigroup => mmx => mmy => State(s =>
    outer.chain(Semigroup.append(mmx.run(s))) (mx =>
      outer.map(my => Pair(Semigroup.append(mx[0]) (my[0]), my[1])) (mmy.run(mx[1]))));
  

  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = Monoid => State(s => outer.of(Pair(Monoid.empty, s)));


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
streams instead. */


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


A.eq = Eq => xs => ys => {
  if (xs.length !== ys.length) return false;

  else return Loop(i => {
    if (i === xs.length) return Loop.base(true);

    else {
      const b = Eq.eq(xs[i]) (ys[i]);
      return b === true ? Loop.rec(i + 1) : Loop.base(false);
    }
  }) (0);
};


A.Eq = {eq: A.eq};


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


/* Defines a focus spanning one/several elements on an existing array without
altering it. The focus creates an immutable but otherwise normal array. The
iterable protocol can be used to reify the focused portion of the original
array. */

A.focus = (i, j = null) => xs => {
  if (j === null) j = xs.length - 1;

  return new Proxy(xs, {
    get(_, k, p) {
      switch (typeof k) {
        case "string": {
          if (k === "length") return j - i + 1;
          
          else {
            const i2 = Number(k);

            if (String(i2) === k) {
              if (i + i2 > j) return undefined;
              else return xs[i + i2];
            }

            else return xs[k];
          }
        }

        default: return xs[k];
      }
    },

    has(_, k) {
      switch (typeof k) {
        case "string": {
          const i2 = Number(k);

          if (String(i2) === k) {
            if (i + i2 > j) return false;
            else return i + i2 in xs;
          }

          else k in xs;
        }

        default: k in xs;
      }
    },

    set(_, k, v, p) {
      throw new Err("immutable focus");
    }
  });
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


A.foldl = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


A.foldl1 = f => xs => {
  let acc = xs.length === 0
    ? _throw(new Err("empty array")) : xs[0];

  for (let i = 1; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


A.foldi = f => init => xs => { // including index
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

A.foldr = f => acc => xs => Loopx(i => {
  if (i === xs.length) return Loopx.base(acc);

  else return Loopx.call(
    f(xs[i]),
    Loopx.rec(i + 1));
}) (0);


A.foldr1 = f => xs => Loopx(i => {
  let acc = xs.length === 0
    ? _throw(new Err("empty array")) : xs[0];

  if (i === xs.length) return Loopx.base(acc);

  else return Loopx.call(
    f(xs[i]),
    Loopx.rec(i + 1));
}) (0);


A.Foldable = {
  foldl: A.foldl,
  foldl1: A.foldl1,
  foldr: A.foldr,
  foldr1: A.foldr1
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


A.mapA = Applicative => ft => xs => {
  const liftA2_ = liftA2(Applicative);

  return A.foldl(ys => y =>
    liftA2_(A.push) (ft(y)) (ys))
      (Applicative.of([])) (xs);
};


A.seqA = Applicative => xs =>
  A.foldl(liftA2(Applicative) (A.push_)) (Applicative.of([])) (xs);


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
█████ Generators ██████████████████████████████████████████████████████████████*/


A.entries = m => m[Symbol.iterator] ();


A.keys = function* (m) {
  for (let [k] of m) {
    yield k;
  }
};


A.values = function* (m) {
  for (let [, v] in m) {
    yield v;
  }
};


/*
█████ Getter ██████████████████████████████████████████████████████████████████*/


A.at = i => xs => xs[i]; // curried `at` non-reliant on `this`


/*
█████ Non-Empty ███████████████████████████████████████████████████████████████*/


/* Non-empty arrays are just regular arrays wrapped in a proxy that cannot be
empty. Usually, each method that creates a new array returns a non-empty one
exept for `filter`, which may return an empty array and thus must not rely on
non-emptiness. */


A.nonEmpty = xs => {
  if (xs.length === 0) throw new Err("must not be empty");

  return new Proxy(xs, {
    deleteProperty(_, i) {
      throw new Err("invalid operation");
    },

    get(_, i, p) {
      if (xs[i] && xs[i].bind) {
        // * distinguish between impure/pure methods
        // * functions that reduce the array in some way always return a normal array

        //return (...args) => A.nonEmpty(xs[i] (...args));

        return (...args) => {
          switch(i) {

            // keep type constructor

            case "concat":
            case "fill":
            case "flat":
            case "flatMap":
            case "map":
            case "reverse":
            case "sort": return A.nonEmpty(xs[i] (...args));

            // conversion to regular array

            case "filter":
            case "slice": return xs[i] (...args);
            
            // added method

            case "of": return x => A.nonEmpty([x]);

            // deviate from default array behavior

            case "push":
            case "shift": {
              xs[i] (...args);
              return p;
            }

            case "pop":
            case "splice":
            case "unshift": throw new Err("invalid operation");

            // change type constructor

            default: return xs[i] (...args);
          }
        };
      }

      else return xs[i];
    },

    set(_, k, v, p) {
      if (k === "length" && v === 0)
        throw new Err("must not be empty");

      else {
        xs[k] = v;
        return p;
      }
    }
  });
};


/*
█████ Ordering ████████████████████████████████████████████████████████████████*/


A.sort = Order => xs => xs.sort(uncurry(Order.compare));


A.sortBy = f => xs => xs.sort(uncurry(f));


A.sortOn = Order => f => xs => xs.sort(uncurry(compBoth(Order.compare) (f)));


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


// strict due to imperative arrays


A.ana = A.unfold;


A.apo = f => init => { 
  let acc = [], x = init, next;

  do {
    const pair = f(x);
    next = false;

    if (strict(pair) === null) continue;

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


A.partition = p => xs => xs.reduce((pair, x)=> {
  if (p(x)) return (pair[0].push(x), pair);
  else return (pair[1].push(x), pair);
}, Pair([], []));


/* A more general version of `A.partition` that allows dynamic key generation
and value combination. */

A.partitionBy = f => g => xs => xs.reduce((acc, x) => {
  const k = f(x);
  return acc.set(k, g(acc.has(k) ? acc.get(k) : null) (x));
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

    if (strict(r) === null) continue;

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
█████ Special Folds ███████████████████████████████████████████████████████████*/


A.foldSucc = f => acc => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc = f(acc) (Pair(xs[i], xs[j]));

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
    acc = f(acc, xs[i], xs[j]);

  return acc;
};


/*
█████ Special Mappings ████████████████████████████████████████████████████████*/


A.mapSucc = f => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc.push(f(Pair(xs[i], xs[j])));

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
on modulo cons. */


export const List = {};


export const L = List;


scope(() => {
  class Cons extends Array {
    constructor(x, xs) {
      super(x, xs);
      Object.defineProperty(this, TAG, {value: "Cons"});
      Object.freeze(this);
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

            default: throw new Err("invalid constructor");
          }
        } while (true);
      } ();
    }
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
  };
  
  L.Cons = Cons;
  
  L.Nil = new Nil();
});


// curried versions

L.Cons_ = x => xs => new L.Cons(x, xs);


L._Cons = xs => x => new L.Cons(x, xs);


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


L.head = xss => {
  switch (xss[TAG]) {
    case "Nil": return null;
    case "Cons": return xss[0];
    default: throw new Err("invalid constructor");
  }
}


L.singleton = x => [x, L.Nil];


L.tail = xss => {
  switch (xss[TAG]) {
    case "Nil": return null;
    case "Cons": return xss[1];
    default: throw new Err("invalid constructor");
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


L.replicate = n => x => function go(m) {
  if (m === 0) return new L.Cons(x, L.Nil);
  else return new L.Cons(x, lazy(() => go(m - 1)));
} (n);


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

      default: throw new Err("invalid constructor");
    }
  } while (!done);

  return acc;
};


// stack-safe even if `f` is strict in its second argument

L.foldr = f => acc => Loopx(xss => {
  switch (xss[TAG]) {
    case "Nil": return Loopx.base(acc);

    case "Cons": {
      const [x, yss] = xss;
      return Loopx.call(f(x), Loopx.rec(yss));
    }

    default: throw new Err("invalid constructor");
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

    default: throw new Err("invalid constructor");
  }
};


L.Foldable = {
  foldl: L.foldl,
  foldr: L.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


L.mapA = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.Cons_);
  return f => L.foldr(x => acc => liftA2_(f(x)) (acc)) (Applicative.of(L.Nil));
};


L.mapA_ = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.Cons_);
  return f => L.foldr_(x => acc => liftA2_(f(x)) (acc)) (Applicative.of(L.Nil));
};


L.seqA = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.Cons_);
  return L.foldr(x => acc => liftA2_(x) (acc)) (Applicative.of(L.Nil));
};


L.seqA_ = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.Cons_);
  return L.foldr_(x => acc => liftA2_(x) (acc)) (Applicative.of(L.Nil));
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


// there is no valid instance because of the empty list


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

  if (strict(r) === null) return L.Nil;

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
      Object.freeze(this);
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

            default: throw new Err("invalid constructor");
          }
        } while (true);
      } ();
    }
  };
  
  class Eol extends Array {
    constructor(x) {
      if (x === undefined) throw new Err("value expected");
      
      else {
        super(x, []);
        Object.defineProperty(this, TAG, {value: "Eol"});
        Object.freeze(this);
      }
    }
    
    static [Symbol.isConcatSpreadable] = true;

    [Symbol.iterator] () {
      const _this = this;
      return function* () {yield _this[0]; return} ();
    }
  };
  
  Nea.Cons = Cons;
  
  Nea.Eol = Eol;
});


Nea.Cons_ = x => xs => new Nea.Cons(x, xs); // curried version


Nea._Cons = xs => x => new Nea.Cons(x, xs);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████ ARRAY :: LIST :: TRANSFORMER █████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (List m a)


L.T = outer => thisify(o => { // outer monad's type dictionary


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  // List a -> m (List m a)
  o.fromList = L.foldr(x => acc =>
    outer.of(L.Cons_(x) (acc))) (outer.of(L.Nil));


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

        default: throw new Err("invalid constructor");
      }
    });
  }) (mmx, acc);


  // (a -> m b -> m b) -> m b -> m (List m a) -> m b
  o.foldr = f => acc => Loopx(mmx => {
    return outer.chain(mmx) (mx => {
      switch (mx[TAG]) {
        case "Nil": return Loopx.base(acc);

        case "Cons": {
          const [x, mmy] = mx;
          return Loopx.call(f(x), Loopx.rec(mmy));
        }

        default: throw new Err("invalid constructor");
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
  o.mapA = Applicative => ft => {
    const liftA2_ = liftA2(Applicative);
    
    return o.foldr(x =>
      liftA2_(y => mmx =>
        outer.of(L.Cons(y, mmx))) (ft(x))) (Applicative.of(o.empty));
  };


  // m (List m (t a)) -> t (m (List m a))
  o.seqA = Applicative => {
    const liftA2_ = liftA2(Applicative);

    return o.foldr(liftA2_(x => mmx =>
      outer.of(L.Cons(x, mmx)))) (Applicative.of(o.empty));
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
  o.hoist = f => Loopx(mmx => {
    return f(outer.map(mmx) (mx => {
      switch (mx[TAG]) {
        case "Nil": return Loopx.base(L.Nil);

        case "Cons": {
          const [x, mmy] = mx;
          return Loopx.call(L.Cons_(x), Loopx.rec(mmy));
        }

        default: throw new Err("invalid constructor");
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

        default: throw new Err("invalid constructor");
      }
    });
  };


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


  // (b -> (a, b)) -> b -> ListT m a
  o.unfold = f => function go(y) {
    const r = f(y);

    if (strict(r) === null) return o.empty;

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


Comp.map = (Functor, Functor2) => f => ttx =>
  Comp(Functor.map(Functor2.map(f)) (ttx));


Comp.Functor = {map: Comp.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Comp.ap = (Apply, Apply2) => ttf => ttx =>
  Comp(Apply.ap(Apply.map(Apply2.ap) (ttf)) (ttx));


Comp.Apply = {
  ...Comp.Functor,
  ap: Comp.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Comp.of = (Applicative, Applicative2) => x =>
  Comp(Applicative.of(Applicative2.of(x)));


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


Const.ap = Semigroup => tf => tx => Const(Semigroup.append(tf.run) (tx.run));


Const.Apply = {
  ...Const.Functor,
  ap: Const.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Const.of = Monoid => _ => Const(Monoid.empty);


Const.Applicative = {
  ...Const.Apply,
  of: Const.of
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ CONT █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode synchronous computations in CPS. The type has the following
properties:

  * pure core/impure shell concept
  * synchronous evaluation
  * deferred nested function calls
  * stack-safe through trampoline
  * reliable return values
  * base monad (no transformer)

In order to preserve stack-safety `Cont` uses a trampoline in its combinators:

  const mx = Cont.of(5);
  const my = Cont.of(7);

  const mz = Cont.ap(Cont.map(x => y => x * y) (mx)) (my);

  Loop(ma.run) (Loop.base); // 35

The type has two major use cases:

  * defer synchronous but impure operations (e.g. get the current datetime)
  * allow more sophisticated control flows (e.g. fold with short circuiting) */


export const Cont = k => ({
  [TAG]: "Cont",
  run: k
});


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


Cont.and = tx => ty =>
  Cont(k =>
    tx.run(x =>
      ty.run(y =>
        Loop.call(k, Pair(x, y)))));


Cont.allArr = () =>
  A.seqA({
    map: Cont.map,
    ap: Cont.ap,
    of: Cont.of});


Cont.allList = () =>
  L.seqA({
    map: Cont.map,
    ap: Cont.ap,
    of: Cont.of});


Cont.allObj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return Cont(k =>
      acc.run(p =>
        o[key].run(x =>
          Loop.call(k, (p[key] = x, p)))));
  }, Cont.of({}));
};


/*
█████ Delimited ███████████████████████████████████████████████████████████████*/


Cont.abrupt = x => Cont(k => Loop.base(x));


Cont.callcc = f => Cont(k => f(Cont.reify(k)) (k));


Cont.reify = k => x => Cont(_ => Loop.call(k, x));


Cont.reset = mx => Cont(k => Loop.call(k, mx.run(id)));


Cont.shift = fm => Cont(k => Loop.call(fm(k).run, id));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Cont.map = f => tx => Cont(k => tx.run(x => Loop.call(k, f(x))));


Cont.Functor = {map: Cont.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Cont.ap = tf => tx => Cont(k => tf.run(f => tx.run(x => Loop.call(k, f(x)))));


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


Cont.chain = mx => fm => Cont(k => mx.run(x => Loop.call(fm(x).run, k)));


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


Cont.append = Semigroup => tx => ty =>
  Cont(k => tx.run(x => ty.run(y => Loop.call(k, Semigroup.append(x) (y)))));


Cont.Semigroup = {append: Cont.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Cont.empty = Monoid => Cont(k => Loop.call(k, Monoid.empty));


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
█████ Calculation █████████████████████████████████████████████████████████████*/


D.lastDayOfMonth = ({m, y}) => {
  const d = new Date(y, m, 1);
  return new Date(d - 1).getDate();
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


D.fromStr = s => {
  const d = new Date(s);

  if (Number.isNaN(d.valueOf()))
    return new Exception("invalid date string");

  else return d;
};


D.fromStrSafe = f => infix(
  E.throw, comp, D.fromStr, comp, f);


/*
█████ Format ██████████████████████████████████████████████████████████████████*/


D.format = sep => (...fs) => d =>
  fs.map(f => f(d))
    .join(sep);


D.formatDay = digits => d => {
  switch (digits) {
    case 1: return String(d.getUTCDate());
    case 2: return String(d.getUTCDate()).padStart(2, "0");
    default: throw new Err("invalid number of digits");
  }
};


D.formatMonth = ({names = [], digits}) => d => {
  switch (digits) {
    case 1: return String(d.getUTCMonth() + 1);
    case 2: return String(d.getUTCMonth() + 1).padStart(2, "0");
    case 3: return names[String(d.getUTCMonth())];
    default: throw new Err("invalid number of digits");
  }
};


D.formatWeekday = ({names = [], digits}) => d => {
  switch (digits) {
    case 1: return String(d.getUTCDay());
    case 2: return String(d.getUTCDay()).padStart(2, "0");
    case 3: return names[String(d.getUTCDay())];
    default: throw new Err("invalid number of digits");
  }
};


D.formatYear = digits => d => {
  switch (digits) {
    case 2: return String(d.getUTCFullYear()).slice(2);
    case 4: return String(d.getUTCFullYear());
    default: throw new Err("invalid number of digits");
  }
};


D.formatDe = D.format(".") (
  D.formatDay(2),
  D.formatMonth({digits: 2}),
  D.formatYear(4));


D.formatIso = D.format("-") (
  D.formatYear(4),
  D.formatMonth({digits: 2}),
  D.formatDay(2));


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
the behavior of `Either`'s validation applicative instance.

As opposed to the prevalent `Either` type `Except` is fixed in its left field,
a limitation that renders the type more suitbale for the desired task. `These`
offers an alternative that resembles `Either` but comes with additional
flexibility. */


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


E.append = Semigroup => tx => ty => {
  if (introspect(tx) === "Error") {
    if (introspect(ty) === "Error") return new Exceptions(tx, ty);
    else return tx;
  }

  else if (introspect(ty) === "Error") return ty;
  else return Semigroup.append(tx) (ty);
};


E.Semigroup = {append: E.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


E.empty = Monoid => Monoid.empty;


E.Monoid = {
  ...E.Semigroup,
  empty: E.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


E.throw = tx => {
  if (introspect(tx) === "Error") throw tx;
  else return tx;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ EXCEPT :: TRANSFORMER ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (a | Exception)


Except.T = outer => Trans => { // outer monad's type dict + value constructor


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  Trans.fromExcept = mx => Trans(outer.of(mx));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  Trans.map = f => mmx => Trans(outer.map(mx =>
    introspect(mx) === "Error" ? mx : f(mx)) (mmx.run));


  Trans.Functor = {map: Trans.map};
  

/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


  Trans.alt = mmx => mmy => outer.chain(mmx.run) (mx => {
    if (introspect(mx) === "Error") {
      return Trans(outer.map(my => {
        if (introspect(my) === "Error") return new Exceptions(mx, my);
        else return my;
      }) (mmy.run))
    }
      
    else return Trans(outer.of(mx));
  });


  Trans.Alt = {
    ...Trans.Functor,
    alt: Trans.alt
  };


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


  Trans.zero = Trans(outer.of(new Exceptions()));


  Trans.Plus = {
    ...Trans.Alt,
    zero: Trans.zero
  };


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  Trans.ap = mmf => mmx => {
    return Trans(outer.chain(mmf.run) (mf => {
      return outer.map(mx => {
        if (introspect(mf) === "Error") {
          if (introspect(mx) === "Error") return new Exceptions(mf, mx);
          else return mf;
        }

        else if (introspect(mx) === "Error") return mx;
        else return mf(mx);
      }) (mmx.run);
    }));
  };


  Trans.Apply = {
    ...Trans.Functor,
    ap: Trans.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  Trans.of = x => Trans(outer.of(x));


  Trans.Applicative = {
    ...Trans.Apply,
    of: Trans.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  Trans.chain = mmx => fmm => outer.chain(mmx.run) (mx => {
    if (introspect(mx) === "Error") return outer.of(mx);
    else return fmm(mx);
  });
  

  Trans.Chain = {
    ...Trans.Apply,
    chain: Trans.chain
  };


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


  Trans.Alternative = {
    ...Trans.Plus,
    ...Trans.Applicative
  };


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


  Trans.Monad = {
    ...Trans.Applicative,
    chain: Trans.chain
  };


/*
█████ Handling ████████████████████████████████████████████████████████████████*/


  Trans.catch = f => mmx => Trans(outer.chain(mmx.run) (mx => {
    if (introspect(mx) === "Error") return outer.of(f(mx));
    else return outer.of(mx);
  }));


  Trans.throw = mmx => Trans(outer.map(x => {
    if (introspect(x) === "Error") throw x;
    else return x;
  }) (mmx.run));


  // TODO: `Trans.finally`


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


  Trans.append = Semigroup => mmx => mmy => {
    return Trans(outer.chain(mmx.run) (mx => {
      return outer.map(my => {
        if (introspect(mx) === "Error") {
          if (introspect(my) === "Error") return new Exceptions(mx, my);
          else return mx;
        }

        else if (introspect(my) === "Error") return my;
        else return Semigroup.append(mx) (my);
      }) (mmy.run);
    }));
  };


  Trans.Semigroup = {append: Trans.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  Trans.empty = Monoid => Trans(outer.of(Monoid.empty));


  Trans.Monoid = {
    ...Trans.Semigroup,
    empty: Trans.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  /* Since `Except` doesn't have its own type wrapper but is based on native
  `Error` values (or the `Exception` subclass respectively), the lift operation
  can simply put the monadic value into the transformer type wrapper without
  further expecting it. */

  Trans.lift = mx => Trans(mx);


  // TODO


  return Trans;
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
██████████████████████████████████ ITERATOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const It = {};


/*
█████ Category ████████████████████████████████████████████████████████████████*/


/* The category of iterators is just function composition/identity. There are
two different variants, either normal or iterator composition:

  * ([k2, v2] -> [k3, v3]) -> ([k, v] -> [k2, v2]) -> [k, v] -> [k3, v3]
  * (Iterator b -> Iterator c) -> (Iterator a -> Iterator b) -> Iterator a -> Iterator c

The normal composition example illustrates a `MapIterator`. */


It.comp = comp;


It.id = id;


It.Category = ({
  comp: It.comp,
  id: It.id
});


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


It.all = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();
    if (done) return true;
  } while (f(x));

  return false;
};


/*
█████ Consumption █████████████████████████████████████████████████████████████*/


It.exhaust = ix => {
  let acc;
  for (acc of ix) continue;
  return acc;
};


It.toArr = ix => {
  const xs = [];
  for (const x of ix) xs.push(x);
  return xs;
};


It.toMap = ix => {
  const m = new Map();
  for (const [k, v] of ix) m.set(k, v);
  return m;
};


It.toObj = ix => {
  const o = {};
  for (const [k, v] of ix) o[k] = v;
  return o;
};


It.toSet = ix => {
  const s = new Set();
  for (const k of ix) s.add(k);
  return s;
};


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


It.any = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return false;
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


It.mapA = Functor => ft => function* (ix) {
  const {value: x, done} = ix.next();

  if (done) return;
  else return Functor.map(y => function* () {yield y} ()) (ft(x));
};


It.seqA = Functor => function* (itx) {
  const {value: tx, done} = itx.next();

  if (done) return;
  else return Functor.map(x => function* () {yield x} ()) (tx);
};


It.Traversable = () => ({
  ...It.Foldable,
  ...It.Functor,
  mapA: It.mapA,
  seqA: It.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


/* The map operation doesn't work in a principled way bc the iterator protocol
abstracts from the original data structure but yields values, which in turn
depend on the original structure (`Map` yields `[k, v]` but `Set` only `k`).
With the following implementation it is the responsibility of `f` to return
values of the same structure as they were passed. */

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


// kleisli composition


// (b -> Iterator c) -> (a -> Iterator b) -> a -> Iterator c
It.komp = f => g => function* (x) {
  for (let y of g(x)) {
    yield* f(y);
  }
};


// (b -> Iterator c) -> (a -> Iterator b) -> Iterator a -> Iterator c
It.komp_ = f => g => function* (ix) {
  for (let x of ix) {
    for (let y of g(x)) {
      yield* f(y);
    }
  }
};


It.Monad = {
  ...It.Applicative,
  chain: It.chain
};


/*
█████ Partial Init/Tail ███████████████████████████████████████████████████████*/


It.drop = n => function* (ix) {
  while (n-- > 0) {
    const {done} = ix.next();
    if (done) return;
  };

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  } while (true);
};


It.dropWhile = p => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();
    if (done) return;

    else if (!p(x)) {
      yield x;
      break;
    }
  };

  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  } while (true);
};


It.take = n => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  } while (--n > 0);
};


It.takeWhile = p => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else if (p(x)) yield x;
    else return;
  } while (true);
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


It.append = Semigroup => ix => function* (iy) {
  const {value: x, done} = ix.next(),
    {value: y, done: done2} = iy.next();

  if (done || done2) return;
  else yield Semigroup.append(x) (y);
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
█████ Special Fold ███████████████████████████████████████████████████████████████████*/


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
      yield f(acc, x, y);
      x = y;
    }
  } while (true);
};


/*
█████ Special Mappings ████████████████████████████████████████████████████████*/


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


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


It.Traversable = It.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ LAZY █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `Lazy` encodes implicit thunks of the form `() => expr` that act like `expr`
in a principled fashion. Lazyness means normal order evaluation, i.e. arguments
passed to functions are only evaluated when needed and only once. Please note
that `$ => expr` is used instead of `() => expr` for improved readability. */


export const Lazy = {};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Lazy.map = f => tx => lazy($ => f(strict(tx)));


Lazy.Functor = {map: Lazy.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Lazy.ap = tf => tx => lazy($ => (tf = strict(tf), tf(strict(tx))));


Lazy.Apply = {
  ...Lazy.Functor,
  ap: Lazy.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


/* The pure value `x` isn't wrapped in an implicit thunk because `x` is already
fully evaluated and thus `x` and `Thunk($ => x)` are equivalent. */

Lazy.of = id;


Lazy.Applicative = {
  ...Lazy.Apply,
  of: Lazy.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Lazy.chain = mx => fm => lazy($ => strict(fm(strict(mx))));


Lazy.Chain = {
  ...Lazy.Apply,
  chain: Lazy.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Lazy.Monad = {
  ...Lazy.Applicative,
  chain: Lazy.chain
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Lazy.app = f => tx => f(strict(tx));


Lazy.seq = tx => ty => (strict(tx), strict(ty));


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ LAZY :: TRANSFORMER █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// structure: m (Thunk($ -> a))


Lazy.T = outer => thisify(o => { // outer monad's type dictionary


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => outer.map(mx => lazy($ => f(strict(mx))));
  

  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = mmf => mmx => outer.chain(mmf) (mf =>
    outer.map(mx => lazy($ => (mf = strict(mf), mf(strict(mx))))) (mmx));
  

  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => outer.of(x);


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx =>
    lazy($ => outer.map(strict) (fmm(strict(mx)))));


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


  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Map = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


// use iterator if each key/value pair is needed separately

_Map.interconvert = f => m => new Map(f(Array.from(m)));


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


_Map.entries = m => m[Symbol.iterator] ();


_Map.keys = function* (m) {
  for (let [k] of m) {
    yield k;
  }
};


_Map.values = function* (m) {
  for (let [, v] in m) {
    yield v;
  }
};


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


_Map.get = k => m => m.has(k) ? m.get(k) : null;


_Map.getOr = x => k => m => m.has(k) ? m.get(k) : x;


_Map.has = k => m => m.has(k);


_Map.set = k => v => m => m.set(k, v);


_Map.del = k => m => m.delete(k);


_Map.upd = k => f => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return new Exception("no property to update");
};


_Map.updOr = x => k => f => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return m.set(k, x);
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ MAP :: DEQUEMAP ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map that combines characteristics of a doubly-ended queue and a hash table.
It maintains the element order of deque operations. `id` is used to generate
unique keys from the stored values and thus hide keys from the interface. If
you want to use values as keys themselves, just pass the identity function.
Please note that `push`/`pop` are way faster than `unshift`/`shift` due to the
native array implementation in Javascript. */


class DequeMap extends Map {
  constructor(id) {
    super();
    Object.defineProperty(this, TAG, {value: "DequeMap"});
    this.id = id;
    this.ks = [];
  }


  /*
  █████ Functor ███████████████████████████████████████████████████████████████*/


  map(f) {
    const d = new DequeMap();
    
    for (const [k, v] of this) {
      const v2 = f(v);
        k2 = id(v2);

      d.set(k2, v2);
      d.ks.push(k2);
    }
    
    return d;
  };


  /*
  █████ Getters/Setters ███████████████████████████████████████████████████████*/


  clear(k) {throw new Err("illegal operation")}


  delete(k) {throw new Err("illegal operation")}


  get(v) {return this.get(this.id(v))}


  has(v) {this.has(this.id(v))}


  pop() {
    const k = this.ks.pop(),
      v = this.get(k);

    this.delete(k);
    return Pair(Pair(k, v), this);
  };


  push(v) {
    const k = this.id(v);
    
    if (this.has(k)) throw Err(`duplicate key "${k}"`);

    else {
      this.set(k, v);
      this.ks.push(k);
      return this;
    }
  };


  set(k) {throw new Err("illegal operation")}


  shift() {
    const k = this.ks.shift(),
      v = this.get(k);

    this.delete(k);
    return Pair(Pair(k, v), this);
  };


  unshift(v) {
    const k = this.id(v);
    
    if (this.has(k)) throw Err(`duplicate key "${k}"`);
    
    else {
      this.set(k, v);
      this.ks.unshift(k);
      return this;
    }
  };


  /*
  █████ Iterator ██████████████████████████████████████████████████████████████*/


  *[Symbol.iterator]() {
    for (let k of this.ks) yield [k, m.get(k)];
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ MAP :: MULTIMAP ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map that has 1:n-relations between its key/value pairs. Such a map represents
the idea of unique keys assigned to conditionally ambiguous values, i.e. it can
encode fuzzy key/value relations. */

class MultiMap extends Map {
  constructor() {
    super();
    Object.defineProperty(this, TAG, {value: "MultiMap"});
  }


  /*
  █████ Conversion ████████████████████████████████████████████████████████████*/


  fromTable(table, i) {
    const m = new MultiMap();

    for (const cols of table) m.setItem(cols[i], cols) (m);
    return m;
  }


  /*
  █████ Functor ███████████████████████████████████████████████████████████████*/


  map(f) {
    const m = new MultiMap();

    for (const [k, v] of this) m.setItem(k, f(v));
    return m;
  }


  /*
  █████ Getters/Setters ███████████████████████████████████████████████████████*/


  delItem(k, pred) {
    const s = this.get(k);

    for (const v of s) {
      if (pred(v)) {
        s.delete(v);
        break;
      }
    }

    if (s.size === 0) this.delete(k);
    return this;
  }


  getItem(k, pred) {
    const s = this.get(k);

    if (s === undefined) return s;

    else {
      for (const v of s) {
        if (pred(v)) return v;
      }

      return undefined;
    }
  }


  setItem(k, v) {
    if (this.has(k)) {
      const s = this.get(k);
      s.add(v);
      return this;
    }

    else {
      this.set(k, new Set([v]));
      return this;
    }
  }


  upd(k, f) {
    const s = this.get(k),
      s2 = new Set();

    if (s === undefined) return s;

    else {
      for (const v of s) s2.add(f(v));
      this.set(k, s2);
      return this;
    }
  }


  updItem(k, pred, f) {
    const s = this.get(k);

    if (s === undefined) return s;

    else {
      for (const v of s) {
        if (pred(v)) {
          s.delete(v);
          s.add(f(v));
          break;
        }
      }

      return this;
    }
  }


  /*
  █████ Iterator ██████████████████████████████████████████████████████████████*/


  *[Symbol.iterator]() {
    for (const [k, s] of super[Symbol.iterator]()) {
      for (const v of s) yield [k, v];
    }
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ NUMBER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Num = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Num.fromSnum = tx => {
  const s = String(tx.run),
    int = s.slice(0, -Snum.precision_),
    dec = s.slice(-Snum.precision_);

  return Number(`${int}.${dec}`);
};


Num.fromStr = s => {
  if (/^(?:\+|\-)?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  else return new Exception(`invalid number string: "${s}"`);
};


Num.fromStrSafe = f => infix(
  E.throw, comp, Num.fromStr, comp, f);


/*
█████ Decimal Places ██████████████████████████████████████████████████████████*/


/* Just patches patches the floating point issue most adequately without
solving the underlying problem. */

Num.decimalPatch = (k, n, digits) => {
  const p = Math.pow(10, digits);

  if (Math.round(n * p) / p === n)
    return n;

  const m = (n * p) * (1 + Number.EPSILON);
  return Math[k] (m) / p;
};


Num.ceil = digits => n =>
  Num.decimalPatch("ceil", n, digits);


Num.floor = digits => n =>
  Num.decimalPatch("floor", n, digits);


Num.round = digits => n =>
  Num.decimalPatch("round", n, digits);


Num.round2 = Num.round(2);


Num.trunc = digits => n =>
  Num.decimalPatch("trunc", n, digits);


/*
█████ Deterministic PRNG ██████████████████████████████████████████████████████*/


/* Deterministic pseudo random number generator with an initial seed. Use with
`Num.hash` to create four 32bit seeds. The PRNG yields a random number and the
next seed. The same initial seed always yields the same sequence of random
numbers. */

Num.prng = ([a, b, c, d]) => {
  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 

  let t = (a + b) | 0;

  a = b ^ b >>> 9;
  b = c + (c << 3) | 0;
  c = (c << 21 | c >>> 11);
  d = d + 1 | 0;
  t = t + d | 0;
  c = c + t | 0;

  return Pair(
    (t >>> 0) / 4294967296,
    [a, b, c, d]
  );
};


/*
█████ Hash ████████████████████████████████████████████████████████████████████*/


// sufficient collision-free hash function

Num.hash = s => {
  let h1 = 1779033703, h2 = 3144134277,
    h3 = 1013904242, h4 = 2773480762;

  for (let i = 0, k; i < s.length; i++) {
    k = s.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0
  ];
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


Num.formatSign = ({pos, neg}) => n =>
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
██████████████████████████████ NUMBER :: SAFENUM ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// safe numbers that avoid floating point issues with arithmetics
// TODO: add negative integers


export const SafeNum = (int, dec) => {
  dec = dec.padEnd(Snum.precision_, "0");

  if (Snum.precision_ < dec.length)
    throw new Err("unsufficient precision");

  else return Object.freeze({
    [TAG]: "SafeNum",
    dec: dec.padEnd(Snum.precision_, "0"),
    int,
    run: BigInt(int + dec)
  });
};


export const Snum = SafeNum;


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


Snum.precision = 10000; // four decimal points


Snum.precision_ = String(Snum.precision).length - 1;


/*
█████ Arithmetics █████████████████████████████████████████████████████████████*/


Snum.add = tx => ty => {
  const s = String(tx.run + ty.run),
    int = s.slice(0, -Snum.precision_),
    dec = s.slice(-Snum.precision_);

  return Snum(int, dec);
};


Snum.div = tx => ty => {
  const [int, dec = ""] = String(Number(tx.run) / Number(ty.run)).split("."),
    tz = Snum.round(Snum.precision_) ({int, dec});

  return Snum(int, tz.dec);
};


Snum.mul = tx => ty => {
  const s = String(tx.run * ty.run),
    precision = tx.dec.length + ty.dec.length,
    int = s.slice(0, -precision),
    dec = s.slice(-precision);

  return Snum.round(Snum.precision_) ({int, dec});
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Snum.fromNum = n => {
  const [int, dec = ""] = String(n).split(".");
  return Snum(int, dec);
};


Snum.fromBigInt = n => {
  const int = String(n);
    dec = "0".repeat(Snum.precision_);

  return Snum(int, dec);
};


Snum.fromSafeBigInt = n => {
  const s = String(n),
    int = s.slice(0, Snum.precision_),
    dec = s.slice(Snum.precision_);

  return Snum(int, dec);
};


/*
█████ Decimal Places ██████████████████████████████████████████████████████████*/


Snum.ceil = places => tx => {
  let int = tx.int,
    dec = tx.dec;

  while (dec.length > places) {
    dec = dec.slice(0, -1);

    for (let i = dec.length - 1; i >= 0; i--) {
      const n = Number(dec[i]);

      if (n === 9) {
        if (i === 0) {
          dec = dec.slice(0, i) + "0" + dec.slice(i + 1);
          int = String(Number(int) + 1);
        }
        
        else dec = dec.slice(0, i) + "0" + dec.slice(i + 1);
      }

      else {
        dec = dec.slice(0, i) + (n + 1) + dec.slice(i + 1);
        break;
      }
    }
  }

  return Snum(int, dec);
};


Snum.floor = places => tx => {
  let int = tx.int,
    dec = tx.dec;
    
  dec = dec.slice(0, places);
  return Snum(int, dec);
};


Snum.round = places => tx => {
  let int = tx.int,
    dec = tx.dec;

  while (dec.length > places) {
    if (dec[dec.length - 1] >= 5) {
      dec = dec.slice(0, -1);

      for (let i = dec.length - 1; i >= 0; i--) {
        const n = Number(dec[i]);

        if (n === 9) {
          if (i === 0) {
            dec = dec.slice(0, i) + "0" + dec.slice(i + 1);
            int = String(Number(int) + 1);
          }
          
          else dec = dec.slice(0, i) + "0" + dec.slice(i + 1);
        }

        else {
          dec = dec.slice(0, i) + (n + 1) + dec.slice(i + 1);
          break;
        }
      }
    }

    else dec = dec.slice(0, -1);
  }

  return Snum(int, dec);
};


/*
█████ Semigroup (Addition) ████████████████████████████████████████████████████*/


Snum.appendAdd = Snum.add;


Snum.Semigroup = {append: Snum.appendAdd};


/*
█████ Semigroup (Multiplication) ██████████████████████████████████████████████*/


Snum.appendMul = Snum.mul;


/*
█████ Semigroup :: Monoid (Addition) ██████████████████████████████████████████*/


Snum.emptyAdd = Snum("0", "");


Snum.Monoid = {
  ...Snum.Semigroup,
  empty: Snum.empty
};


/*
█████ Semigroup :: Monoid (Multiplication) ████████████████████████████████████*/


Snum.emptyMul = Snum("1", "");


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OBJECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Obj = {}; // namespace


export const O = Obj; // shortcut;


/*
█████ Clonable ████████████████████████████████████████████████████████████████*/


// getter/setter safe cloning

O.clone = o => {
  const p = {};

  for (const k of objKeys(o))
    Object.defineProperty(
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


O.Clonable = {clone: O.clone};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


O.fromPairs = pairs => pairs.reduce((acc, [k, v]) => (acc[k] = v, acc), {});


O.toPairs = Object.entries;


O.fromArr = header => xs => {
  const o = {};

  for (let i = 0; i < xs.length; i++)
    o[header.get(i)] = xs[i];

  return o;
};


/*
█████ Instantiation ███████████████████████████████████████████████████████████*/


O.new = (tag = null) => (...ks) => (...vs) => {
  if (ks.length !== vs.length)
    throw new Err("keys don't match values");

  return ks.reduce((acc, k, i) => {
    acc[k] = vs[i];
    return acc;
  }, tag === null ? {} : {[TAG]: tag});
};


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


O.del = k => o => (delete o[k], o);


O.get = k => o => k in o ? o[k] : null;


O.getOr = x => k => o => k in o ? o[k] : x;


O.getPath = keys => o =>
  keys.reduce((acc, key) => key in acc ? acc[key] : null, o);


O.getPathOr = x => keys => o => {
  for (const key of keys) {
    if (key in o) o = o[key];
    
    else {
      o = x;
      break;
    }
  }

  return o;
};


O.set = k => v => o => (o[k] = v, o);


O.upd = k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return new Exception("no property to update");
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
█████ Pattern Matching ████████████████████████████████████████████████████████*/


O.matchPattern = (...ks) => o => {
  const vs = Object.keys(o);

  if (ks.length < vs.length) throw new Err("unnecessary cases");
  else if (ks.length > vs.length) throw new Err("missing cases");

  else return ks.reduce((acc, k) => {
    if (k in o) acc[k] = o[k];
    else throw new Err(`missing key "${k}"`)
    
    return acc;
  }, {});
};


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


// create lazy property that shares its result

O.lazyProp = k => thunk => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true});


O.lazyProps = dtors => o => Object.defineProperties(o, ...dtors);


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


Ob.append = Semigroup => tx => ty => Ob(observer =>
  tx.run({
    next: x => ty.run({
      next: x2 => observer.next(Semigroup.append(x) (x2)),
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


Ob.empty = Monoid => Ob(observer => observer.next(Monoid.empty));


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

Optic.tryFocus = x => (getter, setter) => tx => Optic(
  tx.run === null ? getter(x) : getter(tx.run),
  x => Optic(setter(x) (tx.run === null ? x : tx.run), tx.parent));


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


Optic.add = Semigroup => x => tx =>
  Optic(Semigroup.append(tx.run) (x), tx.parent);


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


Opt.cata = x => f => tx => strict(tx) === null ? x : f(tx);


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

Opt.of = x => strict(x) === null ? _throw("invalid value") : x;


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


Opt.append = Semigroup => tx => ty =>
  strict(tx) === null ? tx
    : strict(ty) === null ? tx
    : Semigroup.append(tx) (ty);


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


// structure: m (Option null | a)


Opt.T = outer => thisify(o => { // outer monad's type dictionary


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromOption = mx => outer.of(mx);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => outer.map(mx => strict(mx) === null ? mx : f(mx));


  o.Functor = {map: o.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


  o.alt = mmx => mmy => outer.chain(mmx) (mx => {
    if (strict(mx) === null) return mmy;
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
    if (strict(mf) === null) return mf;

    else return outer.map(mx =>
      strict(mx) === null ? mx : mf(mx)) (mmx);
  });


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = x => outer.of(x);


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = mmx => fmm => outer.chain(mmx) (mx =>
    strict(mx) === null ? mx : fmm(mx));


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


  o.append = Semigroup => mmx => mmy => outer.chain(mmx) (mx => {
    if (strict(mx) === null) return mmy;

    else return outer.map(my =>
      strict(my) === null ? mx : Semigroup.append(mx) (my)) (mmy);
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


/* Just like `Serial` but evaluated in parallel. See `Serial` for more
comprehensive information. */


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

  runSafe: f => {
    if (asyncCounter > 100) {
      asyncCounter = 0;
      return Promise.resolve(null).then(_ => k(f));
    }

    else {
      asyncCounter++;
      return k(f);
    }
  }
});


export const P = Parallel; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


P.fromPex = mmx => P(mmx.run);


P.fromSerial = tx => P(tx.run);


P.fromSex = mmx => P(mmx.run);


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

        else return k(Pair(pair[0], pair[1]));
      });
    });
  });
};


P.allArr = () =>
  A.seqA({
    map: P.map,
    ap: P.ap,
    of: P.of});


P.allList = () =>
  L.seqA({
    map: P.map,
    ap: P.ap,
    of: P.of});


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
    let done = false;

    return [tx, ty].map(tz => {
      return tz.run(z => {
        if (!done) {
          done = true;
          return k(z);
        }

        else return null;
      });
    });
  });
};


P.anyArr = () =>
  A.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty);


P.anyList = () =>
  L.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty);


P.anyObj = o =>
  A.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty)
        (Object.values(o));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


P.map = f => tx =>
  P(k => tx.run(x => k(f(x))));


P.Functor = {map: P.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


P.ap = tf => tx => P(k =>
  P.and(tf) (tx).run(([f, x]) =>
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
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


// please note that Chain diverges from Apply in terms of evaluation order


P.chain = mx => fm =>
  P(k => mx.run(x => fm(x).run(k)));


P.Chain = {
  ...P.Apply,
  chain: P.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


// please note that Monad diverges from Applicative in terms of evaluation order


P.Monad = {
  ...P.Applicative,
  chain: P.chain
};


/*
█████ Semigroup (Argument) ████████████████████████████████████████████████████*/


P.append = Semigroup => tx => ty => P(k =>
  P.and(tx) (ty).run(([x, y]) =>
    k(Semigroup.append(x) (y))));


P.Semigroup = {append: P.append};

  
/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


P.Race = {};


P.Race.append = P.or;


/*
█████ Semigroup :: Monoid (Argument) ██████████████████████████████████████████*/


P.empty = Monoid => P(k => k(Monoid.empty));


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


P.once = tx => { // TODO: delete
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


P.reify = k => x => P(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


P.allArr = P.allArr();


P.allList = P.allList();


P.anyArr = P.anyArr();


P.anyList = P.anyList();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ PARALLEL :: EXCEPT ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// like `Parallel` but augmented with an `Except` transformer


export const ParallelExcept = Except.T(Parallel) (mmx => ({
  [TAG]: "Parallel.Except",
  run: mmx
}));


export const Pex = ParallelExcept; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Pex.fromParallel = mx => Pex(mx.run);


Pex.fromSex = mmx => Pex(mmx.run);


Pex.fromSerial = mx => Pex(mx.run);


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


// stops on first exception

Pex.and = mmx => mmy => Pex.chain(mmx) (x =>
  Pex.map(y => Pair(x, y)) (mmy));


// continues on exceptions

Pex.and_ = mmx => mmy => Pex(P(k => {
  const pair = Array(2);
  let i = 0;

  return [mmx, mmy].map((mmz, j) => {
    return mmz.run(mz => {
      if (i < 2) {
        if (pair[j] === undefined) {
          pair[j] = mz;
          i++;
        }

        if (i === 2) return k(Pair(pair[0], pair[1]));
        else return null;
      }

      else return k(Pair(pair[0], pair[1]));
    });
  });
}));


Pex.allArr = () =>
  A.seqA({
    map: Pex.map,
    ap: Pex.ap,
    of: Pex.of});


Pex.allList = () =>
  L.seqA({
    map: Pex.map,
    ap: Pex.ap,
    of: Pex.of});


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


Pex.allObj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return Pex.chain(acc) (p =>
      Pex.map(x => (p[key] = x, p)) (o[key]));
  }, Pex.of({}));
};


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


Pex.or = mmx => mmy => {
  return Pex(P(k => {
    let done = false;

    return [mmx, mmy].map(mmz => {
      return mmz.run(mz => {
        if (!done) {
          done = true;
          return k(mz);
        }

        else return null;
      });
    });
  }));
};


Pex.or_ = mmx => mmy => {
  return Pex(P(k => {
    let i = 0;

    return [mmx, mmy].map(mmz => {
      return mmz.run(mz => {
        if (i < 1) {
          if (introspect(mz) === "Error") {
            i++;
            return null;
          }

          else {
            i++;
            return k(mz);
          }
        }

        else if (i === 1) {
          i++;
          return k(mz);
        }

        else return null;
      });
    });
  }));
};


Pex.anyArr = () =>
  A.foldl(acc => tx =>
    Pex.Race.append(acc) (tx))
      (Pex.Race.empty);


Pex.anyList = () =>
  L.foldl(acc => tx =>
    Pex.Race.append(acc) (tx))
      (Pex.Race.empty);


Pex.anyObj = o =>
  L.foldl(acc => tx =>
    Pex.Race.append(acc) (tx))
      (Pex.Race.empty)
        (Object.values(o));


/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


Pex.Race = {};


Pex.Race.append = Pex.or;


/*
█████ Semigroup :: Monoid (Race) ██████████████████████████████████████████████*/


Pex.Race.empty = Pex(P(k => null));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Pex.allArr = Pex.allArr();


Pex.allList = Pex.allList();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ PAIR █████████████████████████████████████
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


Pair.ap = Semigroup => ({1: x, 2: f}) => ({1: y, 2: z}) =>
  Pair(Semigroup.append(x) (y), f(z));


Pair.Apply = {
  ...Pair.Functor,
  ap: Pair.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Pair.of = Monoid => x => Pair(Monoid.empty, x);


Pair.Applicative = {
  ...Pair.Apply,
  of: Pair.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Pair.chain = Semigroup => fm => ({1: x, 2: y}) => {
  const {1: x2, 2: y2} = fm(y);
  return Pair(Semigroup.append(x) (x2), y2);
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


Pair.mapFst = f => tx => Pair(f(tx[0]), tx[1]);


Pair.swap = tx => Pair(tx[1], tx[0]);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████ PAIR :: WRITER :: TRANSFORMER ████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Writer = mmx => ({ // constructor
  [TAG]: "Writer",
  run: mmx
});


export const W = Writer; // shortcut


// structure: m (a, w)


W.T = outer => thisify(o => { // outer monad's type dictionary


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


  o.fromPair = pair => Writer(outer.of(pair));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


  o.map = f => mmx => Writer(outer.map(mx => Pair(f(mx[0]), mx[1])) (mmx.run));


  o.Functor = {map: o.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


  o.ap = Semigroup => mmf => mmx =>
    Writer(outer.ap(outer.map(mx => my =>
      Pair(mx[0] (my[0]), Semigroup.append(mx[1]) (my[1])))
        (mmf.run)) (mmx.run));


  o.Apply = {
    ...o.Functor,
    ap: o.ap
  };


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


  o.of = Monoid => x => Writer(outer.of(Pair(x, Monoid.empty)));


  o.Applicative = {
    ...o.Apply,
    of: o.of
  };


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


  o.chain = Semigroup => mmx => fmm =>
    Writer(outer.chain(mmx.run) (mx =>
      outer.map(my =>
        Pair(my[0], Semigroup.append(mx[1]) (my[1])))
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


  o.append = (Semigroup, Semigroup2) => mmx => mmy =>
    Writer(outer.chain(mmx.run) (mx =>
      outer.map(my => Pair(
        Semigroup.append(mx[0]) (my[0]),
        Semigroup2.append(mx[1]) (my[1])))
          (mmy.run)));


  o.Semigroup = {append: o.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


  o.empty = (Monoid, Monoid2) => Writer(outer.of(Pair(Monoid.empty, Monoid2.empty)));


  o.Monoid = {
    ...o.Semigroup,
    empty: o.empty
  };


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


  o.lift = Monoid => mx => Writer(chain(mx) (x => of(Pair(x, Monoid.empty))));


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


Parser.append = Semigroup => parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => {
      return parser2(p.rest) (p.state).map(ty =>
        ty.run({
          error: o2 => Parser.Result.Error(o2),
          some: p2 => Parser.Result.Some({res: Semigroup.append(p.res) (p2.res), rest: p2.rest, state: p2.state}),
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


Parser.empty = Monoid => Parser(rest => state =>
  [Parser.Result.Some({res: Monoid.empty, rest, state})]);


Parser.map = f => parser => Parser(rest => state => {
  return parser(rest) (state).map(tx => tx.run({
    error: o => Parser.Result.Error(o),
    some: p => Parser.Result.Some({res: f(p.res), rest: p.rest, state: p.state}),
    none: q => Parser.Result.None({rest: q.rest, state: q.state})
  }));
});


Parser.ap = Monoid => parser => parser2 => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],

    some: p => parser2(p.rest) (p.state).map(ty => ty.run({
      error: o2 => Parser.Result.Error(o2),
      some: p2 => Parser.Result.Some({res: p.res(p2.res), rest: p2.rest, state: p2.state}),
      none: q2 => Parser.Result.Some({res: p.res(Monoid.empty), rest: q2.rest, state: q2.state})
    }))
  }));
});


Parser.of = x => Parser(rest => state =>
  [Parser.Result.Some({res: x, rest, state})]);


Parser.chain = Monoid => fm => parser => Parser(rest => state => {
  return parser(rest) (state).flatMap(tx => tx.run({
    error: o => [Parser.Result.Error(o)],
    some: p => fm(p.res) (p.rest) (p.state),
    none: q => fm(Monoid.empty) (q.rest) (q.state)
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


/* Encode asynchronous I/O computations evaluated in serial. Use..

  * `Parallel` for asynchronous computations in parallel
  * `Cont` for synchronous computations in CPS

The type has the following properties:

  * pure core/impure shell concept
  * asynchronous, serial evaluation
  * deferred nested function calls
  * stack-safe due to asynchronous calls
  * non-reliable return values
  * base monad (no transformer)

`Serial` isn't asynchronous by default, i.e. the next continuation (invocation
of the next `then` handler in `Promise` lingo) may be in the same microtask of
Javascript's event loop. Hence an alternative mechanism is needed to provide
stack-safety in the context of long synchronous chains. `runSafe` intersperses
`Promise` into the chain. This process is completely transparent to the caller
because `Serial` doesn't rely on return values.

`Serial` is based on multi-shot continuations, i.e. its continuation can be
invoked several times and thus the corresponding async computation is evaluated
several times. `runOnce` enforces zero or at most one evaluation. */


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

  runSafe: f => {
    if (asyncCounter > 100) {
      asyncCounter = 0;
      return Promise.resolve(null).then(_ => k(f));
    }

    else {
      asyncCounter++;
      return k(f);
    }
  }
});


export const S = Serial; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


S.fromParallel = tx => S(tx.run);


S.fromPex = mmx => S(mmx.run);


S.fromSex = mmx => S(mmx.run);


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


S.allList = () =>
  L.seqA({
    map: S.map,
    ap: S.ap,
    of: S.of});


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


S.ap = tf => tx => S(k =>
  S.and(tf) (tx).run(([f, x]) =>
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


S.append = Semigroup => tx => ty => S(k =>
  S.and(tx) (ty).run(([x, y]) =>
    k(Semigroup.append(x) (y))));


S.Semigroup = {append: S.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


S.empty = Monoid => S(k => k(Monoid.empty));


S.Monoid = {
  ...S.Semigroup,
  empty: S.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


S.capture = tx => S(k => tx.run(x => k(Pair(k, x))));


S.once = tx => { // TODO: delete
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


S.reify = k => x => S(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


S.allArr = S.allArr();


S.allList = S.allList();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ SERIAL :: EXCEPT ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// like `Serial` but augmented with an `Except` transformer


export const SerialExcept = Except.T(Serial) (mmx => ({
  [TAG]: "Serial.Except",
  run: mmx
}));


export const Sex = SerialExcept; // shortcut


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Sex.fromParallel = mx => Sex(mx.run);


Sex.fromPex = mmx => Sex(mmx.run);


Sex.fromSerial = mx => Sex(mx.run);


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


// stops on first exception

Sex.and = mmx => mmy =>
  Sex.chain(mmx) (x =>
    Sex.map(y => Pair(x, y)) (mmy));


// continues on exceptions

Sex.and_ = mmx => mmy =>
  Sex(S(k =>
    mmx.run(x =>
      mmy.run(y =>
        k(Pair(x, y))))));


Sex.allArr = () =>
  A.seqA({
    map: Sex.map,
    ap: Sex.ap,
    of: Sex.of});


Sex.allList = () =>
  L.seqA({
    map: Sex.map,
    ap: Sex.ap,
    of: Sex.of});


Sex.allObj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return Sex.chain(acc) (p =>
      Sex.map(x => (p[key] = x, p)) (o[key]));
  }, Sex.of({}));
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Sex.allArr = Sex.allArr();


Sex.allList = Sex.allList();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Set = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


// use iterator if each key is needed separately

_Set.interconvert = f => s => new Set(f(Array.from(s)));


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


Stream.mapA = Applicative => ft => function go(tx) {
  return tx.run({
    step: o => Applicative.map(x => Stream.Step.lazy({
      yield: x,
      get next() {return go(o.next)}
    }) (ft(o.yield))),

    done: Applicative.of(Stream.Done)
  });
};


Stream.seqA = Applicative => function go(ttx) {
  return ttx.run({
    step: tx => Applicative.map(o => Stream.Step.lazy({
      yield: o.yield,
      get next() {return go(o.next)}
    })) (tx),

    done: Applicative.of(Stream.Done)
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


Stream.append = Semigroup => tx => ty => function go(tx2, ty2) {
  return tx2.run({
    step: o => ty2.run({
      step: o2 => Stream.Step.lazy({
        yield: Semigroup.append(o.yield) (o2.yield),
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


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Str.fromSnum = tx => `${tx.int}.${tx.dec.replace(/0+$/, "")}`;


/*
█████ Parsing █████████████████████████████████████████████████████████████████*/


Str.parseCsv = ({sep, skipFirst}) => csv => {
  if (skipFirst) csv = csv.replace(new RegExp("^.*\\r?\\n", ""), "");

  return csv.trim()
    .replace(/"/g, "")
    .split(/\r?\n/)
    .map(row => row.split(sep))
};


/*
█████ Regular Expressions █████████████████████████████████████████████████████*/


Str.escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


Str.normalizeDate = locale => s => {
  switch (locale) {
    case "de": {
      let rx;

      rx = s.match(new RegExp("^(?<d>\\d{1,2})\\.(?<m>\\d{1,2})\\.(?:20)?(?<y>\\d{2})$", ""));
      
      if (rx === null) rx = s.match(new RegExp("^(?<d>\\d{2})(?<m>\\d{2})(?:20)?(?<y>\\d{2})$", ""));

      if (rx === null) {
        const replacer = (match, d, m, y, offset, string, groups) => {
          const m2 = new Map([
            ["jan", "01"], ["feb", "02"], ["mär", "03"], ["mar", "03"], ["apr", "04"], ["mai", "05"], ["jun", "06"],
            ["jul", "07"], ["aug", "08"], ["sep", "09"], ["okt", "10"], ["nov", "11"], ["dez", "12"]
          ]);

          const k = m.slice(0, 3).toLowerCase();

          if (m2.has(k)) m = m2.get(k);
          return `${d}.${m}.${y}`;
        }

        rx = s.replace(new RegExp("^(\\d{1,2})\\.? +([a-z]+) +(?:20)?(\\d{2})$", "i"), replacer)
          .match(new RegExp("^(?<d>\\d{1,2})\\.(?<m>\\d{2})\\.(?:20)?(?<y>\\d{2})$", ""));
      }

      if (rx === null) return new Exception(`invalid DE date format "${s}"`);

      else {
        if (rx.groups.d.length === 1) rx.groups.d = "0" + rx.groups.d;
        if (rx.groups.m.length === 1) rx.groups.m = "0" + rx.groups.m;
        rx.groups.y = "20" + rx.groups.y;

        return `${rx.groups.y}-${rx.groups.m}-${rx.groups.d}`;
      }
    }

    default: throw new Err(`unknown locale "${locale}"`);
  }
};


Str.normalizeNumber = ({sep: {thd, dec}, places = 0}) => s => {
  if (places > 0 && (thd !== "" || dec !== ""))
    throw new Err("invalid arguments");

  if (thd) s = s.split(thd).join("");
  if (dec) s = s.split(dec).join(".");

  if (places) {
    if (/[^\d]/.test(s)) return s;
    s = `${s.slice(0, -places)}.${s.slice(-places)}`;
  }

  return s;
};


Str.splitChunk = ({from, to}) => s =>
  s.match(new RegExp(`.{${from},${to}}`, "g")) || [];


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THESE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes a fundamental sum type - logical and/or - (A & B) || A || B


export const These = variant("These", "This", "That", "Both") (cons, cons, cons2);


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


These.zero = Monoid => These.That(Monoid.empty);


These.Plus = {
  ...These.Alt,
  zero: These.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


These.ap = Semigroup => tf => tx => tf.run({
  this: f => tx.run({
    this: x => These.This(f(x)),
    that: y => These.Both(f) (y),
    both: x => y => These.Both(f(x)) (y)
  }),

  that: y => tx.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(Semigroup.append(y) (y2)),
    both: x => y => These.Both(x) (Semigroup.append(y) (y2))
  }),

  both: f => y => tx.run({
    this: x => These.Both(f(x)) (y),
    that: y => These.Both(f) (y),
    both: x => y2 => These.Both(f(x)) (Semigroup.append(y) (y2))
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


These.chain = Semigroup => mx => fm => mx.run({
  this: x => fm(x),
  that: _ => mx,

  both: x => y => fm(x).run({
    this: x2 => These.Both(x2) (y),
    that: y2 => These.Both(x) (Semigroup.append(y) (y2)),
    both: x2 => y2 => These.Both(x2) (Semigroup.append(y) (y2))
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


These.append = (Semigroup, Semigroup2) => tx => ty => tx.run({
  this: x => ty.run({
    this: x2 => These.This(Semigroup.append(x) (x2)),
    that: y => These.Both(x) (y),
    both: x2 => y => These.Both(Semigroup.append(x) (x2)) (y),
  }),

  that: y => ty.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(Semigroup2.append(y) (y2)),
    both: x => y2 => These.Both(x) (Semigroup2.append(y) (y2)),
  }),

  both: x => y => ty.run({
    this: x2 => These.Both(Semigroup.append(x) (x2)) (y),
    that: y2 => These.Both(x) (Semigroup2.append(y) (y2)),
    both: x2 => y2 => These.Both(Semigroup.append(x) (x2)) (Semigroup2.append(y) (y2)),
  })
});


These.Semigroup = {append: These.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


These.empty = Monoid => These.That(Monoid.empty);


These.Monoid = {
  ...These.Semigroup,
  empty: These.empty
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ TRAMPOLINE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Allow stack-safe monad recursion through the trampoline mechanism. The type
is the less powerful version of the continuation monad. Due to its structure
consisting of an imperative loop and tagged objects the `Trampoline` type
doesn't have a monad transformer but must be used as the outermost base monad
of a transformer stack. */


export const Trampoline = o => {
  while (o.constructor === Trampoline.rec) o = o.f(o.x);

  return o.constructor === Trampoline.base
    ? o.x
    : _throw(new Err("invalid constructor"));
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Trampoline.map = f => tx =>
  Trampoline.chain(tx) (x => Trampoline.of(f(x)));


Trampoline.Functor = {map: Trampoline.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Trampoline.ap = tf => tx =>
  Trampoline.chain(tf) (f =>
    Trampoline.chain(tx) (x =>
      Trampoline.of(f(x))));


Trampoline.Apply = {
  ...Trampoline.Functor,
  ap: Trampoline.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Trampoline.of = () => Trampoline.base;


Trampoline.Applicative = {
  ...Trampoline.Apply,
  of: Trampoline.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Trampoline.chain = mx => fm =>
  mx.constructor === Trampoline.rec
    ? Trampoline.rec(mx.x) (y => Trampoline.chain(mx.f(y)) (fm))
      : mx.constructor === Trampoline.base ? fm(mx.x)
      : _throw(new Err("invalid constructor"));


Trampoline.Chain = {
  ...Trampoline.Apply,
  chain: Trampoline.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Trampoline.Monad = {
  ...Trampoline.Applicative,
  chain: Trampoline.chain
};


/*
█████ Tags ████████████████████████████████████████████████████████████████████*/


Trampoline.rec = x => f =>
  ({constructor: Trampoline.rec, f, x});


Trampoline.base = x =>
  ({constructor: Trampoline.base, x});


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


Trampoline.of = Trampoline.of();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TREE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* scriptum uses a 2-3 tree implementation as the foundation of its persistant
data structures. */


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ TREE :: SEARCH TREE █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// binary search tree


const Tree = {};


Tree.Empty = {[TAG]: "Empty"};


Tree.Leaf = x => ({[TAG]: "Leaf", height: 0, min: x, x});


Tree.Node2 = (height, min, left, right) =>
  ({[TAG]: "Node2", height, min, left, right});


Tree.Node3 = (height, min, left, middle, right) =>
  ({[TAG]: "Node3", height, min, left, middle, right});


Tree.node2 = (left, right) =>
  Tree.Node2(left.height + 1, left.min, left, right);


Tree.node3 = (left, middle, right) =>
  Tree.Node3(left.height + 1, left.min, left, middle, right);


/*
█████ Implementation Details ██████████████████████████████████████████████████*/


Tree.levelUp = args => {
  switch(args.length) {
    case 2: return [Tree.node2(...args)];
    case 3: return [Tree.node3(...args)];  
    case 4: return [Tree.node2(args[0], args[1]), Tree.node2(args[2], args[3])];
    default: throw new Err("unexpected number of arguments");
  }
}


Tree.levelHeight = (left, right) => {
  if (left.height < right.height) {
    if (right[TAG] === "Node2") {
      const xs = Tree.levelHeight(left, right.left)
        .concat(right.right);

      return Tree.levelUp(xs);
    }

    else {
      const xs = Tree.levelHeight(left, right.left)
        .concat([right.middle, right.right]);

      return Tree.levelUp(xs);
    }
  }

  else if (left.height > right.height) {
    if (left[TAG] === "Node2") {
      const xs = [left.left]
        .concat(Tree.levelHeight(left.right, right));

      return Tree.levelUp(xs);
    }

    else {
      const xs = [left.left, left.middle]
        .concat(Tree.levelHeight(left.right, right));

      return Tree.levelUp(xs);
    }    
  }

  else return [left, right];
};


Tree.merge = (left, right) => {
  if (left[TAG] === "Empty") return right;
  else if (right[TAG] === "Empty") return left;

  else {
    const xs = Tree.levelHeight(left, right);

    if (xs.length === 1) return xs[0];
    else return Tree.node2(...xs);
  }
};


Tree.split = (tree, f) => {
  if (tree[TAG] === "Empty") return [Tree.Empty, Tree.Empty];

  else if (tree[TAG] === "Leaf") {
    if (f(tree.x)) return [Tree.Empty, Tree.Leaf(tree.x)];
    else return [Tree.Leaf(tree.x), Tree.Empty];
  }

  else if (tree[TAG] === "Node2") {
    if (f(tree.right.min)) {
      const [left, right] = Tree.split(tree.left, f);
      return [left, Tree.merge(right, tree.right)];
    }

    else {
      const [left, right] = Tree.split(tree.right, f);
      return [Tree.merge(tree.left, left), right];
    }
  }

  else {
    if (f(tree.middle.min)) {
      const [left, right] = Tree.split(tree.left, f);
      return [left, Tree.merge(right, Tree.node2(tree.middle, tree.right))];
    }

    if (f(tree.right.min)) {
      const [left, right] = Tree.split(tree.middle, f);
      return [Tree.merge(tree.left, left), Tree.merge(right, tree.right)];
    }

    else {
      const [left, right] = Tree.split(tree.right, f);
      return [Tree.merge(Tree.node2(tree.left, tree.middle), left), right];
    }
  }
};


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


// catamorphism (structural fold)

Tree.cata = ({empty, leaf, node2, node3}) => function go(tree) {
  switch (tree[TAG]) {
    case "Empty": return empty();
    case "Leaf": return leaf(tree.x);

    case "Node2": return node2(
      tree.height,
      tree.min,
      go(tree.left),
      go(tree.right))

    case "Node3": return node3(
      tree.height,
      tree.min,
      go(tree.left),
      go(tree.middle),
      go(tree.right))
  }
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Tree.fromArr = xs => xs.reduce((acc, x) => Tree.ins(acc, x), Tree.Empty)


Tree.prepend = (tree, xs) => {
  if (tree[TAG] === "Empty") return xs;
  else if (tree[TAG] === "Leaf") return (xs.unshift(tree.x), xs);
  
  else if (tree[TAG] === "Node2")
    return Tree.prepend(tree.left, Tree.prepend(tree.right, xs));

  else if (tree[TAG] === "Node3")
    return Tree.prepend(tree.left, Tree.prepend(tree.middle, Tree.prepend(tree.right, xs)));
};


Tree.toArr = tree => Tree.prepend(tree, []);


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// left fold in ascending order

Tree.foldl = f => acc => Tree.cata({
  empty: () => acc,
  leaf: id,
  node2: (height, min, left, right) => f(f(acc) (left)) (right),
  node3: (height, min, left, middle, right) => f(f(f(acc) (left)) (middle)) (right)
});


// left fold in descending order

Tree.foldl_ = f => acc => Tree.cata({
  empty: () => acc,
  leaf: id,
  node2: (height, min, right, left) => f(f(acc) (left)) (right),
  node3: (height, min, right, middle, left) => f(f(f(acc) (left)) (middle)) (right)
});


// right fold in ascending order

Tree.foldr = f => function go(acc) {
  return tree => {
    switch (tree[TAG]) {
      case "Empty": return acc;
      case "Leaf": {return f(tree.x) (acc);}
      case "Node2": return go(go(acc) (tree.right)) (tree.left);
      case "Node3": return go(go(go(acc) (tree.right)) (tree.middle)) (tree.left);
    }
  };
};


// right fold in descending order

Tree.foldr_ = f => function go(acc) {
  return tree => {
    switch (tree[TAG]) {
      case "Empty": return acc;
      case "Leaf": {return f(tree.x) (acc);}
      case "Node2": return go(go(acc) (tree.left)) (tree.right);
      case "Node3": return go(go(go(acc) (tree.left)) (tree.middle)) (tree.right);
    }
  };
};


Tree.Foldable = {
  foldl: A.foldl,
  foldr: A.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Tree.map = f => Tree.cata({
  empty: () => Tree.Empty,
  leaf: x => Tree.Leaf(f(x)),

  node2: (height, min, left, right) =>
    Tree.Node2(height, f(min), left, right),

  node3: (height, min, left, middle, right) =>
    Tree.Node3(height, f(min), left, middle, right)
});


Tree.Functor = {map: Tree.map};


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


Tree.has = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);

  if (right[TAG] === "Empty") return false;
  else return right.min === x;
};


Tree.ins = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);
  return Tree.merge(Tree.merge(left, Tree.Leaf(x)), right);
};


Tree.del = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x),
    [, right2] = Tree.split(right, y => y > x);

  return Tree.merge(left, right2);
};


/*
█████ Meta Information ████████████████████████████████████████████████████████*/


Tree.nodes = Tree.cata({
  empty: () => 0,
  leaf: _ => 0,
  node2: (height, min, left, right) => 1 + left + right,
  node3: (height, min, left, middle, right) => 1 + left + middle + right,
});


Tree.leafs = Tree.cata({
  empty: () => 0,
  leaf: _ => 1,
  node2: (height, min, left, right) => left + right,
  node3: (height, min, left, middle, right) => left + middle + right
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


Yo.ap = Apply => tf => tx => Yo(f => Apply.ap(tf.run(comp(f))) (tx.run(id)));


Yo.Apply = {
  ...Yo.Functor,
  ap: Yo.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Yo.of = Applicative => x => Yo(f => Applicative.of(f(x)));


Yo.Applicative = {
  ...Yo.Apply,
  of: Yo.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Yo.chain = Chain => mx => fm =>
  Yo(f => Chain.chain(mx.run(id)) (x => fm(x).run(f)));
    

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


Yo.lift = Functor => tx => Yo(f => Functor.map(f) (tx));


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


/* Scriptum defines the file system as a formal parameter to avoid a hard
dependency. The file system can via a continuation monad supplied in different
variations that span the following semantics:

  * error throwing vs. exeption handling
  * serial vs. parallel processing

What semantics is used depends on the constructor of the monadic continuation
type, which is passed as another argument. */


export const FileSys = fs => Cons => thisify(o => {
  o.copy = src => dest => Cons(k =>
    fs.copyFile(src, dest, e =>
      e ? k(new Exception(e)) : k(null)));

  o.move = src => dest => // guaranteed order
    Cons.chain(o.copy(src) (dest)) (_ =>
      o.unlink(src));

  o.read = opt => path => Cons(k =>
    fs.readFile(path, opt, (e, x) =>
      e ? k(new Exception(e)) : k(x)));

  o.scanDir = path => Cons(k =>
    fs.readdir(path, (e, xs) =>
      e ? k(new Exception(e)) : k(xs)));

  o.stat = path => Cons(k =>
    fs.stat(path, (e, o) =>
      e ? k(new Exception(e)) : k(o)));

  o.unlink = path => Cons(k =>
    fs.unlink(path, e =>
      e ? k(new Exception(e)) : k(null)));

  o.write = opt => path => s => Cons(k =>
    fs.writeFile(path, s, opt, e =>
      e ? k(new Exception(e)) : k(s)));

  return o;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TODO █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/

/*

  * implement non-empty list combinators
  * add foldl1/foldr1 to all container types
  * conversion: fromFoldable instead of fromList/fromArray
  * delete S.once/P.once etc. provided it is redundant
  * add type wrapper for transformers?
  * add Represantable type class
  * add Distributive type class

*/

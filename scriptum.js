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


const DEBUG = true;


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


export const TAG = Symbol.toStringTag;


export const VAL = PREFIX + "value";


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
counter is shared between all running asynchronous operations. */

let asyncCounter = 0; // upper bound: 100


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ ALGEBRAIC DATA TYPES █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const ANY = PREFIX + "*";


/*
█████ Product Type ████████████████████████████████████████████████████████████*/


/* Product types are composite types containing several values of various types.
Most native Javascript types are products. */


export const product = tag => (...ks) => (...vs) => {
  if (ks.length !== vs.length)
    throw new Err(`insufficient arguments`);

  const o = ks.reduce((acc, k,i) => (acc[k] = vs[i], acc), {});

  o.run = o; // variant compliant
  Object.defineProperty(o, TAG, {value: tag});
  return o;
};


// more general product type definitions (e.g. with lazy getters)

export const product_ = tag => (...ks) => o => {
  if (DEBUG) {
    for (const k of ks)
      if (!(k in o)) throw new Err(`missing value "${k}"`);
  }

  o.run = f => f(o); // variant compliant
  Object.defineProperty(o, TAG, {value: tag});
  return p;
};


// unary product type for convenience

export const type = tag => x => {
  const o = {run: x};

  Object.defineProperty(o, TAG, {value: tag});
  return o;
};


/*
█████ Variant Types ███████████████████████████████████████████████████████████*/


/* Variant types allow different shapes in the form of an exclusive-or relation
subsumed under a single type. scriptum only supports composite values as
variants. You can use them as follows:

  const Option = variant("Option", constant("None"), cons("Some"));

  const tx = Option.Some(5),
    ty = Option.None;

  /* The value of a variant type cannot be accessed direclty. You need to invoke
  the `run` method and provide a type dictionary to inspect it:

  tx.run({some: x => x * x, none: 0}); // yields 25
  ty.run({some: x => x * x, none: 0}); // yields 0

  You can also resort to the predefined catamorphism:

  const option = Option.cata({some: x => x * x, none: 0}));

  option(tx); // yields 25
  option(ty); // yields 0

`cata` offers the safest usage because it includes an exhaustiveness check,
i.e. it assures that the provided type dictionary provides all necessary
variants.

You can use the `VAL` property key during debugging to facilitate the process.

The next example is a recursive variant type in which the second constructor is a
product type. In general, you can ecnode sums of products using variant types:

  const List = variant("List", constant("Nil"), consn("Cons", "head", "tail"));

  const xs = List.Cons({
    head: 1,

    tail: List.Cons({
      head: 2,
      tail: List.Nil
    })
  });

  const list = List.cata({
    nil: 0,
    cons: ({head, tail}) => head + list(tail)
  });

  list(xs); // yields 3

Since `List` has a recursive type defintion, its catamorphism relies on
recursion as well. For the sake of simplicity, `cata` isn't stack safe. */


export const variant = (tag, ...cases) => {
  const ks = [];
  
  for (const _case of cases)
    ks.push(_case.name[0].toLowerCase() + _case.name.slice(1));

  const o = cases.reduce((acc, _case, i) => {
    acc[_case.name] = _case(tag, ks[i]);
    return acc;
  }, {});

  o.cata = p => {
    if (DEBUG) {
      for (const k of ks)
        if (!(k in p)) throw new Err(`missing case "${k}"`);
    }

    return tx => tx.run(p);
  };
  
  return o;
};


// constant

export const constant = _case => {
  const o = {
    [_case]: (tag, k) => {
      const p = {
        run: ({[k]: x}) => x,
        tag: _case
      };

      Object.defineProperties(p, {
        [TAG]: {value: tag},
        [VAL]: {value: Null}
      });

      return p;
    }
  };

  return o[_case];
};


// unary constructor

export const cons = _case => {
  const o = {
    [_case]: (tag, k) => x => {
      const p = {
        run: ({[k]: f}) => f(x),
        tag: _case
      };

      Object.defineProperties(p, {
        [TAG]: {value: tag},
        [VAL]: {value: x}
      });

      return p;
    }
  };

  return o[_case];
};


// binary constructor (product type)

export const cons2 = _case => {
  const o = {
    [_case]: (tag, k) => x => y => {
      const p = {
        run: ({[k]: f}) => f(x) (y),
        tag: _case
      };

      Object.defineProperties(p, {
        [TAG]: {value: tag},
        [VAL]: {value: [x, y]}
      });

      return p;
    }
  };

  return o[_case];
};


/* n-ary constructor (product type) with more than two arguments are defined
as an object with named properties to avoid strict argument order. It can also
be used to define lazy getters. */

export const consn = (_case, ...ks) => {
  const o = {
    [_case]: (tag, k) => o => {
      if (DEBUG) {
        for (const k2 of ks)
          if (!(k2 in o)) throw new Err(`missing case "${k2}"`);
      }

      const p = {
        run: ({[k]: f}) => f(o),
        tag: _case
      };

      Object.defineProperties(p, {
        [TAG]: {value: tag},
        [VAL]: {value: o}
      });

      return p;
    }
  };

  return o[_case];
};


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


/* General catamorphism for all types that resemble variant types. It only
accept functions as arguments, no constants. Most suitable for types in
Javascript that encode certain control flow effects like `Null` or `Error`. */

export const cata = (...ks) => dict => {
  if (DEBUG) {
    for (const k of ks)
      if (!(k in dict)) throw new Err(`missing case "${k}"`);
  }

  else return x => {
    const tag = Object.prototype.toString.call(x).slice(8, -1),
      k = tag[0].toLowerCase() + tag.slice(1);

    if (k in dict) return dict[k] (x);
    else if (ANY in dict) return dict[ANY] (x);
    else throw new Err(`unknown case "${k}"`);
  };
};


/* Some types like natural numbers don't have their own constructor let alone
a recursive type definition in Javascript. For these cases, a more general
function to create catamorphisms is supplied. Other more well-formed types
like single linked lists rely on non-stack-safe recursion. `cata_` can be used
to encode a stack-safe trampoline or imperative loop. */

export const cata_ = (...ks) => decons => dict => {
  if (DEBUG) {
    for (const k of ks)
      if (!(k in dict)) throw new Err(`missing case "${k}"`);
  }

  else return decons(dict);
};


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
  }
};


/* Exception type that accumulates individual exceptions. Useful when you need
to log errors/exceptions for later reporting. */

export class Exceptions extends Exception {
  constructor(...es) {
    super();
    this.errors = []; // excepts `Error` and subclasses

    es.forEach(e => {
      if (e.constructor.name === "Exceptions")
        this.errors.push.apply(this.errors, e.errors);

      else this.errors.push(e);
    });
  }
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ INTROSPECTION ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const introspect = x => {
  if (x === null || x === Null) return "Null";
  else if (x === undefined) throw new Error("undefined evaluation");
  else if (x !== x) throw new Error("not a number");

  else {
    const t = typeof x;

    if (t === "object") {
      const t2 = Object.prototype.toString.call(x).slice(8, -1);

      // product/variant type

      if ("run" in x) {
        if (VAL in x) return `${t2}<${introspect(x[VAL])}>`; // variant
        else return `${t2}<${introspect.obj(x)}>`; // product
      }

      else {
        switch (t2) {
          case "Array": return introspect.arr(x);
          case "Map": return introspect.map(x);
          case "Set": return introspect.set(x);
          
          case "Date": {
            if (Number.isNaN(x.getTime())) throw new Error("invalid date");
            else return "Date";
          }

          default: return introspect.obj(x);
        }
      }      
    }

    else if (t === "function") {
      const t2 = Object.prototype.toString.call(x).slice(8, -1);
      
      // check for implicit thunk

      if (t2 === "Null") return "Null";

      // check for tracked function

      else if ("sig" in x) return `(${x.name} :: ${x.sig})`;
      else return "Function";
    }

    else return t[0].toUpperCase() + t.slice(1);
  }
};


introspect.arr = xs => {
  if (xs.length === 0) return "[]";
  
  else if (xs.length <= 3) {
    const s = xs.reduce((acc, x) => acc.add(introspect(x)), new Set());

    if (s.size === 1) return `[${Array.from(s) [0]}]`;
    else return `[${Array.from(s).join(", ")}]`;
  }

  else return `[${introspect(xs[0])}]`;
};


introspect.map = m => {
  if (m.size === 0) return `Map<>`;
  for (const [k, v] of m) return `Map<${introspect(k)}, ${introspect(v)}>`;
};


introspect.set = s => {
  if (s.size === 0) return `Set<>`;
  for (const k of s) return `Set<${introspect(k)}>`;
};


introspect.obj = o => {
  const t = Object.prototype.toString.call(o).slice(8, -1),
    ks = Reflect.ownKeys(o);

  if (ks.length === 0) return t;
  else return `${t} {${ks.map(k => `${k}: ${introspect(o[k])}`).join(", ")}}`
};


/*
█████ Definitions █████████████████████████████████████████████████████████████*/


introspect.def = {};


introspect.def.un = (f, name) => F(f, name, [["x"]]);


introspect.def.unf = (f, name) => F(f, name, [["f"]]);


introspect.def.bin = (f, name) => F(f, name, [["x"], ["y"]]);


introspect.def.binf = (f, name) => F(f, name, [["f"], ["x"]]);


introspect.def.binf2 = (f, name) => F(f, name, [["f"], ["g"]]);


introspect.def.binUn = (f, name) => F(f, name, [["x", "y"], ["z"]]);


introspect.def.binUnf = (f, name) => F(f, name, [["f", "x"], ["y"]]);


introspect.def.binUnf2 = (f, name) => F(f, name, [["f", "g"], ["x"]]);


introspect.def.bin_ = (f, name) => F(f, name, [["x", "y"]]);


introspect.def.binf_ = (f, name) => F(f, name, [["f", "x"]]);


introspect.def.binf2_ = (f, name) => F(f, name, [["f", "g"]]);


introspect.def.tern = (f, name) => F(f, name, [["x"], ["y"], ["z"]]);


introspect.def.ternf = (f, name) => F(f, name, [["f"], ["x"], ["y"]]);


introspect.def.ternf2 = (f, name) => F(f, name, [["f"], ["g"], ["x"]]);


introspect.def.ternf3 = (f, name) => F(f, name, [["f"], ["g"], ["h"]]);


introspect.def.ternUn = (f, name) => F(f, name, [["w", "x", "y"], ["z"]]);


introspect.def.ternUnf = (f, name) => F(f, name, [["f", "x", "y"], ["z"]]);


introspect.def.ternUnf2 = (f, name) => F(f, name, [["f", "g", "x"], ["y"]]);


introspect.def.ternUnf3 = (f, name) => F(f, name, [["f", "g", "h"], ["x"]]);


introspect.def.tern_ = (f, name) => F(f, name, [["x", "y", "z"]]);


introspect.def.ternf_ = (f, name) => F(f, name, [["f", "x", "y"]]);


introspect.def.ternf2_ = (f, name) => F(f, name, [["f", "g", "x"]]);


introspect.def.ternf3_ = (f, name) => F(f, name, [["f", "g", "h"]]);


introspect.def.vari = (f, name) => F(f, name, [["...xs"]]);


introspect.def.varif = (f, name) => F(f, name, [["...fs"]]);


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

All three operations force `expr` as an implicit thunk to be evaluated. You can
also call implicit thunks as if it were explicit ones, i.e. `expr()` works even
if if the evaluation doesn't yield an unary function.

There are some limitations to this Proxy-based thunk approach:

  * `typeof` isn't intercepted by the proxy (thus yields `object`)
  * `===` doesn't trigger evaluation
  * `&&`/`||` doesn't trigger evaluation
  * `throw` doesn't trigger evaluation

These limitations are considered throughout the library. */


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


const DETHUNK = PREFIX + "dethunk";


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/*
█████ API █████████████████████████████████████████████████████████████████████*/


/* Create an implicit thunk. Just like with `typeof`, tag introspection should
not force evaluation. This isn't always possible in an untyped setting, though.
If wihtin an operation the tag for a lazy expression is known upfront, it can
be passed to the thunk through the `tag` argument. Otherwise, `null` is provided
via the `lazy` partially applied auxliliary function. In case of `null`, tag
introspection forces evaluation. When a specific tag is provided, it is up to
the user that it corresponds to the type of the eventually evaluated thunk. */

export const lazy_ = tag => thunk =>
  new Proxy(thunk, new Thunk(tag));


export const lazy = lazy_(Null);


// striclty evaluate an expression that might be an implicit thunk

export const strict = x => {
  if (x && x[THUNK]) return x[DETHUNK];
  else return x;
};


/*
█████ Implementation Details ██████████████████████████████████████████████████*/


class Thunk {
  constructor(tag) {
    this.tag = tag;
    this.memo = NULL;
  }

  apply(f, that, args) {

    // enforce evalutation to WHNF

    if (this.memo === NULL) evaluate(this, f);

    if (typeof this.memo === "function") {
      this.memo = this.memo(...args);
      return this.memo;
    }

    // allow implicit thunks to be called explicitly

    else if (args.length === 0) return this.memo;
    else throw Err("call of non-callable thunk");
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
      if (this.memo === NULL) evaluate(this, f);
      return this.memo;
    }

    // avoid evaluation due to tag introspection as far as possible

    else if (k === Symbol.toStringTag) {
      if (this.tag === Null) {
        if (this.memo === NULL) evaluate(this, f);
        this.tag = this.memo ? this.memo[TAG] : undefined;
      }

      return this.tag;
    }

    // intercept implicit type casts

    else if (k === Symbol.toPrimitive
      || k === "valueOf"
      || k === "toString") {
        if (this.tag === "Null") throw new Err("implicit type cast on null");
        else if (this.memo === NULL) evaluate(this, f);
        
        if (Object(this.memo) === this.memo) return this.memo[k];
        
        else if (k === Symbol.toPrimitive) return hint =>
          hint === "string" ? String(this.memo) : this.memo;

        else if (k === "valueOf") return () => this.memo;
        else return () => String(this.memo);
    }

    // enforce evaluation to WHNF due to array context

    else if (k === Symbol.isConcatSpreadable) {
      if (this.memo === NULL) evaluate(this, f);
      if (this.memo && this.memo[Symbol.isConcatSpreadable]) return true;
      else return false;
    }

    // enforce evaluation to WHNF due to property access

    else {
      if (this.memo === NULL) evaluate(this, f);

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

    if (this.memo === NULL) evaluate(this, f);
    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(f, k) {

    // prevent evaluation in case of thunk introspection

    if (k === THUNK) return true;

    // enforce evaluation to WHNF

    if (this.memo === NULL) evaluate(this, f);
    return k in this.memo;
  }

  ownKeys(o) {

    // enforce evaluation to WHNF

    if (this.memo === NULL) evaluate(this, f);
    return Reflect.ownKeys(this.memo);
  }

  set(o) {
    throw new Err("set op on immutable value");
  }
}


const evaluate = (_this, f) => {
  _this.memo = f();
  
  while (_this.memo && _this.memo[THUNK] === true)
    _this.memo = _this.memo[EVAL];

  if (_this.memo === undefined)
    throw new Err("thunk evaluated to undefined");
  
  // enforce tag consistency

  else if (_this.memo
    && _this.memo[TAG]
    && _this.memo[TAG] !== _this.tag
    && _this.tag !== Null)
      throw new Err("tag argument deviates from actual value");
};


/*
█████ Type Constants ██████████████████████████████████████████████████████████*/


/* Safer null value that also immediately throws at implicit type casts. It
evaluates to `null` */

export const Null = lazy_("Null") (() => null);


// proper bottom type

export const Undefined = lazy_("Undefined") (() => {
  throw new Err("undefined program state");
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ MEMOIZATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Memoization of recursive functions with a single argument. You can transform
them into CPS form in order to derive memoized and a non-memoized versions from
them:

  const app = f => x => f(x);

  const cpsFib = k => {
    const rec = k(n => n <= 1 ? n : rec(n - 1) + rec(n - 2));
    return rec;
  };

  const fibMemo = cpsFib(memo)
    fib = cpsFib(app);

  fib(40); // yields 102334155
  fibMemo(40); // yields 102334155 much faster

Or simply rely on reference mutation of the original recursive function with
`let fib = n => {...}; fib = memo(fib)` */


const memo = f => {
  const m = new Map();

  return x => {
    if (m.has(x)) return m.get(x);
    
    else {
      const r = f(x);
      m.set(x, r);
      return r;
    }
  };
};


// more general version where the key is derived from the value

const memo_ = f => g => {
  const m = new Map();

  return x => {
    const k = f(x);

    if (m.has(k)) return m.get(k);
    
    else {
      const y = g(x), k2 = f(y);
      m.set(k2, y);
      return y;
    }
  };
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ OVERLOADED OPERATORS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Javascript built-in overloaded operators as functions. Some of them only
make sense with implicit/explicit thunks. For example, with `and` you would
lose the lazy evaluation property of the `&&` operator, if you pass them as
expressions not wrapped in a thunk/function. */


/*
█████ Short Circuiting ████████████████████████████████████████████████████████*/


// g might never be evaluated

export const and = f => g => f() && g();


// g might never be evaluated

export const or = f => g => f() || g();


// y might never be evaluated

export const xor_ = _default => x => y => {
  if (x && !y) return x;
  else if (!x && y) return y;
  else return _default;
};


/*
█████ Boolean Logic ███████████████████████████████████████████████████████████*/


export const between = ({lower, upper}) => x => x >= lower && x <= upper;


/* Since `===` cannot be intercepted by proxies, implicit thunks are not forced
to WHNF. Hence the strict evaluation of operands. */

export const eq = x => y => x === y;


// lazy variant that works with implicit and explicit thunks

export const eq_ = f => g => f() === g();


export const gt = x => y => x > y;


export const gte = x => y => x >= y;


export const iff = ({true: t, false: f}) => x => y => {
  if (x && y) return t;
  else if (!x && !y) return t;
  else return f;
};


export const imply = ({true: t, false: f}) => x => y => {
  if (x) {
    if (y) return t;
    else return f;
  }

  else return t;
};


export const lt = x => y => x < y;


export const lte = x => y => x <= y;


export const max = x => y => x >= y ? x : y;


export const min = x => y => x <= y ? x : y;


export const neq = x => y => x !== y;


/* Since `!==` cannot be intercepted by proxies, implicit thunks are not forced
to WHNF. Hence the strict evaluation of operands. */

export const neq_ = f => g => f() !== g();


export const notBetween = ({lower, upper}) => x => x < lower || y > upper;


export const xor = ({true: t, false: f}) => x => y => {
  if (x && !y) return t;
  else if (!x && y) return t;
  else return f;
};


/*
█████ Ordering ████████████████████████████████████████████████████████████████*/


export const compareAsc = x => y => x < y ? LT : x > y ? GT : EQ;


export const compareDesc = y => x => x < y ? LT : x > y ? GT : EQ;


export const compareOn_ = () => compBoth(compareAsc);


export const order = ({lt, eq, gt}) => x => y =>
  x < y ? lt(Pair(x, y))
    : x > y ? gt(Pair(x, y))
    : eq(Pair(x, y));


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


Loop.call = function call(f, x) {
  return {[TAG]: "Loop", constructor: Loop.call, f, x};
};


Loop.rec = function rec(x) {
  return {[TAG]: "Loop", constructor: Loop.rec, x};
};


Loop.base = function base(x) {
  return {[TAG]: "Loop", constructor: Loop.base, x};
};


Loop2.call = function call(f, x, y) {
  return {[TAG]: "Loop2", constructor: Loop2.call, f, x, y};
};


Loop2.rec = function rec(x, y) {
  return {[TAG]: "Loop2", constructor: Loop2.rec, x, y};
};


Loop2.base = function base(x) {
  return {[TAG]: "Loop2", constructor: Loop2.base, x};
};


Loop3.call = function call(f, x, y, z) {
  return {[TAG]: "Loop3", constructor: Loop3.call, f, x, y, z};
};


Loop3.rec = function rec(x, y, z) {
  return {[TAG]: "Loop3", constructor: Loop3.rec, x, y, z};
};


Loop3.base = function base(x) {
  return {[TAG]: "Loop3", constructor: Loop3.base, x};
};


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

  const fib = Stack(n =>
    n <= 1
      ? Stack.base(n)
      : Stack.call2(
          add,
          Stack.rec(n - 1),
          Stack.rec(n - 2))); */


export const Stack = f => x => {
  const stack = [f(x)];

  while (stack.length > 1 || stack[0].constructor !== Stack.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Stack.call:
      case Stack.call2: {
        o = f(o.x.x); // 1st x of call and 2nd x of next tag
        stack.push(o);
        break;
      }

      case Stack.rec: {
        o = f(o.x);
        break;
      }

      case Stack.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Stack.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Stack.call: {
              o = Stack.base(p.f(o.x));
              stack.push(o);

              break;
            }

            case Stack.call2: {
              o = Stack.call(p.f(o.x), p.y);
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


export const Stack2 = f => (x, y) => {
  const stack = [f(x, y)];

  while (stack.length > 1 || stack[0].constructor !== Stack2.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Stack2.call:      
      case Stack2.call2: {
        o = f(o.x.x, o.x.y);
        stack.push(o);
        break;
      }

      case Stack2.rec: {
        o = f(o.x, o.y);
        break;
      }

      case Stack2.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Stack2.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Stack2.call: {
              o = Stack2.base(p.f(o.x, o.y));
              stack.push(o);

              break;
            }

            case Stack2.call2: {
              o = Stack2.call(p.f(o.x, o.y), p.y);
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


Stack.call = function call(f, x) {
  return {[TAG]: "Stack", constructor: Stack.call, f, x};
};


Stack.call2 = function call2(f, x, y) {
  return {[TAG]: "Stack", constructor: Stack.call2, f, x, y};
};


Stack.rec = function rec(x) {
  return {[TAG]: "Stack", constructor: Stack.rec, x};
};


Stack.base = function base(x) {
  return {[TAG]: "Stack", constructor: Stack.base, x};
};


Stack2.call = function call(f, x) {
  return {[TAG]: "Stack2", constructor: Stack2.call, f, x};
};


Stack2.call2 = function call2(f, x, y) {
  return {[TAG]: "Stack2", constructor: Stack2.call2, f, x, y};
};


Stack2.rec = function rec(x) {
  return function rec(y) {
    return {[TAG]: "Stack2", constructor: Stack2.rec, x, y};
  };
};


Stack2.base = function base(x) {
  return {[TAG]: "Stack2", constructor: Stack2.base, x};
};



/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THIS █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// make the receiving object explicit thus dropping `this`

export const This = t => ({
  app: x => This(t(x)), // applies the boxed fun
  app_: x => This(y => t(y) (x)), // applies the 2nd arg of the boxed fun
  map: f => This(f(t)),  // applies the fun
  map_: f => This(x => f(x) (t)), // applies the 2nd arg of the fun
  unbox: t // retrieves the boxed value
});


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


/*
█████ Kleisli Composition █████████████████████████████████████████████████████*/


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


// ignore the result of the first monad

export const then = Monad => mmx => mmy => Monad.chain(mmx) (_ =>
  Chain.chain(mmy) (Monad.of));


// ignore the result of the second monad

export const then_ = Monad => mmx => mmy => Monad.chain(mmx) (x =>
  Chain.chain(mmy) (_ => Monad.of(x)));


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FUNCTION ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Tracked functions always carry their initial name no matter if they are in
multi-argument or curried form. They track the argument types they were called
with and display all unsatisfied parameters left. Tracked functions throw an
error as soon as they detect an undefined argument or return value. Variadic
arguments are supported, optional arguments are not.

Each function will be supplied in a tracked and untracked variant. Which one
is actually exported depends on the global `DEBUG` constant of the library.

HEADS UP: You must not create dependencies against the `name` or `sig` property
in your codebase. */

const Fun = (f, name, arities, types = []) => {
  if (typeof f !== "function") return f;

  Object.defineProperties(f, {
    name: {value: name},

    sig: {value: types.map(xs => xs.join(", ")).join(" -> ")
      + (types.length ? " => " : "")
      + arities.map(xs => xs.join(", ")).join(" => ")
      + " => ?"}
  });

  return new Proxy(f, {
    apply: (f, _, args) => {
      if (arities.length <= 1) {
        const r = f(...args), t = introspect(r);

        if (t === undefined || t === "NaN" || t === "InvalidDate")
          throw new Error("evaluated to " + t);

        else return r;
      }

      else if (arities[0] [0] [0] === ".") return F(
        f(...args),
        name,
        arities.slice(1),
        types.concat([[introspect(args)]]));
      
      else return F(
        f(...args),
        name,
        arities.slice(1),
        types.concat([arities[0].map((_, i) => introspect(args[i]))]));
    }
  });
};


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

Classic function composition composes operators `comp`/`pipe` compose in their
first argument just like applicative `ap`. Functorial `map`, however, composes
in its second argument. */

const _infix = first => (...args) => {
  if (args.length === 0) throw new Err("no argument found");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else if (first) x = args[i++] (x) (args[i++]);
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


export let comp = f => g => x => f(g(x));
if (DEBUG) comp = introspect.def.ternf2(comp, "comp");


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


/* Create a queue of functions that can be applied in sequence in a stack-safe
manner. You can not only get the final result but recover all intermediate
results by consuming the generator with `Array.from`. */

export const seq = fs => function* (x) {
  for (let i = 0; i < fs.length; i++) {
    x = fs[i] (x);
    yield x;
  }

  return x;
};


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
    `${"█".repeat(3)} LOG ${"█".repeat(71)}`,
    "\r\n", `${tag}:`, x, "\r\n");

  else console.log(
    `${"█".repeat(3)} LOG ${"█".repeat(71)}`,
    "\r\n", x, "\r\n");

  return x;
};


export const trace = x => {
  const s = JSON.stringify(x);

  console.log(
    `${"█".repeat(3)} LOG ${"█".repeat(71)}`,
    "\r\n", x, "\r\n"
  );

  console.log(
    `${"█".repeat(3)} JSON ${"█".repeat(70)}`,
    "\r\n", s," \r\n"
  );

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


export const intro = x =>
  Object.prototype.toString.call(x).slice(8, -1);


export const _throw = e => { // throw as a first class expression
  throw e;
};


export const throw_ = e => {
  return {
    for: p => x => {
      if (p(x)) throw e(x);
      else return x;
    },

    exceptFor: p => x => {
      if (!p(x)) throw e(x);
      else return x;
    }
  };
};


// try/catch block as an expression

export const _try = f => x => ({
  catch: handler => {
    try {return f(x)}
    catch(e) {return handler(x) (e)};
  }
});


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
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Enocodes the effect of computations that may have no, one or several results.
Array is not a functional data type, because it has a non recursive definition.
While it has a valid monad instance, there is no valid transformer. Use list or
streams instead. */


export const Arr = {}; // namespace


export const A = Arr; // shortcut


/*
█████ Backtrack ███████████████████████████████████████████████████████████████*/


// TODO


/*
█████ Clonable ████████████████████████████████████████████████████████████████*/


A.clone = xs => xs.concat();


A.Clonable = {clone: A.clone};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


A.fromList = xss => xss.flat(Number.POSITIVE_INFINITY);


A.fromCsv = ({sep, skipFirst}) => csv => {
  if (skipFirst) csv = csv.replace(new RegExp("^.*\\r?\\n", ""), "");

  return csv.trim()
    .replace(/"/g, "")
    .split(/\r?\n/)
    .map(row => row.split(sep))
};


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


A.cons = x => xs => [x].concat(xs);


A.cons_ = xs => x => [x].concat(xs);


A.head = xs => xs.length === 0 ? Null : xs[0];


A.headOr = x => xs => xs.length === 0 ? x : xs[0];


A.index = i => xs => (i in xs) ? xs[i] : Null;


A.indexOr = x => i => xs => (i in xs) ? xs[i] : x;


A.init = xs => xs.length === 0 ? Null : xs.slice(0, -1);


A.last = xs => xs.length === 0 ? Null : xs[xs.length - 1];


A.lastOr = x => xs => xs.length === 0 ? x : xs[xs.length - 1];


A.push = x => xs => (xs.push(x), xs);


A.pushn = ys => xs => (xs.push.apply(xs, ys), xs);


A.push_ = xs => x => (xs.push(x), xs);


A.pushn_ = xs => ys => (xs.push.apply(xs, ys), xs);


A.pop = xs => Pair(xs.length === 0 ? Null : xs.pop(), xs);


A.shift = xs => Pair(xs.length === 0 ? Null : xs.shift(), xs);


A.singleton = x => [x];


A.snoc = x => xs => xs.concat([x]);


A.snoc_ = xs => x => xs.concat([x]);


A.tail = xs => xs.length === 0 ? Null : xs.slice(1);


A.uncons = xs => Pair(xs.length === 0 ? Null : xs[0], xs.slice(1));


A.unshift = x => xs => (xs.unshift(x), xs);


A.unshiftn = ys => xs => (xs.unshift.apply(xs, ys), xs);


A.unshift_ = xs => x => (xs.unshift(x), xs);


A.unshiftn_ = xs => ys => (xs.unshift.apply(xs, ys), xs);


A.unsnoc = xs => Pair(
  xs.length === 0 ? Null : xs[xs.length - 1],
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

A.focus = (i, j = Null) => xs => {
  if (j === Null) j = xs.length - 1;

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


/* A fold with `f` encoded in continuation passing style so that the function
argument can decide whether to continue or abort the right-associative fold. */

A.foldk = f => init => xs =>
  Loop2((acc, i) =>
    i === xs.length
      ? Loop2.base(acc)
      : f(xs[i]) (acc) (acc2 => Loop2.rec(acc2, i + 1)))
        (init, 0);


// eager, right-associative and yet stack-safe fold

A.foldr = f => acc => xs => Stack(i => {
  if (i === xs.length) return Stack.base(acc);

  else return Stack.call(
    f(xs[i]),
    Stack.rec(i + 1));
}) (0);


A.foldr1 = f => xs => Stack(i => {
  let acc = xs.length === 0
    ? _throw(new Err("empty array")) : xs[0];

  if (i === xs.length) return Stack.base(acc);

  else return Stack.call(
    f(xs[i]),
    Stack.rec(i + 1));
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


// eager arrays don't comply with lazy recursion schemes


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
█████ Special Folds ███████████████████████████████████████████████████████████*/


A.foldSucc = f => acc => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc = f(acc) (Pair(xs[i], xs[j]));

  return acc;
};


A.sum = A.foldl(m => n => m + n) (0);


/*
█████ Special Maps ████████████████████████████████████████████████████████████*/


A.mapSucc = f => xs => {
  const acc = [];

  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc.push(f(Pair(xs[i], xs[j])));

  return acc;
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
pervious/current element. If the predicate fails, a new subgroup is created
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
  return acc.set(k, g(acc.has(k) ? acc.get(k) : Null) (x));
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

A.unfold = f => seed => {
  let acc = [], x = seed;

  while (true) {
    const r = f(x);

    if (strict(r) === Null) break;

    else {
      const [y, z] = r;

      x = z;
      acc.push(y);
    }
  }

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
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


A.alt = A.alt();


A.Alt = A.Alt();


A.ana = A.ana();


A.Traversable = A.Traversable();


A.ZipArr.ap = A.ZipArr.ap();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ BEHAVIOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode time changing values. Such a value is asynchronously mutated over time
by the events it has subscribed to. As opposed to `Observable`, a `Behavior` has
a continuous value over its entire lifespan. It has the following properties:

  * multicast
  * async
  * push
  * lazy

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
defined inside the nullary `cancel` function. */


// smart constructor

export const Behavior = init => behave => {
  const o = {
    get run() {
      delete this.run;
      const  {state, cancel} = behave(init);

      Object.defineProperty(this, "run", {
        get() {return state.run}
      });
      
      this.cancel = cancel;
      return init;
    },

    cancel() {}
  };

  Object.defineProperty(o, TAG, {value: "Behavior"});
  return o;
};


export const Be = Behavior; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ COMPOSE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the composition of functors


export const Comp = type("Comp");


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


export const Const = type("Const");


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
████████████████████████████████ CONTINUATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode stack-safe continuation passing style using a trampoline to reify
the control flow. */


export const Cont = type("Cont");


Cont.evalCont = tx => tx.run(id);


Cont.run = f => tx => tx.run(f);


Cont.runOnce = f => tx => tx.run(x => {
  tx.run = () => x;
  return x;
});


/*
█████ Binary ██████████████████████████████████████████████████████████████████*/


Cont.binary = mx => my => Cont(k => mx.run(x => my.run(y => k(x, y)));


/*
█████ Category ████████████████████████████████████████████████████████████████*/


Cont.comp = f => g => Cont(k => x =>
  g(x).run(f).run(Cont.Tramp.call_(k)));


Cont.id = tx => tx.run(id);


Cont.Category = {
  comp: Cont.comp,
  id: Cont.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> Cont r t -> Cont r t
Cont.mapCont = f => tx => Cont(k => f(tx.run(Cont.Tramp.call_(k))));


Cont.pipe = g => f => Cont(k => x =>
  g(x).run(f).run(Cont.Tramp.call_(k)));


// ((s -> r) -> t -> r) -> Cont r t -> Cont r s
Cont.withCont = f => tx => Cont(k => tx.run(f(Cont.Tramp.call_(k))));


/*
█████ Delimited Continuations █████████████████████████████████████████████████*/


/* Delimited continuation expecting a monad in their codomain: (a => m r) => m r
If you only need pure values just pass the identity monad's type dictionary. */


// Cont r r -> Cont s r
Cont.reset = tx => Cont(k => k(tx.run(id)));

// ((t -> r) -> Cont r r) -> Cont r t
Cont.shift = ft => Cont(k => ft(k).run(id));


/*
█████ Effects █████████████████████████████████████████████████████████████████*/


// encode control flow effects in continuation passing style


Cont.A = {};


// intedetministic computation

Cont.A.foldr = f => init => xs => Cont(k => function go(acc, i) {
  if (i === xs.length) return Cont.Tramp.call(k, acc);
  else return f(xs[i]) (acc).run(acc2 => Cont.Tramp.call2(go, acc2, i + 1));
} (init, 0));


Cont.A.chain = xs => fm => Cont(k => {
  return Cont.A.foldr(x => acc => Cont(k2 => {
    acc.push.apply(acc, fm(x));
    return Cont.Tramp.call(k2, acc);
  })) ([]) (xs).run(id).map(k);
});


Cont.A.of = x => Cont(k => [k(x)]);


Cont.Except = {};


// computation that may cause an exception

Cont.Except.except = ({fail, succeed}) => x => Cont(k =>
  intro(x) === "Error" ? fail(x) : Cont.Tramp.call(k, succeed(x)));


Cont.Except.chain = mx => fm => Cont(k => intro(mx) === "Error" ? mx : fm(mx));


Cont.Except.of = ({fail, succeed}) => x => Cont(k => Cont.Tramp.call(k, succeed(x)));


// computation that may cause an exception and catches it

Cont.Except.tryCatch = ({fail, succeed}) => x => Cont(k =>
  intro(x) === "Error"
    ? Cont.Tramp.call(k, fail(x))
    : Cont.Tramp.call(k, succeed(x)));


// computation that may cause an exception and immediately terminate the program

Cont.Except.tryThrow = ({fail, succeed}) => x => Cont(k =>
  intro(x) === "Error" ? _throw(x) : Cont.Tramp.call(k, succeed(x)));


Cont.Option = {};


// computation that may not yield a result

Cont.Option.option = ({none, some}) => x => Cont(k =>
  x === Null ? none : Cont.Tramp.call(k, some(x)));


Cont.Option.chain = ({none, some}) => mx => fm => Cont(k =>
  mx === Null ? none : Cont.Tramp.call(k, fm(mx)));


Cont.Option.of = ({none, some}) => x => Cont(k => Cont.Tramp.call(k, some(x)));


// computation that may not yield a result but a default value

Cont.Option.default = ({none, some}) => x => Cont(k =>
  x === Null ? Cont.Tramp.call(k, none) : Cont.Tramp.call(k, some(x)));


// compututation with arguments implicitly threaded through function invocations


Cont.Reader = {};


Cont.Reader.chain = mx => fm => Cont(k => e =>
  mx(y => fm(y) (k) (e))) (e);


Cont.Reader.of = x => Cont(k => _ => Cont.Tramp.call(k, x));


Cont.State = {};


// computation with state implicitly threaded through function invocations


Cont.State.chain = mx => fm => Cont(k => s =>
  _let(mx(s)).in(pair => Cont.Tramp.call(k, fm(pair[0]) (pair[1]))));


Cont.State.of = x => Cont(k => s => Cont.Tramp.call(k, Pair(x, s)));


Cont.Writer = {};


// comutation with results implicitly logged


Cont.Writer.chain = Monoid => mx => fm => Cont(k =>
  _let(fm(mx[0])).in(my =>
    Cont.Tramp.call(k, Pair(my[0], Monoid.append(mx[1]) (my[1])))));


Cont.Writer.of = Monoid => x => Cont(k =>
  Cont.Tramp.call(k, Pair(x, Monoid.empty)));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Cont.map = f => tx => Cont(k => tx.run(x => Cont.Tramp.call(k, f(x))));


Cont.Functor = {map: Cont.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Cont.ap = tf => tx => Cont(k =>
  tf.run(f => tx.run(x => Cont.Tramp.call(k, f(x)))));


Cont.Apply = {
  ...Cont.Functor,
  ap: Cont.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Cont.of = x => Cont(k => Cont.Tramp.call(k, x));


Cont.Applicative = {
  ...Cont.Apply,
  of: Cont.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* The mother of all chains: Take a continuation (the previous computation) and
a CPS function (the next computation yielding another continuation) and feed
the CPS function into the previous continuation as soon as the next continuation
is provided. */

Cont.chain = mx => fm => Cont(k => mx.run(x => fm(x).run(Cont.Tramp.call_(k))));


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
█████ Lifting █████████████████████████████████████████████████████████████████*/


Cont.lift = f = x => Cont(k => k(f(x)));


Cont.lift2 = f = x => y => Cont(k => k(f(x) (y)));


/*
█████ Monadic █████████████████████████████████████████████████████████████████*/


Cont.join = mmx => Cont(mmx.run(id));


// sequence two monads and ignore the first value

Cont.then = mx => my => Cont(k =>
  Cont.Tramp.call(k, Cont.ap(Cont.map(_ => y => y) (mx)) (my).run(id)));


// sequence two monads and ignore the second value

Cont.then_ = mx => my => Cont(k =>
  Cont.Tramp.call(k, Cont.ap(Cont.map(x => _ => x) (mx)) (my).run(id)));


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


Cont.dimap = h => g => f => Cont(k =>
  x => h(x).run(f).run(g).run(Cont.Tramp.call_(k)));


Cont.lmap = Cont.pipe;


Cont.rmap = Cont.comp;


Cont.Profunctor = {
  ...Cont.Functor,
  dimap: Cont.dimap,
  lmap: Cont.lmap,
  rmap: Cont.rmap
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Cont.append = Semigroup => tx => ty => Cont(k =>
  tx.run(x => ty.run(y => Cont.Tramp.call(k, Semigroup.append(x) (y)))));


Cont.Semigroup = {append: Cont.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Cont.empty = Monoid => Cont(k => Cont.Tramp.call(k, Monoid.empty));


Cont.Monoid = {
  ...Cont.Semigroup,
  empty: Cont.empty
};


/*
█████ Short Circuiting █████████████████████████████████████████████████████████*/


Cont.abrupt = x => Cont(k => x);


/* Short circuit mechanism (unwinds the whole stack). Usage:

  Cont.callcc(shortCircuit => Cont.chain(shortCircuit(0))
    (x => Cont.of(x * x))).run(x => x); */

Cont.callcc = f => Cont(k => f(x => Cont(_ => k(x))).run(k));


/*
█████ Trampoline ██████████████████████████████████████████████████████████████*/


// stack-safe invocation of the deferred function call tree using a trampoline

Cont.Tramp = {};


// strictly call the deferred function call tree

Cont.Tramp.continuous = tx => {
  while (tx && tx.tag === "call") {
    tx = tx.f(tx.x);
  }

  return tx;
};


// non-strictly call the deferred function call tree

Cont.Tramp.step = function* interpret_(tx) {
  while (tx && tx.tag === "call") {
    yield tx.x;
    tx = tx.f(tx.x);
  }

  yield tx;
};


Cont.Tramp.call = function call(f, x) {
  return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call, f, x};
};


Cont.Tramp.call2 = function call2(f, x, y) {
  return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call2, f, x, y};
};


Cont.Tramp.call_ = function call_(f) {
  return function call_(x) {
    return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call, f, x};
  };
};


Cont.Tramp.call2_ = function call2_(f) {
  return function call2_(x) {
    return function call2_(y) {
      return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call2, f, x, y};
    };
  };
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Cont.get = tx => Cont(k => Cont.Tramp.call(k, tx.run));


Cont.reify = k => x => Cont(_ => k(x));


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ COROUTINE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Separate pure computation from effect handling. Exemplary computation that
might don't return a result:

  // pure computation;

  function* task(init) {
    const o = yield init;

    const x = yield o.foo,
      y = yield o.bar;

    yield x * y;
  }

  // effect handling

  const interpreter = ix => {
    const iy = ix.next();

    if (iy.done) return iy;
    else if (iy.value === Null) return Co.empty;
    else if (iy.value === undefined) return Co.empty;

    const iz = iy.nextWith(o => o.x);

    if (iz.done) return iy;
    else if (iz.value === Null) return Co.empty;
    else if (iz.value === undefined) return Co.empty;

    const ia = iz.nextWith(o => o.x);
    return ia;
  };

  const ix = Co(task({foo: 2, bar: 3})),
    iy = Co(task({fou: 2, bar: 3}));

  interpreter(ix).value; // yields 6
  interpreter(iy).value; // yields undefined

Exemplary asynchronous computation:

  function* task(init) {
    const s = yield init;

    const s2 = yield Promise.resolve("hi, " + s);

    yield s2.toUpperCase() + "!";
  }

  const interpreter = ix => {
    const iy = ix.next();

    if (iy.done) return;

    else if (iy.value[Symbol.toStringTag] === "Promise") iy.value.then(x => {
      const iz = iy.next(x);
      console.log(iz.value);
    });
  };

  const ix = Co(task2("Joe"));

  interpreter(ix).value; // logs "HI, JOE!"
*/


export const Coroutine = ix => {
  let o = ix.next(); // init

  o.next = x => {
    const p = ix.next(x || o.value);

    p.next = o.next;
    p.nextWith = o.nextWith;
    delete o.next;
    delete o.nextWith;
    o.next = () => p;
    o.nextWith = () => p;
    o = p;
    return p;
  };

  o.nextWith = f => {
    const p = ix.next(f(o.value));

    p.next = o.next;
    p.nextWith = o.nextWith;
    delete o.next;
    delete o.nextWith;
    o.next = () => p;
    o.nextWith = () => p;
    o = p;
    return p;
  }

  return o;
};


export const Co = Coroutine;


/*
█████ Consumption █████████████████████████████████████████████████████████████*/


// evaluate a single step of the coroutine

Co.iterate = o => o.next();


// short circuit the coroutine without a value

Co.iterateIf = p => o => {
  const q = o.next();

  if (q.done === false) {
    if (p(q.value)) return q;
    else return Co.empty;
  }

  return q;
};


// short cicuit the coroutine with a reason

Co.iterateTry = reason => p => o => {
  const q = o.next();

  if (q.done === false) {
    if (p(q.value)) return q;
    else return Co.of(reason);
  }

  return q;
};


// evaluate a step of the coroutine and transform the intermediate result

Co.iterateWith = f => o => {
  const p = o.next();

  if (p.done === false) p.value = f(p.value);
  return p;
};


// strictly evaluate coroutine to its final value

Co.strict = o => {
  let p = o.next(), r = p.value;

  while (p.done === false) p = p.next();
  return r;
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Co.toArr = o => {
  const acc = [];
  
  let p = o.next();

  while (p.done === false) {
    acc.push(p.value);
    p = p.next();
  }

  return acc;
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


Co.filter = p => o => {
  return Co(function* (init) {
    yield init;

    let q = o.next();

    while (q.done === false) {
      if (p(q.value)) yield q.value;
      q = q.next();
    }
  } (o.value));
};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


Co.fold = f => acc => o => {
  return Co(function* (init) {
    yield init;

    let p = o.next();

    while (p.done === false) {
      acc = f(acc) (p.value);
      p.value = acc;
      yield p.value;
      p = p.next();
    }
  } (o.value));
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Co.map = f => o => {
  return Co(function* (init) {
    yield init;

    let p = o.next();

    while (p.done === false) {
      p.value = f(p.value);
      yield p.value;
      p = p.next();
    }
  } (o.value));
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Co.append = o => o2 => {
  return Co(function* (init) {
    yield init;

    let p = o.next();

    while (p.done === false) {
      yield p.value;
      p = p.next();
    }

    p = o2.next();

    while (p.done === false) {
      yield p.value;
      p = p.next();
    }
  } (o.value));
};


Co.Semigroup = {append: Co.append};


/*
█████ Semigroup (Alignment) ███████████████████████████████████████████████████*/


Co.Align = {};


Co.Align.append = Semigroup => o => o2 => {
  return Co(function* (init) {
    yield init;

    let p = o.next(), p2 = o2.next();

    while (p.done === false && p2.done === false) {
      yield Semigroup.append(p.value) (p2.value);
      p = p.next();
      p2 = p2.next();
    }
  } (o.value));
};


Co.Align.Semigroup = {append: Co.Align.append};


/*
█████ Monoid ██████████████████████████████████████████████████████████████████*/


Co.empty = Co(function* empty() {} ());


Co.Monoid = {
  ...Co.Semigroup,
  empty: Co.empty
};


/*
█████ Monoid (Alignment) ██████████████████████████████████████████████████████*/


Co.Align.empty = Monoid => Co(function* empty(x) {
  yield x;
  while (true) yield x;
} (Monoid.empty));


Co.Align.Monoid = {
  ...Co.Align.Semigroup,
  empty: Co.Align.empty
};


/*
█████ Mics. ███████████████████████████████████████████████████████████████████*/


Co.of = x => Co(function* of(init) {
  yield init;
  yield x;
} (Null));


Co.weave = o => o2 => {
  return Co(function* (init) {
    yield init;

    let p = o.next(), p2 = o2.next();

    while (p.done === false && p2.done === false) {
      yield p.value;
      yield p2.value;
      p = p.next();
      p2 = p2.next();
    }
  } (o.value));
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const DateTime = {}; // namespace


export const D = DateTime; // shortcut


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


D.timestampDay = 86400000;


D.timestampHour = 3600000;


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
  E.throwOnErr, comp, D.fromStr, comp, f);


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


E.cata = cata("error", ANY);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

E.map = f => tx => intro(tx) === "Error" ? tx : f(tx);


E.Functor = {map: E.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


/* Encodes the semantics of left biased picking. In case of errors in both
arguments, the non-empty error is picked with a left bias again. */

E.alt = tx => ty => {
  if (intro(tx) === "Error") {
    if (intro(ty) === "Error") return new Exceptions(tx, ty);
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
  if (intro(tf) === "Error") {
    if (intro(tx) === "Error") return new Exceptions(tf, tx);
    else return tf;
  }

  else if (intro(tx) === "Error") return tx;
  else return tf(tx);
};


E.Apply = {
  ...E.Functor,
  ap: E.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


E.of = x => {
  if (intro(x) === "Error") throw new Err("invalid value");
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


E.chain = mx => fm => intro(mx) === "Error" ? mx : fm(mx);


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
  if (intro(tx) === "Error") {
    if (intro(ty) === "Error") return new Exceptions(tx, ty);
    else return tx;
  }

  else if (intro(ty) === "Error") return ty;
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


E.throwOnErrOnErr = tx => {
  if (intro(tx) === "Error") throw tx;
  else return tx;
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ ID ██████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the absence of any effects in the realm of functors/monads


export const Id = type("Id");


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


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


/* Iterators defer execution which isn't sufficient for lazy evaluation because
it lacks sharing. You cannot share an iterator since every invocation of `next`
destructively changes the iterator's state. For this reason, scriptum provides
a wrapper that renders native iterators idempotent.

Some basic rules on working with impure iterators:

* it is the responsibiliy of the mapper to maintain the outermost structure of
  the return value across generator function calls, e.g. with `[k, v]` the key
  or value may change inside `[]` but not the array itself
* strict functions must not be passed to `comp`/`pipe` as an argument but always
  be the outermost function call
* folds require only strict exhaustion with `It.toAccum` to obtain an accumulated
  result value because they operate their own internal accumulator */


export const It = {};


/*
█████ Category ████████████████████████████████████████████████████████████████*/


It.comp = comp;


It.id = id;


It.Category = ({
  comp: It.comp,
  id: It.id
});


/*
█████ Conversion (Strict) █████████████████████████████████████████████████████*/


It.toArr = ix => {
  const xs = [];
  for (const x of ix) xs.push(x);
  return xs;
};


It.toArrOfKeys = ix => {
  const xs = [];
  for (const [k] of ix) xs.push(k);
  return xs;
};


It.toArrOfValues = ix => {
  const xs = [];
  for (const [, v] of ix) xs.push(v);
  return xs;
};


It.toMap = ix => {
  const m = new Map();
  for (const [k, v] of ix) m.set(k, v);
  return m;
};


It.toMultiMap = ix => {
  const m = new MultiMap();
  for (const [k, v] of ix) m.addItem(k, v);
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
█████ Conjunction █████████████████████████████████████████████████████████████*/


It.all = f => function* (ix) {
  do {
    const {value: x, done} = ix.next();
    if (done) return true;
  } while (f(x));

  return false;
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
█████ Evaluation (Strict) █████████████████████████████████████████████████████*/


// evaluates to null on lack of value

It.strict = ix => {
  let acc = Null;
  for (acc of ix) continue;
  return acc;
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


It.filter = p => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    else if (p(x)) yield x;
  }
};


It.Filterable = {filter: It.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// stateful accumulator

It.foldl = f => acc => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    
    else {
      acc = f(acc) (x);
      yield acc;
    }
  }
};


// left-associative fold with just the arguments flipped

It.foldr = f => acc => function* go(ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    
    else {
      acc = f(x) (acc);
      yield acc;
    }
  }
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


It.map = f => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield f(x);
  }
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
  while (true) {
    const {value: f, done} = tf.next(),
      {value: x, done: done2} = ix.next();

    if (done || done2) return;
    else yield function* () {yield f(x)} ();
  }
};


It.Apply = {
  ...It.Functor,
  ap: It.ap
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


It.chain = mx => function* (fm) {
  while (true) {
    const {value: x, done} = mx.next();

    if (done) return;
    else yield* fm(x);
  }
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
█████ Iterable ████████████████████████████████████████████████████████████████*/


It.fromObjEntries = function* (o) {
  for (let prop in o) {
    yield [prop, o[prop]];
  }
};


It.fromObjKeys = function* (o) {
  for (let prop in o) {
    yield prop;
  }
};


It.fromObjValues = function* (o) {
  for (let prop in o) {
    yield o[prop];
  }
};


It.make = it => it[Symbol.iterator] ();


/*
█████ Iterate (Strict) ████████████████████████████████████████████████████████*/


// perform effects but discard values

It.iterate = f => it => {
  for (const x of it) f(x);
};


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


// lazy recursion schemes are suitable to be encoded using native iterators


// anamorphism

It.ana = () => It.unfold;


// apomorhism: anamorphism plus extra short circuit mechanism

It.apo = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (strict(pair) === Null) return;
    
    else {
      const [y, z] = pair;

      if (intro(z) === "Error") {
        yield y;
        return;
      }

      else {
        x = z;
        yield y;
      }
    }
  }
};


// catamorphism

It.cata = It.foldr;


// paramorphism: catamorphism plus access to the source structure

It.para = f => acc => o => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    
    else {
      acc = f(x) (o) (acc);
      yield acc;
    }
  } 
};


// hylomorphism: anamorphism and immediately following catamorphism

It.hylo = f => g => function* (seed) {
  yield cata(g) (yield ana(f) (seed));
};


// TODO: It.zygo


// TODO: It.mutu


// TODO: It.hysto


// TODO: It.futu


/*
█████ Search ██████████████████████████████████████████████████████████████████*/


It.find = p => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    
    else if (p(x)) {
      yield x;
      return;
    }

  }
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


It.append = ix => function* (iy) {
  do {
    const {value: x, done} = ix.next();

    if (done) break;
    else yield x;
  } while(true)

  do {
    const {value: y, done} = iy.next();

    if (done) return;
    else yield y;
  } while(true);
};


It.Semigroup = {append: It.append};


/*
█████ Semigroup (Alignment) ███████████████████████████████████████████████████*/


It.Align = {};


It.Align.append = Semigroup => ix => function* (iy) {
  while (true) {
    const {value: x, done} = ix.next(),
      {value: y, done: done2} = iy.next();

    if (done || done2) return;
    else yield Semigroup.append(x) (y);
  }
};


It.Align.Semigroup = {append: It.Align.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


It.empty = function* () {} ();


It.Monoid = {
  ...It.Semigroup,
  empty: It.empty
};


/*
█████ Semigroup :: Monoid (Alignment) █████████████████████████████████████████*/


It.Align.empty = function* (empty) {yield empty};


It.Align.Monoid = {
  ...It.Align.Semigroup,
  empty: It.Align.empty
};

/*
█████ Special Folds ███████████████████████████████████████████████████████████*/


It.foldSucc = f => acc => function* (ix) {
  let {value: x} = ix.next();

  while (true) {
    const {value: y, done} = ix.next();

    if (done) return;
    
    else {
      yield f(acc) (Pair(x, y));
      x = y;
    }
  }
};


/*
█████ Special Maps ████████████████████████████████████████████████████████████*/


It.mapSucc = f => function* (ix) {
  let {value: x} = ix.next();

  while (true) {
    const {value: y, done} = ix.next();

    if (done) return;
    
    else {
      yield f(Pair(x, y));
      x = y;
    }
  }
};


/*
█████ Sublists ████████████████████████████████████████████████████████████████*/


It.drop = n => function* (ix) {
  while (n-- > 0) {
    const {done} = ix.next();
    if (done) return;
  };

  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  }
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

  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  }
};


It.take = n => function* (ix) {
  do {
    const {value: x, done} = ix.next();

    if (done) return;
    else yield x;
  } while (--n > 0);
};


It.takeWhile = p => function* (ix) {
  while (true) {
    const {value: x, done} = ix.next();

    if (done) return;
    else if (p(x)) yield x;
    else return;
  }
};


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


/* Lazy, potentially infinite unfold that always needs to be at the beginning
of the iterator chain. */

It.unfold = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (strict(pair) === Null) return;
    
    else {
      const [y, z] = pair;

      x = z;
      yield y;
    }
  }
};


/*
█████ Zipping █████████████████████████████████████████████████████████████████*/


// TODO


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


It.Traversable = It.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ ITERATOR (IDEMPOTENT) ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* `next` method of an iterator object can be called any number of times but
the underlying iterator is only advanced once:
  
  ix.next();
  ix.next();
  ix.next();

The iterator can be advanced further by calling `next` of the returned object:
  
  ix.next().next(); */


export const Ii = ix => {
  let o = {
    value: Null,
    done: false,

    next() {
      const p = ix.next();

      Object.defineProperty(p, TAG, {value: "IdempotentIterator"});
      p.next = o.next
      delete o.next;
      o.next = () => p;
      o = p;
      return p;
    }
  };

  Object.defineProperty(o, TAG, {value: "IdempotentIterator"});
  return o;
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Map = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


_Map.fromArrOfObj = k => xs => xs.reduce((acc, o) => acc.set(o[k], o), new Map());


// use iterator if each key/value pair is needed separately

_Map.interconvert = f => m => new Map(f(Array.from(m)));


// convert a map to an array ignoring the keys

_Map.toArr = m => {
  const xs = [];

  for (const [k, v] of m) xs.push(v);
  return xs;
};


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


_Map.get = k => m => m.has(k) ? m.get(k) : Null;


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
Useful if lots of lookups are performed but interstion order via `push`/`pop`
and `shift`/`unshift` matters. */


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


  static fromTable(table, i) {
    const m = new MultiMap();

    for (const cols of table) m.addItem(cols[i], cols);
    return m;
  }


  static fromTableBy(table, f, i) {
    const m = new MultiMap();

    for (const cols of table) m.addItem(f(cols), cols);
    return m;
  }


  /*
  █████ Getters/Setters ███████████████████████████████████████████████████████*/


  // rely on reference identity

  addItem(k, v) {
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


  setItem(k, v, pred) {
    const s = this.get(k);
    let exists = false;

    for (const v2 of s) {
      if (pred(v2)) {
        s.delete(v2);
        s.add(v);
        exists = true;
        break;
      }
    }

    if (!exists) s.add(v);
    return this;
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


  updItem(k, f, pred) {
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


Num.fromStr = s => {
  if (/^(?:\+|\-)?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  else return new Exception(`invalid number string: "${s}"`);
};


Num.fromStrSafe = f => infix(
  E.throwOnErr, comp, Num.fromStr, comp, f);


/*
█████ Decimal Places ██████████████████████████████████████████████████████████*/


Num.ceil = decPlaces => n => {
  // TODO
};


Num.floor = decPlaces => n => {
  // TODO
}


Num.round = decPlaces => n => {
  const factor = Number("1".padEnd(decPlaces + 1, "0")),
    s = String(n * factor * 10).split(".") [0];

  switch (s[s.length - 1]) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4": return Number(s.slice(0, -1)) / factor;
    default: return n < 0
      ? (Number(s.slice(0, -1)) - 1) / factor
      : (Number(s.slice(0, -1)) + 1) / factor;
  }
};


Num.round2 = Num.round(2);


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
  String(Math.trunc(n))
    .replace(/^-/, "")
    .replace(new RegExp("(\\d)(?=(?:\\d{3})+$)", "g"), `$1${sep}`);


Num.formatSign = ({pos, neg}) => n =>
  n > 0 ? pos : n < 0 ? neg : "";


Num.formatSep = sep => n => sep;


Num.formatIso = Num.format(
  Num.formatSign({pos: "", neg: "-"}),
  Num.formatInt(""),
  Num.formatSep("."),
  Num.formatFrac(2));


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ NUMBER :: NATURAL ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/



export const Natural = {}; // namespace


export const Nat = Natural; // shortcut


/* The elemination rule of the type. Applying structural recursion on natural
numbers might be a little unusual but is quite powerful. Here is an
implementaiton of the fibonacci sequence:

  const fib = comp(Pair.fst) (Nat.cata({
    zero: Pair(0, 1),
    succ: ([a, b]) => Pair(b, a + b)
  }));

  fib(10); // yields 55 */

Nat.cata = cata_("zero", "succ") (dict => n => {
  let r = dict.zero;

  while (n > 0) {
    r = dict.succ(r);
    n -= 1;
  }

  return r;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OBJECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// safer object type

export const Obj = o => {
  if (debug === true) {
    return new Proxy(o, {
      get: (p, k) => {
        if (p[k] === undefined)
          throw new Err("undefined property access");

        else return p[k];
      },

      set: (p, k, v) => {
        if (v === undefined)
          throw new Err("undefined set operation");

        else return p[k] = v;
      }
    });
  }

  else return o;
};


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


O.fromArr = header => xs => {
  const o = {};

  for (let i = 0; i < xs.length; i++)
    if (header.has(i)) o[header.get(i)] = xs[i];

  return o;
};


O.fromPairs = pairs => pairs.reduce((acc, [k, v]) => (acc[k] = v, acc), {});


O.toPairs = Object.entries;


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


O.del = k => o => (delete o[k], o);


O.get = k => o => k in o ? o[k] : Null;


O.getOr = x => k => o => k in o ? o[k] : x;


O.getPath = keys => o =>
  keys.reduce((acc, key) => key in acc ? acc[key] : Null, o);


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


// immutable variant

O.set_ = k => v => o => Object.assign({}, o, {[k]: v});


O.upd = k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return new Exception("unknown property");
};


// immutable variant

O.upd_ = k => f => o => {
  if (k in o) return Object.assign({}, o, {[k]: f(o[k])});
  else return new Exception("unknown property");
};


O.updOr = x => k => f => o => {
  if (k in o) return (o[k] = f(o[k]), o);
  else return (o[k] = x, o);
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


// create lazy property that shares its result

O.lazyProp = k => thunk => o =>
  Object.defineProperty(o, k, {
    get() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true});


O.lazyProps = dtors => o => Object.defineProperties(o, ...dtors);


// self referencing during object creation

export const thisify = f => f({});


O.thisify = thisify;


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ OBSERVABLE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode asynchronous event streams. It has the following properties:

  * broadcast
  * async
  * push
  * lazy */


export const Observable = type("Observable");


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


export const Optic = type("Optic");


/*
█████ Defocus █████████████████████████████████████████████████████████████████*/


// reconstruct the composite data structure and takes any change into account

Optic.defocus = tx =>
  tx.parent === Null ? tx : Optic.defocus(tx.parent(tx.run));


// like `Optic.defocus` but only reconstructs a single layer

Optic.defocus1 = tx =>
  tx.parent === Null ? tx : tx.parent(tx.run);


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


// set a composable focus on a subelement of a composite data structure

Optic.focus = (getter, setter) => tx => Optic(
  getter(tx.run),
  x => Optic(setter(x) (tx.run), tx.parent));


// try to focus or use a composite default value

Optic.tryFocus = x => (getter, setter) => tx => Optic(
  tx.run === Null ? getter(x) : getter(tx.run),
  x => Optic(setter(x) (tx.run === Null ? x : tx.run), tx.parent));


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


Optic.of = x => Optic(x, Null);


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


Opt.cata = cata("null", ANY);


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Opt.map = f => tx => strict(tx) === Null ? Null : f(tx);


Opt.Functor = {map: Opt.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


Opt.alt = tx => ty => strict(tx) === Null ? ty : tx;


Opt.Alt = {
  ...Opt.Functor,
  alt: Opt.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Opt.zero = Null;


Opt.Plus = {
  ...Opt.Alt,
  zero: Opt.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Opt.ap = tf => tx =>
  strict(tf) === Null ? Null
    : strict(tx) === Null ? Null
    : tf(tx);


Opt.Apply = {
  ...Opt.Functor,
  ap: Opt.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

Opt.of = x => strict(x) === Null ? _throw("invalid value") : x;


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


Opt.chain = mx => fm => strict(mx) === Null ? Null : fm(mx);


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
  strict(tx) === Null ? tx
    : strict(ty) === Null ? tx
    : Semigroup.append(tx) (ty);


Opt.Semigroup = {append: Opt.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Opt.empty = Null;


Opt.Monoid = {
  ...Opt.Semigroup,
  empty: Opt.empty
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ PARALLEL ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Just like `Serial` but evaluated in parallel. See `Serial` for more
comprehensive information. */


// smart constructor

export const Parallel = k => {
  const o = {
    run: k,

    get runOnce() { // DEPRECATED
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
        return Promise.resolve(Null).then(_ => k(f));
      }

      else {
        asyncCounter++;
        return k(f);
      }
    }
  };

  Object.defineProperty(o, TAG, {value: "Parallel"});
  return o;
};


export const P = Parallel; // shortcut


/*
█████ Category ████████████████████████████████████████████████████████████████*/


P.comp = f => g => P(k => x => g(x).run(f).run(k));


P.id = tx => tx.run(id);


P.Category = {
  comp: P.comp,
  id: P.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> P r t -> P r t
P.mapCont = f => tx => P(k => f(tx.run(k)));


P.pipe = g => f => P(k => x =>
  g(x).run(f).run(k));


// ((s -> r) -> t -> r) -> P r t -> P r s
P.withCont = f => tx => P(k => tx.run(f(k)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


P.fromSerial = tx => P(tx.run);


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
          else return Null;
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
            xs[j] = Null;
            i++;
          }

          if (i === keys.length) return k(p);
          else return Null;
        }

        else return Null;
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

        else return Null;
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
█████ Effects █████████████████████████████████████████████████████████████████*/


// encode control flow effects in parallel continuation passing style


P.A = {};


// intedetministic computation

P.A.foldr = f => init => xs => P(k => function go(acc, i) {
  if (i === xs.length) return k(acc);
  else return f(xs[i]) (acc).run(acc2 => go(acc2, i + 1));
} (init, 0));


P.A.chain = xs => fm => P(k => {
  return P.A.foldr(x => acc => P(k2 => {
    acc.push.apply(acc, fm(x));
    return k2(acc);
  })) ([]) (xs).run(id).map(k);
});


P.A.of = x => P(k => [k(x)]);


// computation that may cause an exception

P.Except.except = ({fail, succeed}) => x => P(k =>
  intro(x) === "Error" ? fail(x) : k(succeed(x)));


P.Except.chain = mx => fm => P(k => intro(mx) === "Error" ? mx : fm(mx));


P.Except.of = ({fail, succeed}) => x => P(k => k(succeed(x)));


// computation that may cause an exception and catches it

P.Except.tryCatch = ({fail, succeed}) => x => P(k =>
  intro(x) === "Error"
    ? k(fail(x))
    : k(succeed(x)));


// computation that may cause an exception and immediately terminate the program

P.Except.tryThrow = ({fail, succeed}) => x => P(k =>
  intro(x) === "Error" ? _throw(x) : k(succeed(x)));


P.Option = {};


// computation that may not yield a result

P.Option.option = ({none, some}) => x => P(k =>
  x === Null ? none : k(some(x)));


P.Option.chain = ({none, some}) => mx => fm => P(k =>
  mx === Null ? none : k(fm(mx)));


P.Option.of = ({none, some}) => x => P(k => k(some(x)));


// computation that may not yield a result but a default value

P.Option.default = ({none, some}) => x => P(k =>
  x === Null ? k(none) : k(some(x)));


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


P.dimap = h => g => f => P(k => x => h(x).run(f).run(g).run(k));


P.lmap = P.pipe;


P.rmap = P.comp;


P.Profunctor = {
  ...P.Functor,
  dimap: P.dimap,
  lmap: P.lmap,
  rmap: P.rmap
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


P.append = Semigroup => tx => ty => P(k =>
  P.and(tx) (ty).run(([x, y]) =>
    k(Semigroup.append(x) (y))));


P.Semigroup = {append: P.append};

  
/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


P.Race = {};


P.Race.append = P.or;


P.Race.Semigroup = {append: P.Race.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


P.empty = Monoid => P(k => k(Monoid.empty));


P.Monoid = {
  ...P.Semigroup,
  empty: P.empty
};


/*
█████ Semigroup :: Monoid (Race) ██████████████████████████████████████████████*/


P.Race.empty = P(k => Null);


P.Race.Monoid = {
  ...P.Race.Semigroup,
  empty: P.Race.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


P.reify = k => x => P(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


P.allArr = P.allArr();


P.allList = P.allList();


P.anyArr = P.anyArr();


P.anyList = P.anyList();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ PAIR █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// smart constructor

export const Pair = (x, y) => {
  const o = {
    0: x, 1: y, length: 2,

    [Symbol.iterator]: function*() {
      yield x;
      yield y;
    }
  };

  Object.defineProperty(o, TAG, {value: "Pair"});
  return o;  
};


// smart constructor to define lazy getters

export const Pair_ = o => {
  Object.defineProperty(o, TAG, {value: "Pair"});
  o.length = 2;

  o[Symbol.iterator] = function*() {
    yield o[0];
    yield o[1];
  };

  return o;
};


/*
█████ Extracting ██████████████████████████████████████████████████████████████*/


Pair.fst = tx => tx[0];


Pair.snd = tx => tx[1];


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
███████████████████████████████████ PARSER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// stateful parser generators with an applicative based on idempotent iterators


const Parser = type("Parser");
  

Parser.Result = variant("Parser.Result", cons("Invalid"), cons("Valid"));


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
█████ Combinators █████████████████████████████████████████████████████████████*/


// always accept any input

Parser.accept = Parser(next => state => {
  const ix = next();

  if (ix.done) throw new Exception("end of input");

  else return Parser.Result.Valid({
    value: ix.value,
    next: ix.next,
    state: ix.state
  });
});


// always fail regardless of the input but allow to recover (zero)

Parser.fail = msg => Parser(next => state => {
  const ix = next();

  if (ix.done) return new Exception("end of input");

  else return Parser.Result.Invalid({
    value: new Exception(msg),
    next,
    state
  });
});


// only succeed on input that satisfies a predicate

Parser.satisfy = msg => p => Parser(next => state => {
  const ix = next();

  if (ix.done) return new Exception("end of input");

  else if (p(ix.value)) return Parser.Result.Valid({
    value: ix.value,
    next: ix.next,
    state: ix.state
  });

  else return new Exception(msg);
});


// try to parse the next input and allow to recover on failure (backtracking)

Parser.try = p => Parser(next => state => {
  const ix = next();

  if (ix.done) return new Exception("end of input");

  else if (p(ix.value)) return Parser.Result.Valid({
    value: ix.value,
    next: ix.next,
    state: ix.state
  });

  else return Parser.Result.Invalid({
    value: new Exception("failed try"),
    next,
    state
  });
});


// verify end of input

Parser.eoi = Parser(next => state => {
  const ix = next();

  if (ix.done) return new Exception("end of input");

  else return Parser.Result.Valid({
    value: Null,
    next,
    state
  });
});


/* Try the first parser or the second one on error but return the first error
message if both fail. */

Parser.or = px => py => Parser(next => state => {
  return px(next) (state).run({
    Invalid: tx => py(next) (state).run({
      Invlaid: _ => {
        if (intro(tx) === "Error") throw tx;
        else return tx;
      },
      
      Valid: id
    }),

    Valid: id
  })
});


/* Try the first parser and the second and fail if either of them does,
otherwise succeed. */

Parser.and = px => py => Parser(next => state => {
  return px(next) (state).run({
    Invalid: tx => {
      if (intro(tx) === "Error") throw tx;
      else return tx;
    },

    Valid: ty => py(ty.next) (ty.state).run({
      Invalid: tz => {
        if (intro(tz) === "Error") throw tz;
        else return tz;
      },

      Valid: id
    })
  });
});


Parser.xor = px => py => Parser(next => state => {
  return px(next) (state).run({
    Invalid: tx => py(next) (state).run({
      Invlaid: _ => tx,
      Valid: id
    }),

    Valid: ty => py(next) (state).run({
      Invlaid: _ => ty,
      Valid: id
    })
  });
});


Parser.any = ps => Parser(next => state => {
  let tx, first = Null;

  for (const px of ps) {
    tx = px(next) (state);

    if (first === Null) first = tx;

    if (tx.tag === "Valid") return tx;
    else continue;
  }

  return first;
});


Parser.all = ps => Parser(next => state => {
  let tx;

  for (const px of ps) {
    tx = px(next) (state);

    if (tx.tag === "Invalid") return tx;
    else continue;
  }

  return tx;
});


Parser.many = px => function go(acc) {
  return Parser(next => state => {
    return px(next) (state).run({
      Invalid: _ => Parser.Result.Valid({
        value: acc, next, state
      }),

      Valid: tx =>
        go(A.push(tx.value) (acc)) (tx.next) (tx.state)
    });
  });
} ([]);


// ignores the next value provided the supplied parser yields a valid result

Parser.const = x => px => Parser(next => state => {
  return px(next) (state).run({
    Invalid: id,

    Valid: tx => Parser.Result.Valid({
      value: x,
      next: tx.next,
      state: tx.state
    })
  })
});


// lift a function into the context of a parser result

Parser.map = f => px => Parser(next => state => {
  return px(next) (state).run({
    Invalid: id,

    Valid: tx => Parser.Result.Valid({
      value: f(tx.value),
      next: tx.next,
      state: tx.state
    })
  })
});


/* Sequence two parsers so that a binary curried function is lifted into the
context of the parser result values. */

Parser.ap = pf => px => Parser(next => state => {
  return pf(next) (state).run({
    Invalid: id,

    Valid: tf => px(tf.next) (tf.state).run({
      Invalid: id,

      Valid: tx => Parser.Result.Valid({
        value: tf.value(tx.value),
        next: tx.next,
        state: tx.state
      })
    })
  });
});


// put a pure value in a parser context

Parser.of = x => Parser(next => state =>
  Parser.Result.Valid({value: x, next, state}));


/* Conditionally sequence two parsers so that the second parser depends on the
result value of the first one. */

Parser.chain = px => fm => Parser(next => state => {
  return px(next) (state).run({
    Invalid: id,
    Valid: tx => fm(tx.value) (tx.next) (state)
  });
});


/* Todo:

seq (sequence of more than two parsers)
option (returns a default value on error)
none (opposite of all)
sepBy (reads chars separated by a separator)
many1
fromTo
times
drop
dropWhile
takeWhile
amb
between
digit
alnum
letter
space
char (character)
chars (sequence of characters) */


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ PREDICATE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// dynamic predicates


export const Pred = type("Pred");


/*
█████ Boolean Logic ███████████████████████████████████████████████████████████*/


Pred.iff = tx => ty => Pred(x => {
  if (tx.run(x) === true && ty.run(x) === true)
    return true;

  else if (tx.run(x) === false && ty.run(x) === false)
    return false;
});


Pred.imply = tx => ty => Pred(x => {
  if (tx.run(x) === true && ty.run(x) !== true)
    return false;

  else return true;
});


Pred.not = tx => Pred(x => !tx.run(x));


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


Pred.all = xs => Pred(x => {
  for (const tx of xs)
    if (tx.run(x) === false) return false;

  return true;
});


Pred.and = tx => ty => Pred(x => tx.run(x) && ty.run(x));


/*
█████ Constant ████████████████████████████████████████████████████████████████*/


Pred.then = x => true;


Pred.else = x => false;


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


Pred.any = preds => Pred(x => {
  for (const tx of xs)
    if (tx.run(x) === true) return true;

  return false;
});


Pred.or = tx => ty => Pred(x => tx.run(x) || ty.run(x));


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Pred.append = Pred.and;


Pred.Semigroup = {append: Pred.append};


/*
█████ Semigroup (Disjunction) █████████████████████████████████████████████████*/


Pred.Disjunct = {};


Pred.Disjunct.append = Pred.or;


Pred.Disjunct.Semigroup = {append: Pred.Disjunct.append};


/*
█████ Monoid ██████████████████████████████████████████████████████████████████*/


Pred.empty = Pred.then;


Pred.Monoid = {
  ...Pred.Semigroup,
  empty: Pred.empty
};


/*
█████ Monoid (Disjunction) ████████████████████████████████████████████████████*/


Pred.Disjunct.empty = Pred.else;


Pred.Disjunct.Monoid = {
  ...Pred.Disjunct.Semigroup,
  empty: Pred.Disjunct.empty
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ SELECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Backtracking search as a monad (experimental). Schematic usage:

  // always select an element

  const elementSelect = domain => new Select(epsilon(domain));

  
  const selectSequence = domain => new Select(k => {
    
    // base case

    if (!domain.length || !k([])) return [];

    // recursive case

    const tx = Select.chain(selectElement(domain)) (choice => {
      prepend(choice);
      return selectSequence(domain.filter(x => x !== choice));
    });

    return tx.run(k);
  }); */


export const Select = type("Select");


Select.of = x => Select(_ => x);


Select.map = f => tx => Select(f(tx.run(pipe(f))));


Select.ap = tf => tx => Select(k => {
  const choose = f => f(tx.run(x => k(f(x))));
  return choose(tf.run(x => k(choose(x))));
});
  

Select.chain = mf => gm => Select(k => {
  const choose = x => gm(x).run(k);
  return choose(mf.run(x => k(choose(x))));
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
several times. If you need sharing provide a function scope in applicative or
monadic style that provides the only once evaluated expressions.

Exception handling isn't handled by the type. You need to use one of the
supplied combinators that handle control flow effects. */


// smart constructor

export const Serial = k => {
  const o = {
    run: k,

    get runOnce() { // DEPRECATED
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
        return Promise.resolve(Null).then(_ => k(f));
      }

      else {
        asyncCounter++;
        return k(f);
      }
    }
  };

  Object.defineProperty(o, TAG, {value: "Serial"});
  return o;
};


export const S = Serial; // shortcut


/*
█████ Category ████████████████████████████████████████████████████████████████*/


S.comp = f => g => S(k => x => g(x).run(f).run(k));


S.id = tx => tx.run(id);


S.Category = {
  comp: S.comp,
  id: S.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> S r t -> S r t
S.mapCont = f => tx => S(k => f(tx.run(k)));


S.pipe = g => f => S(k => x =>
  g(x).run(f).run(k));


// ((s -> r) -> t -> r) -> S r t -> S r s
S.withCont = f => tx => S(k => tx.run(f(k)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


S.fromParallel = tx => S(tx.run);


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
█████ Effects █████████████████████████████████████████████████████████████████*/


// encode control flow effects in serial continuation passing style


S.A = {};


// intedetministic computation

S.A.foldr = f => init => xs => S(k => function go(acc, i) {
  if (i === xs.length) return k(acc);
  else return f(xs[i]) (acc).run(acc2 => go(acc2, i + 1));
} (init, 0));


S.A.chain = xs => fm => S(k => {
  return S.A.foldr(x => acc => S(k2 => {
    acc.push.apply(acc, fm(x));
    return k2(acc);
  })) ([]) (xs).run(id).map(k);
});


S.A.of = x => S(k => [k(x)]);


// computation that may cause an exception

S.Except.except = ({fail, succeed}) => x => S(k =>
  intro(x) === "Error" ? fail(x) : k(succeed(x)));


S.Except.chain = mx => fm => S(k => intro(mx) === "Error" ? mx : fm(mx));


S.Except.of = ({fail, succeed}) => x => S(k => k(succeed(x)));


// computation that may cause an exception and catches it

S.Except.tryCatch = ({fail, succeed}) => x => S(k =>
  intro(x) === "Error"
    ? k(fail(x))
    : k(succeed(x)));


// computation that may cause an exception and immediately terminate the program

S.Except.tryThrow = ({fail, succeed}) => x => S(k =>
  intro(x) === "Error" ? _throw(x) : k(succeed(x)));


S.Option = {};


// computation that may not yield a result

S.Option.option = ({none, some}) => x => S(k =>
  x === Null ? none : k(some(x)));


S.Option.chain = ({none, some}) => mx => fm => S(k =>
  mx === Null ? none : k(fm(mx)));


S.Option.of = ({none, some}) => x => S(k => k(some(x)));


// computation that may not yield a result but a default value

S.Option.default = ({none, some}) => x => S(k =>
  x === Null ? k(none) : k(some(x)));


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


S.dimap = h => g => f => S(k => x => h(x).run(f).run(g).run(k));


S.lmap = S.pipe;


S.rmap = S.comp;


S.Profunctor = {
  ...S.Functor,
  dimap: S.dimap,
  lmap: S.lmap,
  rmap: S.rmap
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


S.reify = k => x => S(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


S.allArr = S.allArr();


S.allList = S.allList();


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


/* Encode synchronous data streams. Based on the following Haskell type:

  data Stream f m r = Step !(f (Stream f m r))
                    | Effect (m (Stream f m r))
                    | Return r

  instance (Functor f, Monad m) => Functor (Stream f m) where
    fmap f = loop where
      loop stream = case stream of
        Return r -> Return (f r)
        Effect m -> Effect (do {stream' <- m; return (loop stream')})
        Step   g -> Step (fmap loop g)

It has the following properties:

  * unicast
  * sync
  * pull
  * lazy

In Javascript/Node.js functional, linked-list-like streams are less useful, as
there are native iterators but no monad/transformer ecosystem. scriptum also
offers an iterator wrapper that renders them idempotent in their `next` method.
See the iterator section for more details. */


export const Stream = variant("Stream", cons("Step"), cons("Eff"), cons2("Done"));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Stream.map = (Functor, Monad) => f => function go(tx) {
  return tx.run({
    Step: ty => Stream.Step(Functor.map(x => lazy(() => go(x))) (ty)),
    Eff: mx => Stream.Eff(Monad.chain(mx) (x => Monad.of(lazy(() => go(x))))),
    Done: x => Stream.Done(Monad.of(lazy(() => f(x))))
  });
};


Stream.Functor = {map: Stream.map};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Str = {}; // namespace


Str.catWith = s => (...xs) => xs.join(s);


Str.cat = Str.catWith("");


Str.cat_ = Str.catWith(" ");


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


Str.normalizeNum = ({sep: {thd, dec}, places = 0}) => s => {
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


export const These = variant("These", cons("This"), cons("That"), cons2("Both"));


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


/* scriptum uses a 2-3 tree implementation as the foundation of its persistent
data structures. */


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TREE :: DEQUE ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: doubly ended queue


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TREE :: IMAP █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: immutable map


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TREE :: ISET █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: immutable set


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ TREE :: PRIORITY QUEUE ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: Prioq


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ TREE :: SEARCH ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// binary search tree


const Tree = {};


// smart constructor

Tree.Empty = thisify(o => {
  Object.defineProperty(o, TAG, {value: "Tree"});
  o.tag = "Empty";
  return o;
});


Tree.Leaf = x => {
  const o = {height: 0, size: 1, min: x, x, tag: "Leaf"};

  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.Node2 = (height, size, min, left, right) => {
  const o = {height, size, min, left, right, tag: "Node2"};

  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.Node3 = (height, size, min, left, middle, right) => {
  const o = {height, size, min, left, middle, right, tag: "Node3"};

  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.node2 = (left, right) =>
  Tree.Node2(left.height + 1, left.size + right.size, left.min, left, right);


Tree.node3 = (left, middle, right) =>
  Tree.Node3(left.height + 1, left.size + middle.size + right.size, left.min, left, middle, right);


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
    if (right.tag === "Node2") {
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
    if (left.tag === "Node2") {
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
  if (left.tag === "Empty") return right;
  else if (right.tag === "Empty") return left;

  else {
    const xs = Tree.levelHeight(left, right);

    if (xs.length === 1) return xs[0];
    else return Tree.node2(...xs);
  }
};


Tree.split = (tree, f) => {
  if (tree.tag === "Empty") return [Tree.Empty, Tree.Empty];

  else if (tree.tag === "Leaf") {
    if (f(tree.x)) return [Tree.Empty, Tree.Leaf(tree.x)];
    else return [Tree.Leaf(tree.x), Tree.Empty];
  }

  else if (tree.tag === "Node2") {
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
  switch (tree.tag) {
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
  if (tree.tag === "Empty") return xs;
  else if (tree.tag === "Leaf") return (xs.unshift(tree.x), xs);
  
  else if (tree.tag === "Node2")
    return Tree.prepend(tree.left, Tree.prepend(tree.right, xs));

  else if (tree.tag === "Node3")
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
    switch (tree.tag) {
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
    switch (tree.tag) {
      case "Empty": return acc;
      case "Leaf": {return f(tree.x) (acc);}
      case "Node2": return go(go(acc) (tree.left)) (tree.right);
      case "Node3": return go(go(go(acc) (tree.left)) (tree.middle)) (tree.right);
    }
  };
};


Tree.Foldable = {
  foldl: Tree.foldl,
  foldr: Tree.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Tree.map = f => Tree.cata({
  empty: () => Tree.Empty,
  leaf: x => Tree.Leaf(f(x)),

  node2: (height, min, left, right) =>
    Tree.Node2(height, left.size + right.size, f(min), left, right),

  node3: (height, min, left, middle, right) =>
    Tree.Node3(height, left.size + middle.size + right.size, f(min), left, middle, right)
});


Tree.Functor = {map: Tree.map};


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


/* The underscore versions compose an additional function `f`. It must be passed
as an argument and is called before the relational function, so that the actual
data `y` can be transformed for the latter. */


Tree.has = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);

  if (right.tag === "Empty") return false;
  else return right.min === x;
};


Tree.has_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y)));

  if (right.tag === "Empty") return false;
  else return right.min === x;
};


Tree.ins = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);
  return Tree.merge(Tree.merge(left, Tree.Leaf(x)), right);
};


Tree.ins_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y)));
  return Tree.merge(Tree.merge(left, Tree.Leaf(x)), right);
};


Tree.del = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x),
    [, right2] = Tree.split(right, y => y > x);

  return Tree.merge(left, right2);
};


Tree.del_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y))),
    [, right2] = Tree.split(right, y => (z => z > x) (f(y)));

  return Tree.merge(left, right2);
};


/*
█████ Meta Information ████████████████████████████████████████████████████████*/


Tree.leafs = Tree.cata({
  empty: () => 0,
  leaf: _ => 1,
  node2: (height, min, left, right) => left + right,
  node3: (height, min, left, middle, right) => left + middle + right
});


Tree.nodes = Tree.cata({
  empty: () => 0,
  leaf: _ => 0,
  node2: (height, min, left, right) => 1 + left + right,
  node3: (height, min, left, middle, right) => 1 + left + middle + right,
});


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ TREE :: SEQUENCE ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: sequence (list like)


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ TREE :: VECTOR ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: vector (array/indexed list like)


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ YONEDA ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes dynamic function composition within a functor. Useful in cases when
the composition cannot be defined manually upfront but only at runtime. */


export const Yoneda = type("Yoneda");


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
      e ? k(new Exception(e)) : k(Null)));

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
      e ? k(new Exception(e)) : k(Null)));

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

  * encode vagueness caused by indeterminism or uncertainty
    * fuzzy logic
      * terminology:
        * fuzzyfy (create a real number between 0..1)
        * defuzzyfy (create a crisp value)
        * rule based: inference engine based on rules (determines the matching degree)
        * allows deductive reasoing
      * fuzzy logical operators
      * fuzzy type-1/type-2 sets
        * type-1 fuzzy sets are working with a fixed membership function
        * type-2 fuzzy sets are working with a fluctuating membership function
      * set operations (union, intersection, difference, complement)
      * fuzzyfier: a function that creates a real number between 0..1
    * add backtracking types + operators
      * terminology:
        * candidate (to be added to the solution)
        * partial solution (intermediate solution)
        * feasable solution (of the backtracking problem)
        * decision space (set of all condidates)
        * decision point (point at which a specific candidate is chosen)
        * dead end (partial solution cannot be completed)
        * backtracking (undoing previous decisions)
        * search space: all permutations of candidates and choices
        * optimal solution: most effective/efficient solution
        * greedy algos fail, because they choose local maxima to get global maxima
        * backtracking is not a brute force algo bc it skips canidates
          * you can also shape the search space
        * recursive algo
      * type:
        * decision problem
        * optimization problem
        * enumeration problem
      * depth-first approach
        * fair approach considers at least first level of breadth
        * exclusive branching/choice (pruning choices): if/else
        * inclusive branching/choice (enumerate choices): if/if
        * if represent deterministic, depth first pruning (backtracking)
      * alternative strategies:
        * divide and conquer
        * exhaustive search (no unwinding/declining of candidates)
        * dynamic programming algo (share intermediate results using memoization)
        * greedy algos (make decisions that give immediate benefit w/out reconsidering previous choices)
          * gains local maxima
    * ambiguous relations (multi-map)
      * a key is associated to several distinct values (1:n)
      * several keys are associated to the same distinct value (m:1)
      * several keys are associated to the same distinct values (m:n)
    * fuzzy relations (fuzzy set)
      * a value may belong to several sets with varying degree of membership
    * supervaluation/subvaluation
      * accumulate assumptions
      * delay decision
      * contest function declares a winner, several winners or no winner
    * analyze + contectualize = synthesize

  * add context type (array of arrays)
  * add monotonically increasing array type
  * add async iterator machinery

*/

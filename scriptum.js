/*
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
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const augmented = true;


const SYM_PREFIX = "github.com/kongware/scriptum";


/******************************************************************************
*******************************************************************************
*********************************[ DEBUGGING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ Virtualization ]*******************************
******************************************************************************/


// augment a curried function sequence
// untyped
export const Aug = (name, f) => {
  if (augmented) {
    Reflect.defineProperty(f, "name", {value: name});
    return new Proxy(f, handleF(name, f, []))
  }

  else return f;
};


// handle function
// untyped
const handleF = (name, f, log) => {
  return {
    apply: (g, _, args) => {
      if (args.length !== 1) throw new ArityError(
        `\n\n${name} expects one argument\n`
        + `${args.length} arguments received\n`
      );

      const argType = typeCheck(ArgTypeError)
        (t => illTyped => fromTo => `${name} received invalid argument\n\n`
        + `${t}\n`
        + (fromTo.length === 0 ? "\n" : `${underline(fromTo)}\n\n`)
        + `${illTyped} is not allowed\n`) (args[0]);

      const r = f(args[0]);

      const retType = typeCheck(ReturnTypeError)
        (t => illTyped => fromTo => `${name_} returned invalid value`
        + `${t}\n`
        + (fromTo.length === 0 ? "\n" : `${underline(fromTo)}\n\n`)
        + `${illTyped} is not allowed\n`) (r);

      if (typeof r === "function") {
        const name_ = r.name || name;
        Reflect.defineProperty(r, "name", {value: name_});
        return new Proxy(r, handleF(name_, r, log.concat(`${name}(${argType})`)));
      }

      else return r;
    },

    get: (f, k, p) => {
      switch (k) {
        case "name": return name;
        case "log": return log;
      }
    }
  };
};


/******************************************************************************
*******************************[ Introspection ]*******************************
******************************************************************************/


// getTypeTag
// a -> String
export const getTypeTag = x => {
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
};


// typeCheck
// untyped
const typeCheck = Cons => f => x => {
  const t = introspect(x),
    undef = t.search(/\bUndefined\b/),
    nan = t.search(/\bNaN\b/);

  if (undef !== -1) {
    throw new Cons(f(t) ("Undefined") ([undef, undef + 9]));
  }

  else if (nan !== -1) {
    throw new Cons(f(t) ("NaN") ([nan, nan + 3]));
  }

  else return t;
};


// introspect
// a -> String
const introspect = x => {
  switch (typeof x) {
    case "boolean": return "Boolean";
    case "function": return `λ${x.name}`;

    case "number": {
      if (Number.isNaN(x)) return "NaN";
      else if (!Number.isFinite(x)) return "Infinity";
      else return "Number";
    }

    case "object": {
      const tag = getTypeTag(x);

      switch (tag) {
        case "Array": return introspectArr(x);
        case "Map": return introspectMap(x);
        case "Null": return tag;
        case "Set": return introspectSet(x);
        default: return introspectObj(x) (tag);
      }
    }

    case "string": return "String";
    case "symbol": return "Symbol";
    case "undefined": return "Undefined";
  }
};


// introspect Array
// Array -> String
const introspectArr = xs => {
  if (xs.length <= 8) {
    const [s, ts] = xs.reduce(([s, ts], x) => {
      x = introspect(x);
      return [s.add(x), ts.concat(x)];
    }, [new Set(), []]);

    if (s.size === 1) return `[${Array.from(s) [0]}]`;
    else return `[${ts.join(", ")}]`;
  }

  else {
    const s = xs.reduce((s, x) => {
      x = introspect(x);
      return s.add(x);
    }, new Set());

    if (s.size === 1) return `[${Array.from(s) [0]}]`;
    else return "[?]";
  }
};


// introspect Map
// Map -> String
const introspectMap = m => {
  const s = new Set();

  m.forEach((v, k) => {
    v = introspect(v);
    s.add(`${k}, ${v}`);
  });

  if (m.size === 1) return `Map<${Array.from(s) [0]}>`;
  else return `Map<?>`;
};


// introspect Object
// Object -> String
const introspectObj = o => tag => {
  if (tag === "Object") {
    const ks = Object.keys(o);

    if (keys.length <= 16) {
      const [s, ts] = ks.reduce(([s, ts], k) => {
        const v = introspect(o[k]);
        return [s.add(`${k}: ${v}`), ts.concat(`${k}: ${v}`)];
      }, [new Set(), []]);

      if (s.size === 1) return `{String: ${Array.from(s) [0].split(": ") [1]}}`;
      else return `{${ts.join(", ")}}`;
    }

    else {
      const s = ks.reduce((s, k) => {
        const v = introspect(o[k]);
        return s.add(`${k}: ${v}`);
      }, new Set());

      if (s.size === 1) return `{String: ${Array.from(s) [0].split(": ") [1]}}`;
      else return "{?}";
    }
  }

  else return tag;
};


// introspect Set
// Set -> String
const introspectSet = s => {
  const s_ = new Set();

  s.forEach(k => {
    k = introspect(k);
    s_.add(k);
  });

  if (s_.size === 1) return `Set<${Array.from(s_) [0]}>`;
  else return `Set<?>`;
};


/******************************************************************************
******************************[ Error Handling ]*******************************
******************************************************************************/


// ArgTypeError
// String -> ArgTypeError
class ArgTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgTypeError);
  }
};


// ArityError
// String -> ArityError
class ArityError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArityError);
  }
};


// ReturnTypeError
// String -> ReturnTypeError
class ReturnTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ReturnTypeError);
  }
};


/******************************************************************************
*******************************************************************************
*********************************[ BUILT-INS ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ Array ]***********************************
******************************************************************************/


/******************************************************************************
**********************************[ Boolean ]**********************************
******************************************************************************/


//export const all = 


// conjunction
// untyped
export const and = x => y => x && y;


//export const any =


// indeterministic conjunctions
// TODO: loop/recur, traversable
// untyped
export const ands = xs => {
  const aux = n => xs[n] && (xs.length - 1 === n ? xs[n] : aux(n + 1));
  return aux(0);
};


// logical biconditional
// a -> a -> Boolean
export const bicond = x => y => !!(x && y) || !(x || y);


// logical implication
// a -> a -> Boolean
export const implies = x => y => !x || !!y;


// logical negation
// a -> Boolean
export const not = x => !x;


// logical negated predicate
// (a -> Boolean) -> a -> Boolean
export const notp = p => x => !p(x);


// disjunction
// untyped
export const or = x => y => x || y;


// indeterministic disjunctions
// TODO: loop/recur, traversable
// untyped
export const ors = xs => {
  const aux = n => xs[n] || (xs.length - 1 === n ? xs[n] : aux(n + 1));
  return aux(0);
};


// logical exclusive disjunction
// a -> a -> Boolean
export const xor = x => y => !!(x || y) && !(x && y);


// xor with default value
// untyped
export const xor_ = z => x => y => !x === !y ? z : x ? x : y;


/***[Namespace]***************************************************************/


// Boolean namespace
// Object
const Boo = {}


/***[Bounded]*****************************************************************/

  
Boo.minBound = false;
  

Boo.maxBound = true;


/******************************************************************************
*********************************[ Function ]**********************************
******************************************************************************/


// flip arguments
// (a -> b -> c) -> b -> a -> c
export const _ = f => y => x => f(x) (y);


// infix applicator
// a -> (a -> b -> c) -> b -> c
export const $ = x => f => y => f(x) (y);


// applicative
// (a -> b -> c) -> (a -> b) -> a -> c
export const ap = f => g => x => f(x) (g(x));


// applicator
// (a -> b) -> a -> b
export const app = f => x => f(x);


// monadic chain
// (a -> b) -> (b -> a -> c) -> a -> c
export const chain = g => f => x => f(g(x)) (x);


// reversed monadic chain
// (b -> a -> c) -> (a -> b) -> a -> c
export const chainR = f => g => x => f(g(x)) (x);


// variadic monadic chain
// untyped
export const chainN = g => Object.assign(f => chainN(x => f(g(x)) (x)), {run: g});


// export constant
// a -> b -> a
export const co = x => y => x;


// export constant in 2nd argument
// a -> b -> a
export const co2 = x => y => x;


// function composition
// (b -> c) -> (a -> b) -> a -> c
export const comp = f => g => x => f(g(x));


// function composition of inner binary function
// (c -> d) -> (a -> b -> c) -> a -> -> b -> d
export const comp2 = f => g => x => y => f(g(x) (y));


// variadic function composition
// untyped
export const compN = f => Object.assign(g => $(x => f(g(x))), {run: f});


// composition in both arguments
// (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
export const compBoth = f => g => h => x => f(g(x)) (h(x));


// function compostion in the second argument
// (a -> c -> d) -> a -> (b -> c) -> b -> d
export const compSnd = f => x => g => y => f(x) (g(y));


// first class conditional operator
// a -> a -> Boolean -> a
export const cond = x => y => b => b ? x : y;


// contramap
// (a -> b) -> (b -> c) -> a -> c
export const contra = f => g => x => g(f(x));


// continuation
// a -> (a -> b) -> b
export const cont = x => f => f(x);


// curry
// ((a, b) -> c) -> a -> b -> c
export const curry = f => x => y => f(x, y);


// curry3
// ((a, b, c) -> d) -> a -> b -> c -> d
export const curry3 = f => x => y => z => f(x, y, z);


// fix combinator
// ((a -> b) a -> b) -> a -> b
export const fix = f => x => f(fix(f)) (x);


// omega combinator
// untyped
export const fix_ = f => f(f);


// guarded function
// (a -> b) -> (a -> Boolean) -> b -> a -> b
export const guard = f => p => x => y => p(y) ? f(y) : x;


// identity function
// a -> a
export const id = x => x;


// monadic join
// (r -> r -> a) -> r -> a
export const join = f => x => f(x) (x);


// on
// (b -> b -> c) -> (a -> b) -> a -> a -> c
export const on = f => g => x => y => f(g(x)) (g(y));


// rotate left
// a -> b -> c -> d) -> b -> c -> a -> d
export const rotatel = f => y => z => x => f(x) (y) (z);


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
export const rotater = f => z => x => y => f(x) (y) (z);


// uncurry
// (a -> b -> c) -> (a, b) -> c
export const uncurry = f => (x, y) => f(x) (y);


// tap
// (a -> b) -> a -> b)
export const tap = f => x => (f(x), x);


// uncurry
// (a -> b -> c -> d) -> (a, b, c) -> d
export const uncurry3 = f => (x, y, z) => f(x) (y) (z);


/***[Tail Recursion]**********************************************************/


// loop
// no augmentation
// untyped
export const loop = f => {
  let acc = f();

  while (acc && acc.type === recur) {
    acc = f(...acc.args);
  }

  return acc;
};


// recursive case
// no augmentation
// untyped
export const recur = (...args) => ({type: recur, args});

  
/******************************************************************************
************************************[ Map ]************************************
******************************************************************************/


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


/******************************************************************************
**********************************[ String ]***********************************
******************************************************************************/


// capitalize
// String -> String
export const capitalize = s => s[0].toUpperCase() + s.slice(1);


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// ADT with several data export constructors
// untyped
export const Type = Tcons => Dcons => {
  const t = new Tcons();
  t[`run${Dcons.constructor.name}`] = cases => Dcons(cases);
  t.tag = Dcons.constructor.name
  return t;
};


// ADT with single data export constructor
// untyped
export const Data = Tcons => Dcons => {
  const Data = x => {
    const t = new Tcons();
    t[`run${Dcons.constructor.name}`] = x;
    t.tag = Dcons.constructor.name
    return t;
  };

  return Dcons(Data);
};


/******************************************************************************
***********************************[ Cont ]************************************
******************************************************************************/


// continuation
// Function -> ((a -> r) -> r) -> Cont r a
export const Cont = Data(function Cont() {}) (Cont => k => Cont(k));


// run continuation
// Cont r a -> (a -> r) -> r
export const runCont = tk => k => tk.runCont(k);


/***[Chain]*******************************************************************/


// chain
// ((a -> r) -> r) -> (a -> ((b -> r) -> r)) -> ((b -> r) -> r)
//export const chain = tk => ft => Cont(k => tk.runCont(x => ft(x).runCont(k)));


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ Char ]************************************
******************************************************************************/


export class Char extends String {
  constructor(c) {
    super(c);

    if (typeof c !== "string") throw new TypeError(
      "\n\nChar expect String literal\n"
      + `${c} of type ${typeof c} received\n`
    );

    else if ([...c].length !== 1) throw new TypeError(
      "\n\nChar expect single character\n"
      + `"${c}" of length ${c.length} received\n`
    );
  }
} {
  const Char_ = Char;

  Char = function(c) {
    return new Char_(c);
  };

  Char.prototype = Char_.prototype;
}


Char.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nChar is coerced to ${capitalize(hint)}\n`
    + "illegal implicit type conversion\n"
  );
};


/***[Bounded]*****************************************************************/


// minimal bound
// constant
// String
Char.minBound = Char("\u{0}");


// maximal bound
// constant
// String
Char.maxBound = Char("\u{10FFFF}");



/******************************************************************************
***********************************[ Float ]***********************************
******************************************************************************/


/******************************************************************************
************************************[ Int ]************************************
******************************************************************************/


/******************************************************************************
***********************************[ Record ]**********************************
******************************************************************************/


/******************************************************************************
***********************************[ Tuple ]***********************************
******************************************************************************/


/******************************************************************************
***********************************[ Misc ]************************************
******************************************************************************/


// TypeCoercionError
// String -> TypeCoercionError
class TypeCoercionError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, TypeCoercionError);
  }
};


/******************************************************************************
*******************************************************************************
********************************[ TYPECLASSES ]********************************
*******************************************************************************
******************************************************************************/


const typeclasses = new Map([
  ["Bounded", ["minBound", "maxBound"]]
]);


const instances = new Map([
  // built-in type class instances
  //["Bounded Number", {minBound: 0, maxBound: Number.MAX_SAFE_INTEGER}]
  // ...
  //["Monoid Number", {append: Num.append, empty: Num.empty}],
  //["Monoid Array", {append: Arr.append, empty: Arr.empty}]
  // ...
]);


export const typeDict = _class => {
  const f = tag => instances.get(`${_class} ${tag}`),
    ops = typeclasses.get(_class);

  ops.forEach(op => {
    f[op] = x => {
      const r = instances.get(`${_class} ${getTypeTag(x)}`) [op];
      if (typeof r === "function") return r(x);
      else return r;
    }
  });

  return f;
};


/******************************************************************************
*******************************************************************************
*******************************[ DERIVED TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
**********************************[ Boolean ]**********************************
******************************************************************************/


// logical negated conjunction
// a -> a -> Boolean
export const nand = comp2(not) (and);


// logical negated indeterministic conjunctions
// [a] -> Boolean
export const nands = comp(not) (ands);


// logical negated disjunction
// a -> a -> Boolean
export const nor = comp2(not) (or);


// logical negated indeterministic disjunctions
// a -> a -> Boolean
export const nors = comp(not) (ors);


/******************************************************************************
*******************************************************************************
*********************************[ INTERNAL ]**********************************
*******************************************************************************
******************************************************************************/


// stringify
// internal
// a -> String
const stringify = x => {
  switch (typeof x) {
    case "string": return `"${x}"`;
    default: return String(x);
  }
};


// underline
// [Number] -> String
const underline = ([n, m]) =>
  Array(n + 1).join(" ") + Array(m - n + 1).join("^");
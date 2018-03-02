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


const guarded = true;


const SYM_PREFIX = "github.com/kongware/scriptum";


/******************************************************************************
*******************************************************************************
*********************************[ DEBUGGING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ Virtualization ]*******************************
******************************************************************************/


// augment a curried, multi-argument or variadic function
// default export
// untyped
const $ = (name, f) => {
  if (augmented) {
    Reflect.defineProperty(f, "name", {value: name});
    return new Proxy(f, handleF(name, f, [], {nthCall: 0}))
  }

  else return f;
};


// handle function
// proxy handler
// untyped
const handleF = (name, f, log, {nthCall}) => {
  return {
    apply: (g, _, args) => {
      const argTypes = args.map((arg, nthArg) =>
        typeCheck(ArgTypeError)
          (t => illTyped => fromTo => `\n\n${name} received an argument of type`
            + `\n\n${t}`
            + (fromTo.length === 0 ? "\n" : `\n${underline(fromTo)}`)
            + `\n\nin the ${nthCall + 1}. call of ${name}`
            + `\nin the ${nthArg + 1}. argument of ${name}`
            + `\n\ninvalid type`
            + "\n") (arg))
              .join(", ");

      const r = f(...args);

      const retType = typeCheck(ReturnTypeError)
        (t => illTyped => fromTo => `\n\n${name} returned a value of type`
          + `\n\n${t}`
          + (fromTo.length === 0 ? "\n" : `\n${underline(fromTo)}`)
          + `\n\ninvalid type`
          + "\n") (r);

      if (typeof r === "function") {
        const name_ = r.name || name;
        Reflect.defineProperty(r, "name", {value: name_});
        return new Proxy(r, handleF(name_, r, log.concat(`${name}(${argTypes})`), {nthCall: nthCall + 1}));
      }

      else return r;
    },

    get: (f, k, p) => {
      switch (k) {
        case "name": return name;
        case "log": return log;
        default: return f[k];
      }
    }
  };
};


/******************************************************************************
*******************************[ Introspection ]*******************************
******************************************************************************/


// getTypeTag
// a -> String
const getTypeTag = x => {
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
};


// typeCheck
// untyped
const typeCheck = Cons => f => x => {
  const t = introspect(x),
    undef = t.search(/\bUndefined\b/),
    nan = t.search(/\bNaN\b/),
    inf = t.search(/\bInfinity\b/);

  if (undef !== -1) {
    throw new Cons(f(t) ("Undefined") ([undef, undef + 9]));
  }

  else if (nan !== -1) {
    throw new Cons(f(t) ("NaN") ([nan, nan + 3]));
  }

  else if (inf !== -1) {
    throw new Cons(f(t) ("Infinity") ([nan, nan + 3]));
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

    if (ks.length <= 16) {
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
****************************[ Augmentation Errors ]****************************
******************************************************************************/


// ArgTypeError
// String -> ArgTypeError
class ArgTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgTypeError);
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


/***[Namespace]***************************************************************/


// Array namespace
// Object
const Arr = {};


/******************************************************************************
**********************************[ Boolean ]**********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// Boolean namespace
// Object
const Boo = {};


/***[Bounded]*****************************************************************/

  
Boo.minBound = false;
  

Boo.maxBound = true;


/******************************************************************************
*********************************[ Function ]**********************************
******************************************************************************/


// applicative
// (a -> b -> c) -> (a -> b) -> a -> c
const ap = $(
  "ap",
  f => g => x => f(x) (g(x))
);


// applicator
// (a -> b) -> a -> b
const apply = $(
  "apply",
  f => x => f(x)
);


// monadic chain
// (a -> b) -> (b -> a -> c) -> a -> c
const chain = $(
  "chain",
  g => f => x => f(g(x)) (x)
);


// flipped monadic chain
// (b -> a -> c) -> (a -> b) -> a -> c
const chain_ = $(
  "chain_",
  f => g => x => f(g(x)) (x)
);


// variadic monadic chain
// untyped
const chainN = $(
  "chainN",
  g => Object.assign(f => chainN(x => f(g(x)) (x)), {run: g})
);


// constant
// a -> b -> a
const co = $(
  "co",
  x => y => x
);


// constant in 2nd argument
// a -> b -> a
const co2 = $(
  "co2",
  x => y => x
);


// function composition
// (b -> c) -> (a -> b) -> a -> c
const comp = $(
  "comp",
  f => g => x => f(g(x))
);


// function composition of inner binary function
// (c -> d) -> (a -> b -> c) -> a -> -> b -> d
const comp2 = $(
  "comp2",
  f => g => x => y => f(g(x) (y))
);


// variadic function composition
// untyped
const compN = $(
  "compN",
  f => Object.assign(g => $(x => f(g(x))), {run: f})
);


// composition in both arguments
// (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
const compBoth = $(
  "compBoth",
  f => g => h => x => f(g(x)) (h(x))
)


// function compostion in the second argument
// (a -> c -> d) -> a -> (b -> c) -> b -> d
const compSnd = $(
  "compSnd",
  f => x => g => y => f(x) (g(y))
);


// first class conditional operator
// a -> a -> Boolean -> a
const cond = $(
  "cond",
  x => y => b => b ? x : y
);


// contramap
// (a -> b) -> (b -> c) -> a -> c
const contra = $(
  "contra",
  f => g => x => g(f(x))
);


// continuation
// a -> (a -> b) -> b
const cont = $(
  "cont",
  x => f => f(x)
);


// curry
// ((a, b) -> c) -> a -> b -> c
const curry = $(
  "curry",
  f => x => y => f(x, y)
);


// curry3
// ((a, b, c) -> d) -> a -> b -> c -> d
const curry3 = $(
  "curry3",
  f => x => y => z => f(x, y, z)
);


// fix combinator
// ((a -> b) a -> b) -> a -> b
const fix = $(
  "fix",
  f => x => f(fix(f)) (x)
);


// flip arguments
// (a -> b -> c) -> b -> a -> c
const flip = $(
  "flip",
  f => y => x => f(x) (y)
);


// guarded function
// (a -> b) -> (a -> Boolean) -> b -> a -> b
const guard = $(
  "guard",
  f => p => x => y => p(y) ? f(y) : x
);


// identity function
// a -> a
const id = $(
  "id",
  x => x
);


// infix applicator
// a -> (a -> b -> c) -> b -> c
const infix = $(
  "infix",
  x => f => y => f(x) (y)
);


// monadic join
// (r -> r -> a) -> r -> a
const join = $(
  "join",
  f => x => f(x) (x)
);


// omega combinator
// untyped
const omega = $(
  "omega",
  f => f(f)
);


// on
// (b -> b -> c) -> (a -> b) -> a -> a -> c
const on = $(
  "on",
  f => g => x => y => f(g(x)) (g(y))
);


// rotate left
// a -> b -> c -> d) -> b -> c -> a -> d
const rotateL = $(
  "rotateL",
  f => y => z => x => f(x) (y) (z)
);


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
const rotateR = $(
  "rotateR",
  f => z => x => y => f(x) (y) (z)
);


// tap
// (a -> b) -> a -> b)
const tap = $(
  "tap",
  f => x => (f(x), x)
);


// uncurry
// (a -> b -> c) -> (a, b) -> c
const uncurry = $(
  "uncurry",
  f => (x, y) => f(x) (y)
);


// uncurry 3
// (a -> b -> c -> d) -> (a, b, c) -> d
const uncurry3 = $(
  "uncurry3",
  f => (x, y, z) => f(x) (y) (z)
);


/***[Tail Recursion]**********************************************************/


// loop
// trampoline
// untyped
const loop = $(
  "loop",
  f => {
    let acc = f();

    while (acc && acc.type === recur)
      acc = f(...acc.args);

    return acc;
  }
);


// recursive call
// not augmented
// untyped
const recur = (...args) =>
  ({type: recur, args});


/***[Namespace]***************************************************************/


// Function namespace
// Object
const Fun = {};


/******************************************************************************
************************************[ Map ]************************************
******************************************************************************/


/***[Namespace]***************************************************************/


// Map namespace
// Object
const _Map = {};


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// Number namespace
// Object
const Num = {};


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// Object namespace
// Object
const Obj = {};


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


/***[Namespace]***************************************************************/


// Set namespace
// Object
const _Set = {};


/******************************************************************************
**********************************[ String ]***********************************
******************************************************************************/


// capitalize
// String -> String
const capitalize = $(
  "capitalize",
  s => s[0].toUpperCase() + s.slice(1)
);


/***[Namespace]***************************************************************/


// String namespace
// Object
const Str = {};


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// ADT with several data constructors
// untyped
const Type = $(
  "Type",
  Tcons => (tag, Dcons) => {
    const t = new Tcons();
    t[`run${Tcons.name}`] = cases => Dcons(cases);
    t.tag = tag;
    return t;
  }
);


// ADT with single data constructor
// untyped
const Data = $(
  "Data",
  Tcons => Dcons => {
    const Data = x => {
      const t = new Tcons();
      t[`run${Tcons.name}`] = x;
      t.tag = Tcons.name
      return t;
    };

    return Dcons(Data);
  }
);


/******************************************************************************
***********************************[ Cont ]************************************
******************************************************************************/


// continuation
// Function -> ((a -> r) -> r) -> Cont r a
const Cont = Data(function Cont() {}) (Cont => k => Cont(k));


// run continuation
// Cont r a -> (a -> r) -> r
const runCont = tk => k => tk.runCont(k);


/******************************************************************************
********************************[ Comparator ]*********************************
******************************************************************************/


const Comparator = Type(function Comparator() {});


const LT = Comparator("LT", cases => cases.LT);


const EQ = Comparator("EQ", cases => cases.EQ);


const GT = Comparator("GT", cases => cases.GT);


/******************************************************************************
*******************************************************************************
****************************[ FUNCTION ENCODINGS ]*****************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ Char ]************************************
******************************************************************************/


// Char constructor
// String -> Char
const Char = c => {
  if (augmented && typeof c !== "string")
    throw new ArgTypeError(
      "\n\nChar expects String literal"
      + `\nvalue of type ${introspect(c)} received`
      + "\n");

  else if (augmented && [...c].length !== 1)
    throw new ArgTypeError(
      "\n\nChar expects single character"
      + `\n"${c}" of length ${c.length} received`
      + "\n");

  else return
    ({
      runChar: $("runChar", k => k(c)),
      [Symbol.toStringTag]: "Char"
    });
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


// Float constructor
// Number -> Float
const Float = f => {
  if (augmented && typeof f !== "number")
    throw new ArgTypeError(
      "\n\nFloat expects Number literal"
      + `\nvalue of type ${introspect(f)} received`
      + "\n");

  else return
    ({
      runFloat: $("runFloat", k => k(f)),
      [Symbol.toStringTag]: "Float"
    });
};


/******************************************************************************
************************************[ Int ]************************************
******************************************************************************/


// Int constructor
// Number -> Int
const Int = i => {
  if (augmented && typeof i !== "number")
    throw new ArgTypeError(
      "\n\nInt expects Number literal"
      + `\nvalue of type ${introspect(i)} received`
      + "\n");

  else if (augmented && i % 1 !== 0)
    throw new ArgTypeError(
      "\n\nInt expects integer literal"
      + `\n"${i}" of type Float received`
      + "\n");

  else return
    ({
      runInt: $("runInt", k => k(i)),
      [Symbol.toStringTag]: "Int"
    });
};


/***[Bounded]*****************************************************************/


// minimal bound
// constant
// Int
Int.minBound = Int(Number.MIN_SAFE_INTEGER);


// maximal bound
// constant
// Int
Int.maxBound = Int(Number.MAX_SAFE_INTEGER);


/******************************************************************************
**********************************[ Record ]***********************************
******************************************************************************/


// Record constructor
// Object -> Record
const Record = $(
  "Record",
  o => {
    if (augmented && (typeof o !== "object" || o === null)) 
      throw new ArgTypeError(
        "\n\nRecord expects Number literal"
        + `\nvalue of type ${introspect(o)} received`
        + "\n");

    else {
      return ({
        runRecord: $("runRecord", k => k(o)),
        [Symbol.toStringTag]: augmented ? `Record<${introspect(o).slice(1, -1)}>` : "Record"
      });
    }
  }
);


/******************************************************************************
***********************************[ Tuple ]***********************************
******************************************************************************/


// Tuple constructor
// (...Array) -> Tuple
const Tuple = $(
  "Tuple",
  (...args) => ({
    runTuple: $("runTuple", k => k(...args)),
    [Symbol.toStringTag]: augmented ? `Tuple<${introspect(o).slice(1, -1)}>` : "Record"
  })
);


/******************************************************************************
*******************************************************************************
********************************[ TYPECLASSES ]********************************
*******************************************************************************
******************************************************************************/


const typeClasses = new Map([
  // built-in typeclasses
  ["Bounded", ["minBound", "maxBound"]]
]);


const instances = new Map([
  // built-in typeclass instances
  ["Bounded Boolean", {minBound: Boo.minBound, maxBound: Boo.maxBound}],
  ["Bounded Char", {minBound: Char.minBound, maxBound: Char.maxBound}],
  ["Bounded Int", {minBound: Int.minBound, maxBound: Int.maxBound}]
]);


const typeDict = _class => {
  const f = tag => instances.get(`${_class} ${tag}`),
    ops = typeClasses.get(_class);

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
*******************************************************************************
***********************************[ MISC ]************************************
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


/******************************************************************************
*******************************************************************************
**********************************[ EXPORT ]***********************************
*******************************************************************************
******************************************************************************/


Object.assign(
  $,
  {
    ap,
    apply,
    chain,
    chain_,
    chainN,
    Char,
    co,
    co2,
    comp,
    comp2,
    compN,
    compBoth,
    compSnd,
    cond,
    contra,
    cont,
    curry,
    curry3,
    Data,
    EQ,
    fix,
    flip,
    Float,
    guard,
    GT,
    id,
    infix,
    Int,
    join,
    loop,
    LT,
    omega,
    on,
    Record,
    recur,
    rotateL,
    rotateR,
    tap,
    Tuple,
    Type,
    typeDict,
    uncurry,
    uncurry3
  }
);


export default $;
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
********************************[ PREDEFINED ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************************************************************
**********************************[ GLOBALS ]**********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ Constants ]*********************************
******************************************************************************/


// invalid types
// [String]
const INVALID_TYPES = new Set(["Undefined", "NaN", "Infinity"]);


// flag for controling function guarding
// Boolean
const GUARDED = true;


/******************************************************************************
*********************************[ Variables ]*********************************
******************************************************************************/


// history log
// [String]
let history = [];


// set history
// String -> [String]
const setHistory = s => {
  history.unshift(s);

  if (history.length > HISTORY_LEN)
    history.pop();
};


// length of global history log
// Number
const HISTORY_LEN = 10;


// function type log accessor
// Symbol
const LOG = Symbol("LOG");


// property for accessing type signatures
// Symbol
const SIG = Symbol("SIG");


/******************************************************************************
*******************************************************************************
*********************************[ DEBUGGING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ Virtualization ]*******************************
******************************************************************************/


// function guard
// default export
// untyped
const $ = (name, f) => {
  if (GUARDED) {
    if (typeof name !== "string") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n$ expects an argument of type String"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(name)} received`
      + "\n");

    else if (typeof f !== "function") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n$ expects an argument of type Function"
      + `\n\non the 1st call`
      + `\n\nin the 2nd argument`
      + `\n\nbut ${introspect(f)} received`
      + "\n");

    if (name.indexOf("...") === 0) {
      Reflect.defineProperty(f, "name", {value: name.slice(3)});
      
      return new Proxy(
        f, handleF(name.slice(3), f, [], {params: "var", nthCall: 0})
      );
    }

    else {
      Reflect.defineProperty(f, "name", {value: name});

      return new Proxy(
        f, handleF(name, f, [], {params: "fix", nthCall: 0})
      );
    }
  }

  else return f;
};


// handle guarded function
// proxy handler
// untyped
const handleF = (name, f, log, {params, nthCall}) => {
  return {
    apply: (g, _, args) => {
      // skip both calls
      verifyArity(g, args, name, params, nthCall, log);
      const argTypes = verifyArgTypes(args, name, nthCall, log);

      // step into call
      const r = f(...args);

      // skip call
      verifyRetType(r, name, log);

      // skip statement
      if (typeof r === "function") {
        const name_ = r.name || name,
          log_ = log.concat(`${name}(${argTypes})`);

        Reflect.defineProperty(r, "name", {value: name_});
        Reflect.defineProperty(r, LOG, {value: log_});

        return new Proxy(
          r, handleF(name_, r, log_, {params, nthCall: nthCall + 1})
        );
      }

      else {
        setHistory(log.concat(`${name}(${argTypes})`));
        return r;
      }
    },

    get: (f, k, p) => {
      switch (k) {
        case "name": return name;
        case LOG: return log;
        default: return f[k];
      }
    }
  };
};


const guardSum = (name, f, tags) => {
  if (GUARDED) {
    return cases => {
      if (toTypeTag(cases) !== "Object") throw new ArgTypeError(
        "invalid argument type"
        + `\n\n${name} expects an argument of type Object`
        + `\n\non the 1st call`
        + `\nin the 1st argument`
        + `\n\nbut ${introspect(cases)} received`
        + "\n");

      const s = new Set(Object.keys(cases));

      tags.forEach(tag => {
        if (s.has(tag)) s.delete(tag);

        else throw new ArgValueError(
          "invalid argument value"
          + `\n\n${name} expects an Object including the following cases`
          + `\n\n${tags.join(", ")}`
          + `\n\non the 1st call`
          + `\nin the 1st argument`
          + `\n\nbut ${tag} was not received`
          + "\n");
      });

      if (s.size > 0) throw new ArgValueError(
        "invalid argument value"
        + `\n\n${name} expects an Object including the following cases`
        + `\n\n${tags.join(", ")}`
        + `\n\non the 1st call`
        + `\nin the 1st argument`
        + `\n\nbut additionally ${Array.from(s.values()).join(", ")} received`
        + "\n");

      const r = f(cases);
      return typeof r === "function" ? $(`run${name}`, r) : r;
    };
  }

  else return f;
};


/******************************************************************************
*******************************[ Introspection ]*******************************
******************************************************************************/


// get type constructor
// a -> String
const toTypeTag = x => {
  // TODO: inspect x when guarded
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
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
      const tag = toTypeTag(x);

      if (tag !== "Null" && SIG in x) return x[SIG];

      else {
        switch (tag) {
          case "Array": return introspectArr(x);
          case "Map": return introspectMap(x);
          case "Null": return tag;
          case "Record": return introspectRec(x);
          case "Set": return introspectSet(x);
          case "Tuple": return introspectTup(x);
          default: return introspectObj(x) (tag);
        }
      }
    }

    case "string": return "String";
    case "symbol": return "Symbol";
    case "undefined": return "Undefined";
  }
};


// introspect array
// Array -> String
const introspectArr = xs => {
  if (xs.length <= MAX_TUP_SIZE) {
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


// introspect map
// Map -> String
const introspectMap = m => {
  const s = new Set();
  m.forEach((v, k) => s.add(`${introspect(k)}, ${introspect(v)}`));
  if (s.size === 1) return `Map<${Array.from(s) [0]}>`;
  else return `Map<?>`;
};


// introspect object
// Object -> String
const introspectObj = o => tag => {
  if (tag === "Object") {
    const ks = Object.keys(o);

    if (ks.length <= MAX_REC_SIZE) {
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


// introspect record
// Record -> String
const introspectRec = r => {
  if (r.length > MAX_REC_SIZE) return "Record<?>";

  else {
    const r_ = Object.keys(r)
      .map(k => introspect(`${k}: ${r[k]}`))
      .join(", ");

    return `Record<${r_}>`;
  }
};


// introspect set
// Set -> String
const introspectSet = s => {
  const s_ = new Set();
  s.forEach(k => s_.add(introspect(k)));
  if (s_.size === 1) return `Set<${Array.from(s_) [0]}>`;
  else return `Set<?>`;
};


// introspect tuple
// Tuple -> String
const introspectTup = t => {
  if (t.length > MAX_TUP_SIZE) return "Tuple<?>";
  else return `Tuple<${Array.from(t).map(t_ => introspect(t_)).join(", ")}>`;
};


// type check
// untyped
const typeCheck = Cons => f => x => {
  const t = introspect(x),
    undef = t.search(/\bUndefined\b/),
    nan = t.search(/\bNaN\b/),
    inf = t.search(/\bInfinity\b/);

  if (undef !== -1) {
    throw new Cons(f(t) ("Undefined"));
  }

  else if (nan !== -1) {
    throw new Cons(f(t) ("NaN"));
  }

  else if (inf !== -1) {
    throw new Cons(f(t) ("Infinity"));
  }

  else return t;
};


const verifyArgTypes = (args, name, nthCall, log) => 
  args.map((arg, nthArg) => {
    const t = introspect(arg);

    if (INVALID_TYPES.has(t)) throw new ArgTypeError(
      "invalid argument type"
      + `\n\n${name} received an argument of type ${t}`
      + `\n\non the ${ordinal(nthCall + 1)} call`
      + `\nin the ${ordinal(nthArg + 1)} argument`
      + (log.length === 0 ? "" : `\n\nCALL LOG:\n\n${log}`)
      + "\n");
  }).join(", ");
  


const verifyArity = (g, args, name, params, nthCall, log) => {
  if (params === "fix" && g.length !== args.length) {
    throw new ArityError(
      "invalid function call arity"
      + `\n\n${name} expects ${g.length}-ary Function`
      + `\n\non the ${ordinal(nthCall + 1)} call`
      + `\n\nbut ${args.length}-ary Function received`
      + (log.length === 0 ? "" : `\n\nCALL LOG:\n\n[${log.join(", ")}]`)
      + "\n"
    );
  }

  else if (params === "var" && g.length > args.length) {
    throw new ArityError(
      "invalid function call arity"
      + `\n\n${name} expects at least ${g.length}-ary Function`
      + `\n\non the ${ordinal(nthCall + 1)} call`
      + `\n\nbut ${args.length}-ary Function received`
      + (log.length === 0 ? "" : `\n\nCALL LOG:\n\n[${log.join(", ")}]`)
      + "\n"
    );
  }
};


const verifyRetType = (r, name, log) => {
  const t = introspect(r);

  if (INVALID_TYPES.has(t)) throw new ReturnTypeError(
    "invalid return type"
    + `\n\n${name} returned a value of type ${t}`
    + (log.length === 0 ? "" : `\n\nCALL LOG:\n\n${log}`)
    + "\n");

  return t;
};


/******************************************************************************
**********************************[ Errors ]***********************************
******************************************************************************/


// argument type error
// String -> ArgTypeError
class ArgTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgTypeError);
  }
}


// argument value error
// String -> ArgValueError
class ArgValueError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgValueError);
  }
}


// arity error
// String -> ArityError
class ArityError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArityError);
  }
}


// return type error
// String -> ReturnTypeError
class ReturnTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ReturnTypeError);
  }
}


// type coercion error
// String -> TypeCoercionError
class TypeCoercionError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, TypeCoercionError);
  }
}


/******************************************************************************
********************************[ PrettyPrint ]********************************
******************************************************************************/


// ordinal number
// Number -> String
const ordinal = $(
  "ordinal",
  n => {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;

    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  });


// replace nestings
// String -> String
const replaceNestings = $(
  "replaceNestings",
  s => {
    const aux = s_ => {
      const t = s_.replace(/\[[^\[\]]*\]/g, "_")
        .replace(/\{[^{}}]*\}/g, "_")
        .replace(/\<[^<>]*\>/g, "_");

      if (t === s_) return t;
      else return aux(t);
    };

    const xs = s.match(/^[\[{<]|[\]}>]$/g);
    if (xs.length === 0) return aux(s);
    else return `${xs[0]}${aux(s.slice(1, -1))}${xs[1]}`;
  }
);


// stringify
// a -> String
const stringify = $(
  "stringify",
  x => {
    switch (typeof x) {
      case "string": return `"${x}"`;
      default: return String(x);
    }
  }
);


/******************************************************************************
*******************************************************************************
********************************[ OVERLOADING ]********************************
*******************************************************************************
******************************************************************************/


// overloaded function
// untyped
const overload = (name, dispatch) => {
  if (typeof name !== "string") throw new ArgTypeError(
    "invalid argument type"
    + "\n\noverload expects an argument of type String"
    + `\n\non the 1st call`
    + `\n\nin the 1st argument`
    + `\n\nbut ${introspect(name)} received`
    + "\n");

  else if (typeof dispatch !== "function") throw new ArgTypeError(
    "invalid argument type"
    + "\n\noverload expects an argument of type Function"
    + `\n\non the 1st call`
    + `\n\nin the 2nd argument`
    + `\n\nbut ${introspect(dispatch)} received`
    + "\n");

  const pairs = new Map();

  return {
    [`${name}Add`]: $(
      `${name}Add`,
      (k, v) =>
        pairs.set(k, v)),

    [name]: $(
      `${name}`,
      x => {
        const r = pairs.get(dispatch(x));

        if (r === undefined)
          throw new OverloadError(
            "invalid overloaded function call"
            + `\n\n${name} cannot dispatch function/value for ${stringify(dispatch(x))}`
            + "\n\non the 1st call"
            + "\nin the 1st argument"
            + `\n\nof type ${introspect(x)}`
            + "\n");

        else if (typeof r === "function")
          return r(x);

        else return r;
      }
    )
  }
};


/******************************************************************************
**********************************[ Errors ]***********************************
******************************************************************************/


// type class error
// String -> OverloadError
class OverloadError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, OverloadError);
  }
}


/******************************************************************************
********************************[ Typeclasses ]********************************
******************************************************************************/


// equal
// untyped
const eq_ = x => y =>
  x === y;


// not equal
// untyped
const neq_ = x => y =>
  x !== y;


/***[Bounded]*****************************************************************/


// minimal bound
// a
const {minBoundAdd, minBound} =
  overload("minBound", o => o.name);


// maximal bound
// a
const {maxBoundAdd, maxBound} =
  overload("maxBound", o => o.name);


/***[Monoid]******************************************************************/


// empty
// a
const {emptyAdd, empty} =
  overload("empty", o => o.name);


/***[Setoid]**********************************************************************/


// equal
// a -> a -> Boolean
const {eqAdd, eq} =
  overload("eq", toTypeTag);


// not equal
// a -> a -> Boolean
const {neqAdd, neq} =
  overload("neq", toTypeTag);


/***[Simegroup]***************************************************************/


// append
// a -> a -> a
const {appendAdd, append} =
  overload("append", toTypeTag);


// flipped append
// a -> a -> a
const {appendfAdd, appendf} =
  overload("appendf", toTypeTag);


/******************************************************************************
*******************************************************************************
*********************************[ BUILT-INS ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ Array ]***********************************
******************************************************************************/


// @PROXIES/Arr


/******************************************************************************
**********************************[ Boolean ]**********************************
******************************************************************************/


// not predicate
// (a -> Boolean) -> a -> Boolean
const notp = $(
  "notp",
  p => x => !p(x));


// binary not predicate
// (a -> Boolean) -> a -> Boolean
const notp2 = $(
  "notp2",
  p => x => y => !p(x) (y));


/***[Bounded]*****************************************************************/


// minimal bound
// Boolean
minBoundAdd("Boolean", false);
  

// maximal bound
// Boolean
maxBoundAdd("Boolean", true);


/***[Setoid]******************************************************************/


// equal
// Boolean -> Boolean -> Boolean
eqAdd("Boolean", eq_);


// not equal
// Boolean -> Boolean -> Boolean
neqAdd("Boolean", neq_);


/******************************************************************************
*********************************[ Function ]**********************************
******************************************************************************/


// applicator
// (a -> b) -> a -> b
const apply = $(
  "apply",
  f => x => f(x));


// constant
// a -> b -> a
const co = $(
  "co",
  x => y => x);


// constant in 2nd argument
// a -> b -> b
const co2 = $(
  "co2",
  x => y => y);


// binary function composition
// (c -> d) -> (a -> b -> c) -> a -> -> b -> d
const comp2 = $(
  "comp2",
  f => g => x => y => f(g(x) (y)));


// composition in both arguments
// (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
const compBoth = $(
  "compBoth",
  f => g => h => x => f(g(x)) (h(x)));


// comp @ALIASES


// function composition
// right-to-left
// untyped
const compn = $(
  "...compn",
  (f, ...fs) => x =>
    fs.length === 0
      ? f(x)
      : f(compn(...fs) (x)));


// first class conditional operator
// a -> a -> Boolean -> a
const cond = $(
  "cond",
  x => y => b =>
    b ? x : y);


// contramap
// (a -> b) -> (b -> c) -> a -> c
const contra = $(
  "contra",
  f => g => x =>
    g(f(x)));


// continuation
// a -> (a -> b) -> b
const cont = $(
  "cont",
  x => f =>
    f(x));


// curry
// ((a, b) -> c) -> a -> b -> c
const curry = $(
  "curry",
  f => x => y =>
    f(x, y));


// curry3
// ((a, b, c) -> d) -> a -> b -> c -> d
const curry3 = $(
  "curry3",
  f => x => y => z =>
    f(x, y, z));


// fix combinator
// ((a -> b) -> a -> b) -> a -> b
const fix = $(
  "fix",
  f => x =>
    f(fix(f)) (x));


// flip arguments
// (a -> b -> c) -> b -> a -> c
const flip = $(
  "flip",
  f => y => x =>
    f(x) (y));


// identity function
// a -> a
const id = $(
  "id",
  x => x);


// infix applicator
// (a, (a -> b -> c), b) -> c
const infix = $(
  "infix",
  (x, f, y) =>
    f(x) (y));


// monadic join
// (r -> r -> a) -> r -> a
const join = $(
  "join",
  f => x =>
    f(x) (x));


// omega combinator
// untyped
const omega = $(
  "omega",
  f => f(f));


// on
// (b -> b -> c) -> (a -> b) -> a -> a -> c
const on = $(
  "on",
  f => g => x => y =>
    f(g(x)) (g(y)));


// parial
// untyped
const partial = $(
  "...partial",
  (f, ...args) => (...args_) =>
    f(...args, ...args_));


// function composition
// left-to-right
// untyped
const pipe = $(
  "...pipe",
  (f, ...fs) => x =>
    fs.length === 0
      ? f(x)
      : pipe(...fs) (f(x)));


// rotate left
// a -> b -> c -> d) -> b -> c -> a -> d
const rotl = $(
  "rotl",
  f => y => z => x =>
    f(x) (y) (z));


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
const rotr = $(
  "rotr",
  f => z => x => y =>
    f(x) (y) (z));


// swap
// ((a, b) -> c) -> (b, a) -> c
const swap = $(
  "swap",
  f => (x, y) =>
    f(y, x));


// tap
// (a -> b) -> a -> b)
const tap = $(
  "tap",
  f => x =>
    (f(x), x));


// uncurry
// (a -> b -> c) -> (a, b) -> c
const uncurry = $(
  "uncurry",
  f => (x, y) =>
    f(x) (y));


// ternary uncurry
// (a -> b -> c -> d) -> (a, b, c) -> d
const uncurry3 = $(
  "uncurry3",
  f => (x, y, z) =>
    f(x) (y) (z));


/***[Monoid]***************************************************************/


// empty
// All
emptyAdd("Function", id);


/***[Semigroup]***************************************************************/


// appendAdd @ALIASES


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
// not guarded
// untyped
const recur = (...args) =>
  ({type: recur, args});


/******************************************************************************
************************************[ Map ]************************************
******************************************************************************/


// @PROXIES/_Map


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


/***[Setoid]******************************************************************/


// equal
// Number -> Number -> Boolean
eqAdd("Number", eq_);


// not equal
// Number -> Number -> Boolean
neqAdd("Number", neq_);


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


// destructive delete
// String -> Object -> Object
const destructiveDel = k => o =>
  (delete o[k], o);


// destructive set
// (String, a) -> Object -> Object
const destructiveSet = (k, v) => o =>
  (o[k] = v, o);


// property getter
// String -> Object -> a
const prop = k => o => o[k];


/***[Setoid]******************************************************************/


// TODO


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


// @Proxies/_Set


/******************************************************************************
**********************************[ String ]***********************************
******************************************************************************/


// capitalize
// String -> String
const capitalize = $(
  "capitalize",
  s => s[0].toUpperCase() + s.slice(1));


/***[Setoid]******************************************************************/


// equal
// String -> String -> Boolean
eqAdd("String", eq_);


// not equal
// String -> String -> Boolean
neqAdd("String", neq_);


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ All ]************************************
******************************************************************************/


// all
// Boolean -> All
class All extends Boolean {
  constructor(b) {
    super(b);

    if (GUARDED) {
      if (typeof b !== "boolean") throw new ArgTypeError(
        "invalid argument type"
        + "\n\nAny expects an argument of type Boolean"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(b)} received`
        + "\n");
    }
  }
} {
  const All_ = All;

  All = function(b) {
    return new All_(b);
  };

  All.prototype = All_.prototype;
};


/***[Monoid]***************************************************************/


// empty
// All
emptyAdd("All", All(true));


/***[Semigroup]***************************************************************/


// append
// All -> All -> All
appendAdd("All", a => b => All(a && b));


// flipped append
// All -> All -> All
appendfAdd("All", b => a => All(a && b));


/******************************************************************************
************************************[ Any ]************************************
******************************************************************************/


// any
// Boolean -> Any
class Any extends Boolean {
  constructor(b) {
    super(b);

    if (GUARDED) {
      if (typeof b !== "boolean") throw new ArgTypeError(
        "invalid argument type"
        + "\n\nAny expects an argument of type Boolean"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(b)} received`
        + "\n");
    }
  }
} {
  const Any_ = Any;

  Any = function(b) {
    return new Any_(b);
  };

  Any.prototype = Any_.prototype;
};


/***[Monoid]******************************************************************/


// empty
// Any
emptyAdd("Any", Any(false));


/***[Semigroup]***************************************************************/


// append
// Any -> Any -> Any
appendAdd("Any", a => b => Any(a || b));


// append
// Any -> Any -> Any
appendfAdd("Any", b => a => Any(a || b));


/******************************************************************************
***********************************[ Char ]************************************
******************************************************************************/


// char constructor
// String -> Char
class Char extends String {
  constructor(c) {
    super(c);

    if (GUARDED) {
      if (typeof c !== "string") throw new ArgTypeError(
        "invalid argument type"
        + "\n\nChar expects an argument of type String"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(c)} received`
        + "\n");

      else if ([...c].length !== 1) throw new ArgValueError(
        "invalid argument value"
        + "\n\nChar expects a single character"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${c} received`
        + "\n");
    }
  }
} {
  const Char_ = Char;

  Char = function(c) {
    return new Char_(c);
  };

  Char.prototype = Char_.prototype;
};


Char.prototype[Symbol.toStringTag] = "Char";


Char.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    "illegal type coercion"
    + "\n\nChar must maintain its type"
    + `\n\nbut type coercion to ${capitalize(hint)} received`
    + "\n");
};


/***[Bounded]*****************************************************************/


// minimal bound
// Char
minBoundAdd("Char", Char("\u{0}"));


// maximal bound
// Char
maxBoundAdd("Char", Char("\u{10FFFF}"));


/***[Setoid]******************************************************************/


// auxiliary function
// Char -> Char -> Boolean
const eqChar = c => d =>
  c.valueOf() === d.valueOf()


// equal
// Char -> Char -> Boolean
eqAdd("Char", eqChar);


// not equal
// Char -> Char -> Boolean
neqAdd("Char", notp2(eqChar));


/******************************************************************************
***********************************[ Float ]***********************************
******************************************************************************/


// float constructor
// Number -> Float
class Float extends Number {
  constructor(n) {
    super(n);

    if (GUARDED) {
      if (typeof n !== "number") throw new ArgTypeError(
        "invalid argument type"
        + "\n\nFloat expects an argument of type Number"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(n)} received`
        + "\n");
    }
  }
} {
  const Float_ = Float;

  Float = function(n) {
    return new Float_(n);
  };

  Float.prototype = Float_.prototype;
};


Float.prototype[Symbol.toStringTag] = "Float";


Float.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    "illegal type coercion"
    + "\n\nFloat must maintain its type"
    + `\n\nbut type coercion to ${capitalize(hint)} received`
    + "\n");
};


/***[Setoid]******************************************************************/


// auxiliary function
// Float -> Float -> Boolean
const eqFloat = f => g =>
  f.valueOf() === g.valueOf();


// equal
// Float -> Float -> Boolean
eqAdd("Float", eqFloat);


// not equal
// Float -> Float -> Boolean
neqAdd("Float", notp2(eqFloat));


/******************************************************************************
************************************[ Int ]************************************
******************************************************************************/


// integer constructor
// Number -> Int
class Int extends Number {
  constructor(n) {
    super(n);

    if (GUARDED) {
      if (typeof n !== "number") throw new ArgTypeError(
        "invalid argument type"
        + "\n\nInt expects an argument of type Number"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(n)} received`
        + "\n");

      else if (n % 1 !== 0) throw new ArgValueError(
        "invalid argument value"
        + "\n\nInt expects a natural Number"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${c} received`
        + "\n");
    }
  }
} {
  const Int_ = Int;

  Int = function(n) {
    return new Int_(n);
  };

  Int.prototype = Int_.prototype;
};


Int.prototype[Symbol.toStringTag] = "Int";


Int.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    "illegal type coercion"
    + "\n\nInt must maintain its type"
    + `\n\nbut type coercion to ${capitalize(hint)} received`
    + "\n");
};


/***[Bounded]*****************************************************************/


// minimal bound
// Int
minBoundAdd("Int", Int(Number.MIN_SAFE_INTEGER));


// maximal bound
// Int
maxBoundAdd("Int", Int(Number.MAX_SAFE_INTEGER));


/***[Setoid]******************************************************************/


// auxiliary function
// Int -> Int -> Boolean
const eqInt = i => j =>
  i.valueOf() === j.valueOf();


// equal
// Int -> Int -> Boolean
eqAdd("Int", eqInt);


// not equal
// Int -> Int -> Boolean
neqAdd("Int", notp2(eqInt));


/******************************************************************************
********************************[ Null (Unit) ]********************************
******************************************************************************/


/***[Bounded]*****************************************************************/


// minimal bound
// Null
minBoundAdd("Null", null);


// minimal bound
// Null
maxBoundAdd("Null", null);


/***[Setoid]******************************************************************/


// auxiliary function
// Null -> Null -> Boolean
const eqNull = _ => __ => true;


// equal
// Null -> Null -> Boolean
eqAdd("Null", eqNull);


// not equal
// Null -> Null -> Boolean
neqAdd("Null", notp2(eqNull));


/******************************************************************************
**********************************[ Record ]***********************************
******************************************************************************/


// record constructor
// Object -> Record
class Rec extends Object {
  constructor(o) {
    super(o);
    Object.assign(this, o);

    if (GUARDED) {
      if (typeof o !== "object" || o === null) throw new ArgTypeError(
        "invalid argument type"
        + "\n\nRec expects an argument of type Object"
        + `\n\non the 1st call`
        + `\n\nin the 1st argument`
        + `\n\nbut ${introspect(o)} received`
        + "\n");

      Object.freeze(this);
    }
  }
} {
  const Rec_ = Rec;

  Rec = function(o) {
    return new Rec_(o);
  };

  Rec.prototype = Rec_.prototype;
};


Rec.prototype[Symbol.toStringTag] = "Record";


Rec.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    "illegal type coercion"
    + "\n\nRec must maintain its type"
    + `\n\nbut type coercion to ${capitalize(hint)} received`
    + "\n");
};


// maximal record size
// Number
const MAX_REC_SIZE = 16;


/***[Setoid]******************************************************************/


// auxiliary function
// Record -> Record -> Boolean
const eqRec = r => s => {
  const ks = Object.keys(r),
    ls = Object.keys(s);

  if (ks.length !== ls.length)
    return false;

  else return ks.every(k => !(k in s)
    ? false
    : eq(r[k]) (s[k]));
};


// equal
// Record -> Record -> Boolean
eqAdd("Record", eqRec);


// not equal
// Record -> Record -> Boolean
neqAdd("Record", notp2(eqRec));


/******************************************************************************
***********************************[ Tuple ]***********************************
******************************************************************************/


// tuple constructor
// (...Array) -> Tuple
class Tup extends Array {
  constructor(...args) {
    if (args.length === 1) {
      if (typeof args[0] === "number") {
        super(1);
        this[0] = args[0];
      }

      else super(...args);
    } 

    else super(...args);

    if (GUARDED)
      Object.freeze(this);
  }
} {
  const Tup_ = Tup;

  Tup = function(...args) {
    return new Tup_(...args);
  };

  Tup.prototype = Tup_.prototype;
};


Tup.prototype.map = () => {
  throw new TypeError(
    "illegal operation"
    + "\n\nTup must not used as an Array"
    + `\n\nbut attempt to map over received`
    + "\n");
};


Tup.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    "illegal type coercion"
    + "\n\nTup must maintain its type"
    + `\n\nbut type coercion to ${capitalize(hint)} received`
    + "\n");
};


Tup.prototype[Symbol.toStringTag] = "Tuple";


// maximal tuple size
// Number
const MAX_TUP_SIZE = 8;


/***[Setoid]******************************************************************/


// auxiliary function
// Tupple -> Tuple -> Boolean
const eqTup = xs => ys =>
  xs.length !== ys.length
    ? false
    : xs.every((x, n) =>
      eq(x) (ys[n]))


// equal
// Tuple -> Tuple -> Boolean
eqAdd("Tuple", eqTup);


// not equal
// Tuple -> Tuple -> Boolean
neqAdd("Tuple", notp2(eqTup));


/******************************************************************************
*******************************************************************************
**********************************[ PROXIES ]**********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ Arr ]************************************
******************************************************************************/


// homogeneous array constructor
// Array -> Proxy
const Arr = xs => {
  if (GUARDED) {
    if (!Array.isArray(xs)) throw new ArgTypeError(
      "invalid argument type"
      + "\n\nArr expects an argument of type Array"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(xs)} received`
      + "\n");

    const t = introspect(xs);

    if (replaceNestings(t).search(/\?|,/) !== -1) throw new ArgTypeError(
      "invalid argument type"
      + "\n\nArr expects an homogeneous Array"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(xs)} received`
      + "\n");

    else return new Proxy(xs, handleArr(t));
  }
  
  else return xs;
};


// handle homogeneous array
// String -> Proxy
const handleArr = t => ({
  get: (xs, i, p) => {
    switch (i) {
      case Symbol.toPrimitive: return hint => {
        throw new TypeCoercionError(
          "illegal type coercion"
          + "\n\nArr must maintain its type"
          + `\n\nbut type coercion to ${capitalize(hint)} received`
          + "\n");
      };

      default: return xs[i];
    }
  },

  deleteProperty: (xs, i) => {
    if (String(Number(i)) === i) {
      if (Number(i) !== xs.length - 1) throw new TypeError(
        "illegal operation"
        + "\n\nArr must maintain a coherent index"
        + `\n\nbut delete operation would lead to an index gap`
        + `\n\nat the ${ordinal(i)} position`
        + "\n");
    }

    delete xs[i];
    return xs;
  },

  set: (xs, i, v) => setArr(xs, i, {value: v}, t, {mode: "set"}),

  defineProperty: (xs, i, d) => setArr(xs, i, d, t, {mode: "def"})
});


// set array
// ([a], Number, {value: a}, {mode: String} => [a]
const setArr = (xs, i, d, t, {mode}) => {
  if (String(Number(i)) === i) {
    if (Number(i) > xs.length) throw new TypeError(
      "illegal operation"
      + "\n\nArr must maintain a coherent index"
      + `\n\nbut add operationwould lead to an index gap`
      + `\n\nat the ${ordinal(i)} position`
      + "\n");

    else if (`[${introspect(d.value)}]` !== t) throw new TypeError(
      "illegal operation"
      + `\n\nArr of type ${introspect(xs)} must remain homogeneous`
      + `\n\nbut set operation would lead to a heterogeneous Arr`
      + `\n\nwith element of type ${introspect(d.value)}`
      + "\n");
  }

  if (mode === "set") xs[i] = d.value;
  else Reflect.defineProperty(xs, i, d);
  return xs;
};


/***[Setoid]******************************************************************/


// auxiliary function
// [a] -> [a] -> Boolean
const eqArr = xs => ys => {
  if (xs.length !== ys.length)
    return false;

  else if (xs.length === 0)
    return true;

  else {
    return xs.every((x, n) =>
      eq(x) (ys[n]));
  }
};


// equal
// Array -> Array -> Boolean
eqAdd("Array", eqArr);


// not equal
// Array -> Array -> Boolean
neqAdd("Array", notp2(eqArr));


/******************************************************************************
***********************************[ _Map ]************************************
******************************************************************************/


// homogeneous map constructor
// Map -> Proxy
const _Map = m => {
  if (GUARDED) {
    if (toTypeTag(m) !== "Map") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n_Map expects an argument of type Map"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(m)} received`
      + "\n");

    const t = introspect(m);

    if (t === "Map<?>") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n_Map expects an homogeneous Map"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${t} received`
      + "\n");

    else return new Proxy(m, handleMap(t));
  }
  
  else return m;
};


// handle homogeneous map
// String -> Proxy
const handleMap = t => ({
  get: (m, k, p) => {
    switch (k) {
      case Symbol.toPrimitive: return hint => {
        throw new TypeCoercionError(
          "illegal type coercion"
          + "\n\n_Map must maintain its type"
          + `\n\nbut type coercion to ${capitalize(hint)} received`
          + "\n");
      };

      case "set": return (k, v) => {
        if (`Map<${introspect(k)}, ${introspect(v)}>` !== t) throw new TypeError(
          "illegal operation"
          + `\n\n_Map of type ${introspect(m)} must remain homogeneous`
          + `\n\nbut set operation would lead to a heterogeneous _Map`
          + `\n\nwith pair of type ${introspect(k)}/${introspect(v)}`
          + "\n");

        else return m.set(k, v);
      }

      default: return typeof m[k] === "function"
        ? m[k].bind(m)
        : m[k];
    }
  },
});


/***[Setoid]******************************************************************/


// auxiliary function
// Map<k, v> -> Map<k, v> -> Boolean
const eqMap = m => n => {
  if (m.size !== n.size) return false;

  else {
    const kvs = Array.from(m),
      lws = Array.from(n);

    return kvs.every(([k, v], n) => {
      const [l, w] = lws[n];
      if (!eq(k) (l)) return false;
      else return eq(v) (w);
    });
  }
};


// equal
// Map<k, v> -> Map<k, v> -> Boolean
eqAdd("Map", eqMap);


// not equal
// Map<k, v> -> Map<k, v> -> Boolean
neqAdd("Map", notp2(eqMap));


/******************************************************************************
***********************************[ _Set ]************************************
******************************************************************************/


// homogeneous set constructor
// Set -> Proxy
const _Set = s => {
  if (GUARDED) {
    if (toTypeTag(s) !== "Set") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n_Set expects an argument of type Set"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(m)} received`
      + "\n");

    const t = introspect(s);

    if (t === "Set<?>") throw new ArgTypeError(
      "invalid argument type"
      + "\n\n_Set expects a homogeneous Set"
      + `\n\non the 1st call`
      + `\n\nin the 1st argument`
      + `\n\nbut ${introspect(m)} received`
      + "\n");

    else return new Proxy(s, handleSet(t));
  }
  
  else return s;
};


// handle homogeneous set
// String -> Proxy
const handleSet = t => ({
  get: (s, k, p) => {
    switch (k) {
      case Symbol.toPrimitive: return hint => {
        throw new TypeCoercionError(
          "illegal type coercion"
          + "\n\n_Set must maintain its type"
          + `\n\nbut type coercion to ${capitalize(hint)} received`
          + "\n");
      };

      case "set": return k => {
        if (`Set<${introspect(k)}>` !== t) throw new ArgTypeError(
          "illegal operation"
          + `\n\n_Set of type ${introspect(s)} must remain homogeneous`
          + `\n\nbut set operation would lead to a heterogeneous _Set`
          + `\n\nwith key of type ${introspect(k)}`
          + "\n");

        else return s.add(k);
      }

      default: return typeof s[k] === "function"
        ? s[k].bind(s)
        : s[k];
    }
  },
});


/***[Setoid]******************************************************************/


// auxiliary function
// Set<a> -> Set<a> -> Boolean
const eqSet = s => t => {
  if (s.size !== t.size) return false;

  else {
    const ks = Array.from(s),
      ls = Array.from(t);

    return ks.every((k, n) => {
      return eq(k) (ls[n]);
    });
  }
};


// equal
// Set<a> -> Set<a> -> Boolean
eqAdd("Set", eqSet);


// not equal
// Set<a> -> Set<a> -> Boolean
neqAdd("Set", notp2(eqSet));


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// data constructor
// ADTs with any number of constructors and fields
// untyped
const Type = (name, ...tags) => {
  const Type = tag => {
    const Type = Dcons => {
      const t = new Tcons();

      if (GUARDED) {
        if (typeof Dcons !== "function") 
          throw new ArgTypeError(
            "invalid argument type"
            + `\n\n${name} expects an argument of type Function`
            + "\n\non the 3rd call"
            + "\nin the 1st argument"
            + `\n\nbut ${introspect(Dcons)} received`
            + "\n");

        else if (Dcons.length !== 1) 
          throw new ArityError(
            "invalid function call arity"
            + `\n\n${name} expects an 1-ary Function`
            + "\n\non the 3rd call"
            + "\nin the 1st argument"
            + `\n\nbut ${Dcons.length}-ary Function received`
            + "\n");

        else t[SIG] = `${name}<λ>`;
      }
        
      t[`run${name}`] = guardSum(`run${name}`, Dcons, tags);
      t[TAG] = tag;
      return t;
    };

    if (GUARDED) {
      if (typeof tag !== "string") 
        throw new ArgTypeError(
          "invalid argument type"
          + "\n\nType expects an argument of type String"
          + "\n\non the 2nd call"
          + "\nin the 1st argument"
          + `\n\nbut ${introspect(tag)} received`
          + "\n");

      else if (!tags.includes(tag)) 
        throw new ArgValueError(
          "invalid argument value"
          + "\n\nType expects a known tag"
          + "\n\non the 2nd call"
          + "\nin the 1st argument"
          + `\n\nbut ${tag} received`
          + "\n");
    }

    return Type;
  };

  if (GUARDED) {
    [name, ...tags].forEach((arg, nthArg) => {
      if (typeof arg !== "string")
        throw new ArgTypeError(
          "invalid argument type"
          + "\n\nType expects an argument of type String"
          + "\n\non the 1st call"
          + `\nin the ${ntgArg + 1} argument`
          + `\n\nbut ${introspect(arg)} received`
          + "\n");

      else if (arg[0].toLowerCase() === arg[0])
        throw new ArgValueError(
          "invalid argument value"
          + "\n\nType expects a capitalized String"
          + "\n\non the 1st call"
          + `\nin the ${ntgArg + 1} argument`
          + `\n\nbut ${arg} received`
          + "\n");
    });
  }

  const Tcons =
    Function(`return function ${name}() {}`) ();

  Tcons.prototype[Symbol.toStringTag] = name;
  return Type;
};


// data constructor
// ADTs with single constructor and any number of fields
// untyped
const Data = name => {
  const Data = Dcons => {
    const Data = k => {
      const t = new Tcons();

      if (GUARDED) {
        if (typeof k !== "function")
          throw new ArgTypeError(
            "invalid argument type"
            + `\n\n${name} expects an argument of type Function`
            + "\n\non the 3rd call"
            + "\nin the 1st argument"
            + `\n\nbut ${introspect(k)} received`
            + "\n");

        t[SIG] = `${name}<λ>`;
      }
      
      t[`run${name}`] = $(`run${name}`, k);
      t[Symbol.toStringTag] = name;
      t[TAG] = name;
      return t;
    };

    if (GUARDED) {
      if (typeof Dcons !== "function") 
        throw new ArgTypeError(
          "invalid argument type"
          + `\n\n${name} expects an argument of type Function`
          + "\n\non the 2nd call"
          + "\nin the 1st argument"
          + `\n\nbut ${introspect(Dcons)} received`
          + "\n");

      else if (Dcons.length !== 1) 
        throw new ArityError(
          "invalid function call arity"
          + `\n\n${name} expects an 1-ary Function`
          + "\n\non the 2nd call"
          + "\nin the 1st argument"
          + `\n\nbut ${Dcons.length}-ary Function received`
          + "\n");
    }

    return $(name, Dcons(Data));
  };

  if (GUARDED) {
    if (typeof name !== "string")
      throw new ArgTypeError(
        "invalid argument type"
        + "\n\nData expects an argument of type String"
        + "\n\non the 1st call"
        + "\nin the 1st argument"
        + `\n\nbut ${introspect(name)} received`
        + "\n");

    else if (name[0].toLowerCase() === name[0])
      throw new ArgValueError(
        "invalid argument value"
        + "\n\nData expects a capitalized String"
        + "\n\non the 1st call"
        + "\nin the 1st argument"
        + `\n\nbut ${name} received`
        + "\n");
  }

  const Tcons =
    Function(`return function ${name}() {}`) ();

  return Data;
};


// property for pattern matching
// Symbol
const TAG = Symbol("TAG");


/******************************************************************************
*********************************[ Behavior ]**********************************
******************************************************************************/


// behavior
// ((a -> r) -> r, (e -> r) -> r) -> Behavior<a, e>
const Behavior = Data("Behavior")
  (Behavior => k => Behavior(k));


// run behavior
// (a -> r, e -> r) -> Behavior<a, e> -> r
const runBehavior = $(
  "runBehavior",
  f => tk => tk.runBehavior(f));


/***[Misc]********************************************************************/


// subscribe
// {target: Object, type: String, listener: Function, options: Object} -> Function
const subscribe = o => {
  o.target.addEventListener(
    o.type,
    o.listener,
    o.options
  );

  return () => o.target.removeEventListener(
    o.type,
    o.listener,
    o.options
  );
};


/******************************************************************************
********************************[ Comparator ]*********************************
******************************************************************************/


// comparator type constructor
// ({LT: r, EQ: r, GT: r} -> r) -> Comparator
const Comparator = Type("Comparator", "LT", "EQ", "GT");


// lower than data constructor
// Comparator
const LT = Comparator("LT")
  (cases => cases.LT);


// equal data constructor
// Comparator
const EQ = Comparator("EQ")
  (cases => cases.EQ);


// greater than data constructor
// Comparator
const GT = Comparator("GT")
  (cases => cases.GT);


/***[Bounded]*****************************************************************/


// minimal bound
// Comparator
minBoundAdd("Comparator", LT);


// maximal bound
// Comparator
maxBoundAdd("Comparator", GT);


/***[Setoid]******************************************************************/


// equal
// Comparator -> Comparator -> Boolean
eqAdd(
  "Comparator",
  t => u => t[TAG] === u[TAG]);


// not equal
// Comparator -> Comparator -> Boolean
neqAdd(
  "Comparator",
  t => u => t[TAG] !== u[TAG]);


/******************************************************************************
***********************************[ Cont ]************************************
******************************************************************************/


// delimited continuation
// ((a -> r) -> r) -> Cont<r, a>
const Cont = Data("Cont")
  (Cont => k => Cont(k));


/******************************************************************************
************************************[ Eff ]************************************
******************************************************************************/


// effect
// synchronous
// (() -> a) -> Eff<a>
const Eff = Data("Eff")
  (Eff => thunk => Eff(thunk));


// run effect
// unsafe
// Eff<a> -> () -> a
const runEff = $(
  "runEff",
  tx => tx.runEff());


/***[Functor]*****************************************************************/


// functorial composition
// (a -> b) -> Eff<a> -> Eff<b>
Eff.map = $(
  "map",
  f => tx =>
    Eff(() => f(tx.runEff())));


/***[Applicative]*************************************************************/


// applicative composition
// Eff<a -> b> -> Eff<a> -> Eff<b>
Eff.ap = $(
  "ap",
  tf => tx =>
    Eff(() => tf.runEff() (tx.runEff())));


/***[Chain]*******************************************************************/


// monadic composition
// Eff<a> -> (a -> Eff<b>) -> Eff<b>
Eff.chain = $(
  "chain",
  mx => fm =>
    Eff(() => fm(mx.runEff()).runEff()));


/******************************************************************************
***********************************[ Either ]**********************************
******************************************************************************/


// either
// ({Left: a -> r, Right: b -> r} -> r) -> Either<a, b>
const Either = Type("Either", "Left", "Right");


// left
// a -> Either<a, b>
const Left = $(
  "Left",
  x => Either("Left")
    (cases => cases.Left(x)));


// right
// b -> Either<a, b>
const Right = $(
  "Right",
  x => Either("Right")
    (cases => cases.Right(x)));


/***[Setoid]******************************************************************/


// auxiliary function
// Either<a, b> -> Either<a, b> -> Boolean
const eqEither = tx => ty =>
  tx[TAG] === ty[TAG]
    && tx.runEither({
      Left: x => ty.runEither({Left: y => eq(x) (y)}),
      Right: x => ty.runEither({Right: y => eq(x) (y)})});


// equal
// Either<a, b> -> Either<a, b> -> Boolean
eqAdd("Either", eqEither);


// not equal
// Either<a, b> -> Either<a, b> -> Boolean
neqAdd("Either", notp2(eqEither));


/******************************************************************************
***********************************[ Event ]***********************************
******************************************************************************/


// event stream
// TODO: type signature
const Event = Data("Event")
  (Event => k => Event(k));


/******************************************************************************
**********************************[ Except ]***********************************
******************************************************************************/


// exception
// ({Err: e -> r, Suc: a -> r} -> r) -> Except<e, a>
const Except = Type("Except", "Err", "Suc");


// error
// e -> Except<e, a>
const Err = $(
  "Err",
  e => Except("Err")
    (cases => cases.Err(e)));


// success
// a -> Except<e, a>
const Suc = $(
  "Suc",
  x => Except("Suc")
    (cases => cases.Suc(x)));


/******************************************************************************
************************************[ Id ]*************************************
******************************************************************************/


// identity
// a -> Id<a>
const Id = Data("Id")
  (Id => x => Id(k => k(x)));


/***[Setoid]******************************************************************/


// auxiliary function
// Id<a> -> Id<a> -> Boolean
const eqId = tx => ty =>
    tx.runId(x => ty.runId(y => eq(x) (y)));


// equal
// Id<a> -> Id<a> -> Boolean
eqAdd("Id", eqId);
  


// not equal
// Id<a> -> Id<a> -> Boolean
neqAdd("Id", notp2(eqId));


/******************************************************************************
***********************************[ Lazy ]************************************
******************************************************************************/


// lazy
const Lazy = Eff;


/******************************************************************************
***********************************[ List ]************************************
******************************************************************************/


// list
// ({Cons: a -> List<a> -> r, Nil: r} -> r) -> List<a>
const List = Type("List", "Cons", "Nil");


// construct
// a -> List<a> -> List<a>
const Cons = $(
  "Cons",
  x => tx => List("Cons")
    (cases => cases.Cons(x) (tx)));


// not in list
// List<a>
const Nil = List("Nil")
  (cases => cases.Nil);


/***[Setoid]******************************************************************/


/******************************************************************************
**********************************[ Memoize ]**********************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ Option ]**********************************
******************************************************************************/


// option
// ({Some: a -> r, None: r} -> r) -> Option<a>
const Option = Type("Option", "None", "Some");


// none
// Option<a>
const None = Option("None")
  (cases => cases.None);


// some
// a -> Option<a>
const Some = $(
  "Some",
  x => Option("Some")
    (cases => cases.Some(x)));


/***[Setoid]******************************************************************/


/******************************************************************************
**********************************[ Reader ]***********************************
******************************************************************************/


// reader
// (a -> b) -> Reader<a, b>
const Reader = Data("Reader")
  (Reader => f => Reader(f));


/***[Functor]*****************************************************************/


// functorial composition
// (a -> b) -> Reader<e, a> -> Reader<e, b>
Reader.map = $(
  "map",
  f => g => x =>
    f(g(x)));


// variadic map
// untyped
Reader.mapv = $(
  "mapv",
  f => Object.assign(g =>
    Reader.mapv(x =>
      f(g(x))),
      {runReader: f}));


/***[Applicative]*************************************************************/


// applicative compostion
// Reader<e, a -> b> -> Reader<e, a> -> Reader<e, b>
Reader.ap = $(
  "ap",
  f => g => x =>
    f(x) (g(x)));


// variadic applicative composition
// left-to-right
// untyped
Reader.apv = $(
  "...apv",
  f => Object.assign(g =>
    Reader.apv(x =>
      g(x) (f(x))), {runReader: f}));


/***[Monad]*******************************************************************/


// monadic composition
// Reader<e, a> -> (a -> Reader<e, b>) -> Reader<e, b>
Reader.chain = $(
  "chain",
  g => f => x => f(g(x)) (x)
);


// variadic monadic composition
// left-to-right
// untyped
Reader.chainv = $(
  "chainv",
  f => Object.assign(g =>
    Reader.chainv(x =>
      g(f(x)) (x)), {runReader: f}));


/******************************************************************************
************************************[ Ref ]************************************
******************************************************************************/

// reference
// Object -> Ref<Object>
const Ref = Data("Ref")
  (Ref => o => Ref(k => k(o)));


/***[Setoid]******************************************************************/


// auxiliary function
// Ref<Object> -> Ref<Object> -> Boolean
const eqRef = to => tp =>
  to.runRef(o =>
    tp.runRef(p => o === p));


// equal
// Ref<Object> -> Ref<Object> -> Boolean
eqAdd("Ref", eqRef);


// not equal
// Ref<Object> -> Ref<Object> -> Boolean
neqAdd("Ref", notp2(eqRef));


/******************************************************************************
***********************************[ State ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
**********************************[ Stream ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ Task ]************************************
******************************************************************************/


// task
// TODO: switch to node style
// ((a -> r) -> r, (e -> r) -> r) -> Task<a, e>
const Task = Data("Task")
  (Task => k => Task(k));


/***[Functor]*****************************************************************/


// functorial composition
// (a -> b) -> Task<a, e> -> Task<b, e>
Task.map = f => tk =>
  Task((k, e) =>
    tk.runTask(x =>
      k(f(x)), e));


/***[Applicative]*************************************************************/


// applicative composition
// Task<a -> b, e> -> Task<a, e> -> Task<b, e>
Task.ap = tf => tk =>
  Task((k, e) =>
    tf.runTask(f =>
      tk.runTask(x =>
        k(f(x)), e), e));


/***[Chain]*******************************************************************/


// monadic composition
// Task<a, e> -> (a -> Task<b, e>) -> Task<b, e>
Task.chain = mk => fm =>
  Task((k, e) =>
    mk.runTask(x =>
      fm(x).runTask(k, e), e));


/***[Monad]*******************************************************************/


// of
// a -> Task<a, e>
Task.of = x =>
  Task((k, e) => k(x));


/******************************************************************************
***********************************[ Tree ]************************************
******************************************************************************/


// multi-way tree
// a -> Forest<a> -> Tree<a>
const Tree = Data("Tree")
  (Tree => x => children => Tree(k => k(x) (children)));


// multi-way tree forest
// [Tree<a>] -> Forest<a>
const Forest = Data("Forest")
  (Forest => (...trees) => Forest(k => k(trees)));


/***[Setoid]******************************************************************/


/******************************************************************************
**********************************[ Unique ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ Valid ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
**********************************[ Writer ]***********************************
******************************************************************************/


// TODO


/******************************************************************************
*******************************************************************************
**********************************[ ALIASES ]**********************************
*******************************************************************************
******************************************************************************/


// function composition
// (b -> c) -> (a -> b) -> a -> c
const comp = Reader.map;


// append
// (a -> a) -> (a -> a) -> (a -> a)
appendAdd("Function", comp);


// flipped append
// (a -> a) -> (a -> a) -> (a -> a)
appendfAdd("Function", contra);


/******************************************************************************
*******************************************************************************
**********************************[ EXPORT ]***********************************
*******************************************************************************
******************************************************************************/


// reset history
history = [];


// initialize namespace
Object.assign($,
  {
    All,
    Any,
    append,
    appendAdd,
    appendfAdd,
    apply,
    Arr,
    Behavior,
    Char,
    co,
    co2,
    comp,
    comp2,
    compBoth,
    compn,
    cond,
    Cons,
    Cont,
    contra,
    cont,
    curry,
    curry3,
    Data,
    Eff,
    empty,
    emptyAdd,
    EQ,
    eq,
    eqAdd,
    Err,
    Event,
    fix,
    flip,
    Float,
    Forest,
    toTypeTag,
    GT,
    history,
    Id,
    id,
    infix,
    Int,
    introspect,
    join,
    Lazy,
    Left,
    loop,
    LT,
    _Map,
    maxBound,
    maxBoundAdd,
    minBound,
    minBoundAdd,
    neq,
    neqAdd,
    Nil,
    None,
    notp,
    notp2,
    omega,
    on,
    overload,
    partial,
    pipe,
    prop,
    Reader,
    Rec,
    recur,
    Ref,
    Right,
    rotl,
    rotr,
    runEff,
    _Set,
    SIG,
    Some,
    subscribe,
    Suc,
    swap,
    TAG,
    tap,
    Task,
    Tree,
    Tup,
    Type,
    uncurry,
    uncurry3
  }
);


module.exports = $;
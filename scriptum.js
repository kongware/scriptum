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


// guarded flag
// Boolean
const GUARDED = true;


// maximal record size
// Number
const MAX_REC_SIZE = 16;


// maximal tuple size
// Number
const MAX_TUP_SIZE = 8;


// symbol prefix
// String
const SYM_PREFIX = "github.com/kongware/scriptum";


/******************************************************************************
*******************************************************************************
*********************************[ DEBUGGING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ Virtualization ]*******************************
******************************************************************************/


// guard function
// default export
// untyped
const $ = (name, f) => {
  if (GUARDED) {
    if (name.search(/\.\.\./) === 0) {
      Reflect.defineProperty(f, "name", {value: name.slice(3)});
      return new Proxy(f, handleF(name.slice(3), f, [], {params: "var", nthCall: 0}));
    }

    else {
      Reflect.defineProperty(f, "name", {value: name});
      return new Proxy(f, handleF(name, f, [], {params: "fix", nthCall: 0}));
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
      if (params === "fix" && g.length !== args.length) throw new ArityError(
        `\n\n${name} expects ${g.length} argument(s)`
        + `\n\n${args.length} of type ${introspect(args).slice(1, -1)} received`
        + `\n\nin the ${nthCall + 1}. call of ${name}`
        + `\n\ninvalid function call arity`
        + "\n\nTYPE LOG:"
        + `\n\n${log}`
        + "\n");

      const argTypes = args.map((arg, nthArg) =>
        typeCheck(ArgTypeError)
          (t => illTyped => fromTo =>
            `\n\n${name} received an argument of type`
            + `\n\n${t}`
            + (fromTo.length === 0 ? "\n" : `\n${underline(fromTo)}`)
            + `\n\nin the ${nthCall + 1}. call of ${name}`
            + `\nin the ${nthArg + 1}. argument of ${name}`
            + `\n\ninvalid type`
            + "\n\nTYPE LOG:"
            + `\n\n${log}`
            + "\n") (arg))
              .join(", ");

      const r = f(...args);

      const retType = typeCheck(ReturnTypeError)
        (t => illTyped => fromTo =>
          `\n\n${name} returned a value of type`
          + `\n\n${t}`
          + (fromTo.length === 0 ? "\n" : `\n${underline(fromTo)}`)
          + `\n\ninvalid type`
          + "\n\nTYPE LOG:"
          + `\n\n${log}`
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


// get type constructor
// a -> String
const getTypeTag = x => {
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
};


// type check
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

      if ("sig" in x) return x.sig;

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
      .map(k => introspect(`${k}: ${r[k]}`)
      .join(", "));

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
  else return `Tuple<${t.map(t_ => introspect(t_).join(", "))}>`;
};


/******************************************************************************
******************************[ Guarding Errors ]******************************
******************************************************************************/


// argument type error
// String -> ArgTypeError
class ArgTypeError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArgTypeError);
  }
};


// arity error
// String -> ArityError
class ArityError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, ArityError);
  }
};


// return type error
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


// see Proxies --> Arr


/******************************************************************************
**********************************[ Boolean ]**********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// boolean namespace
// Object
const Boo = {};


/***[Bounded]*****************************************************************/


// minimal bound
// Boolean
Boo.minBound = false;
  

// maximal bound
// Boolean
Boo.maxBound = true;


/***[Eq]**********************************************************************/


// equal
// Boolean -> Boolean -> Boolean
Boo.eq = b => c => b === c;


// not equal
// Boolean -> Boolean -> Boolean
Boo.neq = b => c => b !== c;


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
const chainn = $(
  "chainN",
  g => Object.assign(f => chainn(x => f(g(x)) (x)), {run: g})
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
const compn = $(
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


// GUARDED function
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
const rotatel = $(
  "rotateL",
  f => y => z => x => f(x) (y) (z)
);


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
const rotater = $(
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
// not GUARDED
// untyped
const recur = (...args) =>
  ({type: recur, args});


/***[Namespace]***************************************************************/


// function namespace
// Object
const Fun = {};


/******************************************************************************
************************************[ Map ]************************************
******************************************************************************/


// see Proxies --> _Map


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// number namespace
// Object
const Num = {};


/***[Eq]**********************************************************************/


// equal
// Number -> Number -> Boolean
Num.eq = m => n => m === n;


// not equal
// Number -> Number -> Boolean
Num.neq = m => n => m !== n;


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


// not supported


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


// see Proxies --> _Set


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


// string namespace
// Object
const Str = {};


/***[Eq]**********************************************************************/


// equal
// String -> String -> Boolean
Str.eq = s => t => s === t;


// not equal
// String -> String -> Boolean
Str.neq = s => t => s !== t;


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPING ]*********************************
*******************************************************************************
******************************************************************************/


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
        "\n\nChar expects String literal"
        + `\nvalue of type ${introspect(c)} received`
        + "\n");

      else if ([...c].length !== 1) throw new ArgTypeError(
        "\n\nChar expects single character"
        + `\n"${c}" of length ${c.length} received`
        + "\n");
    }
  }
} {
  const Char_ = Char;

  Char = function(c) {
    return new Char_(c);
  };

  Char.prototype = Char_.prototype;
}


Char.prototype[Symbol.toStringTag] = "Char";


Char.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nChar is coerced to ${capitalize(hint)}`
    + "\nillegal implicit type conversion"
    + "\n");
};


/***[Bounded]*****************************************************************/


// minimal bound
// Char
Char.minBound = Char("\u{0}");


// maximal bound
// Char
Char.maxBound = Char("\u{10FFFF}");


/***[Eq]**********************************************************************/


// equal
// Char -> Char -> Boolean
Char.eq = c => d => c === d;


// not equal
// Char -> Char -> Boolean
Char.neq = c => d => c !== d;


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
        "\n\nFloat expects Number literal"
        + `\nvalue of type ${introspect(n)} received`
        + "\n");
    }
  }
} {
  const Float_ = Float;

  Float = function(n) {
    return new Float_(n);
  };

  Float.prototype = Float_.prototype;
}


Float.prototype[Symbol.toStringTag] = "Float";


Float.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nFloat is coerced to ${capitalize(hint)}`
    + "\nillegal implicit type conversion"
    + "\n");
};


/***[Eq]**********************************************************************/


// equal
// Float -> Float -> Boolean
Float.eq = f => g => f === g;


// not equal
// Float -> Float -> Boolean
Float.neq = f => g => f !== g;


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
        "\n\nInt expects Number literal"
        + `\nvalue of type ${introspect(n)} received`
        + "\n");

      else if (n % 1 !== 0) throw new ArgTypeError(
        "\n\nInt expects integer literal"
        + `\nvalue of type ${introspect(n)} received`
        + "\n");
    }
  }
} {
  const Int_ = Int;

  Int = function(n) {
    return new Int_(n);
  };

  Int.prototype = Int_.prototype;
}


Int.prototype[Symbol.toStringTag] = "Int";


Int.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nInt is coerced to ${capitalize(hint)}`
    + "\nillegal implicit type conversion"
    + "\n");
};


/***[Bounded]*****************************************************************/


// minimal bound
// Int
Int.minBound = Int(Number.MIN_SAFE_INTEGER);


// maximal bound
// Int
Int.maxBound = Int(Number.MAX_SAFE_INTEGER);


/******************************************************************************
**********************************[ Record ]***********************************
******************************************************************************/


// record constructor
// Object -> Record
class Rec extends Object {
  constructor(o) {
    super(o);

    if (GUARDED) {
      if (typeof o !== "object" || o === null) throw new ArgTypeError(
        "\n\nRec expects Object type"
        + `\nvalue of type ${introspect(o)} received`
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
}


Rec.prototype[Symbol.toStringTag] = "Record";


Rec.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nRec is coerced to ${capitalize(hint)}`
    + "\nillegal implicit type conversion"
    + "\n");
};


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
}


Tup.prototype[Symbol.toStringTag] = "Tuple";


Tup.prototype[Symbol.toPrimitive] = hint => {
  throw new TypeCoercionError(
    `\n\nTup is coerced to ${capitalize(hint)}`
    + "\nillegal implicit type conversion"
    + "\n");
};


/***[Bounded]*****************************************************************/


// minimal bound
// [a, b]
//Tup.minBound = ...;


// minimal bound
// [a, b]
//Tup.maxBound = ...;


/******************************************************************************
***********************************[ Unit ]************************************
******************************************************************************/


/***[Namespace]***************************************************************/


// string namespace
// Object
const Unit = {};


/***[Bounded]*****************************************************************/


// minimal bound
// Null
Unit.minBound = null;


// minimal bound
// Null
Unit.maxBound = null;


/***[Eq]**********************************************************************/


// equal
// Null -> Null -> Boolean
Unit.eq = _ => __ => true;


// not equal
// Null -> Null -> Boolean
Unit.neq = _ => __ => false;


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
      "\n\nArr expects Array type"
      + `\nvalue of type ${introspect(xs)} received`
      + "\n");

    const t = introspect(xs);

    if (replaceNestedTypes(t).search(/\?|,/) !== -1) throw new ArgTypeError(
      "\n\nArr expects homogeneous Array"
      + `\nvalue of type ${t} received`
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
          `\n\nArr is coerced to ${capitalize(hint)}`
          + "\nillegal implicit type conversion"
          + "\n");
      };

      default: return xs[i];
    }
  },

  deleteProperty: (xs, i) => {
    if (String(Number(i)) === i) {
      if (Number(i) !== xs.length - 1) throw new ArgTypeError(
        "\n\nillegal element deletion of"
        + `\n\n${t}`
        + `\n\nat index #${i}`
        + `\nArr must not contain index gaps`
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
    if (Number(i) > xs.length) throw new ArgTypeError(
      "\n\nillegal element setting of"
      + `\n\n${t}`
      + `\n\nat index #${i}`
      + `\nArr must not contain index gaps`
      + "\n");

    else if (`[${introspect(d.value)}]` !== t) throw new ArgTypeError(
      "\n\nillegal element setting of"
      + `\n\n${t}`
      + `\n${underline([1, t.length - 1])}`
      + `\n\n${introspect(d.value)} at index #${i} received`
      + "\nArr must be homogeneous"
      + "\n");
  }

  if (mode === "set") xs[i] = d.value;
  else Reflect.defineProperty(xs, i, d);
  return xs;
};


/***[Eq]**********************************************************************/


// equal
// Array -> Array -> Boolean
//Arr.eq = xs => ys => ...;


// not equal
// Null -> Null -> Boolean
//Arr.neq = xs => ys => ...;


/******************************************************************************
***********************************[ _Map ]************************************
******************************************************************************/


// homogeneous map constructor
// Map -> Proxy
const _Map = m => {
  if (GUARDED) {
    if (getTypeTag(m) !== "Map") throw new ArgTypeError(
      "\n\n_Map expects Map type"
      + `\nvalue of type ${introspect(m)} received`
      + "\n");

    const t = introspect(m);

    if (t === "Map<?>") throw new ArgTypeError(
      "\n\n_Map expects homogeneous Map"
      + `\nvalue of type ${t} received`
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
          `\n\n_Map is coerced to ${capitalize(hint)}`
          + "\nillegal implicit type conversion"
          + "\n");
      };

      case "set": return (k, v) => {
        if (`Map<${introspect(k)}, ${introspect(v)}>` !== t) throw new ArgTypeError(
          "\n\nillegal element setting of"
          + `\n\n${t}`
          + `\n${underline([4, t.length - 1])}`
          + `\n\n${introspect(v)} at key ${k} received`
          + "\nMap must be homogeneous"
          + "\n");

        else return m.set(k, v);
      }

      default: return k => m.get(k);
    }
  },
});


/******************************************************************************
***********************************[ _Set ]************************************
******************************************************************************/


// homogeneous set constructor
// Set -> Proxy
const _Set = s => {
  if (GUARDED) {
    if (getTypeTag(s) !== "Set") throw new ArgTypeError(
      "\n\n_Set expects Set type"
      + `\nvalue of type ${introspect(s)} received`
      + "\n");

    const t = introspect(s);

    if (t === "Set<?>") throw new ArgTypeError(
      "\n\n_Set expects homogeneous Set"
      + `\nvalue of type ${t} received`
      + "\n");

    else return new Proxy(s, handleSet(t));
  }
  
  else return s;
};


// handle homogeneous set
// String -> Proxy
const handleSet = t => ({
  get: (s, k, p) => {
    switch (i) {
      case Symbol.toPrimitive: return hint => {
        throw new TypeCoercionError(
          `\n\n_Set is coerced to ${capitalize(hint)}`
          + "\nillegal implicit type conversion"
          + "\n");
      };

      case "set": return k => {
        if (`Set<${introspect(k)}>` !== t) throw new ArgTypeError(
          "\n\nillegal element setting of"
          + `\n\n${t}`
          + `\n${underline([1, t.length - 1])}`
          + `\n\n${introspect(k)} received`
          + "\nSet must be homogeneous"
          + "\n");

        else return s.add(k);
      }

      default: return k => s[k];
    }
  },
});


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// adt with several data constructors
// untyped
const Type = $(
  "Type",
  Tcons => {
    const Type = (tag, ...args) => Dcons => {
      const t = new Tcons();
      
      t[`run${Tcons.name}`] = $(`run${Tcons.name}`, cases => Dcons(cases));
      t.tag = tag;

      if (GUARDED)
        t.sig = `${Tcons.name}<${introspect(args).slice(1, -1)}>`;
        
      return t;
    };

    Tcons.prototype[Symbol.toStringTag] = Tcons.name;
    return Type;
  }
);


// adt with single data constructor
// untyped
const Data = $(
  "Data",
  Tcons => {
    const Data = Dcons => {
      const Data = x => {
        const t = new Tcons();
        t[`run${Tcons.name}`] = x;
        t.tag = Tcons.name

        if (GUARDED)
          t.sig = `${Tcons.name}<${introspect(x)}>`;
        
        return t;
      };

      // return $(Tcons.name, Dcons(Data)); ???
      return Dcons(Data);
    };

    Tcons.prototype[Symbol.toStringTag] = Tcons.name;
    return Data;
  }
);


/******************************************************************************
********************************[ Comparator ]*********************************
******************************************************************************/


// comparator type constructor
// Function -> Function
const Comparator = Type(function Comparator() {});


// lower than data constructor
// Comparator
const LT = Comparator("LT") (cases => cases.LT);


// equal data constructor
// Comparator
const EQ = Comparator("EQ") (cases => cases.EQ);


// greater than data constructor
// Comparator
const GT = Comparator("GT") (cases => cases.GT);


/***[Bounded]*****************************************************************/


// minimal bound
// Comparator
Comparator.minBound = LT;


// maximal bound
// Comparator
Comparator.maxBound = GT;


/******************************************************************************
************************************[ Eff ]************************************
******************************************************************************/


// synchronous effect type
// Function -> a -> Eff a
const Eff = Data(function Eff() {}) (Eff => thunk => Eff(thunk));


// run effect
// (a -> b) -> Eff (() -> a) -> b
const runEff = $(
  "runEff",
  f => tf => f(tf.runEff())
);


/***[Functor]*****************************************************************/


// map
// (a -> b) -> Eff (() -> a) -> Eff (() -> b)
Eff.map = $(
  "map",
  f => tx =>
    Eff(() => f(tx.runEff()))
);


/***[Applicative]*************************************************************/


// apply
// Eff (() -> (a -> b)) -> Eff (() -> a) -> Eff (() -> b)
Eff.ap = $(
  "ap",
  tf => tx =>
    Eff(() => tf.runEff() (tx.runEff()))
);


/***[Chain]*******************************************************************/


// chain
// Eff (() -> a) -> (a -> Eff (() -> b)) -> Eff (() -> b)
Eff.chain = $(
  "chain",
  mx => fm =>
    Eff(() => fm(mx.runEff()).runEff())
);


/******************************************************************************
***********************************[ List ]************************************
******************************************************************************/


// TODO


/******************************************************************************
*********************************[ Rose Tree ]*********************************
******************************************************************************/


// TODO


/******************************************************************************
*******************************************************************************
********************************[ TYPECLASSES ]********************************
*******************************************************************************
******************************************************************************/


// type classes
// Map
const typeClasses = new Map([
  ["Bounded", ["minBound", "maxBound"]]
]);


// instances
// Map
const instances = new Map([
  ["Bounded Boolean", {minBound: Boo.minBound, maxBound: Boo.maxBound}],
  ["Bounded Char", {minBound: Char.minBound, maxBound: Char.maxBound}],
  ["Bounded Comparator", {minBound: Comparator.minBound, maxBound: Comparator.maxBound}],
  ["Bounded Int", {minBound: Int.minBound, maxBound: Int.maxBound}]
]);


// type dictionary
// String -> String -> Function
const typeDict = $(
  "typeDict",
  _class => {
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
  }
);


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


// replace nested types
// String -> String
const replaceNestedTypes = $(
  "replaceNestedTypes",
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
// internal
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


// type coercion error
// String -> TypeCoercionError
class TypeCoercionError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, TypeCoercionError);
  }
};


// underline
// [Number] -> String
const underline = $(
  "underline",
  ([n, m]) =>
    Array(n + 1).join(" ") + Array(m - n + 1).join("^")
);


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
    Arr,
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
    Eff,
    EQ,
    fix,
    flip,
    Float,
    getTypeTag,
    guard,
    GT,
    id,
    infix,
    Int,
    introspect,
    join,
    loop,
    LT,
    _Map,
    omega,
    on,
    Rec,
    recur,
    rotateL,
    rotateR,
    runEff,
    _Set,
    tap,
    Tup,
    Type,
    typeDict,
    uncurry,
    uncurry3
  }
);


export default $;
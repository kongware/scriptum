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
    Reflect.defineProperty(f, "name", {value: name});
    return new Proxy(f, handleF(name, f, [], {nthCall: 0}))
  }

  else return f;
};


// handle guarded function
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

  m.forEach((v, k) => {
    v = introspect(v);
    s.add(`${k}, ${v}`);
  });

  if (m.size === 1) return `Map<${Array.from(s) [0]}>`;
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

  s.forEach(k => {
    k = introspect(k);
    s_.add(k);
  });

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


/***[Namespace]***************************************************************/


// see Proxies --> _Map


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// number namespace
// Object
const Num = {};


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


/***[Namespace]***************************************************************/


// object namespace
// Object
const Obj = {};


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


/***[Namespace]***************************************************************/


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


/******************************************************************************
*******************************************************************************
**********************************[ PROXIES ]**********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ Arr ]************************************
******************************************************************************/


// homogeneous array contrcutor
// Array -> Array
const Arr = xs => {
  if (GUARDED) {
    if (!Array.isArray(xs)) throw new ArgTypeError(
      "\n\nArr expects Array type"
      + `\nvalue of type ${introspect(xs)} received`
      + "\n");

    const t = introspect(xs);

    if (replaceNestedTypes(t).search(/\?|,/) !== -1) throw new ArgTypeError(
      "\n\nArr expects homogeneous Array"
      + `\nvalue of type ${introspect(xs)} received`
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

    else if (t !== `[${introspect(d.value)}]`) throw new ArgTypeError(
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


/******************************************************************************
***********************************[ _Map ]************************************
******************************************************************************/


// TODO


/******************************************************************************
***********************************[ _Set ]************************************
******************************************************************************/


// TODO


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
    const Type = (tag, Dcons) => {
      const t = new Tcons();
      t[`run${Tcons.name}`] = cases => Dcons(cases);
      t.tag = tag;
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

      return Dcons(Data);
    };

    Tcons.prototype[Symbol.toStringTag] = Tcons.name;
    return Data;
  }
);


/******************************************************************************
************************************[ Aff ]************************************
******************************************************************************/


// TODO


/******************************************************************************
********************************[ Comparator ]*********************************
******************************************************************************/


// comparator type constructor
// Function -> Function
const Comparator = Type(function Comparator() {});


// lower than data constructor
// Comparator
const LT = Comparator("LT", cases => cases.LT);


// equal data constructor
// Comparator
const EQ = Comparator("EQ", cases => cases.EQ);


// greater than data constructor
// Comparator
const GT = Comparator("GT", cases => cases.GT);


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
// Eff (() -> a) -> (a -> b) -> b
const runEff = tf => f => tf.runEff(f);


/***[Functor]*****************************************************************/


// map
// (a -> b) -> Eff (() -> a) -> Eff (() -> b)
Eff.map = f => tx => Eff(() => tx.runEff(g => f(g())));


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


// type coercion error
// String -> TypeCoercionError
class TypeCoercionError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, TypeCoercionError);
  }
};


// replace nested types
// String -> String
const replaceNestedTypes = s => {
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
};


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
    omega,
    on,
    Rec,
    recur,
    rotateL,
    rotateR,
    tap,
    Tup,
    Type,
    typeDict,
    uncurry,
    uncurry3
  }
);


export default $;
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


//const all = 


// conjunction
// untyped
const and = x => y => x && y;


//const any =


// indeterministic conjunctions
// TODO: loop/recur, traversable
// untyped
const ands = xs => {
  const aux = n => xs[n] && (xs.length - 1 === n ? xs[n] : aux(n + 1));
  return aux(0);
};


// logical biconditional
// a -> a -> Boolean
const bicond = x => y => !!(x && y) || !(x || y);


// logical implication
// a -> a -> Boolean
const implies = x => y => !x || !!y;


// logical negation
// a -> Boolean
const not = x => !x;


// logical negated predicate
// (a -> Boolean) -> a -> Boolean
const notp = p => x => !p(x);


// disjunction
// untyped
const or = x => y => x || y;


// indeterministic disjunctions
// TODO: loop/recur, traversable
// untyped
const ors = xs => {
  const aux = n => xs[n] || (xs.length - 1 === n ? xs[n] : aux(n + 1));
  return aux(0);
};


// logical exclusive disjunction
// a -> a -> Boolean
const xor = x => y => !!(x || y) && !(x && y);


// xor with default value
// untyped
const xor_ = z => x => y => !x === !y ? z : x ? x : y;


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


// applicative
// (a -> b -> c) -> (a -> b) -> a -> c
const ap = f => g => x => f(x) (g(x));


// applicator
// (a -> b) -> a -> b
const app = f => x => f(x);


// monadic chain
// (a -> b) -> (b -> a -> c) -> a -> c
const chain = g => f => x => f(g(x)) (x);


// reversed monadic chain
// (b -> a -> c) -> (a -> b) -> a -> c
const chainR = f => g => x => f(g(x)) (x);


// variadic monadic chain
// untyped
const chainN = g => Object.assign(f => chainN(x => f(g(x)) (x)), {run: g});


// constant
// a -> b -> a
const co = x => y => x;


// constant in 2nd argument
// a -> b -> a
const co2 = x => y => x;


// function composition
// (b -> c) -> (a -> b) -> a -> c
const comp = f => g => x => f(g(x));


// function composition of inner binary function
// (c -> d) -> (a -> b -> c) -> a -> -> b -> d
const comp2 = f => g => x => y => f(g(x) (y));


// variadic function composition
// untyped
const compN = f => Object.assign(g => $(x => f(g(x))), {run: f});


// composition in both arguments
// (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
const compBoth = f => g => h => x => f(g(x)) (h(x));


// function compostion in the second argument
// (a -> c -> d) -> a -> (b -> c) -> b -> d
const compSnd = f => x => g => y => f(x) (g(y));


// first class conditional operator
// a -> a -> Boolean -> a
const cond = x => y => b => b ? x : y;


// contramap
// (a -> b) -> (b -> c) -> a -> c
const contra = f => g => x => g(f(x));


// continuation
// a -> (a -> b) -> b
const cont = x => f => f(x);


// curry
// ((a, b) -> c) -> a -> b -> c
const curry = f => x => y => f(x, y);


// curry3
// ((a, b, c) -> d) -> a -> b -> c -> d
const curry3 = f => x => y => z => f(x, y, z);


// fix combinator
// ((a -> b) a -> b) -> a -> b
const fix = f => x => f(fix(f)) (x);


// flip arguments
// (a -> b -> c) -> b -> a -> c
const flip = f => y => x => f(x) (y);


// guarded function
// (a -> b) -> (a -> Boolean) -> b -> a -> b
const guard = f => p => x => y => p(y) ? f(y) : x;


// identity function
// a -> a
const id = x => x;


// infix applicator
// a -> (a -> b -> c) -> b -> c
const infix = x => f => y => f(x) (y);


// monadic join
// (r -> r -> a) -> r -> a
const join = f => x => f(x) (x);


// omega combinator
// untyped
const omega = f => f(f);


// on
// (b -> b -> c) -> (a -> b) -> a -> a -> c
const on = f => g => x => y => f(g(x)) (g(y));


// rotate left
// a -> b -> c -> d) -> b -> c -> a -> d
const rotatel = f => y => z => x => f(x) (y) (z);


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
const rotater = f => z => x => y => f(x) (y) (z);


// uncurry
// (a -> b -> c) -> (a, b) -> c
const uncurry = f => (x, y) => f(x) (y);


// tap
// (a -> b) -> a -> b)
const tap = f => x => (f(x), x);


// uncurry
// (a -> b -> c -> d) -> (a, b, c) -> d
const uncurry3 = f => (x, y, z) => f(x) (y) (z);


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
const capitalize = s => s[0].toUpperCase() + s.slice(1);


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// ADT with several data constructors
// untyped
const Type = Tcons => (tag, Dcons) => {
  const t = new Tcons();
  t[`run${Dcons.constructor.name}`] = cases => Dcons(cases);
  t.tag = tag
  return t;
};


// ADT with single data constructor
// untyped
const Data = Tcons => Dcons => {
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
const Cont = Data(function Cont() {}) (Cont => k => Cont(k));


// run continuation
// Cont r a -> (a -> r) -> r
const runCont = tk => k => tk.runCont(k);


/***[Chain]*******************************************************************/


// chain
// ((a -> r) -> r) -> (a -> ((b -> r) -> r)) -> ((b -> r) -> r)
//const chain = tk => ft => Cont(k => tk.runCont(x => ft(x).runCont(k)));


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ Char ]************************************
******************************************************************************/


class Char extends String {
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


const typeDict = _class => {
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
const nand = comp2(not) (and);


// logical negated indeterministic conjunctions
// [a] -> Boolean
const nands = comp(not) (ands);


// logical negated disjunction
// a -> a -> Boolean
const nor = comp2(not) (or);


// logical negated indeterministic disjunctions
// a -> a -> Boolean
const nors = comp(not) (ors);


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


/******************************************************************************
*******************************************************************************
**********************************[ EXPORT ]***********************************
*******************************************************************************
******************************************************************************/


$.id = id;


export default $;
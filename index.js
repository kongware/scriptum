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
*******************************[ INTROSPECTION ]*******************************
*******************************************************************************
******************************************************************************/


// to type tag
// a -> String
const toTypeTag = x => {
  const tag = Object.prototype.toString.call(x);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
};


/******************************************************************************
*******************************************************************************
********************************[ OVERLOADING ]********************************
*******************************************************************************
******************************************************************************/


// overload unary function
// dispatch on the first argument
// untyped
const overload = (name, dispatch) => {
  const pairs = new Map();

  return {
    [`${name}Add`]: (k, v) => pairs.set(k, v),

    [`${name}Lookup`]: k => pairs.get(k),

    [name]: x => {
      const r = pairs.get(dispatch(x));

      if (r === undefined)
        throw new OverloadError(
          "invalid overloaded function call"
          + `\n\n${name} cannot dispatch on ${dispatch(x)}`
          + "\n\non the 1st call"
          + "\nin the 1st argument"
          + `\n\nfor the given value of type ${toTypeTag(x)}`
          + "\n");

      else if (typeof r === "function")
        return r(x);

      else return r;
    }
  }
};


// overload binary function
// dispatch both on the first and second argument
// untyped
const overload2 = (name, dispatch) => {
  const pairs = new Map();

  return {
    [`${name}Add`]: (k, v) => pairs.set(k, v),

    [`${name}Lookup`]: k => pairs.get(k),

    [name]: x => y => {
      if (typeof x === "function" && (VALUE in x))
        x = x(y);

      else if (typeof y === "function" && (VALUE in y))
        y = y(x);

      const r = pairs.get(dispatch(x, y));

      if (r === undefined)
        throw new OverloadError(
          "invalid overloaded function call"
          + `\n\n${name} cannot dispatch on ${dispatch(x)}/${dispatch(y)}`
          + "\n\non the 1st/2nd call"
          + "\nin the 1st argument"
          + `\n\nfor the given values of type ${toTypeTag(x)}/${toTypeTag(y)}`
          + "\n");

      else if (typeof r === "function")
        return r(x) (y);

      else return r;
    }
  }
};


/***[Dispatcher]**************************************************************/


// default dispatcher
// untyped
const dispatcher = (...args) => args.map(arg => {
  const tag = Object.prototype.toString.call(arg);
  return tag.slice(tag.lastIndexOf(" ") + 1, -1);
}).join("/");


/***[Errors]******************************************************************/


// type class error
// String -> OverloadError
class OverloadError extends Error {
  constructor(s) {
    super(s);
    Error.captureStackTrace(this, OverloadError);
  }
}


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


// not predicate
// (a -> Boolean) -> a -> Boolean
const notp = p => x => !p(x);


// binary not predicate
// (a -> Boolean) -> a -> Boolean
const notp2 = p => x => y => !p(x) (y);


/******************************************************************************
*********************************[ Function ]**********************************
******************************************************************************/


// infix applicator
// (a, (a -> b -> c), b) -> c
const $ = (x, f, y) => f(x) (y);


// applicator
// (a -> b) -> a -> b
const apply = f => x => f(x);


// constant
// a -> b -> a
const co = x => y => x;


// constant in 2nd argument
// a -> b -> b
const co2 = x => y => y;


// function composition
// (b -> c) -> (a -> b) -> a -> c
const comp = f => g => x => f(g(x));


// binary function composition
// (c -> d) -> (a -> b -> c) -> a -> -> b -> d
const comp2 = f => g => x => y => f(g(x) (y));


// composition in both arguments
// (b -> c -> d) -> (a -> b) -> (a -> c) -> a -> d
const compBoth = f => g => h => x => f(g(x)) (h(x));


// function composition
// right-to-left
// untyped
const compn = (f, ...fs) => x =>
  fs.length === 0
    ? f(x)
    : f(compn(...fs) (x));


// first class conditional operator
// a -> a -> Boolean -> a
const cond = x => y => b => b ? x : y;


// contramap
// (a -> b) -> (b -> c) -> a -> c
const contra = g => f => x => f(g(x));


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
// ((a -> b) -> a -> b) -> a -> b
const fix = f => x => f(fix(f)) (x);


// flip arguments
// (a -> b -> c) -> b -> a -> c
const flip = f => y => x => f(x) (y);


// identity function
// a -> a
const id = x => x;


// monadic join
// (r -> r -> a) -> r -> a
const join = f => x => f(x) (x);


// omega combinator
// untyped
const omega = f => f(f);


// on
// (b -> b -> c) -> (a -> b) -> a -> a -> c
const on = f => g => x => y => f(g(x)) (g(y));


// parial
// untyped
const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


// function composition
// left-to-right
// untyped
const pipe = (f, ...fs) => x =>
  fs.length === 0
    ? f(x)
    : pipe(...fs) (f(x));


// rotate left
// a -> b -> c -> d) -> b -> c -> a -> d
const rotl = f => y => z => x => f(x) (y) (z);


// rotate right
// (a -> b -> c -> d) -> c -> a -> b -> d
const rotr = f => z => x => y => f(x) (y) (z);


// swap
// ((a, b) -> c) -> (b, a) -> c
const swap = f => (x, y) => f(y, x);


// tap
// (a -> b) -> a -> b)
const tap = f => x => (f(x), x);


// uncurry
// (a -> b -> c) -> (a, b) -> c
const uncurry = f => (x, y) => f(x) (y);


// ternary uncurry
// (a -> b -> c -> d) -> (a, b, c) -> d
const uncurry3 = f => (x, y, z) => f(x) (y) (z);


/***[Tail Recursion]**********************************************************/


// loop
// trampoline
// untyped
const loop = f => {
  let acc = f();

  while (acc && acc.type === recur)
    acc = f(...acc.args);

  return acc;
};


// recursive call
// untyped
const recur = (...args) =>
  ({type: recur, args});


/******************************************************************************
*********************************[ Generator ]*********************************
******************************************************************************/


// keys
// Object -> Generator
function* keys(o) {
  for (let prop in o) {
    yield prop;
  }
}


// values
// Object -> Generator
function* values(o) {
  for (let prop in o) {
    yield o[prop];
  }
}


// entries
// Object -> Generator
function* entries(o) {
  for (let prop in o) {
    yield [prop, o[prop]];
  }
}


/******************************************************************************
*********************************[ Iterator ]**********************************
******************************************************************************/


const exhaust = f => ix => {
  for (let x of ix) {
    f(x)
  }
}

/******************************************************************************
************************************[ Map ]************************************
******************************************************************************/


// TODO: add monoid instance for Ord<k, v> => Map<k, v>


/******************************************************************************
********************************[ Null (Unit) ]********************************
******************************************************************************/


/******************************************************************************
**********************************[ Number ]***********************************
******************************************************************************/


// add
// Number -> Number -> Number
const add = m => n => m + n;


// decrease
// Number -> Number
const dec = n => n - 1;


// divide
// Number -> Number -> Number
const div = m => n => m / n;


// divide flipped
// Number -> Number -> Number
const divf = n => m => m / n;


// exponentiate
// Number -> Number -> Number
const exp = m => n => m ** n;


// exponentiate flipped
// Number -> Number -> Number
const expf = n => m => m ** n;


// increase
// Number -> Number
const inc = n => n + 1;


// multiply
// Number -> Number -> Number
const mul = m => n => m * n;


// negate
// Number -> Number
const neg = n => -n;


// remainder
// Number -> Number -> Number
const rem = m => n => m % n;


// remainder
// Number -> Number -> Number
const remf = n => m => m % n;


// sub
// Number -> Number -> Number
const sub = m => n => m - n;


// sub flipped
// Number -> Number -> Number
const subf = n => m => m - n;


/******************************************************************************
**********************************[ Object ]***********************************
******************************************************************************/


// destructive delete
// String -> Object -> Object
const destructiveDel = k => o => (delete o[k], o);


// destructive set
// (String, a) -> Object -> Object
const destructiveSet = (k, v) => o => (o[k] = v, o);


// object factory
// untyped
const Factory = (name, ...fields) => {
  const Cons =
    Function(`return function ${name}() {}`) ();

  Cons.prototype[Symbol.toStringTag] = name;

  const rec = (o, n) => {
    if (n === fields.length)
      return Object.assign(new Cons(), o);

    else return x => {
      o[fields[n]] = x;
      return rec(o, n + 1);
    };
  };

  return rec({}, 0);
};


// property getter
// String -> Object -> a
const prop = k => o => o[k];


/******************************************************************************
************************************[ Set ]************************************
******************************************************************************/


// TODO: add monoid instance for Ord<k> => Set<k>


/******************************************************************************
**********************************[ String ]***********************************
******************************************************************************/


// capitalize
// String -> String
const capitalize = s => s[0].toUpperCase() + s.slice(1);


/******************************************************************************
*******************************************************************************
*********************************[ SUBTYPING ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
**********************************[ Record ]***********************************
******************************************************************************/


// record constructor
// Object -> Record
class Rec extends Object {
  constructor(o) {
    super(o);
    Object.assign(this, o);
  }
} {
  const Rec_ = Rec;

  Rec = function(o) {
    return new Rec_(o);
  };

  Rec.prototype = Rec_.prototype;

  Rec_.prototype[Symbol.toStringTag] = "Record";
}


/******************************************************************************
***********************************[ Tuple ]***********************************
******************************************************************************/


// tuple constructor
// (...[?]) -> Tuple
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
  }
} {
  const Tup_ = Tup;

  Tup = function(...args) {
    return new Tup_(...args);
  };

  Tup.prototype = Tup_.prototype;

  Tup_.prototype[Symbol.toStringTag] = "Tuple";
}


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


// data constructor
// ADTs with any number of constructors and fields
// untyped
const Type = name => {
  const Type = tag => Dcons => {
    const t = new Tcons();

    Object.defineProperty(
      t,
      `run${name}`,
      {value: Dcons});

    t[TAG] = tag;
    return t;
  };

  const Tcons =
    Function(`return function ${name}() {}`) ();

  Tcons.prototype[Symbol.toStringTag] = name;
  return Type;
};


// data constructor
// ADTs with single constructor and any number of fields
// untyped
const Data = name => Dcons => {
  const Data = x => {
    const t = new Tcons();

    Object.defineProperty(
      t,
      typeof x === "function" ? `run${name}` : `get${name}`,
      {value: x});

    t[Symbol.toStringTag] = name;
    t[TAG] = name;
    return t;
  };

  const Tcons =
    Function(`return function ${name}() {}`) ();

  return Dcons(Data);
};


// property for pattern matching
// Symbol
const TAG = Symbol("TAG");


/******************************************************************************
************************************[ All ]************************************
******************************************************************************/


// all
// Boolean -> All
const All = Data("All") (All => b => All(b));


/******************************************************************************
************************************[ Any ]************************************
******************************************************************************/


// any
// Boolean -> Any
const Any = Data("Any") (Any => b => Any(b));


/******************************************************************************
*********************************[ Behavior ]**********************************
******************************************************************************/


// behavior
// ((a -> r) -> r, (e -> r) -> r) -> Behavior<a, e>
const Behavior = Data("Behavior")
  (Behavior => k => Behavior(k));


/***[Subscription]************************************************************/


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
***********************************[ Char ]************************************
******************************************************************************/


// character
// String -> Char
const Char = Data("Char") (Char => s => Char(s[0]));


/******************************************************************************
********************************[ Comparator ]*********************************
******************************************************************************/


// comparator type constructor
// ({LT: r, EQ: r, GT: r} -> r) -> Comparator
const Comparator = Type("Comparator");


// lower than data constructor
// Comparator
const LT = Comparator("LT") (cases => cases.LT);


// equal data constructor
// Comparator
const EQ = Comparator("EQ") (cases => cases.EQ);


// greater than data constructor
// Comparator
const GT = Comparator("GT") (cases => cases.GT);


/******************************************************************************
***********************************[ Cont ]************************************
******************************************************************************/


// delimited continuation
// ((a -> r) -> r) -> Cont<r, a>
const Cont = Data("Cont") (Cont => k => Cont(k));


/******************************************************************************
************************************[ Eff ]************************************
******************************************************************************/


// effect
// synchronous
// (() -> a) -> Eff<a>
const Eff = Data("Eff") (Eff => thunk => Eff(thunk));


/******************************************************************************
***********************************[ Either ]**********************************
******************************************************************************/


// either
// ({Left: a -> r, Right: b -> r} -> r) -> Either<a, b>
const Either = Type("Either");


// left
// a -> Either<a, b>
const Left = x => Either("Left") (cases => cases.Left(x));


// right
// b -> Either<a, b>
const Right = x => Either("Right") (cases => cases.Right(x));


/******************************************************************************
***********************************[ Endo ]************************************
******************************************************************************/


// endomorphism
// (a -> a) -> Endo<a>
const Endo = Data("Endo") (Endo => f => Endo(f));


/******************************************************************************
***********************************[ Event ]***********************************
******************************************************************************/


// event stream
// TODO: type signature
const Event = Data("Event") (Event => k => Event(k));


/******************************************************************************
**********************************[ Except ]***********************************
******************************************************************************/


// exception
// ({Err: e -> r, Suc: a -> r} -> r) -> Except<e, a>
const Except = Type("Except");


// error
// e -> Except<e, a>
const Err = e => Except("Err") (cases => cases.Err(e));


// success
// a -> Except<e, a>
const Suc = x => Except("Suc") (cases => cases.Suc(x));


/******************************************************************************
***********************************[ First ]***********************************
******************************************************************************/


// first
// a -> First<a>
const First = Data("First") (First => x => First(x));


/******************************************************************************
************************************[ Id ]*************************************
******************************************************************************/


// identity
// a -> Id<a>
const Id = Data("Id") (Id => x => Id(x));


/******************************************************************************
***********************************[ Last ]************************************
******************************************************************************/


// last
// a -> Last<a>
const Last = Data("Last") (Last => x => Last(x));


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
const List = Type("List");


// construct
// a -> List<a> -> List<a>
const Cons = x => tx => List("Cons") (cases => cases.Cons(x) (tx));


// not in list
// List<a>
const Nil = List("Nil") (cases => cases.Nil);


/******************************************************************************
**********************************[ Memoize ]**********************************
******************************************************************************/


/******************************************************************************
************************************[ Max ]************************************
******************************************************************************/


// max
// (Ord<a>, Bounded<a>) => a -> Max<a>
const Max = Data("Max") (Max => x => Max(x));


/******************************************************************************
************************************[ Min ]************************************
******************************************************************************/


// min
// (Ord<a>, Bounded<a>) => a -> Min<a>
const Min = Data("Min") (Min => x => Min(x));


/******************************************************************************
***********************************[ Option ]**********************************
******************************************************************************/


// option
// ({Some: a -> r, None: r} -> r) -> Option<a>
const Option = Type("Option");


// none
// Option<a>
const None = Option("None") (cases => cases.None);


// some
// a -> Option<a>
const Some = x => Option("Some") (cases => cases.Some(x));


/******************************************************************************
**********************************[ Product ]**********************************
******************************************************************************/


// product
// Number -> Product
const Product = Data("Product") (Product => n => Product(n));


/******************************************************************************
**********************************[ Reader ]***********************************
******************************************************************************/


// reader
// (a -> b) -> Reader<a, b>
const Reader = Data("Reader") (Reader => f => Reader(f));


/******************************************************************************
************************************[ Ref ]************************************
******************************************************************************/

// reference
// Object -> Ref<Object>
const Ref = Data("Ref") (Ref => o => Ref(o));


/******************************************************************************
***********************************[ State ]***********************************
******************************************************************************/


/******************************************************************************
**********************************[ Stream ]***********************************
******************************************************************************/


/******************************************************************************
************************************[ Sum ]************************************
******************************************************************************/


// sum
// Number -> Sum
const Sum = Data("Sum") (Sum => n => Sum(n));


/******************************************************************************
***********************************[ Task ]************************************
******************************************************************************/


// task
// TODO: switch to node style
// ((a -> r) -> r, (e -> r) -> r) -> Task<a, e>
const Task = Data("Task") (Task => k => Task(k));


/******************************************************************************
***********************************[ Tree ]************************************
******************************************************************************/


// multi-way tree
// TODO: change to non-mutual recursive adt?
// a -> Forest<a> -> Tree<a>
const Tree = Data("Tree")
  (Tree => x => children => Tree(k => k(x) (children)));


// multi-way tree forest
// [Tree<a>] -> Forest<a>
const Forest = Data("Forest")
  (Forest => (...trees) => Forest(k => k(trees)));


/******************************************************************************
**********************************[ Unique ]***********************************
******************************************************************************/


/******************************************************************************
***********************************[ Valid ]***********************************
******************************************************************************/


/******************************************************************************
**********************************[ Writer ]***********************************
******************************************************************************/


/******************************************************************************
*******************************************************************************
***************************[ DOCUMENT OBJECT MODEL ]***************************
*******************************************************************************
******************************************************************************/


// append to parent node
// Node -> Node -> Eff<>
const appendNode = parent => child => Eff(() => parent.append(child));


// dom attribute
// (String, String) -> Attr
const attr = (k, v) => {
  const a = document.createAttribute(k);
  a.value = v;
  return a;
};


// insert after sibling node
// Node -> Node -> Eff<>
const insertAfter = predecessor => sibling =>
  Eff(() => predecessor.insertBefore(sibling));


// insert before sibling node
// Node -> Node -> Eff<>
const insertBefore = successor => sibling =>
  Eff(() => successor.insertBefore(sibling));


// dom markup
// String -> ...[Attr] -> ...[HTMLElement] -> HTMLElement
const markup = name => (...attr) => (...children) => {
  const el = document.createElement(name);

  attr.forEach(
    a => el.setAttributeNode(a));

  children.forEach(child =>
    el.appendChild(child));

  return el;
};


// dom text
// String -> Text
const text = s => document.createTextNode(s);


/******************************************************************************
*******************************************************************************
********************************[ TYPECLASSES ]********************************
*******************************************************************************
******************************************************************************/


// polymorphic value tag
// Symbol
const VALUE = Symbol("VALUE");


/***[Bounded]*****************************************************************/


// minimal bound
// a
const {minBoundAdd, minBoundLookup, minBound} =
  overload("minBound", toTypeTag);


// maximal bound
// a
const {maxBoundAdd, maxBoundLookup, maxBound} =
  overload("maxBound", toTypeTag);


/***[Deserialize]*************************************************************/


/***[Enum]********************************************************************/


/***[Foldable]****************************************************************/


// fold
// (Foldable<t>, Monoid<m>) => t<m> -> m
const {foldAdd, foldLookup, fold} =
  overload("fold", toTypeTag);


// foldl
// Foldable<t> => (b -> a -> b) -> b -> t<a> -> b
const {foldlAdd, foldlLookup, foldl} =
  overload("foldl", toTypeTag);


// foldr
// Foldable<t> => (a -> b -> b) -> b -> t<a> -> b
const {foldrAdd, foldrLookup, foldr} =
  overload("foldr", toTypeTag);


// concat
// Foldable<t> => t<[a]> -> [a]
const {concatAdd, concatLookup, concat} =
  overload("concat", toTypeTag);


// concat map
// Foldable<t> => (a -> [b]) -> t<a> -> [b]
const {concatMapAdd, concatMapLookup, concatMap} =
  overload("concatMap", toTypeTag);


/***[Monoid]******************************************************************/


// monoid empty
// a
const {emptyAdd, emptyLookup, empty} =
  overload("empty", toTypeTag);

empty[VALUE] = "empty";


/***[Num]*********************************************************************/


/***[Ord]*********************************************************************/


/***[Serialize]***************************************************************/


/***[Setoid]******************************************************************/


// equal
// a -> a -> Boolean
const {eqAdd, eqLookup, eq} =
  overload("eq", toTypeTag);


// not equal
// a -> a -> Boolean
const {neqAdd, neqLookup, neq} =
  overload("neq", toTypeTag);


/***[Semigroup]***************************************************************/


// append
// a -> a -> a
const {appendAdd, appendLookup, append} =
  overload2("append", dispatcher);


// prepend
// a -> a -> a
const {prependAdd, prependLookup, prepend} =
  overload2("prepend", dispatcher);


/******************************************************************************
*********************************[ Instances ]*********************************
******************************************************************************/


/***[Bounded]*****************************************************************/


// minimal bound
// Boolean
minBoundAdd("Boolean", false);
  

// maximal bound
// Boolean
maxBoundAdd("Boolean", true);


// minimal bound
// Char
minBoundAdd("Char", Char("\u{0}"));


// maximal bound
// Char
maxBoundAdd("Char", Char("\u{10FFFF}"));


// minimal bound
// Comparator
minBoundAdd("Comparator", LT);


// maximal bound
// Comparator
maxBoundAdd("Comparator", GT);


// minimal bound
// Null
minBoundAdd("Null", null);


// minimal bound
// Null
maxBoundAdd("Null", null);


// minimal bound
// Number
minBoundAdd("Number", Number.MIN_SAFE_INTEGER);


// maximal bound
// Number
maxBoundAdd("Number", Number.MAX_SAFE_INTEGER);


/***[Monoid]***************************************************************/


// empty add
// All
emptyAdd("All", All(true));


// empty add
// Any
emptyAdd("Any", Any(false));


// empty add
// [a]
emptyAdd("Array", []);


// empty add
// Comparator
emptyAdd("Comparator", EQ);


// empty add
// Endo<a>
emptyAdd("Endo", Endo(id));


// empty add
// First<a>
emptyAdd("First", First(None));


// empty add
// Monoid b => a -> b
emptyAdd("Function", co(empty));


// empty add
// Last<a>
emptyAdd("Last", Last(None));


// empty add
// Product
emptyAdd("Product", Product(1));


// empty add
// Record -> Record
emptyAdd("Record", o => {
  const ix = entries(o),
    p = {};

  for (let [k, v] of ix)
    p[k] = empty(v);

  return Rec(p);
});


// empty add
// String
emptyAdd("String", "");


// empty add
// Sum
emptyAdd("Sum", Sum(0));


// empty add
// Tuple -> Tuple
emptyAdd("Tuple", xs => xs.map(x => empty(x)));


/***[Semigroup]***************************************************************/


// append add
// All -> All -> All
appendAdd("All/All", a => b => All(a.getAll && b.getAll));


// prepend add
// All -> All -> All
prependAdd("All/All", b => a => All(a.getAll && b.getAll));


// append add
// Any -> Any -> Any
appendAdd("Any/Any", a => b => Any(a.getAny || b.getAny));


// prepend add
// Any -> Any -> Any
prependAdd("Any/Any", b => a => Any(a.getAny || b.getAny));


// append add
// Array -> Array -> Array
appendAdd("Array/Array", xs => ys => xs.concat(ys));


// prepend add
// Array -> Array -> Array
prependAdd("Array/Array", ys => xs => xs.concat(ys));


// append add
// Comparator -> Comparator -> Comparator
appendAdd("Comparator/Comparator", t => u =>
  t[TAG] === "LT" ? LT
    : t[TAG] === "EQ" ? u
    : GT);


// prepend add
// Comparator -> Comparator -> Comparator
appendAdd("Comparator/Comparator", u => t =>
  t[TAG] === "LT" ? LT
    : t[TAG] === "EQ" ? u
    : GT);


// append add
// Endo<a> -> Endo<a> -> Endo<a>
appendAdd("Endo/Endo", tf => tg => Endo(x => tf.runEndo(tg.runEndo(x))));


// prepnd add
// Endo<a> -> Endo<a> -> Endo<a>
prependAdd("Endo/Endo", tg => tf => Endo(x => tf.runEndo(tg.runEndo(x))));


// append add
// First<a> -> First<a> -> First<a>
appendAdd("First/First", tx => ty =>
  tx.getFirst.runOption({
    None: ty,
    Some: _ => tx}));


// prepend add
// First<a> -> First<a> -> First<a>
prependAdd("First/First", ty => tx =>
  tx.getFirst.runOption({
    None: ty,
    Some: _ => tx}));


// append add
// Monoid b => (a -> b) -> (a -> b) -> a -> b
appendAdd("Function/Function", f => g => x => append(f(x)) (g(x)));


// prepend add
// Monoid b => (a -> b) -> (a -> b) -> a -> b
prependAdd("Function/Function", g => f => x => append(f(x)) (g(x)));


// append add
// Product -> Product -> Product
appendAdd("Product/Product", m => n => Product(m.getProduct * n.getProduct));


// prepend add
// Product -> Product -> Product
prependAdd("Product/Product", n => m => Product(m.getProduct * n.getProduct));


// record append
// Record -> Record -> Record
const recAppend = o => p => {
  const ix = entries(o),
    q = {};

  for (let [k, v] of ix) {
    q[k] = append(v) (p[k]);
  }

  return Rec(q);
};


// append add
// Record -> Record -> Record
appendAdd("Record/Record", recAppend);


// prepend add
// Record -> Record -> Record
prependAdd("Record/Record", flip(recAppend));


// append add
// String -> String -> String
appendAdd("String/String", s => t => `${s}${t}`);


// prepend add
// String -> String -> String
prependAdd("String/String", t => s => `${s}${t}`);


// append add
// Sum -> Sum -> Sum
appendAdd("Sum/Sum", m => n => Sum(m.getSum + n.getSum));


// prepend add
// Sum -> Sum -> Sum
prependAdd("Sum/Sum", n => m => Sum(m.getSum + n.getSum));


// append add
// Tuple -> Tuple -> Tuple
appendAdd("Tuple/Tuple", xs => ys => xs.map((x, i) => append(x) (ys[i])));


// prepend add
// Tuple -> Tuple -> Tuple
prependAdd("Tuple/Tuple", ys => xs => xs.map((x, i) => prepend(x) (ys[i])));


/***[Setoid]******************************************************************/


// default equal
// untyped
const defaultEq = x => y => x === y;


// default not equal
// untyped
const defaultNeq = x => y => x !== y;


// array equal
// [a] -> [a] -> Boolean
const arrEq = xs => ys => {
  if (xs.length !== ys.length)
    return false;

  else if (xs.length === 0)
    return true;

  else {
    const eq = eqLookup(toTypeTag(xs[0]));

    return xs.every((x, n) =>
      eq(x) (ys[n]));
  }
};


// equal
// Array -> Array -> Boolean
eqAdd("Array", arrEq);


// not equal
// Array -> Array -> Boolean
neqAdd("Array", notp2(arrEq));


// equal
// Boolean -> Boolean -> Boolean
eqAdd("Boolean", defaultEq);


// not equal
// Boolean -> Boolean -> Boolean
neqAdd("Boolean", defaultNeq);


// equal
// Char -> Char -> Boolean
eqAdd("Char", tc => td => tc.getChar === td.getChar);


// not equal
// Char -> Char -> Boolean
neqAdd("Char", tc => td => tc.getChar !== td.getChar);


// equal
// Comparator -> Comparator -> Boolean
eqAdd("Comparator", t => u => t[TAG] === u[TAG]);


// not equal
// Comparator -> Comparator -> Boolean
neqAdd("Comparator", t => u => t[TAG] !== u[TAG]);


// either equal
// Either<a, b> -> Either<a, b> -> Boolean
const eitherEq = tx => ty =>
  tx[TAG] === ty[TAG]
    && tx.runEither({
      Left: x => ty.runEither({Left: y => eq(x) (y)}),
      Right: x => ty.runEither({Right: y => eq(x) (y)})});


// equal
// Either<a, b> -> Either<a, b> -> Boolean
eqAdd("Either", eitherEq);


// not equal
// Either<a, b> -> Either<a, b> -> Boolean
neqAdd("Either", notp2(eitherEq));


// equal
// Id<a> -> Id<a> -> Boolean
eqAdd("Id", tx => ty => eq(tx.getId) (ty.getId));
  

// not equal
// Id<a> -> Id<a> -> Boolean
neqAdd("Id", tx => ty => neq(tx.getId) (ty.getId));


// map equal
// TODO: replace Array.from with generator
// Map<k, v> -> Map<k, v> -> Boolean
const mapEq = m => n => {
  if (m.size !== n.size) return false;

  else if (m.size === 0)
    return true;

  else {
    const kvs = Array.from(m),
      lws = Array.from(n),
      neq = neqLookup(toTypeTag(kvs[0] [0])),
      eq = eqLookup(toTypeTag(kvs[0] [1]));

    return kvs.every(([k, v], n) => {
      const [l, w] = lws[n];
      if (neq(k) (l)) return false;
      else return eq(v) (w);
    });
  }
};


// equal
// Map<k, v> -> Map<k, v> -> Boolean
eqAdd("Map", mapEq);


// not equal
// Map<k, v> -> Map<k, v> -> Boolean
neqAdd("Map", notp2(mapEq));


// equal
// Null -> Null -> Boolean
eqAdd("Null", _ => __ => true);


// not equal
// Null -> Null -> Boolean
neqAdd("Null", _ => __ => false);


// equal
// Number -> Number -> Boolean
eqAdd("Number", defaultEq);


// not equal
// Number -> Number -> Boolean
neqAdd("Number", defaultNeq);


// object equal
// TODO: replace Object.keys with generator
// Object -> Object -> Boolean
const objEq = r => s => {
  const ks = Object.keys(r),
    ls = Object.keys(s);

  if (ks.length !== ls.length)
    return false;

  else return ks.every(k => !(k in s)
    ? false
    : eq(r[k]) (s[k]));
};


// equal
// Object -> Object -> Boolean
eqAdd("Object", objEq);


// not equal
// Object -> Object -> Boolean
neqAdd("Object", notp2(objEq));


// equal
// Record -> Record -> Boolean
eqAdd("Record", objEq);


// not equal
// Record -> Record -> Boolean
neqAdd("Record", notp2(objEq));


// equal
// Ref<Object> -> Ref<Object> -> Boolean
eqAdd("Ref", to => tp => to.getRef === tp.getRef);


// not equal
// Ref<Object> -> Ref<Object> -> Boolean
neqAdd("Ref", to => tp => to.getRef !== tp.getRef);


// equal set
// TODO: replace Array.from with generator
// Set<a> -> Set<a> -> Boolean
const eqSet = s => t => {
  if (s.size !== t.size) return false;

  else if (s.size === 0)
    return true;

  else {
    const ks = Array.from(s),
      ls = Array.from(t),
      eq = eqLookup(toTypeTag(ks[0]));

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


// equal
// String -> String -> Boolean
eqAdd("String", defaultEq);


// not equal
// String -> String -> Boolean
neqAdd("String", defaultNeq);


// tuple equal
// Tuple -> Tuple -> Boolean
const tupEq = xs => ys => {
  if (xs.length !== ys.length)
    return false;

  else {
    return xs.every((x, n) =>
      eq(x) (ys[n]));
  }
};


// equal
// Tuple -> Tuple -> Boolean
eqAdd("Tuple", arrEq);


// not equal
// Tuple -> Tuple -> Boolean
neqAdd("Tuple", notp2(arrEq));


/******************************************************************************
*******************************************************************************
*********************************[ INTERNAL ]**********************************
*******************************************************************************
******************************************************************************/


// ordinal number
// Number -> String
const ordinal = n => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;

  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};


/******************************************************************************
*******************************************************************************
**********************************[ EXPORT ]***********************************
*******************************************************************************
******************************************************************************/


// initialize namespace
Object.assign($,
  {
    add,
    All,
    Any,
    append,
    appendAdd,
    appendLookup,
    appendNode,
    apply,
    attr,
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
    dec,
    destructiveDel,
    destructiveSet,
    dispatcher,
    div,
    divf,
    Eff,
    empty,
    emptyAdd,
    emptyLookup,
    Endo,
    entries,
    EQ,
    eq,
    eqAdd,
    eqLookup,
    exp,
    expf,
    Err,
    Event,
    Factory,
    First,
    fix,
    flip,
    Forest,
    GT,
    Id,
    id,
    inc,
    insertAfter,
    insertBefore,
    join,
    keys,
    Last,
    Lazy,
    Left,
    loop,
    LT,
    markup,
    Max,
    maxBound,
    maxBoundAdd,
    maxBoundLookup,
    Min,
    minBound,
    minBoundAdd,
    minBoundLookup,
    mul,
    neg,
    neq,
    neqAdd,
    neqLookup,
    Nil,
    None,
    notp,
    notp2,
    omega,
    on,
    overload,
    partial,
    pipe,
    prepend,
    prependAdd,
    prependLookup,
    Product,
    prop,
    Reader,
    Rec,
    recur,
    Ref,
    rem,
    remf,
    Right,
    rotl,
    rotr,
    Some,
    sub,
    subf,
    subscribe,
    Suc,
    Sum,
    swap,
    TAG,
    tap,
    Task,
    text,
    toTypeTag,
    Tree,
    Tup,
    Type,
    uncurry,
    uncurry3,
    VALUE,
    values
  }
);


module.exports = $;
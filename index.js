/*
                                                                                      
                                                   I8                                 
                                                   I8                                 
                                 gg             88888888                              
                                 ""                I8                                 
   ,g,       ,gggg,   ,gggggg,   gg   gg,gggg,     I8   gg      gg   ,ggg,,ggg,,ggg,  
  ,8'8,     dP"  "Yb  dP""""8I   88   I8P"  "Yb    I8   I8      8I  ,8" "8P" "8P" "8, 
 ,8'  Yb   i8'       ,8'    8I   88   I8'    ,8i  ,I8,  I8,    ,8I  I8   8I   8I   8I 
,8'_   8) ,d8,_    _,dP     Y8,_,88,_,I8 _  ,d8' ,d88b,,d8b,  ,d8b,,dP   8I   8I   Yb,
P' "YY8P8PP""Y8888PP8P      `Y88P""Y8PI8 YY88888P8P""Y88P'"Y88P"`Y88P'   8I   8I   `Y8
                                      I8                                              
                                      I8                                              
                                      I8                                              
*/


/******************************************************************************
*******************************************************************************
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const ARGS = Symbol("args"); // used for debugging


const TAG = Symbol("tag"); // the tag property of tagged unions


const TYPE = Symbol.toStringTag; // used for debugging


/******************************************************************************
*******************************************************************************
**********************************[ ERRORS ]***********************************
*******************************************************************************
******************************************************************************/


// I actually do subtying in scriptum :D

class ExtendableError extends Error {
  constructor(s) {
    super(s);
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
    
    else
      this.stack = (new Error(s)).stack;
  }
};


class ScriptumError extends ExtendableError {};


class UnionError extends ScriptumError {};


/******************************************************************************
*******************************************************************************
*******************************[ INTROSPECTION ]*******************************
*******************************************************************************
******************************************************************************/


const introspect = x =>
  x && TYPE in x
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


/******************************************************************************
*******************************************************************************
********************************[ TRAMPOLINES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


const loop = f => {
  let step = f();

  while (step && step.type === recur)
    step = f(...step.args);

  return step;
};


const recur = (...args) =>
  ({type: recur, args});


/******************************************************************************
*****************************[ MUTUAL RECURSION ]******************************
******************************************************************************/


const tramp = f => (...args) => {
  let step = f(...args);

  while (step && step.type === recur) {
    let [f, ...args_] = step.args;
    step = f(...args_);
  }

  return step;
};


/******************************************************************************
*******************************************************************************
*******************************[ CONSTRUCTORS ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ UNION TYPE ]*********************************
******************************************************************************/


const union = type => (tag, x) => ({
  ["run" + type]: x,
  tag,
  [TYPE]: type
});


const match = ({[TYPE]: type, tag}, o} =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(tag in o) ? _throw(new UnionError("invalid tag"))
    : o[tag];


/******************************************************************************
********************************[ RECORD TYPE ]********************************
******************************************************************************/


const struct = type => cons => {
  const f = x => ({
    ["run" + type]: x,
    [TYPE]: type,
  });

  return cons(f);
};


const structMemo = type => cons => {
  const f = thunk => ({
    get ["run" + type] () {
      delete this["run" + type];
      return this["run" + type] = thunk();
    },
    [TYPE]: type
  });

  return cons(f);
};


/******************************************************************************
*******************************************************************************
****************************[ TYPECLASS FUNCTIONS ]****************************
*******************************************************************************
******************************************************************************/


/***[Foldable]****************************************************************/


const foldMap = (fold, append, empty) => f =>
  fold(comp2nd(append) (f)) (empty);


/***[Applicative]*************************************************************/


const liftAn = (map, ap) => {
  const go = tf => tx => {
    const ty = ap(tf) (tx);

    return Object.assign(
      go(ty), {runAp: ty, [TYPE]: "Ap"});
  };

  return f => tx => go(map(f) (tx));
};


/***[Monad]*******************************************************************/


const kleisli = chain => fm => gm => x =>
  chain(fm) (gm(x));


const kleislin = chain => {
  const go = fm =>
    Object.assign(
      gm => go(x => chain(fm) (gm(x))),
      {runKleisli: fm, [TYPE]: "Kleisli"});

  return go;
};


const kleisliContra = chain => gm => fm => x =>
  chain(fm) (gm(x));


const kleisliContran = chain => {
  const go = gm =>
    Object.assign(
      fm => go(x => chain(fm) (gm(x))),
      {runKleisli: gm, [TYPE]: "KleisliContra"});

  return go;
};


const chainn = chain => {
  const go = fm => mx => {
    const my = chain(fm) (mx);

    return Object.assign(
      go(my), {runChain: my, [TYPE]: "Chain"});
  };

  return go;
};


const liftMn = (chain, of) => {
  const go = f => mx => {
    const my = chain(f) (mx);

    return Object.assign(
      go(my), {runChain: of(my), [TYPE]: "Chain"});
  };

  return go;
};


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Applicative]*************************************************************/


const arrAp = fs => xs =>
  fs.reduce((acc, f) =>
    acc.concat(xs.map(x => f(x))), []);


const arrOf = x => [x];


/***[ChainRec]****************************************************************/


const arrChainRec = f => {
  const stack = [],
    acc = [];

  let step = f();

  if (step && step.type === recur)
    arrPushFlat(stack) (step.arg);

  else
    arrPushFlat(acc) (step.arg);

  while (stack.length > 0) {
    step = f(stack.shift());

    if (step && step.type === recur)
      arrPushFlat(stack) (step.arg);

    else
      arrPushFlat(acc) (step);
  }

  return acc;
};


/***[Clonable]****************************************************************/


const arrClone = xs => {
  const ys = [];

  for (let i = 0; i < xs.length; i++)
    ys[i] = xs[i];

  return ys;
};


/***[Combinators]*************************************************************/


const arrPushFlat = xs => ys => {
  ys.forEach(x =>
    xs.push(x));

  return ys;
};


const arrUnshiftFlat = xs => ys => {
  ys.forEach(x =>
    xs.unshift(x));

  return ys;
};


/***[Filterable]**************************************************************/


const arrFilter = p => xs =>
  xs.filter(x => p(x) ? x : null);


// TODO: add arrFilterEntries et al.


/***[Foldable]****************************************************************/


const arrFold = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (xs[i]);

  return acc;
};


const arrFoldEntries = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (i, xs[i]);

  return acc;
};


const arrFoldWhile = p => alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++) {
    if (!p(acc, xs[i])) break;
    acc = alg(acc) (xs[i]);
  }

  return acc;
};


const arrFoldEntriesWhile = p => alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++) {
    if (!p(acc, i, xs[i])) break;
    acc = alg(acc) (i, xs[i]);
  }

  return acc;
};


const arrPara = alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    x;

  while (x = ys.shift()) 
    acc = alg(acc) (ys) (x);

  return acc;
};


const arrParaEntries = alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    len = 0,
    x;

  while (x = ys.shift())
    acc = alg(acc) (len++, ys) (x);

  return acc;
};


const arrParaWhile = p => alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    x;

  while (x = ys.shift()) {
    if (!p(acc, ys, x)) break;
    acc = alg(acc) (ys) (x);
  }

  return acc;
};


const arrParaEntriesWhile = p => alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    len = 0,
    x;

  while (x = ys.shift()) {
    if (!p(acc, ys, len, x)) break;
    acc = alg(acc) (ys) (len++, x);
  }

  return acc;
};


/***[Functor]*****************************************************************/


const arrMap = f => xs =>
  xs.map(x => f(x));


const arrMapConst = x => xs => {
  const f = _const(x);
  return xs.map(f);
};


/***[Monad]*******************************************************************/


const arrChain = fm => xs =>
  xs.reduce((acc, x) => arrPushFlat(acc) (fm(x)), []);


const arrChainf = xs => fm =>
  xs.reduce((acc, x) => arrPushFlat(acc) (fm(x)), []);


const arrJoin = xss => {
  let xs = [];

  for (let i = 0; i < xss.length; i++)
    for (let j = 0; j < xss[i].length; j++)
      xs.push(xss[i] [j]);

  return xs;
};


/***[Monoid]******************************************************************/


const arrAppend = xs => ys => xs.concat(ys);


const arrPrepend = ys => xs => xs.concat(ys);


/***[Transduce]***************************************************************/


const arrTransduce = alg => reduce =>
  arrFold(alg(reduce));


const arrTransduceWhile = p => alg => reduce =>
  arrFoldWhile(p) (alg(reduce));


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


const day = invoke("getDate");


const formatDate = sep => (...fs) => date =>
  fs.map(f => f(date))
    .join(sep);


const month = invoke("getMonth");


const year = invoke("getFullYear");


/******************************************************************************
***********************************[ FLOAT ]***********************************
******************************************************************************/


const roundWith = k => places => fp => {
  let [n, ex] = `${fp < 0 ? Math.abs(fp) : fp}e`.split('e'),
    r = Math[k](`${n}e${Number(ex) + places}`);

  [n, ex] = `${r}e`.split('e');
  r = Number(`${n}e${Number(ex) - places}`);

  return fp < 0 ? -r : r;
};


const toFixedFloat = places => fp =>
  String(round(places) (fp));


/***[Derived]*****************************************************************/


const ceil = roundWith("ceil");


const floor = roundWith("floor");


const round = roundWith("round");


/******************************************************************************
*********************************[ FUNCTIONS ]*********************************
******************************************************************************/


const app = f => x => f(x);


const appr = f => y => x => f(x) (y);


const _const = x => y => x;


const flip = f => y => x => f(x) (y);


const id = x => x;


const infix = (x, f, y) => f(x) (y); // simulates function calls in infix position


const _let = f => f(); // simulates let binding as an expression


/***[Composition]*************************************************************/


const comp = f => g => x => f(g(x));


const compm = f =>
  Object.assign(
    g => compm(x => f(g(x))),
    {runComp: f, [TYPE]: "Comp"});


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipem = g =>
  Object.assign(
    f => pipem(x => f(g(x))),
    {runContra: g, [TYPE]: "Pipe"});


const on = f => g => x => y =>
  f(g(x)) (g(y));


/***[Conditional Branching]***************************************************/


const cond = x => y => b =>
  b ? x : y;


const cond_ = b => x => y =>
  b ? x : y;


const guard = p => f => x =>
  p(x) ? f(x) : x;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


/***[Currying]****************************************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const curry5 = f => v => w => x => y => z =>
  f(v, w, x, y, z);


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


const uncurry5 = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);


/***[Impure]******************************************************************/


const eff = f => x => (f(x), x); // aka tap


const memoThunk = (f, memo) => () =>
  memo === undefined
    ? (memo = f(), memo)
    : memo;


const _throw = e => {
  throw e;
};


const tryCatch = f => g => x => {
  try {
    return f(x);
  }

  catch(e) {
    return g([x, e]);
  }
};


/***[Partial Application]*****************************************************/


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const pcurry = (f, n, ...args) => {
  const go = (acc, m) =>
    m === 0
      ? f(...args, ...acc)
      : x => go((acc.push(x), acc), m - 1);

  return go([], n);
};


/***[Transducer]**************************************************************/


const mapper = f => reduce => acc => x =>
  reduce(acc) (f(x));


const filterer = p => reduce => acc => x =>
  p(x) ? reduce(acc) (x) : acc;


/***[Typeclass Functions]*****************************************************/


const funAp = f => g => x =>
  f(x) (g(x));


const funChain = f => g => x =>
  f(g(x)) (x);


const funContra = pipe;


const funJoin = f => x =>
  f(x) (x);


const funLiftA2 = f => g => h => x =>
  f(g(x)) (h(x));


const funMap = comp;


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


const abstractNew = cons => (...args) =>
  new cons(...args);


const factory = (...fields) => (...values) =>
  values.reduce(
    (acc, value, i) =>
      (acc[fields[i]] = value, acc), {});


const factory_ = entries =>
  entries.reduce(
    (acc, [k, v]) =>
      (acc[k] = v, acc), {});


const invoke = (name, ...args) => o =>
  o[name] (...args);


const path = def => {
  go = o => Object.assign(
    k => go(o[k] || def),
    {runPath: o, [TYPE]: "Path"});
  
  return go;
};


const omitProps = (...ks) => o =>
  Object.keys(o).reduce(
    (acc, k) => ks.includes(k)
      ? acc
      : (acc[k] = o[k], acc), {});


const pickProps = (...ks) => o =>
  ks.reduce((acc, k) => (acc[k] = o[k], acc), {});


/***[Iterators]**************************************************************/


function* objEntries(o) {
  for (let prop in o) {
    yield [prop, o[prop]];
  }
}


function* objKeys(o) {
  for (let prop in o) {
    yield prop;
  }
}


function* objValues(o) {
  for (let prop in o) {
    yield o[prop];
  }
}


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


const strDeleteAt = i => s =>
  t.slice(0, i) + t.slice(i + 1);


const strReplaceAt = i => s => t =>
  t.slice(0, i) + s + t.slice(i + 1);


const strReplaceAtWith = i => f => s =>
  s.slice(0, i) + f(s[i]) + s.slice(i + 1);


/******************************************************************************
*******************************************************************************
*******************************[ CUSTOM TYPES ]********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ ALL ]************************************
******************************************************************************/


const All = struct("All") (All => b => All(b));


/***[Typeclasses]*************************************************************/


const allAppend = tx => ty =>
  All(tx.runAll || ty.runAll);


const allPrepend = allAppend;


const allEmpty = All(false);


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = struct("Any") (Any => b => Any(b));


/***[Typeclasses]*************************************************************/


const anyAppend = tx => ty =>
  Any(tx.runAny || ty.runAny);


const anyPrepend = anyAppend;


const anyEmpty = Any(false);


/******************************************************************************
********************************[ COMPARATOR ]*********************************
******************************************************************************/


const Comparator = union("Comparator");


const comparator = lt => eq => gt => tx =>
  match(tx) ({
    type: "Comparator",
    get LT() {return lt()},
    get EQ() {return eq()},
    get GT() {return gt()}
  });


const LT = Object.assign(
  Comparator("LT"), {valueOf: () => -1});


const EQ = Object.assign(
  Comparator("EQ"), {valueOf: () => 0});


const GT = Object.assign(
  Comparator("GT"), {valueOf: () => 1});


/***[Typeclasses]*************************************************************/


const ctorAppend = tx => ty =>
  comparator(_ => LT)
    (_ => ty)
      (_ => GT)
        (tx);


const ctorPrepend = ty => tx =>
  comparator(_ => LT)
    (_ => ty)
      (_ => GT)
        (tx);


const ctorEmpty = EQ;


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


const Compare = struct("Compare") (Compare => f => Compare(f));


/***[Typeclasses]*************************************************************/


const compAppend = tf => tg =>
  Compare(x => y =>
    ctorAppend(tf.runCompare(x) (y)) (tg.runCompare(x) (y)));


const compPrepend = tg => tf =>
  Compare(x => y =>
    ctorPrepend(tf.runCompare(x) (y)) (tg.runCompare(x) (y)));


const compEmpty = Compare(x => y => EQ);


const compContra = f => tf =>
  Compare(on(tf.runCompare) (f));


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


const Comp = struct("Comp") (Comp => ttx => Comp(ttx));


/***[Typeclasses]*************************************************************/


const compMap = (map1, map2) => f => ttx =>
  Comp(map1(map2(f)) (ttx.runComp));


const compOf = (of1, of2) => x =>
  Comp(of1(of2(x)));


const compAp = (map1, ap1, ap2) => ttf => ttx =>
  Comp(ap1(map1(ap2) (ttf.runComp)) (ttx.runComp));


/******************************************************************************
***********************************[ CONST ]***********************************
******************************************************************************/


const Const = struct("Const") (Const => x => Const(x));


/***[Typeclasses]*************************************************************/


const constMap = f => tx =>
  Const(tx.runConst);


/******************************************************************************
***********************************[ DEFER ]***********************************
******************************************************************************/


const Defer = struct("Defer") (Defer => thunk => Defer(thunk));


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const Left = x =>
  Either("Left", x);


const Right = x =>
  Either("Right", x);


/******************************************************************************
***********************************[ ENDO ]************************************
******************************************************************************/


const Endo = struct("Endo") (Endo => f => Endo(f));


/***[Typeclasses]*************************************************************/


const endoAppend = tf => tg => x =>
  Endo(tf.runEndo(tg.runEndo(x)));


const endoPrepend = tg => tf => x =>
  Endo(tf.runEndo(tg.runEndo(x)));


const endoEmpty = Endo(id);


/******************************************************************************
***********************************[ EQUIV ]***********************************
******************************************************************************/


const Equiv = struct("Equiv") (Equiv => p => Equiv(p));


/***[Typeclasses]*************************************************************/


const equivAppend = tf => tg =>
  Equiv(x => y =>
    tf.runEquiv(x) (y) && tg.runEquiv(x) (y));


const equivPrepend = equivAppend;


const equivEmpty = Equiv(x => y => true);


const equivContra = f => tf =>
  Equiv(on(tf.runEquiv) (f));


/******************************************************************************
***********************************[ FIRST ]***********************************
******************************************************************************/


const First = struct("First") (First => f => First(f));


/***[Typeclasses]*************************************************************/


const firstAppend = x => _ => x;


const firstPrepend = lastAppend;


/******************************************************************************
************************************[ ID ]*************************************
******************************************************************************/


const Id = struct("Id") (Id => x => Id(x));


/***[Typeclasses]*************************************************************/


const idMap = f => tx =>
  f(tx.runId);


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


const Last = struct("Last") (Last => f => Last(f));


/***[Typeclasses]*************************************************************/


const lastAppend = _ => y => y;


const LastPrepend = firstAppend;


/******************************************************************************
***********************************[ LAZY ]************************************
******************************************************************************/


// Defer with memoization

const Lazy = structMemo("Lazy")
  (Lazy => thunk => Lazy(thunk));


/******************************************************************************
***********************************[ LENS ]************************************
******************************************************************************/


const Lens = struct("Lens") (Lens => o => Lens(o));


const objLens = k => Lens({
  get: o =>
    o[k],

  set: v => o =>
    Object.assign({}, o, {[k]: v}),

  mod: f => o =>
    Object.assign({}, o, {[k]: f(o[k])}),

  del: o => {
    const o_ = Object.assign({}, o);
    delete o_[k];
    return o_;
  }
});


const arrLens = i => Lens({
  get: xs =>
    xs[i],

  set: v => xs => {
    const xs_ = xs.concat([]);
    xs_[i] = v;
    return xs_;
  },

  mod: f => xs => {
    const xs_ = xs.concat([]);
    xs_[i] = f(xs_[i]);
    return xs_;
  },

  del: xs => {
    const xs_ = xs.concat([]);
    delete xs_[i]
    return xs_;
  }
});


const mapLens = k => Lens({
  get: m =>
    m.get(k),

  set: v => m => {
    const m_ = new Map(m);
    return m_.set(k, v);
  },

  mod: f => m => {
    const m_ = new Map(m);
    return m_.set(k, f(v));
  },

  del: m => {
    const m_ = new Map(m);
    return m_.delete(k);
  }
});


const setLens = k => Lens({
  get: s =>
    s.get(k),

  set: v => s => {
    const s_ = new Set(s);
    return s_.add(k, v);
  },

  mod: f => s => {
    const s_ = new Set(s);
    return s_.add(k, f(v));
  },

  del: s => {
    const s_ = new Set(s);
    return s_.delete(k);
  }
});


const strLens = i => Lens({
  get: s =>
    s[i],

  set: v => s =>
    strReplaceAt(i) (v) (s),

  mod: f => s =>
    strReplaceAtWith(i) (f) (s),

  del: xs =>
    strDeleteAt(i) (s)
});


/***[Combinators]*************************************************************/


const fromPath = lens => ks =>
  arrFold(acc => k =>
    (acc.push(lens(k)), acc))
      ([]) (ks);


/***[Composition]*************************************************************/


const lensComp = tx => ty => Lens({
  get: o =>
    ty.runLens.get(tx.runLens.get(o)),

  set: v => o =>
    tx.runLens.set(ty.runLens.set(v) (tx.runLens.get(o))) (o),

  mod: f => o =>
    tx.runLens.set(f(ty.runLens.set(v) (tx.runLens.get(o)))) (o),

  del: o =>
    tx.runLens.set(ty.runLens.del(tx.runLens.get(o))) (o)
});


const lensCompn = tx =>
  Object.assign(
    ty => lensCompn(lensComp(tx) (ty)),
    {runLens: tx.runLens}, [TYPE]: "Lens");


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = struct("Max") (Max => f => Max(f));


/***[Typeclasses]*************************************************************/


const maxAppend = max => x => y =>
  max(x) (y);


const maxPrepend = maxAppend;


const maxEmpty = minBound => Max(minBound);


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = struct("Min") (Min => f => Min(f));


/***[Typeclasses]*************************************************************/


const minAppend = min => x => y =>
  min(x) (y);


const minPrepend = minAppend;


const minEmpty = maxBound => Min(maxBound);


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


const Option = union("Option");


const None = Option("None", null);


const Some = x =>
  Option("Some", x);


/***[Applicative]*************************************************************/


const optAp = tf => tx =>
  match(tf, {
    type: "Option",
    None: None,
    get Some() {
      return match(tx, {
        type: "Option",
        None: None,
        get Some() {return Some(tf.runOption(tx.runOption))}
      });
    }
  });


const optOf = x => Some(x);


/***[Folding]*****************************************************************/


const optCata = none => some => tx =>
  match(tx, {
    type: "Option",
    None: none,
    get Some() {return some(tx.runOption)}
  });


/***[Functor]*****************************************************************/


const optMap = f => tx =>
  match(tx, {
    type: "Option",
    None: None,
    get Some() {return Some(f(tx.runOption))}
  });


/***[Monad]*******************************************************************/


const optChain = fm => mx =>
  match(mx, {
    type: "Option",
    None: None,
    get Some() {return fm(mx.runOption)}
  });


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


// asynchronous computations in parallel

const Parallel = struct("Parallel")
  (Parallel => k => Parallel((res, rej) => k(res, rej)));


/***[Foldable]****************************************************************/


const parCata = alg => tf.runParallel;


/***[Applicative]*************************************************************/


const parAp = tf => tx =>
  Parallel((res, rej) =>
    parAnd(tf) (tx).runParallel(([f, x]) => res(f(x)), rej));


const parOf = x => Parallel((res, rej) => res(x));


/***[Combinators]*************************************************************/


const parAnd = tf => tg => {
  const r = []

  const guard = (res, rej, i) => [
    x => (
      r[i] = x,
      isRes || isRej || r[0] === undefined || r[1] === undefined
        ? false
        : (isRes = true, res(r))),
    e =>
      isRes || isRej
        ? false
        : (isRej = true, rej(e))];

  let isRes = false,
    isRej = false;

  return Parallel(
    (res, rej) => (
      tf.runParallel(...guard(res, rej, 0)),
      tg.runParallel(...guard(res, rej, 1))));
};


const parOr = tf => tg => {
  const guard = (res, rej) => [
    x => (
      isRes || isRej
        ? false
        : (isRes = true, res(x))),
    e =>
        isRes || isRej
          ? false
          : (isRej = true, rej(e))];

  let isRes = false,
    isRej = false;

  return Parallel(
    (res, rej) => (
      tf.runParallel(...guard(res, rej)),
      tg.runParallel(...guard(res, rej))))
};


const parAll = ts => // eta abstraction to create a new tOf([]) for each invocation
  arrFold(acc => tf =>
    parMap(([xs, x]) =>
      (xs.push(x), xs))
        (parAnd(acc) (tf)))
          (parOf([])) (ts);


const parAny =
  arrFold(acc => tf =>
    parOr(acc) (tf))
      (parEmpty);


/***[Functor]*****************************************************************/


const parMap = f => tx =>
  Parallel((res, rej) => tx.runParallel(x => res(f(x)), rej));


/***[Monoid]******************************************************************/


const parEmpty = Parallel((res, rej) => null);


/***[Semigroup]***************************************************************/


const parAppend = parOr;


const parPrepend = parOr;


/******************************************************************************
***********************************[ PRED ]************************************
******************************************************************************/


const Pred = struct("Pred") (Pred => p => Pred(p));


/***[Typeclasses]*************************************************************/


const predAppend = tf => tg =>
  Pred(x => tf.runPred(x) && tg.runPred(x));


const predPrepend = predAppend;


const predEmpty = Pred(x => true);


const predContra = f => tf =>
  x => Pred(tf.runPred(f(x)));


/******************************************************************************
***********************************[ PRISM ]***********************************
******************************************************************************/


const Prism = struct("Prism") (Prism => o => Prism(o));


const objPrism = k => Prism({
  get: o =>
    k in o
      ? Some(o[k])
      : None,

  set: v => o =>
    Object.assign({}, o, {[k]: v}),

  mod: f => o =>
    k in o
      ? Object.assign({}, o, {[k]: f(o[k])})
      : o,

  del: o => {
    const o_ = Object.assign({}, o);
    delete o_[k];
    return o_;
  }
});


/******************************************************************************
***********************************[ PROD ]************************************
******************************************************************************/


const Prod = struct("Prod") (Prod => n => Prod(n));


/***[Typeclasses]*************************************************************/


const prodAppend = tm => tn =>
  Sum(tm.runProd * tn.runProd);


const prodPrepend = prodAppend;


const prodEmpty = Prod(0);


/******************************************************************************
**********************************[ READER ]***********************************
******************************************************************************/


const Reader = struct("Reader") (Reader => f => Reader(f));


/***[Typeclasses]*************************************************************/


const readAp = tf => tg =>
  Reader(x => tf.runReader(x) (tg.runReader(x)));


const ask = Reader(id);


const asks = f =>
  readChain(x => readOf(f(x))) (ask);


const readChain = fm => mg =>
  Reader(x => fm.runReader(mg.runReader(x)) (x));


const readJoin = mmf =>
  Reader(x => mmf.runReader(x).runReader(x));


const local = f => tg =>
  Reader(x => tg.runReader(f(x)));


const readMap = f => tg =>
  Reader(x => f(tg.runReader(x)));


const readOf = x => Reader(_ => x);


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = struct("State") (State => f => State(f));


/***[Typeclasses]*************************************************************/


const evalState = tf =>
  y => tf.runState(y) [0];


const execState = tf =>
  y => tf.runState(y) [1];


const gets = f =>
  stateChain(y => stateOf(f(x))) (stateGet);


const modify = f =>
  stateChain(y => statePut(f(y))) (stateGet);


const stateChain = fm => mg =>
  State(y => _let(([x, y_] = mg.runState(y)) => fm(x).runState(y_)));


const stateGet = State(y => [y, y]);


const stateOf = x => State(y => [x, y]);


const statePut = y => State(_ => [null, y]);


/******************************************************************************
************************************[ SUM ]************************************
******************************************************************************/


const Sum = struct("Sum") (Sum => n => Sum(n));


/***[Typeclasses]*************************************************************/


const sumAppend = tm => tn =>
  Sum(tm.runSum + tn.runSum);


const sumPrepend = sumAppend;


const endoEmpty = Prod(1);


/******************************************************************************
***********************************[ TASK ]************************************
******************************************************************************/


// asynchronous computations in sequence

const Task = struct("Task") (Task => k => Task((res, rej) => k(res, rej)));


/***[Applicative]*************************************************************/


const tAp = tf => tx =>
  Task((res, rej) => tf.runTask(f => tx.runTask(x => res(f(x)), rej), rej));


const tOf = x => Task((res, rej) => res(x));


/***[Combinators]*************************************************************/


const tAnd = tf => tg =>
  Task((res, rej) =>
    tf.runTask(f =>
      tg.runTask(g =>
        res([f, g]), rej),
        rej));


const tAll = ts => // eta abstraction to create a new tOf([]) for each invocation
  arrFold(acc => tf =>
    tMap(([xs, x]) =>
      (xs.push(x), xs))
        (tAnd(acc) (tf)))
          (tOf([])) (ts);


/***[Foldable]****************************************************************/


const tCata = alg => tf.runTask;


/***[Functor]*****************************************************************/


const tMap = f => tx =>
  Task((res, rej) => tx.runTask(x => res(f(x)), rej));


/***[Monad]*******************************************************************/


const tChain = mx => fm =>
  Task((res, rej) => mx.runTask(x => fm(x).runTask(res, rej), rej));


const tChainf = fm => mx =>
  Task((res, rej) => mx.runTask(x => fm(x).runTask(res, rej), rej));


/******************************************************************************
***********************************[ THESE ]***********************************
******************************************************************************/


const These_ = union("These");


const This = x =>
  These_("This", x);


const That = x =>
  These_("That", x);


const These = (x, y) =>
  These_("These", [x, y]);


const these = _this => that => these => tx =>
  match(tx) ({
    type: "These",
    get This() {return _this(tx.runThese)},
    get That() {return that(tx.runThese)},
    get These() {return these(...tx.runThese)}
  });


/***[Typeclasses]*************************************************************/


const fromThese = (x, y) => tx =>
  match(tx) ({
    type: "These",
    get This() {return [tx.runThese, y]},
    get That() {return [x, tx.runThese]},
    get These() {return tx.runThese}
  });


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = struct("Writer") (Writer => (x, y) => Writer([x, y]));


/***[Typeclasses]*************************************************************/


const censor = f => mx =>
  pass(mx.runWriter(pair => Writer(pair, f)));


const evalWriter = tx =>
  tx.runWriter(([x, y]) => x);


const execWriter = tx =>
  tx.runWriter(([x, y]) => y);


const listen = tx =>
  tx.runWriter(([x, y]) => Writer([x, y], y));


const listens = f => mx =>
  listen(mx).runWriter(([pair, y]) => Writer(pair, f(y)));


const pass = tx =>
  tx.runWriter(([[x, f], y]) => Writer([x, f(x)]));


const tell = y => Writer(null, y);


const writeChain = append => fm => mx =>
  mx.runWriter(([x, y]) => f(x).runWriter(([x_, y_]) => Writer(x_, append(y) (y_))));


const writeOf = empty => x =>
  Writer(x, empty);


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  // CONSTANTS
  
  ARGS,
  TAG,
  TYPE,
  
  // INTROSPECTION
  
  introspect,
  
  // TRAMPOLINES
  
  loop,
  recur,
  tramp,
  
  // CONSTRUCTORS
  
  union,
  match,
  match2,
  struct,
  structMemo,
  
  // TYPECLASS FUNCTIONS
  
  contran,
  foldMap,
  mapn,
  liftAn,
  kleisli,
  kleislin,
  chainn,
  liftMn,
  
  
  // BUILT-IN TYPES
  
  // Array
  
  arrClone,
  arrFold,
  arrFoldPred,
  arrAppend,
  arrPrepend,
  arrTransduce,
  arrTransducep,
  
  // Function
  
  app,
  appr,
  _const,
  flip,
  id,
  infix,
  _let,
  comp2nd,
  on,
  cond,
  cond_,
  guard,
  select,
  curry,
  curry3,
  curry4,
  curry5,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  eff,
  memoThunk,
  _throw,
  tryCatch,
  partial,
  pcurry,
  mapper,
  filterer,
  funAp,
  funChain,
  funContra,
  funJoin,
  funLiftA2,
  funMap,
  
  // String
  
  strDeleteAt,
  strReplaceAt,
  strReplaceAtWith,
  
  // CUSTOM TYPES
  
  // Lens
  
  Lens,
  arrLens,
  objLens,
  mapLens,
  setLens,
  strLens,
  lensGetComp,
  lensSetComp,
  lensModComp,
  lensDelComp,
  
  // Parallel
  
  Parallel,
  parCata,
  parOf,
  parAnd,
  parOr,
  parAll,
  parAny,
  parMap,
  parEmpty,
  parAppend,
  parPrepend,
  
  // Task
  
  Task,
  tAp,
  tOf,
  tAnd,
  tAll,
  tCata,
  tMap,
  tChain,
  tChainf
}

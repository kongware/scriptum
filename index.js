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
    

/***[Derived]*****************************************************************/


class UnionError extends ScriptumError {};


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
  [TAG]: tag,
  [TYPE]: type
});


const match = ({[TYPE]: type, [TAG]: tag}, o) =>
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
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/***[Category]****************************************************************/


const varComp = ({comp, id}) =>
  varArgs(arrFold(comp) (id));


const varPipe = ({pipe, id}) =>
  varArgs(arrFold(pipe) (id));


/***[Foldable]****************************************************************/


const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);


/***[Applicative]*************************************************************/


const varLiftA = ({ap, of}) => f =>
  varComp({comp: ap, id: of(f)});


/***[Monad]*******************************************************************/


const varChain = ({map, of, chain, join}) => fm =>
  varArgs(args =>
    join(arrFold(mg => mx =>
      chain(g => map(g) (mx)) (mg)) (of(fm)) (args)));


const kleisliComp = chain => fm => gm => x =>
  chain(fm) (gm(x));


const varKleisliComp = ({of, chain}) =>
  varComp({comp: kleisliComp(chain), id: of});


const kleisliPipe = chain => gm => fm => x =>
  chain(fm) (gm(x));


const varKleisliPipe = ({of, chain}) =>
  varPipe({comp: kleisliPipe(chain), id: of});


const varLiftM = ({map, of, chain}) => f =>
  varArgs(arrFold(mg => mx =>
    chain(g => map(g) (mx)) (mg)) (of(f)));


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Applicative]*************************************************************/


const arrAp = fs => xs => // TODO: revise
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


/***[Filterable]**************************************************************/


const arrFilter = p => xs =>
  xs.filter(x => p(x) ? x : null);


/***[Foldable]****************************************************************/


const arrFold = alg => zero => xs => { // aka catamorphism
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (xs[i], i);

  return acc;
};


const arrFoldM = ({append, empty}) =>
  arrFold(append) (empty);


const arrFoldr = alg => zero => xs => { // TODO: make non-strict
  const stack = [];
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    stack.unshift(alg(xs[i]));

  for (let i = 0; i < xs.length; i++)
    acc = stack[i] (acc);

  return acc;
};


const arrFoldWhile = alg => zero => xs => {
  let acc = Loop(zero);

  for (let i = 0; i < xs.length; i++) {
    acc = alg(acc.runStep) (xs[i], i);
    if (acc && acc[TAG] === "Done") break;
  }

  return acc.runStep;
};


const arrHisto = alg => zero =>
  comp(headH) (history(alg) (zero));


const arrHylo = alg => zero => coalg =>
  comp(arrFold(alg) (zero)) (arrAna(coalg));


const arrMutu = alg1 => alg2 => zero1 => zero2 =>
  comp(snd)
    (arrFold(([acc1, acc2]) => x =>
      [alg1(acc1) (acc2) (x), alg2(acc1) (acc2) (x)])
        ([zero1, zero2]));


const arrPara = alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    len = 0,
    x;

  while (x = ys.shift()) 
    acc = alg(acc) (ys) (x, len++);

  return acc;
};


const arrParaWhile = alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = Loop(zero),
    len = 0, x;

  while (x = ys.shift()) {
    acc = alg(acc.runStep) (ys) (x, len++);
    if (acc && acc[TAG] === "Done") break;
  }

  return acc.runStep;
};


const arrSum = arrFoldM(sumAppend, sumEmpty);


const arrZygo = alg1 => alg2 => zero1 => zero2 =>
  comp(snd)
    (arrFold(([acc1, acc2]) => x =>
      [alg1(acc1) (x), alg2(acc1) (acc2) (x)])
        ([zero1, zero2]));


/***[Functor]*****************************************************************/


const arrMap = f => xs =>
  xs.map(x => f(x));


const arrSeqF = x => xs => {
  const f = _const(x);
  return xs.map(f);
};


/***[Monad]*******************************************************************/


const arrChain = fm => xs => // TODO: revise
  xs.reduce((acc, x) => arrPushFlat(acc) (fm(x)), []);


const arrJoin = xss => {
  let xs = [];

  for (let i = 0; i < xss.length; i++)
    for (let j = 0; j < xss[i].length; j++)
      xs.push(xss[i] [j]);

  return xs;
};


/***[Monoid]******************************************************************/


const arrEmpty = [];


/***[Semigroup]***************************************************************/


const arrAppend = xs => ys => xs.concat(ys);


const arrPrepend = ys => xs => xs.concat(ys);


/***[Transduce]***************************************************************/


const arrTransduce = alg => reduce =>
  arrFold(alg(reduce));


const arrTransduceWhile = alg => reduce =>
  arrFoldWhile(alg(reduce));


/***[Tuple]*******************************************************************/


const fst = ([x]) => x;


const snd = ([x, y]) => y;


const thd = ([x, y, z]) => z;


/***[Unfoldable]**************************************************************/


const arrUnfold = coalg => x => { // TODO: make non-strict
  const acc = [];

  while (true) {
    let tx = coalg(x);

    switch (tx[TAG]) {
      case "None": return acc;
      
      case "Some": {
        acc.push(tx.runOption[0]);
        x = tx.runOption[1];
        break;
      }

      default: throw new UnionError("invalid tag");
    }
  }
};


const arrApo = coalg => x => { // TODO: make non-strict
  const acc = [];

  while (true) {
    let tx = coalg(x);

    switch (tx.tag) {
      case "None": return acc;
      
      case "Some": {
        switch (tx.runOption[1].tag) {
          case "Left": {
            arrPushFlat(acc)
              ((tx.runOption[1].runEither.unshift(tx.runOption[0]),
                tx.runOption[1].runEither));
            
            return acc;
          }

          case "Right": {
            acc.push(tx.runOption[0]);
            x = tx.runOption[1].runEither;
            break;
          }

          default: throw new Error("invalid tag");
        }
        
        break;
      }

      default: throw new Error("invalid tag");
    }
  }
};


const arrFutu = coalg => x => { // TODO: make non-strict
  const acc = [];

  while (true) {
    let optX = coalg(x);

    switch (optX.tag) {
      case "None": return acc;

      case "Some": {
        let [y, [ys, optX_]] = optX.runOption;

        switch(optX_.tag) {
          case "None": {
            arrPushFlat(acc) ((ys.unshift(y), ys));
            return acc;
          }

          case "Some": {
            arrPushFlat(acc) ((ys.unshift(y), ys)); 
            x = optX_.runOption;
            break;
          }

          default: throw new UnionError("invalid tag");
        }

        break;
      }

      default: throw new UnionError("invalid tag");
    }
  }
};


/***[Combinators]*************************************************************/


const arrInsertAt = (i, x) => xs => {
  const ys = xs.slice(0, i);

  return arrPushFlat(
    (ys.push(x), ys))
      (xs.slice(i));
};


const arrInsertAtBy = p => f => y =>
  arrParaWhile(acc => xs => (x, i) =>
    p(x)
      ? (acc.push(...f(x, y)), Done(arrPushFlat(acc) (xs)))
      : (acc.push(x), Loop(acc))) ([]);


const arrInsertBy = p => f => y =>
  arrFold(acc => x =>
    p(x)
      ? (acc.push(...f(x, y)), acc)
      : (acc.push(x), acc)) ([]);


const arrModOr = def => (i, f) => xs => {
  const ys = arrClone(xs);

  if (i in ys)
    ys[i] = f(ys[i]);

  else ys[i] = def;

  return ys;
};


const arrPartition = f => xs => // TODO: revise
  xs.reduce((m, x) =>
    _let((r = f(x), ys = m.get(r) || []) =>
      m.set(r, (ys.push(x), ys))), new Map());


const arrPush = xs => x =>
  (xs.push(x), xs);


const arrPushf = x => xs =>
  (xs.push(x), xs);


const arrPushFlat = xs => ys => {
  ys.forEach(x =>
    xs.push(x));

  return xs;
};


const arrScan = f => x_ => xs => // TODO: Absract from recursion with fold
  loop((acc = [], x = x_, i = 0) =>
    i === xs.length
      ? acc
      : recur(
        (acc.push(f(x) (xs[i])), acc),
        acc[acc.length - 1], i + 1));


const arrSet = def => (i, x) => xs => {
  const ys = arrClone(xs);
  return (ys[i] = x, ys);
};


const arrSplitAt = i => xs =>
  [xs.slice(0, i), xs.slice(i)];


const arrSplitAtBy = p => xs => // TODO: Absract from recursion with fold
  loop((acc = [], i = 0) =>
    i === xs.length ? [acc, []]
      : p(xs[i]) ? recur((acc.push(xs[i]), acc), i + 1)
      : [acc, xs.slice(i)]);


const arrSplit = n_ => xs => // TODO: Absract from recursion with fold
  loop((acc = [], n = n_, i = 0) => {
    if (i >= xs.length)
      return acc;

    else
      return recur((acc.push(xs.slice(i, i + n)), acc), n, i + n);
  });


const arrSplitBy = p => xs => // TODO: Absract from recursion with fold
  loop((acc = [], i = 0, j = 0) => {
    if (i + j >= xs.length)
      return (acc.push(xs.slice(i, i + j)), acc);

    else if (p(xs[i + j]))
      return recur((acc.push(xs.slice(i, i + j)), acc), i + j, 1)

    else
      return recur(acc, i, j + 1);
  });


const arrTranspose = matrix =>
  matrix[0].map((_, i) =>
    matrix.map(xs => xs[i]));


const arrUnshift = xs => x =>
  (xs.unshift(x), xs);


const arrUnshiftf = x => xs =>
  (xs.unshift(x), xs);


const arrUnshiftFlat = xs => ys => {
  ys.forEach(x =>
    xs.unshift(x));

  return xs;
};


const arrUnzip = xss => // TODO: Absract from recursion with fold
  loop((acc = [[], []], i = 0) =>
    i === xss.length
      ? acc
      : recur((
          acc[0].push(xss[i] [0]),
          acc[1].push(xss[i] [1]),
          acc), i + 1));


const arrZip = xs => ys => // TODO: Absract from recursion with fold
  loop((acc = [], i = 0) => {
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return acc;

    else
      return recur(
        (acc.push([xs[i], ys[i]]), acc), i + 1);
  });


const arrZipBy = f => xs => ys => // TODO: Absract from recursion with fold
  loop((acc = [], i = 0) => {
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return acc;

    else
      return recur(
        (acc.push(f(xs[i]) (ys[i])), acc), i + 1);
  });


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


const formatDate = sep => (...fs) => date =>
  fs.map(f => f(date))
    .join(sep);


const getDay = invoke("getDate");


const getMonthDays = y => m =>
  new Date(y, m, 0).getDate();


const getMonth = invoke("getMonth");


const getYear = invoke("getFullYear");


const verifyDate = y => m => d =>
  typeof y !== "number" || typeof m !== "number" || typeof d !== "number" ? false
    : Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)? false
    : m <= 0 || m > 12 ? false
    : d <= 0 || d > getMonthDays(y) (m) ? false
    : true;


/******************************************************************************
***********************************[ FLOAT ]***********************************
******************************************************************************/


const roundBy = k => places => fp => {
  let [n, ex] = `${fp < 0 ? Math.abs(fp) : fp}e`.split('e'),
    r = Math[k](`${n}e${Number(ex) + places}`);

  [n, ex] = `${r}e`.split('e');
  r = Number(`${n}e${Number(ex) - places}`);

  return fp < 0 ? -r : r;
};


const toFixedFloat = places => fp =>
  String(round(places) (fp));


/***[Derived]*****************************************************************/


const ceil = roundBy("ceil");


const floor = roundBy("floor");


const round = roundBy("round");


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


/***[Arguments]***************************************************************/


const fromMultiArg = (...args) => [...args];


const infix = (x, ...args) =>
  arrFold(acc => (op, i) =>
    (i & 1) === 0
      ? op(acc)
      : acc(op)) (x) (args);


const swapMultiArg = (x, y) => [y, x];


const varArgs = f => {
  const go = args =>
    Object.defineProperties(
      arg => go(args.concat([arg])), {
        "runVarArgs": {get: function() {return f(args)}, enumerable: true},
        [TYPE]: {value: "VarArgs", enumerable: true}
      });

  return go([]);
};


/***[Composition]*************************************************************/


const comp = f => g => x =>
  f(g(x));


const comp3 = f => g => h => x =>
  f(g(h(x)));


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipe3 = h => g => f => x =>
  f(g(h(x)));


const on = f => g => x => y =>
  f(g(x)) (g(y));


const funVarComp = varComp({comp, id});


const funVarPipe = varPipe({pipe, id});


/***[Conditional Branching]***************************************************/


const cond = x => y => b =>
  b ? x : y;


const cond_ = b => x => y =>
  b ? x : y;


const guard = p => f => x =>
  p(x) ? f(x) : x;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


/***[Currying/Partial Application]********************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const curry5 = f => v => w => x => y => z =>
  f(v, w, x, y, z);


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const partialCurry = (f, ...args) =>
  varArgs(args_ => f(...args, ...args_));


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


const introspect = x =>
  x && TYPE in x
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


const memoThunk = (f, memo) => () =>
  memo === undefined
    ? (memo = f(), memo)
    : memo;


const orThrowOn = p => f => (e, msg) => x => {
  const r = f(x);
  
  if (p(r))
    throw new e(msg);
  
  else return r
};


const orThrowOnf = f => p => (e, msg) => x => {
  const r = f(x);
  
  if (p(r))
    throw new e(msg);
  
  else return r
};


const orThrowOnUnit = orThrowOn(x =>
  x === undefined
    || x === null
    || x === x === false
    || x.getTime && !Number.isNaN(x.getTime()));


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


/***[Predicate]***************************************************************/


const notp = p => x =>
  !p(x);


const notp2 = p => x => y =>
  !p(x) (y);


const notp3 = p => x => y => z =>
  !p(x) (y) (z);  


/***[Primitive]***************************************************************/


const app = f => x => f(x);


const _const = x => y => x;


const flip = f => y => x => f(x) (y);


const id = x => x;


const _let = f => f(); // simulates let binding as an expression


/***[Transducer]**************************************************************/


const mapper = f => reduce => acc => x =>
  reduce(acc) (f(x));


const filterer = p => reduce => acc => x =>
  p(x) ? reduce(acc) (x) : acc;


/***[Typeclass Functions]*****************************************************/


const funAp = f => g => x =>
  f(x) (g(x));


const funAppend = comp;


const funChain = f => g => x =>
  f(g(x)) (x);


const funContra = pipe;


const funEmpty = id;


const funJoin = f => x =>
  f(x) (x);


const funLiftA2 = f => g => h => x =>
  f(g(x)) (h(x));


const funMap = comp;


const funPrepend = pipe;


/***[Combinators]********************************************************************/


const orDefOn = p => f => def => x => {
  const r = f(x);
  
  if (p(r))
    return def;
  
  else return r
};


const orDefOnUnit = orDefOn(x =>
  x === undefined
    || x === null
    || x === x === false
    || x.getTime && !Number.isNaN(x.getTime()));


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


const abstractNew = cons => (...args) =>
  new cons(...args);


const invoke = k => (...args) => o =>
  o[k] (...args);


const objClone = o => {
  const p = {};

  for ([k, v] of objEntries(o))
    p[k] = v;

  return o;
};


const objFactory = (...fields) => (...values) => // TODO: revise
  values.reduce(
    (acc, value, i) =>
      (acc[fields[i]] = value, acc), {});


const objFactory_ = entries => // TODO: revise
  entries.reduce(
    (acc, [k, v]) =>
      (acc[k] = v, acc), {});


const objPathOr = def =>
  varArgs(arrFold(p => k => p[k] || def) (o));


const objUnion = o => p => {
  const q = {};

  for ([k, v] of objEntries(o))
    q[k] = v;

  for ([k, v] of objEntries(p))
    q[k] = v;

  return q;
};


const objUnionx = o => p => {
  for ([k, v] of objEntries(p))
    o[k] = v;

  return p;
};


const omitProps = (...ks) => o => // TODO: revise
  Object.keys(o).reduce(
    (acc, k) => ks.includes(k)
      ? acc
      : (acc[k] = o[k], acc), {});


const pickProps = (...ks) => o => // TODO: revise
  ks.reduce((acc, k) => (acc[k] = o[k], acc), {});


const thisify => f => f({}); // mimics this context


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


const strPadl = n => c => s =>
  c.repeat(n)
    .concat(s)
    .slice(-n);


const strPadr = n => c => s =>
  c.repeat(n)
    .concat(s)
    .slice(0, n);


const strReplaceAt = i => s => t =>
  t.slice(0, i) + s + t.slice(i + 1);


const strReplaceAtBy = i => f => s =>
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


/***[Monoid]******************************************************************/


const allEmpty = All(false);


/***[Semigroup]***************************************************************/


const allAppend = tx => ty =>
  All(tx.runAll && ty.runAll);


const allPrepend = allAppend;


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = struct("Any") (Any => b => Any(b));


/***[Monoid]******************************************************************/


const anyEmpty = Any(false);


/***[Semigroup]***************************************************************/


const anyAppend = tx => ty =>
  Any(tx.runAny || ty.runAny);


const anyPrepend = anyAppend;


/******************************************************************************
********************************[ COMPARATOR ]*********************************
******************************************************************************/


const Comparator = union("Comparator");


const LT = Object.assign(
  Comparator("LT"), {valueOf: () => -1});


const EQ = Object.assign(
  Comparator("EQ"), {valueOf: () => 0});


const GT = Object.assign(
  Comparator("GT"), {valueOf: () => 1});


/***[Foldable]****************************************************************/


const ctorCata = lt => eq => gt => tx =>
  match(tx, {
    type: "Comparator",
    LT: lt,
    EQ: eq,
    GT: gt
  });


/***[Monoid]******************************************************************/


const ctorEmpty = EQ;


/***[Semigroup]***************************************************************/


const ctorAppend = tx => ty =>
  ctorCata(LT) (ty) (GT) (tx);


const ctorPrepend = ctorAppend;


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


const Compare = struct("Compare") (Compare => f => Compare(f));


/***[Contravariant Functor]***************************************************/


const compContra = f => tf =>
  Compare(on(tf.runCompare) (f));


/***[Monoid]******************************************************************/


const compEmpty = Compare(x => y => EQ);


/***[Semigroup]***************************************************************/


const compAppend = tf => tg =>
  Compare(x => y =>
    ctorAppend(tf.runCompare(x) (y)) (tg.runCompare(x) (y)));


const compPrepend = tg => tf =>
  Compare(x => y =>
    ctorPrepend(tf.runCompare(x) (y)) (tg.runCompare(x) (y)));


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


const Comp = struct("Comp") (Comp => ttx => Comp(ttx));


/***[Applicative]*************************************************************/


const compOf = ({of1, of2}) => x =>
  Comp(of1(of2(x)));


const compAp = ({map1, ap1, ap2}) => ttf => ttx =>
  Comp(ap1(map1(ap2) (ttf.runComp)) (ttx.runComp));


/***[Functor]*****************************************************************/


const compMap = ({map1, map2}) => f => ttx =>
  Comp(map1(map2(f)) (ttx.runComp));


/******************************************************************************
*********************************[ CONSTANT ]**********************************
******************************************************************************/


const Const = struct("Const") (Const => x => Const(x));


/***[Functor]*****************************************************************/


const constMap = f => tx =>
  Const(tx.runConst);


/******************************************************************************
*******************************[ CONTINUATION ]********************************
******************************************************************************/


const Cont = struct("Cont") (Cont => k => Cont(k));


/***[Applicative]*************************************************************/


const contAp = tf => tx =>
  Cont(k => tf.runCont(f => tx.runCont(x => k(f(x)))));


const contLiftA2 = f => tx => ty =>
  contAp(contMap(f) (tx)) (ty);


const contOf = x => Cont(k => k(x));


/***[Combinators]*************************************************************/


const contReset = tx => // delimited continuations
  of(tx.runCont(id));
  

const contShift = f => // delimited continuations
  Cont(k => f(k).runCont(id));


/***[Functor]*****************************************************************/


const contMap = f => tx =>
  Cont(k => tx.runCont(x => k(f(x))));
                                  

/***[Monad]*******************************************************************/


const contChain = fm => mx =>
  Cont(k => mx.runCont(x => fm(x).runCont(y => k(y))));


const contChain2 = fm => mx => my =>
  Cont(k => mx.runCont(x => my.runCont(y => fm(x) (y).runCont(z => k(z)))));


const contJoin = mmx =>
  Cont(k => mmx.runCont(mx => mx.runCont(x => k(x))));


const contLiftM2 = f => mx => my =>
  Cont(k => mx.runCont(x => my.runCont(y => k(f(x) (y)))));


/******************************************************************************
***************************[ DEFERRED COMPUTATION ]****************************
******************************************************************************/


const Defer = struct("Defer") (Defer => thunk => Defer(thunk));


/***[Applicative]*************************************************************/


const defAp = tf => tx =>
  Defer(() => tf.runDefer() (tx.runDefer()));


const defOf = x => Defer(() => x);


/***[Functor]*****************************************************************/


const defMap = f => tx =>
  Defer(() => f(tx.runDefer()));


/***[Monad]*******************************************************************/


const defChain = fm => mx =>
  Defer(() => fm(mx.runDefer()).runDefer());


const defJoin = mmx =>
  Defer(() => mmx.runDefer().runDefer());


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const Left = x =>
  Either("Left", x);


const Right = x =>
  Either("Right", x);


/***[Foldable]****************************************************************/


const eithCata = left => right => tx =>
  match(tx, {
    type: "Either",
    get Left() {return left(tx.runEither)},
    get Right() {return right(tx.runEither)}
  });


/******************************************************************************
*******************************[ ENDOMORPHISM ]********************************
******************************************************************************/


const Endo = struct("Endo") (Endo => f => Endo(f));


/***[Monoid]******************************************************************/


const endoEmpty = Endo(id);


/***[Semigroup]***************************************************************/


const endoAppend = tf => tg => x =>
  Endo(tf.runEndo(tg.runEndo(x)));


const endoPrepend = tg => tf => x =>
  Endo(tf.runEndo(tg.runEndo(x)));


/******************************************************************************
********************************[ EQUIVALENT ]*********************************
******************************************************************************/


const Equiv = struct("Equiv") (Equiv => p => Equiv(p));


/***[Contravariant Functor]***************************************************/


const equivContra = f => tf =>
  Equiv(on(tf.runEquiv) (f));


/***[Monoid]******************************************************************/


const equivEmpty = Equiv(x => y => true);


/***[Semigroup]***************************************************************/


const equivAppend = tf => tg =>
  Equiv(x => y =>
    tf.runEquiv(x) (y) && tg.runEquiv(x) (y));


const equivPrepend = equivAppend;


/******************************************************************************
***********************************[ FIRST ]***********************************
******************************************************************************/


const First = struct("First") (First => f => First(f));


/***[Semigroup]***************************************************************/


const firstAppend = x => _ => x;


const firstPrepend = lastAppend;


/******************************************************************************
**********************************[ GETTER ]***********************************
******************************************************************************/


const Getter = struct("Getter") (Getter => f => Getter(f));


/***[Category]****************************************************************/


const getId = Getter(id);


const getComp = tx => ty =>
  Getter(x => tx.runGetter(ty.runGetter(x)));


const getComp3 = tx => ty => tz =>
  Getter(x => tx.runGetter(ty.runGetter(tz.runGetter(x))));


const getPipe = ty => tx =>
  Getter(x => tx.runGetter(ty.runGetter(x)));


const getPipe3 = tz => ty => tx =>
  Getter(x => tx.runGetter(ty.runGetter(tz.runGetter(x))));


const getVarComp = varComp({comp: getComp, id: getId});


const getVarPipe = varPipe({pipe: getPipe, id: getId});


/******************************************************************************
**********************************[ HISTORY ]**********************************
******************************************************************************/


// part of the histomorpishm

const History = union("History");


const Ancient = x => History("Ancient", x);


const Age = x => y => History("Age", [x, y, z]);


const history = alg => zero =>
  arrFoldr(x => acc => Age(x) (alg(x) (acc)) (acc))
    (Ancient(zero));


const headH = tx => {
  switch (tx[TAG]) {
    case "Ancient": return tx.runHistory;
    case "Age": return tx.runHistory[1];
    default: throw new UnionError("invalid tag");
  }
};


/******************************************************************************
************************************[ ID ]*************************************
******************************************************************************/


const Id = struct("Id") (Id => x => Id(x));


/***[Functor]*****************************************************************/


const idMap = f => tx =>
  f(tx.runId);


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


const Last = struct("Last") (Last => f => Last(f));


/***[Semigroup]***************************************************************/


const lastAppend = _ => y => y;


const LastPrepend = firstAppend;


/******************************************************************************
*****************************[ LAZY COMPUTATION ]******************************
******************************************************************************/


// Defer with memoization

const Lazy = structMemo("Lazy") (Lazy => thunk => Lazy(thunk));


/***[Applicative]*************************************************************/


const lazyAp = tf => tx =>
  Defer(() => tf.runLazy() (tx.runLazy()));


const lazyOf = x => Lazy(() => x);


/***[Functor]*****************************************************************/


const lazyMap = f => tx =>
  Lazy(() => f(tx.runLazy()));


/***[Monad]*******************************************************************/


const lazyChain = fm => mx =>
  Lazy(() => fm(mx.runLazy()).runLazy());


const lazyJoin = mmx =>
  Lazy(() => mmx.runLazy().runLazy());


/******************************************************************************
***********************************[ LENS ]************************************
******************************************************************************/


const Lens = struct("Lens") (Lens => o => Lens(o));


const objLens = k => Lens({
  get: o => o[k],
  
  set: o => v =>
    Object.assign({}, o, {[k]: v}),
  
  mod: o => f =>
    Object.assign({}, o, {[k]: f(o[k])}),

  del: o => {
    const p = Object.assign({}, o);
    delete p[k];
    return p;
  }
});


const arrLens = i => Lens({
  get: xs => xs[i],

  set: xs => x => {
    const ys = xs.concat([]);
    ys[i] = x;
    return ys;
  },

  mod: xs => f => {
    const ys = xs.concat([]);
    ys[i] = f(ys[i]);
    return ys;
  },

  del: xs => {
    const ys = xs.concat([]);
    delete ys[i]
    return ys;
  }
});


const mapLens = k => Lens({
  get: m => m.get(k),

  set: m => v => {
    const n = new Map(m);
    return n.set(k, v);
  },

  mod: m => f => {
    const n = new Map(m);
    return n.set(k, f(v));
  },

  del: m => {
    const n = new Map(m);
    return n.delete(k);
  }
});


const setLens = k => Lens({
  get: s => s.get(k),

  set: s => v => {
    const t = new Set(s);
    return t.add(k, v);
  },

  mod: s => f => {
    const t = new Set(s);
    return t.add(k, f(v));
  },

  del: s => {
    const t = new Set(s);
    return t.delete(k);
  }
});


const strLens = i => Lens({
  get: s => s[i],

  set: s => c =>
    strReplaceAt(i) (c) (s),

  mod: s => f =>
    strReplaceAtBy(i) (f) (s),

  del: s =>
    strDeleteAt(i) (s)
});


/***[Combinators]*************************************************************/


const fromPath = lens =>
  arrFold(acc => k =>
    (acc.push(lens(k)), acc))
      ([]);


/***[Composition]*************************************************************/

// TODO: Change to Category

const lensComp = tx => ty => Lens({
  get: o =>
    tx.runLens.get(ty.runLens.get(o)),

  set: o => x =>
    ty.runLens.set(o) (tx.runLens.set(ty.runLens.get(o)) (x)),

  mod: o => f =>
    ty.runLens.set(o) (tx.runLens.set(ty.runLens.get(o)) (f)),

  del: o =>
    ty.runLens.set(o) (tx.runLens.del(ty.runLens.get(o)))
});


const lensPipe = flip(lensComp);


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = struct("Max") (Max => f => Max(f));


/***[Monoid]******************************************************************/


const maxEmpty = minBound => Max(minBound);


/***[Semigroup]***************************************************************/


const maxAppend = max => x => y =>
  max(x) (y);


const maxPrepend = maxAppend;


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = struct("Min") (Min => f => Min(f));


/***[Monoid]******************************************************************/


const minEmpty = maxBound => Min(maxBound);


/***[Semigroup]***************************************************************/


const minAppend = min => x => y =>
  min(x) (y);


const minPrepend = minAppend;


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
*****************************[ ASYNC IN PARALLEL ]*****************************
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
*********************************[ PREDICATE ]*********************************
******************************************************************************/


const Pred = struct("Pred") (Pred => p => Pred(p));


/***[Contravariant Functor]***************************************************/


const predContra = f => tf =>
  x => Pred(tf.runPred(f(x)));


/***[Monoid]******************************************************************/


const predEmpty = Pred(x => true);


/***[Semigroup]***************************************************************/


const predAppend = tf => tg =>
  Pred(x => tf.runPred(x) && tg.runPred(x));


const predPrepend = predAppend;


/******************************************************************************
***********************************[ PRISM ]***********************************
******************************************************************************/


const Prism = struct("Prism") (Prism => o => Prism(o));


const objPrism = k => Prism({
  get: o =>
    k in o
      ? Some(o[k])
      : None,

  set: o => v =>
    Object.assign({}, o, {[k]: v}),

  mod: o => f =>
    k in o
      ? Object.assign({}, o, {[k]: f(o[k])}) : o,

  del: o => {
    if (k in o) {
      const p = Object.assign({}, o);
      delete p[k];
      return p;
    }

    else
      return o;
  }
});


/******************************************************************************
**********************************[ PRODUCT ]**********************************
******************************************************************************/


const Prod = struct("Prod") (Prod => n => Prod(n));


/***[Monoid]******************************************************************/


const prodEmpty = Prod(1);


/***[Semigroup]***************************************************************/


const prodAppend = tm => tn =>
  Sum(tm.runProd * tn.runProd);


const prodPrepend = prodAppend;


/******************************************************************************
**********************************[ READER ]***********************************
******************************************************************************/


const Reader = struct("Reader") (Reader => f => Reader(f));


/***[Combinators]*************************************************************/


const ask = Reader(id);


const asks = f =>
  readChain(x => readOf(f(x))) (ask);


const local = f => tg =>
  Reader(x => tg.runReader(f(x)));


/***[Applicative]**************************************************************/


const readAp = tf => tg =>
  Reader(x => tf.runReader(x) (tg.runReader(x)));


const readOf = x => Reader(_ => x);


/***[Functor]******************************************************************/


const readMap = f => tg =>
  Reader(x => f(tg.runReader(x)));


/***[Monad]********************************************************************/


const readChain = fm => mg =>
  Reader(x => fm(mg.runReader(x)).runReader(x));


const readJoin = mmf =>
  Reader(x => mmf.runReader(x).runReader(x));


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = struct("State") (State => f => State(f));


/***[Applicative]*************************************************************/


const stateOf = x => State(y => [x, y]);


/***[Combinators]*************************************************************/


const evalState = tf =>
  y => tf.runState(y) [0];


const execState = tf =>
  y => tf.runState(y) [1];


const gets = f =>
  stateChain(y => stateOf(f(x))) (stateGet);


const modify = f =>
  stateChain(y => statePut(f(y))) (stateGet);


const stateGet = State(y => [y, y]);


const statePut = y => State(_ => [null, y]);


/***[Monad]*******************************************************************/


const stateChain = fm => mg =>
  State(y => _let(([x, y_] = mg.runState(y)) => fm(x).runState(y_)));


/******************************************************************************
************************************[ SUM ]************************************
******************************************************************************/


const Sum = struct("Sum") (Sum => n => Sum(n));


/***[Monoid]******************************************************************/


const sumEmpty = Sum(0);


/***[Semigroup]***************************************************************/


const sumAppend = tm => tn =>
  Sum(tm.runSum + tn.runSum);


const sumPrepend = sumAppend;


/******************************************************************************
***********************************[ STEP ]************************************
******************************************************************************/


const Step = union("Step");


const Loop = x => Step("Loop", x);


const Done = x => Step("Done", x);


/******************************************************************************
*****************************[ ASYNC IN SEQUENCE ]*****************************
******************************************************************************/


// asynchronous computations in sequence

const Task = struct("Task") (Task => k => Task((res, rej) => k(res, rej)));


/***[Applicative]*************************************************************/


const tAp = tf => tx =>
  Task((res, rej) => tf.runTask(f => tx.runTask(x => res(f(x)), rej), rej));


const tLiftA2 = f => tx => ty =>
  tAp(tMap(f) (tx)) (ty);


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


const tChain = fm => mx =>
  Task((res, rej) => mx.runTask(x => fm(x).runTask(res, rej), rej));


const tChain2 = fm => mx => my =>
  Task((res, rej) => mx.runTask(x =>
    my.runTask(y =>
      fm(x) (y).runTask(res, rej), rej), rej));


const tJoin = mmx =>
  Task((res, rej) => mmx.runTask(mx => mx.runTask(res, rej), rej));


const tLiftM2 = f => mx => my =>
  tChain(mx) (x => tChain(my) (y => tOf(f(x) (y))));


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


/***[Combinators]*************************************************************/


const fromThese = (x, y) => tx =>
  match(tx) ({
    type: "These",
    get This() {return [tx.runThese, y]},
    get That() {return [x, tx.runThese]},
    get These() {return tx.runThese}
  });


/***[Foldable]****************************************************************/


const theseCata = _this => that => these => tx =>
  match(tx, {
    type: "These",
    get This() {return _this(tx.runThese)},
    get That() {return that(tx.runThese)},
    get These() {return these(...tx.runThese)}
  });


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = struct("Writer") (Writer => (x, y) => Writer([x, y]));


/***[Applicative]*************************************************************/


const writeOf = empty => x =>
  Writer(x, empty);


/***[Combinators]*************************************************************/


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


/***[Monad]*******************************************************************/


const writeChain = append => fm => mx =>
  mx.runWriter(([x, y]) => f(x).runWriter(([x_, y_]) => Writer(x_, append(y) (y_))));


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


const fileRead  = enc => path =>
  Task((res, rej) =>
    fs.readFile(path, enc, (e, s) =>
      e ? rej(e) : res(s)));


const fileScanDir = path =>
  Task((res, rej) =>
    fs.readdir(path, (e, ss) =>
      e ? rej(e) : res(ss)));


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {} // TODO

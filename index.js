/*
                                                                                 
                               _|              _|                                
   _|_|_|    _|_|_|  _|  _|_|      _|_|_|    _|_|_|_|  _|    _|  _|_|_|  _|_|    
 _|_|      _|        _|_|      _|  _|    _|    _|      _|    _|  _|    _|    _|  
     _|_|  _|        _|        _|  _|    _|    _|      _|    _|  _|    _|    _|  
 _|_|_|      _|_|_|  _|        _|  _|_|_|        _|_|    _|_|_|  _|    _|    _|  
                                   _|                                            
                                   _|                                            
*/


/******************************************************************************
*******************************************************************************
*********************************[ CONSTANTS ]*********************************
*******************************************************************************
******************************************************************************/


const NOT_FOUND = -1;


const TYPE = Symbol.toStringTag;


/******************************************************************************
*******************************************************************************
**********************************[ ERRORS ]***********************************
*******************************************************************************
******************************************************************************/


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
    

/***[Subclasses]**************************************************************/


class DateError extends ScriptumError {};


class EnumError extends ScriptumError {};


class FileError extends ScriptumError {};


class RegExpError extends ScriptumError {};


class SemigroupError extends ScriptumError {};


class UnionError extends ScriptumError {};


/******************************************************************************
*******************************************************************************
***************************[ WEAK HEAD NORMAL FORM ]***************************
*******************************************************************************
******************************************************************************/


/*** experimental ***/


class ProxyHandler {
  constructor(f) {
    this.f = f;
    this.memo = undefined;
  }

  apply(g, that, args) {
    if (this.memo === undefined)
      this.memo = g();

    return this.memo(...args);
  }

  defineProperty(g, k, descriptor) { debugger;
    if (this.memo === undefined)
      this.memo = g();

    Object.defineProperty(this.memo, k, descriptor);
    return true;
  }

  get(g, k) {
    if (this.memo === undefined)
      this.memo = g();

    if (typeof this.memo[k] === "function")
      return this.memo[k].bind(this.memo);

    else return this.memo[k];
  }

  has(g, k) {
    if (this.memo === undefined)
      this.memo = g();

    return k in this.memo;
  }

  set(g, k, v) {
    if (this.memo === undefined)
      this.memo = g();

    this.memo[k] = v;
    return true;
  }  
}


const thunk = f =>
  new Proxy(f, new ProxyHandler(f));


/******************************************************************************
*******************************************************************************
***************************[ ALGEBRAIC DATA TYPES ]****************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************[ PRODUCT TYPE ]********************************
******************************************************************************/


const struct = (type, o) =>
  (o[TYPE] = type.name || type, o);


/******************************************************************************
********************************[ UNION TYPE ]*********************************
******************************************************************************/


const union = type => (tag, o) =>
  (o[TYPE] = type.name || type, o.tag = tag.name || tag, o);


/***[Elimination Rule]********************************************************/


const match = (type, tx, o) =>
  tx[TYPE] !== type
    ? _throw(new UnionError("invalid type"))
    : o[tx.tag] (tx);


/******************************************************************************
****************************[ AUXILIARY FUNCTION ]*****************************
******************************************************************************/


const lazyProp = (k, v) => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = v()},
    configurable: true,
    enumerable: true});


/******************************************************************************
*******************************************************************************
********************************[ TRAMPOLINE ]*********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************[ TAIL RECURSION MODULO CONS ]*************************
******************************************************************************/


const rec = f => (...args) => {
  let step = f(...args);
  const stack = [];

  while (step.tag !== Base) {
    stack.push(step.f);
    step = f(...step.step.args);
  }

  let r = step.x;

  for (let i = stack.length - 1; i >= 0; i--) {
    r = stack[i] (r);
    
    if (r && r.tag === Base) {
      r = r.x;
      break;
    }
  }

  return r;
};


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


const tailRec = f => (...args) => {
    let step = f(...args);

    while (step.tag !== Base)
      step = f(...step.args);

    return step.x;
};


/******************************************************************************
******************************[ MONAD RECURSION ]******************************
******************************************************************************/


const monadRec = step => {
    while (step.tag !== Base)
      step = step.f(...step.args);

    return step.x;
};


/***[Monad]*******************************************************************/


const recChain = mx => fm =>
  mx.tag === Chain
    ? Chain(args => recChain(mx.f(...args)) (fm)) (mx.args)
    : fm(mx.x);


const recOf = Base;


/******************************************************************************
******************************[ MONAD RECURSION ]******************************
******************************************************************************/


const mutuRec = monadRec;


/******************************************************************************
******************************[ POST RECURSION ]*******************************
******************************************************************************/


const postRec = tx => {
  do {
    tx = tx.cont(id);
  } while (tx && tx.tag === "Cont")

  return cont;
};


/******************************************************************************
***********************************[ TAGS ]************************************
******************************************************************************/


const Base = x =>
  ({tag: Base, x});


const Call = (f, step) =>
  ({tag: Call, f, step});


const Chain = f => (...args) =>
  ({tag: Chain, f, args});


const Mutu = Chain;


const Step = (...args) =>
  ({tag: Step, args});


/******************************************************************************
*******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/***[Applicative]*************************************************************/


const apEff1 = ({map, ap}) => tx => ty =>
  ap(map(_const) (tx)) (ty);


const apEff2 = ({map, ap}) => tx => ty =>
  ap(mapEff(map) (id) (tx)) (ty);


/***[Ix]**********************************************************************/


const range = ({succ, gt}) => (lower, upper) =>
  arrUnfold(x =>
    gt(x) (upper)
      ? None
      : Some([x, succ(x)])) (lower);


const index = ({succ, eq}) => (lower, upper) => x =>
  tailRec((y = lower, i = 0) => // TODO: replace with fold
    eq(y) (upper) ? Base(None)
      : eq(x) (y) ? Base(Some(i))
      : Step(succ(y), i + 1));


const inRange = ({succ, eq, gt}) => (lower, upper) => x =>
  tailRec((y = lower) => // TODO: replace with fold
    gt(y) (upper) ? Base(false)
      : eq(x) (y) ? Base(true)
      : Step(succ(y)));


const rangeSize = ({succ, eq, gt}) => (lower, upper) =>
  tailRec((x = lower, n = 0) => // TODO: replace with fold
    gt(x) (upper)
      ? Base(n)
      : Step(succ(x), n + 1));


/***[Foldable]****************************************************************/


const all = ({fold, append, empty}) => p =>
  comp(tx => tx.all) (foldMap({fold, append, empty}) (comp(All) (p)));


const any = ({fold, append, empty}) => p =>
  comp(tx => tx.any) (foldMap({fold, append, empty}) (comp(Any) (p)));


const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty());


/***[Functor]*****************************************************************/


const mapEff = map => x =>
  map(_ => x);


/***[Monad]*******************************************************************/


const chainEff = chain => mx => my =>
  chain(_ => my) (mx);


const kleisli = chain => fm => gm => x =>
  chain(fm) (gm(x));


const kleisli_ = chain => gm => fm => x =>
  chain(fm) (gm(x));


const apM = ({chain, of}) => mf => mx =>
  chain(f => chain(x => of(f(x))) (mx)) (mf);


/******************************************************************************
*******************************************************************************
********************************[ TRANSDUCER ]*********************************
*******************************************************************************
******************************************************************************/


const dropper = n => reduce => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, acc)
      : reduce(acc) (x);
};


const dropperk = n => reduce => { 
  let m = 0;

  return acc => x => k =>
    m < n
      ? (m++, k(acc))
      : reduce(acc) (x).cont(k)};


const dropperNth = nth => reduce => { 
  let n = 0;

  return acc => x =>
    ++n % nth === 0
      ? acc
      : reduce(acc) (x);
};


const dropperNthk = nth => reduce => { 
  let n = 0;

  return acc => x => k =>
    ++n % nth === 0
      ? k(acc)
      : reduce(acc) (x).cont(k)};


const dropperWhile = p => reduce => {
  let drop = true;

  return acc => x => 
    drop && p(x)
      ? acc
      : (drop = false, reduce(acc) (x));
};


const dropperWhilek = p => reduce => {
  let drop = true;

  return acc => x =>
    Cont(k =>
      drop && p(x)
        ? k(acc)
        : (drop = false, reduce(acc) (x).cont(k)))};


const filterer = p => reduce => acc => x =>
  p(x)
    ? reduce(acc) (x)
    : acc;


const filtererk = p => reduce => acc => x =>
  Cont(k =>
    p(x)
      ? reduce(acc) (x).cont(k)
      : k(acc));


const mapper = f => reduce => acc => x =>
  reduce(acc) (f(x));


const mapperk = f => reduce => acc => x =>
  Cont(k =>
    reduce(acc) (f(x)).cont(k));


const taker = n => reduce => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, reduce(acc) (x))
      : acc;
};


const takerk = n => reduce => { 
  let m = 0;

  return acc => x =>
    Cont(k =>
      m < n
        ? (m++, reduce(acc) (x).cont(k))
        : acc)};


const takerNth = nth => reduce => { 
  let n = 0;

  return acc => x =>
    ++n % nth === 0
      ? reduce(acc) (x)
      : acc;
};


const takerNthk = nth => reduce => { 
  let n = 0;

  return acc => x =>
    Cont(k =>
      ++n % nth === 0
        ? reduce(acc) (x).cont(k)
        : acc)};


const takerWhile = p => reduce => acc => x =>
  p(x)
    ? reduce(acc) (x)
    : acc;


const takerWhilek = p => reduce => acc => x =>
  Cont(k =>
    p(x)
      ? reduce(acc) (x).cont(k)
      : acc);


/******************************************************************************
*******************************************************************************
******************************[ BUILT-IN TYPES ]*******************************
*******************************************************************************
******************************************************************************/


/***[Eq]**********************************************************************/


const eq = x => y => x === y;


const neq = x => y => x !== y;


/***[Ord]*********************************************************************/


const ascOrder = x => y => z =>
  x <= y && y <= z;


const compare = x => y =>
  x < y ? LT
    : x === y ? EQ
    : GT;
      

const descOrder = x => y => z =>
  x >= y && y >= z;


const gt = x => y => x > y;


const gte = x => y => x >= y;


const lt = x => y => x < y;


const lte = x => y => x <= y;


const min = x => y =>
  x < y ? x
    : x === y ? x
    : y;


const max = x => y =>
  x < y ? y
    : x === y ? x
    : x;


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Alternative]*************************************************************/


// arrAlt @Derived


// arrZero @Derived


/***[Applicative]*************************************************************/


const arrAp = tf => tx =>
  arrFold(acc => f =>
    arrAppend(acc)
      (arrMap(x => f(x)) (tx)))
        ([])
          (tf);


// arrApEff1 @Derived


// arrApEff2 @Derived


const arrLiftA2 = f => tx => ty =>
  arrAp(arrMap(f) (tx)) (ty);


const arrOf = x => [x];


/***[Clonable]****************************************************************/


const arrClone = xs =>
  xs.slice(0);


/***[Filterable]**************************************************************/


const arrFilter = p => xs =>
  xs.filter((x, i) => p(x, i) ? x : null);


/***[Foldable]****************************************************************/


// arrAll @Derived


// arrAny @Derived


const arrFold = f => acc => xs => {
  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


const arrFoldk = f => acc => xs =>
  tailRec((acc_, i) =>
    i === xs.length
      ? Base(acc_)
      : f(acc_) (xs[i], i).cont(acc__ => Step(acc__, i + 1))) (acc, 0);


const arrFoldkr = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(acc => f(xs[i]) (acc).cont(id), Step(i + 1))) (0);


// arrFoldMap @Derived


const arrFoldr = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), thunk(() => Step(i + 1))))
          (0);


const arrFoldr_ = f => acc => xs =>
  rec(i =>
    i === xs.length
      ? Base(acc)
      : Call(f(xs[i]), Step(i + 1))) (0);


const arrLen = xs => xs.length;


const arrNull = xs => xs.length === 0;


// arrProd @DERIVED


// arrSum @DERIVED


// TODO: add toArray, arrMax, arrMin


/***[Functor]*****************************************************************/


const arrMap = f => xs =>
  xs.map((x, i) => f(x, i));


const arrMapEff = mapEff(arrMap);


/***[Monad]*******************************************************************/


// arrApM @Derived


const arrChain = mx => fm =>
  arrFold(acc => x => arrAppend(acc) (fm(x))) ([]) (mx);


// arrJoin @Derived


const arrChainEff = chainEff(arrChain);


/***[Monoid]******************************************************************/


const arrConcat = ({append, empty}) =>
  arrFold(append) (empty());


const arrEmpty = () => [];


/***[Semigroup]***************************************************************/


const arrAppend = xs => ys =>
  xs.push.apply(xs, ys)


const arrPrepend = ys => xs =>
  xs.push.apply(xs, ys)


/***[Transduce]***************************************************************/


const arrTransduce = f => reduce =>
  arrFold(f(reduce));


const arrTransducek = f => reduce =>
  arrFoldk(f(reduce));


// TODO: add arrTransducer, arrTransducekr


/***[Traversable]*************************************************************/


const arrMapA = ({liftA2, of}) => f =>
  arrFold(acc => x => liftA2(arrSnoc) (f(x)) (acc)) (of([]));


// arrSeqA @DERIVED


/***[Unfoldable]**************************************************************/


const arrUnfold = f => x =>
  tailRec((acc, tx) =>
    match("Option", tx, {
      None: _ => Base(acc),
      Some: ({x: [x_, y]}) => Step(arrSnoc(x_) (acc), f(y))
    })) ([], f(x));


const arrUnfoldr = f => x =>
  match("Option", f(x), {
    None: _ => [],
    Some: ({x: [x_, y]}) => cons(x_) (thunk(() => unfoldr(f) (y)))
  });


/***[Misc. Combinators]*******************************************************/


const arrCons = x => xs =>
  (xs.unshift(x), xs);


const arrDedupe = xs => {
  const s = new Set();

  return arrFilter(x => {
    return s.has(x)
      ? null
      : (s.add(x), x);
  }) (xs);
};


const arrDedupeBy = f => xs => {
  const s = new Set();

  return arrFilter(x => {
    const r = f(x);
    
    return s.has(r)
      ? null
      : (s.add(r), x);
  }) (xs);
};


const arrDedupeOn = k => xs => {
  const s = new Set();

  return arrFilter(o =>
    s.has(o[k])
      ? null
      : (s.add(o[k]), o[k])) (xs);
};


const arrDel = i => xs =>
  (xs.splice(i, 1), xs);


const arrHead = xs =>
  xs.length === 0
    ? None
    : Some(xs[0]);


const arrHeadOr = def => xs =>
  xs.length === 0
    ? def
    : xs[0];


const arrInit = xs =>
  xs.slice(0, -1);


const arrLast = xs =>
  xs.length === 0
    ? None
    : Some(xs[xs.length - 1]);


const arrLastOr = def => xs =>
  xs.length === 0
    ? def
    : xs[xs.length - 1];


const arrMapAdjacent = f => n => xs =>
  tailRec((i = 0, acc = []) => // TODO: replace with fold
    i + n > xs.length
      ? Base(acc)
      : Step(i + 1, (acc.push(f(xs.slice(i, i + n))), acc)));


const arrMapChunk = f => n => xs =>
  tailRec((i = 0, remainder = xs.length % n, acc = []) => // TODO: replace with fold
    i >= xs.length - remainder
      ? Base(acc)
      : Step(i + n, remainder, (acc.push(f(xs.slice(i, i + n))), acc)));


const arrModOr = def => (i, f) => xs =>
  i in xs
    ? (xs[i] = f(xs[i]), xs)
    : xs[i] = def;


const arrPartition = f => xs =>
  xs.reduce((m, x) => // TODO: replace with fold
    _let((r = f(x), ys = m.get(r) || []) =>
      m.set(r, (ys.push(x), ys))), new Map());


const arrScan = f => x_ => xs =>
  tailRec((acc = [], x = x_, i = 0) => // TODO: replace with fold
    i === xs.length
      ? Base(acc)
      : Step(
        (acc.push(f(x) (xs[i])), acc),
        acc[acc.length - 1], i + 1));


const arrSet = (i, x) => xs =>
  (xs[i] = x, xs);


const arrSliceAt = (i, len) => xs =>
  xs.slice(i, i + len);


const arrSnoc = x => xs =>
  (xs.push(x), xs);


const arrSortBy = f => xs =>
  xs.sort((x, y) => f(x) (y));


const arrSplitAt = i => xs =>
  [xs, xs.splice(i + 1)];


const arrSplitBy = p => xs =>
  arrFoldk(
    acc => (x, i) =>
      Cont(Step =>
        p(x)
          ? Base(arrSplitAt(i) (xs))
          : Step(acc)))
              ([xs, []])
                (xs);


const arrTail = xs =>
  xs.slice(1);


const arrTranspose = matrix =>
  matrix[0].map((_, i) =>
    matrix.map(xs => xs[i]));


const arrUncons = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.shift(), xs]);
};


const arrUnconsOr = def => xs => {
  if (xs.length === 0)
    return [def, xs];

  else
    return [xs.shift(), xs];
};


const arrUnsnoc = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.pop(), xs]);
};


const arrUnsnocOr = def => xs => {
  if (xs.length === 0)
    return [def, xs];

  else
    return [xs.pop(), xs];
};


const arrUnzip = xss =>
  tailRec((acc = [[], []], i = 0) => // TODO: replace with fold
    i === xss.length
      ? Base(acc)
      : Step((
          acc[0].push(xss[i] [0]),
          acc[1].push(xss[i] [1]),
          acc), i + 1));


const arrZip = xs => ys =>
  tailRec((acc = [], i = 0) => { // TODO: replace with fold
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return Base(acc);

    else
      return Step(
        (acc.push([xs[i], ys[i]]), acc), i + 1);
  });


const arrZipBy = f => xs => ys =>
  tailRec((acc = [], i = 0) => { // TODO: replace with fold
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return Base(acc);

    else
      return Step(
        (acc.push(f(xs[i]) (ys[i])), acc), i + 1);
  });


/***[Derived]*****************************************************************/


const arrApEff1 = apEff1(
  {map: arrMap, ap: arrAp});


const arrApEff2 = apEff2(
  {map: arrMap, ap: arrAp});


const arrAlt = arrAppend;


const arrApM = apM({arrChain, arrOf});


const arrFoldMap = foldMap(
  {fold: arrFold, append: arrAppend, arrEmpty});


const arrJoin = arrConcat;


const arrZero = arrEmpty;


/******************************************************************************
**********************************[ BOOLEAN ]**********************************
******************************************************************************/


const and = x => y =>
  x && y;


const andp = p => q => x =>
  p(x) && q(x);


const imply = x => y =>
  !x || y;


const isFalse = x => x === false;


const isTrue = x => x === true;


const not = x => !x;


const notp = p => x => !p(x);


const or = x => y =>
  x || y;


const orp = p => q => x =>
  p(x) || q(x);


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


const dateParse = s => {
  const d = new Date(s);
  
  if (d.getTime === undefined || Number.isNaN(d.getTime()))
    return Left("invalid date string");

  else
    return Right(d);
};


const formatDate = sep => (...fs) => date =>
  fs.map(f => f(date))
    .join(sep);


const formatDay = digits => n => {
  switch (digits) {
    case 1: return n.toString();
    case 2: return strPadl(2) ("0") (n);

    default: throw new DateError("invalid number of digits");
  }
};


const formatMonth = (monthMap, abbrMonthMap) => digits => n => {
  switch (digits) {
    case 1: return (n + 1).toString();
    case 2: return strPadl(2) ("0") (n + 1);
    case 3: return abbrMonthMap[n];
    case 4: return monthMap[n];
    
    default: throw new DateError("invalid number of digits");
  }
};


const formatYear = digits => n => {
  switch (digits) {
    case 2: return n.toString().slice(digits);
    case 4: return n.toString();

    default: throw new DateError("invalid number of digits");
  }
};


// getDay @DERIVED


const getMonthDays = y => m =>
  new Date(new Date(y, m + 1, 1) - 1).getDate();


// getMonth @DERIVED


// getTimezoneOffet @DERIVED


// getYear @DERIVED


const isDate = x =>
  introspect(x) === "Date"
    && !Number.isNaN(x.getTime());


const isDateStr = s => {
  const [y, m, d] = s.split("-");

  if (String(Number(y)) !== y
    || Number(y) < 0)
      return false;

  else if (Number(m) < 1
    || Number(m) > 12)
      return false;

  else if (Number(d) < 1
    || Number(d) > getMonthDays(y) (Number(m)))
      return false;

  else
    return true; 
};


/******************************************************************************
***********************************[ FLOAT ]***********************************
******************************************************************************/


// ceil @Derived


// floor @Derived


const formatFloat = fracPlaces => f =>
  f.toFixed(fracPlaces)


const isFloatStr = s =>
  s.search(new RegExp("^\\d+\\.\\d+$")) !== NOT_FOUND;


// round @Derived


const roundBy = k => digits => fp => {
  let [n, ex] = `${fp < 0 ? Math.abs(fp) : fp}e`.split('e'),
    r = Math[k](`${n}e${Number(ex) + digits}`);

  [n, ex] = `${r}e`.split('e');
  r = Number(`${n}e${Number(ex) - digits}`);

  return fp < 0 ? -r : r;
};


const setFracSep = sep => s =>
  s.replace(".", sep);


const setGroupSep = sep => fracSep => s => {
  const [integral, fraction] = s.split(fracSep);
  
  return [
    integral.replace(/\B(?=(\d{3})+(?!\d))/g, sep),
    fraction]
      .join(fracSep);
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


/***[Applicative]*************************************************************/


const funAp = tf => tg => x =>
  tf(x) (tg(x));


const funLiftA2 = f => tg => th => x =>
  f(tg(x)) (th(x));


// funOf @Derived


/***[Composition]*************************************************************/


const comp = f => g => x =>
  f(g(x));


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const compBin = f => g => x => y =>
  f(g(x) (y));


const compOn = f => g => x => y =>
  f(g(x)) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipe_ = g => f => x => y =>
  f(x) (g(y));


const pipeBin = g => f => x => y =>
  f(g(x) (y));


const pipeOn = g => f => x => y =>
  f(g(x)) (g(y));


/***[Contravariant Functor]***************************************************/


const funContra = pipe;


/***[Currying/Partial Application]********************************************/


const curry = f => x => y =>
  f(x, y);


const curry3 = f => x => y => z =>
  f(x, y, z);


const curry4 = f => w => x => y => z =>
  f(w, x, y, z);


const curry5 = f => v => w => x => y => z =>
  f(v, w, x, y, z);


const curry6 = f => u => v => w => x => y => z =>
  f(u, v, w, x, y, z);


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


const uncurry5 = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);


const uncurry6 = f => (u, v, w, x, y, z) =>
  f(u) (v) (w) (x) (y) (z);


/***[Debugging]***************************************************************/


const debug = f => (...args) => {
  debugger;
  return f(...args);
};


const delay = f => ms => x =>
  Task((res, rej) => setTimeout(comp(res) (f), ms, x));


const log = s =>
  (console.log(s), s);


const taggedLog = tag => s =>
  (console.log(tag, s), s);


const trace = f =>
  eff(x => console.log(JSON.stringify(x) || x.toString()));


/***[Functor]*****************************************************************/


const funMap = comp;


/***[Impure]******************************************************************/


const eff = f => x =>
  (f(x), x); // aka tap


const introspect = x =>
  x && x[TYPE] !== undefined
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


const isUnit = x =>
  x === undefined
    || x === null
    || x === x === false // NaN
    || x.getTime !== undefined && Number.isNaN(x.getTime()); // Invalid Date


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


/***[Monad]*******************************************************************/


const funChain = mg => fm => x =>
  fm(mg(x)) (x);


const funJoin = mmf => x =>
  mmf(x) (x);


/***[Monoid]******************************************************************/


// funEmpty @Derived


/***[Primitive]***************************************************************/


const app = f => x => f(x);


const app_ = x => f => f(x);


const _const = x => _ => x;


const const_ = _ => y => y;


const fix = f => x => f(fix(f)) (x); // not stack safe


const flip = f => y => x => f(x) (y);


const id = x => x;


/***[Profunctor]**************************************************************/


const funDimap = f => g => h => x =>
  g(h(f(x)));


const funLmap = f => h => x =>
  h(f(x));


const funRmap = g => h => x =>
  g(h(x));


/***[Semigroup]***************************************************************/


const funAppend = comp;


const funPrepend = pipe;


/***[Infix Combinators]*******************************************************/


const infix = (x, f, y) =>
  f(x) (y);


const infix2 = (x, f, y, g, z) =>
  g(f(x) (y)) (z);


const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);


const infix4 = (v, f, w, g, x, h, y, i, z) =>
  i(h(g(f(v) (w)) (x)) (y)) (z);


const infix5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z);


const infix6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z);


const infixM2 = (λ, f, x, g, y) =>
  f(x_ =>
    λ(x_, α => g(y_ =>
      α(y_, id)) (y))) (x);


const infixM3 = (λ, f, x, g, y, h, z) =>
  f(x_ =>
    λ(x_, α => g(y_ =>
      α(y_, β => h(z_ =>
        β(z_, id)) (z))) (y))) (x);


const infixM4 = (λ, f, w, g, x, h, y, i, z) =>
  f(w_ =>
    λ(w_, α => g(x_ =>
      α(x_, β => h(y_ =>
        β(y_, γ => i(z_ =>
          γ(z_, id)) (z))) (y))) (x))) (w);



const infixM5 = (λ, f, v, g, w, h, x, i, y, j, z) =>
  f(v_ =>
    λ(v_, α => g(w_ =>
      α(w_, β => h(x_ =>
        β(x_, γ => i(y_ =>
          γ(y_, δ => j(z_ =>
            δ(z_, id)) (z))) (y))) (x))) (w))) (v);



const infixM6 = (λ, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(u_ =>
    λ(u_, α => g(v_ =>
      α(v_, β => h(w_ =>
        β(w_, γ => i(x_ =>
          γ(x_, δ => j(y_ =>
            δ(y_, ε => k(z_ =>
              ε(z_, id)) (z))) (y))) (x))) (w))) (v))) (u);


const infixr = (y, f, x) =>
  f(x) (y);


const infixr2 = (x, f, y, g, z) =>
  f(x) (g(y) (z));


const infixr3 = (w, f, x, g, y, h, z) =>
  f(w) (g(x) (h(y) (z)));


const infixr4 = (v, f, w, g, x, h, y, i, z) =>
  f(v) (g(w) (h(x) (i(y) (z))));


const infixr5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  f(u) (g(v) (h(w) (i(x) (j(y) (z)))));


const infixr6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  f(t) (g(u) (h(v) (i(w) (j(x) (k(y) (z))))));


const infixrM2 = (x, f, y, g, λ) =>
  f(x) (x_ =>
    λ(x_, α => g(y) (y_ =>
      α(y_, id))));


const infixrM3 = (x, f, y, g, z, h, λ) =>
  f(x) (x_ =>
    λ(x_, α => g(y) (y_ =>
      α(y_, β => h(z) (z_ =>
        β(z_, id))))));


const infixrM4 = (w, f, x, g, y, h, z, i, λ) =>
  f(w) (w_ =>
    λ(w_, α => g(x) (x_ =>
      α(x_, β => h(y) (y_ =>
        β(y_, γ => i(z) (z_ =>
          γ(z_, id))))))));


const infixrM5 = (v, f, w, g, x, h, y, i, z, j, λ) =>
  f(v) (v_ =>
    λ(v_, α => g(w) (w_ =>
      α(w_, β => h(x) (x_ =>
        β(x_, γ => i(y) (y_ =>
          γ(y_, δ => j(z) (z_ =>
            δ(z_, id))))))))));


const infixrM6 = (u, f, v, g, w, h, x, i, y, j, z, k, λ) =>
  f(u) (u_ =>
    λ(u_, α => g(v) (v_ =>
      α(w_, β => h(w) (w_ =>
        β(x_, γ => i(x) (x_ =>
          γ(y_, δ => j(y) (y_ =>
            δ(y_, ε => k(z) (z_ =>
              ε(z_, id))))))))))));


/***[Misc. Combinators]*******************************************************/


const appr = (f, y) => x => f(x) (y); // right section


const apply = f =>
  arrFold(g => x => g(x)) (f);


const apply_ = f => args => 
  f(...args);


const guard = p => f => x =>
  p(x) ? f(x) : x;


const _let = f => f();


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


const select11 = m => (ks, vs) => k =>
  vs[m.get(ks.indexOf(k))];


const select1N = m => (ks, vs) => k =>
  arrMap(l => vs[l])
    (m.get(ks.indexOf(k)));


/***[Derived]*****************************************************************/


const funEmpty = () => id;


const funOf = _const;


/******************************************************************************
*********************************[ GENERATOR ]*********************************
******************************************************************************/


const _enum = function* (n) {
  while (true)
    yield n++;
};


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
*****************************[ ITERATOR/ITERABLE ]*****************************
******************************************************************************/


const itFilter = ({append, empty}) => p =>
  itFold(acc => x =>
    p(x)
      ? append(acc) (x)
      : acc)
        (empty());


const itFold = f => acc => it => {
  for (let x of it)
    acc = f(acc) (x);

  return acc;
};


const itMap = ({append, empty}) => f =>
  itFold(acc => x =>
    append(acc) (f(x)))
      (empty());


/******************************************************************************
************************************[ MAP ]************************************
******************************************************************************/


/***[Functor]*****************************************************************/


const mapMap = f => m => {
  let n = new Map();
  
  for (const [k, v] of m)
    n.set(k, f(v));
  
  return n;
};


/***[Misc. Combinators]*******************************************************/


const mapDel = k => m =>
  m.delete(k);


const mapGet = k => m =>
  m.has(k)
    ? Some(m.get(k))
    : None;


const mapGetOr = def => k => m =>
  m.has(k)
    ? m.get(k)
    : def;


const mapModOr = def => (k, f) => m =>
  m.has(k)
    ? m.set(k, f(m.get(k)))
    : m.set(k, def);


const mapSet = (k, v) => m =>
  m.set(k, v);


const mapSetM = ({append, empty}) => (k, v) => m =>
  m.has(k)
    ? m.set(k, append(m.get(k)) (v))
    : m.set(k, append(empty()) (v));


/******************************************************************************
**********************************[ NUMBER ]***********************************
******************************************************************************/


/***[Bounded]*****************************************************************/


const numMaxBound = Number.MAX_SAFE_INTEGER;


const numMinBound = Number.MIN_SAFE_INTEGER;


/***[Enum]********************************************************************/


const numFromEnum = id;


const numPred = n => n === numMinBound
  ? _throw(new EnumError("enumeration out of bound"))
  : n - 1;


const numSucc = n => n === numMaxBound
  ? _throw(new EnumError("enumeration out of bound"))
  : n + 1;


const numToEnum = id;


/***[Eq]**********************************************************************/


const numEq = eq;


const numNeq = neq;


/***[Ord]**********************************************************************/


const numCompare = compare;


const numGt = gt;


const numGte = gte;


const numLt = lt;


const numLte = lte;


const numMin = min;


const numMax = max;


/***[Misc. Combinators]*******************************************************/


const isIntStr = s =>
  s.search(new RegExp("^\\d+$")) !== NOT_FOUND;


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


const invoke = k => (...args) => o =>
  o[k] (...args);


const _new = cons => (...args) =>
  new cons(...args);


const objClone = o => {
  const p = {};

  for (k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


const objDel = k => o =>
  (delete o[k], o);


const objGet = k => o =>
  k in o
    ? Some(o[k])
    : None;


const objGetOr = def => k => o =>
  k in o ? o[k] : def;


const objMemo = k => f => o =>
  Object.defineProperty(o, k, {get: function() {
    return x => {
      const r = f(x);
      delete this[k];
      this[k] = () => r;
      return r;
    };
  }, configurable: true});


const objModOr = def => (k, f) => o =>
  k in o
    ? (o[k] = f(o[k]), o)
    : (o[k] = def, o);


const objPathOr = def => (...ks) => o =>
  ks.reduce((acc, k) => acc && acc[k] || def, o);


const objSet = (k, v) => o =>
  (o[k] = v, o);


const objUnion = o => p => { // TODO: replace with getter/setter safe version
  for ([k, v] of objEntries(p))
    o[k] = v;

  return o;
};


const thisify = f => f({});


/******************************************************************************
************************************[ SET ]************************************
******************************************************************************/


/***[Functor]*****************************************************************/


const setMap = f => s => {
  const t = new Set();
  
  for (const x of s)
    t.add(f(x));
  
  return t;
};


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


/***[Foldable]****************************************************************/


const strFold = f => acc => s => {
  for (let i = 0; i < s.length; i++)
    [acc, i] = f(acc) (s, i);

  return acc;
};


const strLen = s => s.length;


const strNull = s => s === "";


/***[Semigroup]***************************************************************/


const strAppend = s => t => s + t;


const strPrepend = t => s => s + t;


/***[Regular Expressions]*****************************************************/


const strDel = (r, flags) => s =>
  s.replace(new RegExp(r, flags), "");


const strMatch = (r, flags) => s => {
  const xs = s.match(new RegExp(r, flags));

  if (xs === null)
    return Matched(None);

  else if (!("index" in xs))
    throw new RegExpError(`invalid greedy regular expression`);

  else if (xs.groups === undefined)
    xs.groups = {}; // add empty group instead of undefined

  xs.relIndex = xs.index; // add relative index in case of multiple matches
  xs.relInput = xs.input; // add relative input in case of multiple matches
  return Matched(Some(xs));
};


const strMatchAll = (r, flags) => s_ =>
  tailRec((acc = [], s = s_, i = 0) => {
    if (s === "")
      return Base(acc);

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.mat.tag) { // TODO: replace with match
        case "None": return Base(acc);

        case "Some": {
          const xs = tx.mat.some;
          xs.index += i;
          xs.input = s_;

          return Step(
            (acc.push(tx), acc),
            s_.slice(xs.index + xs[0].length),
            xs.index + xs[0].length);
        }

        default: _throw(new UnionError("unknown tag"));
      }
    }
  });


const strMatchLast = (r, flags) => s_ =>
  tailRec((acc = Matched(None), s = s_, i = 0) => {
    if (s === "")
      return Base(acc);

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.mat.tag) { // TODO: replace with match
        case "None": return Base(acc);

        case "Some": {
          const xs = tx.mat.some;
          xs.index += i;
          xs.input = s_;

          return Step(
            tx,
            s_.slice(xs.index + xs[0].length),
            xs.index + xs[0].length);
        }

        default: _throw(new UnionError("unknown tag"));
      }
    }
  });


const strMatchNth = nth_ => (r, flags) => s_ =>
  tailRec((acc = Matched(None), s = s_, i = 0, nth = 0) => {
    if (nth_ === nth)
      return Base(acc);

    else if (s === "")
      return Base(Matched(None));

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.mat.tag) { // TODO: replace with match
        case "None": return Base(acc);

        case "Some": {
          const xs = tx.mat.some;
          xs.index += i;
          xs.input = s_;

          return Step(
            tx,
            s_.slice(xs.index + xs[0].length),
            xs.index + xs[0].length,
            nth + 1);
        }

        default: _throw(new UnionError("unknown tag"));
      }
    }
  });


const strMod = (r, f, flags) => s =>
  s.replace(new RegExp(r, flags), f);


const strNormalize = (...pairs) => s =>
  arrFold(acc => ([from, to]) =>
    strSet(from, to, "gi") (acc)) (s) (pairs);
      
      
const strNormalizeBy = (...pairs) => s =>
  arrFold(acc => ([from, f]) =>
    strMod(from, f, "gi") (acc)) (s) (pairs);


const strSet = (r, t, flags) => s =>
  s.replace(new RegExp(r, flags), t);


/***[Misc. Combinators]*******************************************************/


const strCapWord = s => // TODO: add word separators like "-"
  s[0].toUpperCase() + s.slice(1);


const strChunk = n =>
  strFold(
    acc => (s, i) =>
      [arrAppend(acc) ([s.slice(i, i + n)]), i])
        ([]);


const strExtract = (i, len) => s => // TODO: revise
  i >= s.length
    ? None
    : Some([s.slice(i, i + len), s.slice(0, i) + s.slice(i + len)]);


const strExtractOr = def => (i, len) => s => // TODO: revise
  i >= s.length
    ? [def, s]
    : [s.slice(i, i + len), s.slice(0, i) + s.slice(i + len)];


const strInsert = (t, i) => s => // TODO: revise
  s.slice(0, i + 1) + t + s.slice(i + 1);


const strLocaleCompare = locale => s => t => {
  switch (s.localeCompare(t, locale)) {
    case -1: return LT;
    case 0: return EQ;
    case 1: return GT;
  }
};


const strPadl = n => c => s =>
  c.repeat(n)
    .concat(s)
    .slice(-n);


const strPadr = n => c => s =>
  s.concat(
    c.repeat(n))
      .slice(0, n);


const strSliceAt = (i, len) => s =>
  s.slice(i, i + len);


const strSplitAt = i => s =>
  [s.slice(0, i + 1), s.slice(i + 1)];


const strSplitBy = p =>
  strFold(
    acc => (s, i) =>
      p(s[i])
        ? [strSplitAt(i) (s), s.length]
        : [acc, i])
            (["", ""]);


const strSplitWords = blacklist => s => {
  const xs = s.split(
    new RegExp(`[^\\p{L}\\p{N}${blacklist}]+(?=\\p{L}|$)`, "gu"));

  if (xs[xs.length - 1] === "")
    xs.pop();

  return xs;
};


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const arrSeqA = flip(arrMapA) (id);


const getDay = d => d.getDate();


const getMonth = d => d.getMonth();


const getYear = d => d.getFullYear();


/******************************************************************************
*******************************************************************************
***********************[ FUNCTIONAL PROGRAMMING TYPES ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
************************************[ ALL ]************************************
******************************************************************************/


const All = all => struct("All", {all});


/***[Monoid]******************************************************************/


const allEmpty = () => All(true);


/***[Semigroup]***************************************************************/


const allAppend = tx => ty =>
  All(tx.all && ty.all);


const allPrepend = allAppend;


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = any => struct("Any", {any});


/***[Monoid]******************************************************************/


const anyEmpty = () => Any(false);


/***[Semigroup]***************************************************************/


const anyAppend = tx => ty =>
  Any(tx.any || ty.any);


const anyPrepend = anyAppend;


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


const Compare = cmp => struct("Compare", {cmp});


/***[Contravariant Functor]***************************************************/


const cmpContra = f => tf =>
  Compare(compOn(tf.cmp) (f));


/***[Monoid]******************************************************************/


const cmpEmpty = () => Compare(x => y => EQ);


/***[Semigroup]***************************************************************/


const cmpAppend = tf => tg =>
  Compare(x => y =>
    ordAppend(tf.cmp(x) (y)) (tg.cmp(x) (y)));


const cmpPrepend = flip(cmpAppend);


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


const Comp = comp => struct("Comp", {comp});


/***[Applicative]*************************************************************/


const compOf = ({of1, of2}) => x =>
  Comp(of1(of2(x)));


const compAp = ({map1, ap1, ap2}) => ttf => ttx =>
  Comp(ap1(map1(ap2) (ttf.comp)) (ttx.comp));


/***[Functor]*****************************************************************/


const compMap = ({map1, map2}) => f => ttx =>
  Comp(map1(map2(f)) (ttx.comp));


/******************************************************************************
*********************************[ CONSTANT ]**********************************
******************************************************************************/


const Const = const_ => struct("Const", {const: const_});


/***[Applicative]*************************************************************/


const constOf = x => Const(x);


/***[Functor]*****************************************************************/


const constMap = f => tx =>
  Const(tx.const);


/******************************************************************************
*******************************[ CONTINUATION ]********************************
******************************************************************************/


const Cont = cont => struct("Cont", {cont});


const cont = f => x =>
  Cont(k => k(f(x))); 


const cont2 = f => x => y =>
  Cont(k => k(f(x) (y)));


/***[Applicative]*************************************************************/


const contAp = tf => tx =>
  Cont(k => tf.cont(f => tx.cont(x => k(f(x)))));


const contLiftA2 = f => tx => ty =>
  contAp(contMap(f) (tx)) (ty);


const contOf = x => Cont(k => k(x));


/***[Functor]*****************************************************************/


const contMap = f => tx =>
  Cont(k => tx.cont(x => k(f(x))));
                                  

/***[Monad]*******************************************************************/


const contChain = mx => fm =>
  Cont(k => mx.cont(x => fm(x).cont(y => k(y))));


const contJoin = mmx =>
  Cont(k => mmx.cont(mx => mx.cont(x => k(x))));


/***[Misc. Combinators]*******************************************************/


const contReset = tx => // delimited continuations
  contOf(tx.cont(id));
  

const contShift = f => // delimited continuations
  Cont(k => f(k).cont(id));


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const either = left => right => tx =>
  match("Either", tx, {
    Left: ({left: x}) => left(x),
    Right: ({right: y}) => right(y)
  });


const Left = left =>
  Either(Left, {left});


const Right = right =>
  Either(Right, {right});


/******************************************************************************
*******************************[ ENDOMORPHISM ]********************************
******************************************************************************/


const Endo = endo => struct("Endo", {endo});


/***[Monoid]******************************************************************/


const endoEmpty = () => Endo(id);


/***[Semigroup]***************************************************************/


const endoAppend = tf => tg => x =>
  Endo(tf.endo(tg.endo(x)));


const endoPrepend = flip(endoAppend);


/******************************************************************************
********************************[ EQUIVALENT ]*********************************
******************************************************************************/


const Equiv = equiv => struct("Equiv", {equiv});


/***[Contravariant Functor]***************************************************/


const equivContra = f => tf =>
  Equiv(compOn(tf.equiv) (f));


/***[Monoid]******************************************************************/


const equivEmpty = () => Equiv(x => y => true);


/***[Semigroup]***************************************************************/


const equivAppend = tf => tg =>
  Equiv(x => y =>
    tf.equiv(x) (y) && tg.equiv(x) (y));


const equivPrepend = equivAppend;


/******************************************************************************
***********************************[ FIRST ]***********************************
******************************************************************************/


const First = first => struct("First", {first});


/***[Semigroup]***************************************************************/


const firstAppend = x => _ => x;


// firstPrepend @Derived


/******************************************************************************
******************************[ GETTER (OPTICS) ]******************************
******************************************************************************/


const Lens = lens => struct("Lens", {lens});


/***[Instances]***************************************************************/


// Object


const objGetter = k =>
  Lens(_ => ft => o =>
    ft(o[k]));


/***[Category]****************************************************************/


const getComp = tx => ty =>
  Lens(x => tx.lens() (ty.lens() (x)));


const getComp3 = tx => ty => tz =>
  Lens(x => tx.lens() (ty.lens() (tz.lens() (x))));


const getId = Lens(id);


/***[Misc. Combinators]*******************************************************/


const getGet = tx => o =>
  tx.lens(Const) (o)
    .const;


/******************************************************************************
************************************[ ID ]*************************************
******************************************************************************/


const Id = id => struct("Id", {id});


/***[Applicative]*************************************************************/


const idOf = x => Id(x);


/***[Functor]*****************************************************************/


const idMap = f => tx =>
  Id(f(tx.id));


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


const Last = last => struct("Last", {last});


/***[Semigroup]***************************************************************/


const lastAppend = _ => y => y;


const lastPrepend = firstAppend;


/******************************************************************************
***********************[ LAZY (LAZY EVAL WITH SHARING) ]***********************
******************************************************************************/


const Lazy = lazy => struct(Lazy, {get lazy() {
    delete this.lazy
    return this.lazy = lazy();
}});


/***[Applicative]*************************************************************/


const lazyAp = tf => tx =>
  Lazy(() => tf.lazy(tx.lazy));


const lazyOf = x => Lazy(() => x);


/***[Functor]*****************************************************************/


const lazyMap = f => tx =>
  Lazy(() => f(tx.lazy));


/***[Monad]*******************************************************************/


const lazyChain = mx => fm =>
  Lazy(() => fm(mx.lazy).lazy);


const lazyJoin = mmx =>
  Lazy(() => mmx.lazy.lazy);


/******************************************************************************
*******************************[ LENS (OPTICS) ]*******************************
******************************************************************************/


// constructor defined @getter


/***[Instances]***************************************************************/


// Array


const arrLens_ = ({set, del}) => i =>
  Lens(map => ft => xs =>
    map(x => {
      if (x === null)
        return del(i) (xs);

      else
        return set(i, x) (xs);
    }) (ft(xs[i])));


const arrLens = arrLens_({set: arrSet, del: arrDel});


// Map


const mapLens_ = ({set, del}) => k =>
  Lens(map => ft => m =>
    map(v => {
      if (v === null)
        return del(k) (m);

      else 
        return set(k, v) (m)
    }) (ft(m.get(k))));


const mapLens = mapLens_({set: mapSet, del: mapDel});


// Object


const objLens_ = ({set, del}) => k =>
  Lens(map => ft => o =>
    map(v => {
      if (v === null)
        return del(k) (o);

      else 
        return set(k, v) (o)
    }) (ft(o[k])));


const objLens = objLens_({set: objSet, del: objDel});


// String


const strLens = (i, len) => // String is immutable hence no typeclass functions
  Lens(map => ft => s =>
    map(t => {
      const tx = strExtract(i, len) (s);

      switch (tx.tag) { // TODO: replace with match
        case "None": return t;

        case "Some":
          return strInsert(t, i - 1) (tx.opt[1]);
      }
    })
      (ft(s.slice(i, len + i))));


/***[Category]****************************************************************/


const lensComp = tx => ty =>
  Lens(map => ft =>
    tx.lens(map) (ty.lens(map) (ft)));


const lensComp3 = tx => ty => tz =>
  Lens(map => ft =>
    tx.lens(map) (ty.lens(map) (tz.lens(map) (ft))));


const lensId = Lens(id);


/***[Misc. Combinators]*******************************************************/


const lensDel = tx => o =>
  tx.lens(idMap) (_const(Id(null))) (o);


const lensGet = tx => o =>
  tx.lens(constMap) (Const) (o)
    .const;


const lensMod = tx => f => o =>
  tx.lens(idMap) (v => Id(f(v))) (o);


const lensSet = tx => v => o =>
  tx.lens(idMap) (_const(Id(v))) (o);


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


const List = union("List");


const Nil = List("Nil", {});


const Cons = head => tail => List(Cons, {head, tail});


/***[Misc. Combinators]********************************************************/


const listCons = x => xs =>
  new Pair(x, xs);


/******************************************************************************
**************************[ MATCHED (REGEXP RESULT) ]**************************
******************************************************************************/


const Matched = mat => struct("Matched", {mat});


const matched = x => tx =>
  match("Option", tx.mat, {
    None: _ => x,
    Some: ({some: y}) => y
  });


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = max => struct("Max", {max});


/***[Monoid]******************************************************************/


const maxEmpty = minBound => () => Max(minBound);


/***[Semigroup]***************************************************************/


const maxAppend = max => x => y =>
  max(x) (y);


const maxPrepend = maxAppend;


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = min => struct("Min", {min});


/***[Monoid]******************************************************************/


const minEmpty = maxBound => () => Min(maxBound);


/***[Semigroup]***************************************************************/


const minAppend = min => x => y =>
  min(x) (y);


const minPrepend = minAppend;


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


const Option = union("Option");


const option = none => some => tx =>
  match("Option", tx, {
    None: _ => none,
    Some: ({some: x}) => some(x)
  });


const None = Option("None", {});


const Some = some => Option(Some, {some});


/***[Applicative]*************************************************************/


const optAp = tf => tx =>
  match("Option", tf, {
    None: _ => None,
    Some: ({some: f}) => {
      return match("Option", tx, {
        None: _ => None,
        Some: ({some: x}) => Some(f(x))
      });
    }
  });


const optLiftA2 = f => tx => ty =>
  optAp(optMap(f) (tx)) (ty);


const optOf = x => Some(x);


/***[Functor]*****************************************************************/


const optMap = f => tx =>
  match("Option", tx, {
    None: _ => None,
    Some: ({some: x}) => Some(f(x))
  });


/***[Monad]*******************************************************************/


const optChain = mx => fm =>
  match("Option", mx, {
    None: _ => None,
    Some: ({some: x}) => fm(x)
  });


const optChainT = ({chain, of}) => mmx => fmm =>
  chain(mmx)
    (mx =>
      match("Option", mx, {
        None: _ => of(None),
        Some: ({some: x}) => fmm(x)
      }));


/******************************************************************************
*********************************[ ORDERING ]**********************************
******************************************************************************/


const Ordering = ord => union("Ordering");


const ordering = lt => eq => gt => tx =>
  match("Ordering", tx, {
    LT: _ => lt,
    EQ: _ => eq,
    GT: _ => gt
  });


const LT = Ordering("LT",
  {get ord() {return LT}, valueOf: () => -1});


const EQ = Ordering("EQ",
  {get ord() {return EQ}, valueOf: () => 0});


const GT = Ordering("GT",
  {get ord() {return GT}, valueOf: () => 1});


/***[Monoid]******************************************************************/


const ordEmpty = () => EQ;


/***[Semigroup]***************************************************************/


const ordAppend = tx => ty =>
  ordering(LT) (ty) (GT) (tx);


const ordPrepend = ordAppend;


/******************************************************************************
***********************[ PARALLEL (ASYNC IN PARALLEL) ]************************
******************************************************************************/


// TODO: review


/*** experimental ***/


const Parallel = par => struct(
  "Parallel",
  thisify(o => {
    o.par = (res, rej) => k(x => {
      o.par = l => l(x);
      return res(x);
    }, rej);
    
    return o;
  }));


const parallel = _ => tf.par;


/***[Applicative]*************************************************************/


const parAp = tf => tx =>
  Parallel((res, rej) =>
    parAnd(tf) (tx).par(([f, x]) => res(f(x)), rej));


const parOf = x => Parallel((res, rej) => res(x));


/***[Functor]*****************************************************************/


const parMap = f => tx =>
  Parallel((res, rej) => tx.par(x => res(f(x)), rej));


/***[Monoid]******************************************************************/


const parEmpty = () => Parallel((res, rej) => null);


/***[Semigroup]***************************************************************/


// parAppend @Derived


// parPrepend @Derived


/***[Misc. Combinators]*******************************************************/


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
      tf.par(...guard(res, rej, 0)),
      tg.par(...guard(res, rej, 1))));
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
      tf.par(...guard(res, rej)),
      tg.par(...guard(res, rej))))
};


const parAll =
  ts =>
    arrFold(acc => tf =>
      parMap(([xs, x]) =>
        (xs.push(x), xs))
          (parAnd(acc) (tf)))
            (parOf([]))
              (ts);


const parAny =
  arrFold(acc => tf =>
    parOr(acc) (tf))
      (parEmpty());


/***[Derived]*****************************************************************/


const parAppend = parOr;


const parPrepend = parOr;


/******************************************************************************
*********************************[ PREDICATE ]*********************************
******************************************************************************/


const Pred = pred => struct("Pred", {pred});


/***[Contravariant Functor]***************************************************/


const predContra = f => tf =>
  x => Pred(tf.pred(f(x)));


/***[Monoid]******************************************************************/


const predEmpty = () => Pred(x => true);


/***[Semigroup]***************************************************************/


const predAppend = tf => tg =>
  Pred(x => tf.pred(x) && tg.pred(x));


const predPrepend = predAppend;


/******************************************************************************
******************************[ PRISM (OPTICS) ]*******************************
******************************************************************************/


// constructor defined @getter


/***[Instances]***************************************************************/


// Either


const leftPrism =
  Lens(({map, of}) => ft => tx =>
    match("Either", tx, {
      Left: ({left: x}) => map(Left) (ft(x)),
      Right: _ => of(tx)
    }));


const rightPrism =
  Lens(({map, of}) => ft => tx =>
    match("Either", tx, {
      Left: _ => of(tx),
      Right: ({right: y}) => map(Right) (ft(y))
    }));


/***[Misc. Combinators]*******************************************************/


const prismGet = prism => tx => // TODO: falsify
  prism(constMap).lens(tx => Const(tx)) (tx);


const prismMod = prism => f => tx => // aka prismOver
  prism(idMap).lens(ty =>
    Id(optMap(f) (ty))) (tx);


const prismSet = prism => x => tx =>
  prism(idMap).lens(_const(Id(Some(x)))) (tx);


/******************************************************************************
**********************************[ PRODUCT ]**********************************
******************************************************************************/


const Prod = prod => struct("Prod", {prod});


/***[Monoid]******************************************************************/


const prodEmpty = () => Prod(1);


/***[Semigroup]***************************************************************/


const prodAppend = tm => tn =>
  Sum(tm.prod * tn.prod);


const prodPrepend = prodAppend;


/******************************************************************************
**********************************[ READER ]***********************************
******************************************************************************/


const Reader = read => struct("Reader", {read});


/***[Applicative]**************************************************************/


const readAp = tf => tg =>
  Reader(x => tf.read(x) (tg.read(x)));


const readOf = x => Reader(_ => x);


/***[Functor]******************************************************************/


const readMap = f => tg =>
  Reader(x => f(tg.read(x)));


/***[Monad]********************************************************************/


const readChain = mg => fm =>
  Reader(x => fm(mg.read(x)).read(x));


const readJoin = mmf =>
  Reader(x => mmf.read(x).read(x));


/***[Misc. Combinators]*******************************************************/


const ask = Reader(id);


const asks = f =>
  readChain(ask)
    (x => readOf(f(x)));


const local = f => tg =>
  Reader(x => tg.read(f(x)));


/******************************************************************************
******************************[ SETTER (OPTICS) ]******************************
******************************************************************************/


// constructor defined @getter


/***[Instances]***************************************************************/


// Object


const objSetter_ = objDel => k =>
  Lens(_ => ft => o =>
    idMap(v =>
      objUnion(
        objDel(k) (o))
          (v === null
            ? {}
            : {[k]: v}))
                (ft(o[k])));


const objSetter = objSetter_(objDel);


/***[Category]****************************************************************/


const setComp = tx => ty =>
  Lens(x => tx.lens() (ty.lens() (x)));


const setComp3 = tx => ty => tz =>
  Lens(x => tx.lens() (ty.lens() (tz.lens() (x))));


const setId = Lens(id);


/***[Misc. Combinators]*******************************************************/


const setDel = tx => o =>
  tx.lens(_const(Id(null))) (o);


const setMod = tx => f => o =>
  tx.lens(v => Id(f(v))) (o);


const setSet = tx => v => o =>
  tx.lens(_const(Id(v))) (o);


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = state => struct("State", {state});


/***[Applicative]*************************************************************/


const stateAp = tf => tx =>
  State(y => {
    const [f, y_] = tf.state(y),
      [x, y__] = tx.state(y_);

    return [f(x), y__];
  });


const stateOf = x => State(y => [x, y]);


/***[Functor]*****************************************************************/


const stateMap = f => tx =>
  State(y => {
    const [x, y_] = tx.state(y);
    return [f(x), y_];
  });


/***[Monad]*******************************************************************/


const stateChain = mx => fm =>
  State(y => {
    const [x, y_] = mx.state(y);
    return fm(x).state(y_);
  });


/***[Misc. Combinators]*******************************************************/


const evalState = tf =>
  y => tf.state(y) [0];


const execState = tf =>
  y => tf.state(y) [1];


const stateGet = State(y => [y, y]);


const stateGets = f =>
  stateChain(stateGet)
    (y => stateOf(f(x)));


const stateModify = f =>
  stateChain(stateGet)
    (y => statePut(f(y)));


const statePut = y => State(_ => [null, y]);


/******************************************************************************
**********************************[ STREAM ]***********************************
******************************************************************************/


// TODO: add streams


const Stream = stream => union("Stream");


/******************************************************************************
************************************[ SUM ]************************************
******************************************************************************/


const Sum = sum => struct("Sum", {sum});


/***[Monoid]******************************************************************/


const sumEmpty = () => Sum(0);


/***[Semigroup]***************************************************************/


const sumAppend = tm => tn =>
  Sum(tm.sum + tn.sum);


const sumPrepend = sumAppend;


/******************************************************************************
*************************[ TASK (ASYNC IN SEQUENCE) ]**************************
******************************************************************************/


const Task = task => struct(
  Task,
  thisify(o => {
    o.task = (res, rej) => k(x => {
      o.task = l => l(x);
      return res(x);
    }, rej);
    
    return o;
  }));


const task = _ => tf.task;


/***[Applicative]*************************************************************/


const tAp = tf => tx =>
  Task((res, rej) => tf.task(f => tx.task(x => res(f(x)), rej), rej));


const tLiftA2 = f => tx => ty =>
  tAp(tMap(f) (tx)) (ty);


const tOf = x => Task((res, rej) => res(x));


/***[Functor]*****************************************************************/


const tMap = f => tx =>
  Task((res, rej) => tx.task(x => res(f(x)), rej));


/***[Monad]*******************************************************************/


const tChain = mx => fm =>
  Task((res, rej) => mx.task(x => fm(x).task(res, rej), rej));


const tChainT = ({chain, of}) => mmx => fm => // TODO: fix
  chain(mmx)
    (mx => of(tChain(fm) (mx))); // invalid


const tJoin = mmx =>
  Task((res, rej) => mmx.task(mx => mx.task(res, rej), rej));


/***[Monoid]*******************************************************************/


const tEmpty = () => x => Task((res, rej) => res(x));


/***[Misc. Combinators]*******************************************************/


const tAnd = tf => tg =>
  Task((res, rej) =>
    tf.task(f =>
      tg.task(g =>
        res([f, g]), rej),
        rej));


const tAll =
  ts =>
    arrFold(acc => tf =>
      tMap(([xs, x]) =>
        (xs.push(x), xs))
          (tAnd(acc) (tf)))
            (tOf([]))
              (ts);


/***[Derived]*****************************************************************/


const tAppend = tAnd;


const tPrepend = flip(tAnd);


/******************************************************************************
***********************************[ THESE ]***********************************
******************************************************************************/


const These_ = union("These");


const these = _this => that => these => tx =>
  match("These", tx, {
    This: ({this: x}) => _this(x),
    That: ({that: y}) => that(y),
    These: ({this: x, that: y}) => these(x) (y)
  });


const This = _this =>
  These_(This, {this: _this});


const That = that =>
  These_(That, {that});


const These = _this => that =>
  These_(These, {this: _this, that});


/***[Misc. Combinators]*******************************************************/


const fromThese = _this => that => tx =>
  match("These", tx, {
    This: ({this: x}) => new Pair(x, that),
    That: ({that: y}) => new Pair(_this, y),
    These: ({this: x, that: y}) => new Pair(x, y)
  });


/******************************************************************************
****************************[ TRAVERSAL (OPTICS) ]*****************************
******************************************************************************/


// TODO: add


/******************************************************************************
*******************************[ TUPLE (PAIR) ]********************************
******************************************************************************/


class Pair extends Array {
  constructor(x, y) {
    const r = super(2);
    r[0] = x;
    r[1] = y;
    return r;
  }
}


/******************************************************************************
******************************[ TUPLE (TRIPLE) ]*******************************
******************************************************************************/


class Triple extends Array {
  constructor(x, y, z) {
    const r = super(3);
    r[0] = x;
    r[1] = y;
    r[2] = z;
    return r;
  }
}


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = write => struct(Writer, {write});


/***[Applicative]*************************************************************/


const writeAp = append => ({write: [f, y]}) => ({write: [x, y_]}) =>
  Writer(f(x), append(y) (y_));  


const writeOf = empty => x =>
  Writer(x, empty());


/***[Functor]*****************************************************************/


const writeMap = f => ({write: [x, y]}) =>
  Writer(f(x), y);


/***[Monad]*******************************************************************/


const writeChain = append => ({write: [x, y]}) => fm => {
  const [x_, y_] = fm(x).write;
  return Writer(x_, append(y) (y_));
};


/***[Misc. Combinators]*******************************************************/


const evalWriter = tx =>
  tx.write(([x, y]) => x);


const execWriter = tx =>
  tx.write(([x, y]) => y);


const writeCensor = f => mx =>
  pass(mx.write(pair => Writer(pair, f)));


const writeListen = tx =>
  tx.write(([x, y]) => Writer([x, y], y));


const writeListens = f => mx =>
  listen(mx).write(([pair, y]) => Writer(pair, f(y)));


const writePass = tx =>
  tx.write(([[x, f], y]) => Writer([x, f(x)]));


const writeTell = y => Writer(null, y);


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const arrAll = all({
  fold: arrFoldk,
  append: compBin(tx =>
    Cont(Step =>
      tx.all
        ? Step(tx)
        : Base(tx)))
            (allAppend),
  empty: allEmpty});


const arrAny = any({
  fold: arrFoldk,
  append: compBin(tx =>
    Cont(Step =>
      tx.any
        ? Base(tx)
        : Step(tx)))
            (anyAppend),
  empty: anyEmpty});


const firstPrepend = lastAppend;


/******************************************************************************
*******************************************************************************
***********************[ HASHED ARRAY MAP TRIE (HAMT) ]************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


const HAMT_BITS = 5;


const HAMT_SIZE = Math.pow(2, HAMT_BITS);


const HAMT_MASK = HAMT_SIZE - 1;


const HAMT_LEAF = "Leaf";


const HAMT_BRANCH = "Branch";


const HAMT_COLLISION = "Collision";


const HAMT_DELETE = "delete";


const HAMT_NOOP = "noop";


/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


let hamtObjKeys = new WeakMap();


/******************************************************************************
***********************************[ HASH ]************************************
******************************************************************************/


const hamtHash = k => {
  switch (typeof k) {
    case "string":
      return hamtStrHash(k);

    case "number":
      return k === 0 ? 0x42108420
        : k !== k ? 0x42108421
        : k === Infinity ? 0x42108422
        : k === -Infinity ? 0x42108423
        : (k % 1) > 0 ? hamtStrHash(k + "") // string hashes for floats
        : hamtNumHash(k);

    case "boolean":
      return k === false
        ? 0x42108424
        : 0x42108425;

    case "undefined":
      return 0x42108426;

    case "function":
    case "object":
    case "symbol": {
      if (k === null)
        return 0x42108427;

      else if (hamtObjKeys.has(k))
        return hamtObjKeys.get(k);

      else {
        const k_ = crypto.getRandomValues(
          new Uint32Array(1)) [0];

        hamtObjKeys.set(k, k_);
        return k_;
      }
    }
  }
};


const hamtStrHash = s => {
  let r = 0x811c9dc5;

  for (let i = 0, l = s.length; i < l; i++) {
    r ^= s.charCodeAt(i);
    r = Math.imul(r, 0x1000193);
  }

  return r >>> 0;
};


const hamtNumHash = n =>
{
  n = (n + 0x7ed55d16) + (n << 12);
  n = (n ^ 0xc761c23c) ^ (n >> 19);
  n = (n + 0x165667b1) + (n << 5);
  n = (n + 0xd3a2646c) ^ (n << 9);
  n = (n + 0xfd7046c5) + (n << 3);
  n = (n ^ 0xb55a4f09) ^ (n >> 16);
  return n >>> 0;
};


/******************************************************************************
*****************************[ POPULATION COUNT ]******************************
******************************************************************************/


const hamtPopCount = (x, n) => {
  if (n !== undefined)
    x &= (1 << n) - 1;

  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >> 24;
};


/******************************************************************************
*******************************[ CONSTRUCTORS ]********************************
******************************************************************************/


const hamtBranch = (mask = 0, children = []) => ({
  type: HAMT_BRANCH,
  mask,
  children
});


const hamtCollision = (hash, children) => ({
  type: HAMT_COLLISION,
  hash,
  children
});


const hamtLeaf = (hash, k, v) => ({
  type: HAMT_LEAF,
  hash,
  k,
  v
});


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const hamtDel = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT");

  const hash = hamtHash(k),
    hamt_ = hamtDelNode(hamt, hash, k, 0);

  if (hamt_ === HAMT_NOOP)
    return hamt;

  else if (hamt_ === HAMT_DELETE)
    return hamtEmpty;

  else return hamt_;
};


const hamtEmpty = hamtBranch();


const hamtGet = (hamt, k) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT"); // TODO: change to HAMT error

  const hash = hamtHash(k);

  let node = hamt,
    depth = -1;

  while (true) {
    ++depth;

    switch (node.type) {
      case HAMT_BRANCH: {
        const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
          mask = 1 << frag;

        if (node.mask & mask) {
          const i = hamtPopCount(node.mask, frag);
          node = node.children[i];
          continue;
        }

        else
          return undefined;
      }

      case HAMT_COLLISION: {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.k === k)
            return child.v;
        }

        return undefined;
      }

      case HAMT_LEAF: {
        return node.k === k
          ? node.v
          : undefined;
      }
    }
  }
};


const hamtSet = (hamt, k, v) => {
  if (hamt.type !== HAMT_BRANCH)
    throw new TypeError("invalid HAMT");

  const hash = hamtHash(k);
  return hamtSetNode(hamt, hash, k, v);
};


/******************************************************************************
******************************[ IMPLEMENTATION ]*******************************
******************************************************************************/


const hamtSetNode = (node, hash, k, v, depth = 0) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      if (node.hash === hash) {
        if (node.k === k)
          return hamtLeaf(hash, k, v)

        return hamtCollision(
          hash,
          [node, hamtLeaf(hash, k, v)]);
      }

      else {
        const prevFrag = (node.hash >>> (HAMT_BITS * depth)) & HAMT_MASK;

        if (prevFrag === frag)
          return hamtBranch(
            mask, [
              hamtSetNode(
                hamtSetNode(hamtEmpty, hash, k, v, depth + 1),
              node.hash,
              node.k,
              node.v,
              depth + 1)
            ]
          );

        const prevMask = 1 << prevFrag,
          children = prevFrag < frag
            ? [node, hamtLeaf(hash, k, v)]
            : [hamtLeaf(hash, k, v), node];

        return hamtBranch(mask | prevMask, children);
      }
    }

    case HAMT_BRANCH: {
      const i = hamtPopCount(node.mask, frag),
        children = node.children;

      if (node.mask & mask) {
        const child = children[i],
          children_ = Array.from(children);

        children_[i] = hamtSetNode(child, hash, k, v, depth + 1);
        return hamtBranch(node.mask, children_);
      }

      else {
        const children_ = Array.from(children);
        children_.splice(i, 0, hamtLeaf(hash, k, v));
        return hamtBranch(node.mask | mask, children_);
      }
    }

    case HAMT_COLLISION: {
      for (let i = 0, len = node.children.length; i < len; ++i) {
        if (node.children[i].k === k) {
          const children = Array.from(node.children);
          children[i] = hamtLeaf(hash, k, v);
          return hamtCollision(node.hash, children);
        }
      }

      return hamtCollision(
        node.hash,
        node.children.concat(hamtLeaf(hash, k, v))
      );
    }
  }
}


const hamtDelNode = (node, hash, k, depth) => {
  const frag = (hash >>> (HAMT_BITS * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      // null means remove, undefined
      // means do nothing
      return node.k === k ? HAMT_DELETE : HAMT_NOOP;
    }

    case HAMT_BRANCH: {
      if (node.mask & mask) {
        const i = hamtPopCount(node.mask, frag),
          node_ = hamtDelNode(node.children[i], hash, k, depth + 1);

        if (node_ === HAMT_DELETE) {
          const newMask = node.mask & ~mask;

          if (newMask === 0)
            return HAMT_DELETE;
          
          else {
            const children = Array.from(node.children);
            children.splice(i, 1);
            return hamtBranch(newMask, children);
          }
        }

        else if (node_ === HAMT_NOOP)
          return HAMT_NOOP;

        else {
          const children = Array.from(node.children);
          children[i] = node_;
          return hamtBranch(node.mask, children);
        }
      }

      else
        return HAMT_NOOP;
    }

    case HAMT_COLLISION: {
      if (node.hash === hash) {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.k === k) {
            const children = Array.from(node.children);
            children.splice(i, 1);
            return hamtCollision(node.hash, children);
          }
        }
      }

      return HAMT_NOOP;
    }
  }
}


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


const fileCopy_ = fs => flags => newPath => path =>
  Task((res, rej) => {
    const readStream = fs.createReadStream(path),
      writeStream = fs.createWriteStream(newPath, {flags});

    readStream.on("error", rej);
    writeStream.on("error", rej);
    writeStream.on("finish", () => res(newPath));
    readStream.pipe(writeStream);
  });


const fileMove_ = fs => flags => newPath => path =>
  renameFile(path, newPath)
    .task(id, e => {
      if (e.code !== "EXDEV") // TODO: there are other error codes to take into account
        throw new FileError(e);

      else
        return tAnd(
          copyFile(path, newPath, flags))
            (unlinkFile(path));
    });


const fileRead_ = fs => enc => path =>
  Task((res, rej) =>
    fs.readFile(path, enc, (e, s) =>
      e ? rej(e) : res(s)));


const fileRename_ = fs => newPath => path => 
  Task((res, rej) => {
    fs.rename(path, newPath, e =>
      e ? rej(e) : res(newPath));
  });


const fileScanDir_ = fs => path =>
  Task((res, rej) =>
    fs.readdir(path, (e, ss) =>
      e ? rej(e) : res(ss)));


const fileWrite_ = fs => opt => path => s =>
  Task((res, rej) =>
    fs.writeFile(path, s, opt, (e, s) =>
      e ? rej(e) : res(None)));


const fileUnlink_ = fs => path => 
  Task((res, rej) => {
    fs.unlink(path, e =>
      e ? rej(e) : res(None));
  });


/******************************************************************************
*******************************************************************************
**********************************[ DERIVED ]**********************************
*******************************************************************************
******************************************************************************/


const arrSum = arrFold(
  sumAppend)
    (sumEmpty());


const arrProd = arrFold(
  prodAppend)
    (prodEmpty());


const getTimezoneOffset = Lazy(
  () => 
    new Date()
      .getTimezoneOffset() * 60);


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  All,
  all,
  allAppend,
  allEmpty,
  allPrepend,
  and,
  andp,
  Any,
  any,
  anyAppend,
  anyEmpty,
  anyPrepend,
  apEff1,
  apEff2,
  app,
  app_,
  apply,
  apply_,
  appr,
  arrAll,
  arrAlt,
  arrAny,
  arrAp,
  arrApEff1,
  arrApEff2,
  arrAppend,
  arrChain,
  arrClone,
  arrConcat,
  arrSnoc,
  arrCons,
  arrDedupe,
  arrDedupeBy,
  arrDedupeOn,
  arrDel,
  arrEmpty,
  arrFilter,
  arrFold,
  arrFoldk,
  arrFoldkr,
  arrFoldMap,
  arrFoldr,
  arrFoldr_,
  arrHead,
  arrHeadOr,
  arrInit,
  arrLast,
  arrLastOr,
  arrLens,
  arrLiftA2,
  arrJoin,
  arrLen,
  arrMap,
  arrMapA,
  arrMapAdjacent,
  arrMapChunk,
  arrMapEff,
  arrModOr,
  arrNull,
  arrOf,
  arrPartition,
  arrPrepend,
  arrProd,
  arrScan,
  arrSeqA,
  arrSet,
  arrSliceAt,
  arrSortBy,
  arrSplitAt,
  arrSplitBy,
  arrSum,
  arrTail,
  arrTransduce,
  arrTransducek,
  arrTranspose,
  arrUncons,
  arrUnconsOr,
  arrUnsnoc,
  arrUnsnocOr,
  arrUnfold,
  arrUnfoldr,
  arrUnzip,
  arrZero,
  arrZip,
  arrZipBy,
  ascOrder,
  ask,
  asks,
  Base,
  Call,
  ceil,
  Chain,
  chainEff,
  cmpAppend,
  cmpContra,
  cmpEmpty,
  cmpPrepend,
  Comp,
  comp,
  comp2nd,
  compBin,
  compAp,
  Compare,
  compare,
  compMap,
  compOf,
  compOn,
  Cons,
  Const,
  _const,
  const_,
  constMap,
  constOf,
  Cont,
  cont,
  cont2,
  contAp,
  contChain,
  contJoin,
  contLiftA2,
  contMap,
  contReset,
  contShift,
  contOf,
  curry,
  curry3,
  curry4,
  curry5,
  curry6,
  DateError,
  dateParse,
  debug,
  delay,
  descOrder,
  dropper,
  dropperk,
  dropperNth,
  dropperNthk,
  dropperWhile,
  dropperWhilek,
  eff,
  Either,
  either,
  Endo,
  endoAppend,
  endoEmpty,
  endoPrepend,
  _enum,
  EnumError,
  EQ,
  eq,
  Equiv,
  equivAppend,
  equivContra,
  equivEmpty,
  equivPrepend,
  evalState,
  execState,
  fileCopy_,
  FileError,
  fileMove_,
  fileRead_,
  fileRename_,
  fileScanDir_,
  fileWrite_,
  fileUnlink_,
  filterer,
  filtererk,
  First,
  firstAppend,
  firstPrepend,
  fix,
  flip,
  floor,
  foldMap,
  formatDate,
  formatDay,
  formatFloat,
  formatMonth,
  formatYear,
  fromThese,
  funAp,
  funAppend,
  funChain,
  funContra,
  funDimap,
  funEmpty,
  funJoin,
  funLiftA2,
  funLmap,
  funMap,
  funPrepend,
  funRmap,
  getComp,
  getComp3,
  getDay,
  getGet,
  getId,
  getMonth,
  getMonthDays,
  getTimezoneOffset,
  getYear,
  GT,
  guard,
  hamtDel,
  hamtEmpty,
  hamtGet,
  hamtSet,
  Id,
  id,
  idMap,
  idOf,
  imply,
  index,
  infix,
  infix2,
  infix3,
  infix4,
  infix5,
  infix6,
  infixM2,
  infixM3,
  infixM4,
  infixM5,
  infixM6,
  infixr,
  infixr2,
  infixr3,
  infixr4,
  infixr5,
  infixr6,
  infixrM2,
  infixrM3,
  infixrM4,
  infixrM5,
  infixrM6,
  inRange,
  invoke,
  introspect,
  isDate,
  isDateStr,
  isFalse,
  isIntStr,
  isTrue,
  isUnit,
  itFilter,
  itFold,
  itMap,
  kleisli,
  kleisli_,
  Last,
  lastAppend,
  lastPrepend,
  Lazy,
  lazyAp,
  lazyChain,
  lazyJoin,
  lazyMap,
  lazyOf,
  Left,
  leftPrism,
  Lens,
  lensComp,
  lensComp3,
  lensDel,
  lensGet,
  lensId,
  lensMod,
  lensSet,
  _let,
  List,
  listCons,
  local,
  log,
  LT,
  mapEff,
  mapMap,
  mapDel,
  mapGet,
  mapGetOr,
  mapLens,
  mapModOr,
  mapSet,
  mapSetM,
  mapper,
  mapperk,
  match,
  Matched,
  matched,
  Max,
  max,
  maxEmpty,
  maxAppend,
  maxPrepend,
  Min,
  min,
  minAppend,
  minEmpty,
  minPrepend,
  apM,
  monadRec,
  Mutu,
  mutuRec,
  neq,
  _new,
  Nil,
  None,
  not,
  NOT_FOUND,
  notp,
  numCompare,
  numEq,
  numFromEnum,
  numNeq,
  numGt,
  numGte,
  numLt,
  numLte,
  numMaxBound,
  numMinBound,
  numPred,
  numSucc,
  numToEnum,
  objClone,
  objDel,
  objEntries,
  objGet,
  objGetOr,
  objGetter,
  objKeys,
  objLens,
  objMemo,
  objModOr,
  objPathOr,
  objSet,
  objSetter,
  objUnion,
  objValues,
  Option,
  option,
  optAp,
  optChain,
  optChainT,
  optLiftA2,
  optMap,
  optOf,
  or,
  ordAppend,
  ordEmpty,
  ordPrepend,
  Ordering,
  ordering,
  orp,
  Pair,
  Parallel,
  parallel,
  parAll,
  parAnd,
  parAny,
  parAp,
  parAppend,
  parEmpty,
  parMap,
  parOf,
  parOr,
  parPrepend,
  partial,
  pipe,
  pipe_,
  pipeBin,
  pipeOn,
  postRec,
  Pred,
  predAppend,
  predContra,
  predEmpty,
  predPrepend,
  prismGet,
  prismMod,
  prismSet,
  Prod,
  prodAppend,
  prodEmpty,
  prodPrepend,
  range,
  rangeSize,
  Reader,
  readAp,
  readChain,
  readJoin,
  readMap,
  readOf,
  rec,
  recChain,
  recOf,
  RegExpError,
  Right,
  rightPrism,
  round,
  roundBy,
  ScriptumError,
  select,
  select11,
  select1N,
  SemigroupError,
  setComp,
  setComp3,
  setDel,
  setFracSep,
  setGroupSep,
  setId,
  setMap,
  setMod,
  setSet,
  Some,
  State,
  stateAp,
  stateChain,
  stateGet,
  stateGets,
  stateMap,
  stateModify,
  stateOf,
  statePut,
  Step,
  strAppend,
  strCapWord,
  strChunk,
  strDel,
  strExtract,
  strExtractOr,
  strFold,
  strInsert,
  strLen,
  strLens,
  strLocaleCompare,
  strMatch,
  strMatchAll,
  strMatchLast,
  strMatchNth,
  strMod,
  strNormalize,
  strNormalizeBy,
  strNull,
  strSet,
  strPadl,
  strPadr,
  strPrepend,
  strSliceAt,
  strSplitAt,
  strSplitBy,
  strSplitWords,
  struct,
  Sum,
  sumAppend,
  sumEmpty,
  sumPrepend,
  taker,
  takerk,
  takerNth,
  takerNthk,
  takerWhile,
  takerWhilek,
  Task,
  task,
  taggedLog,
  tailRec,
  tAnd,
  tAll,
  tAp,
  tAppend,
  tChain,
  tChainT,
  tEmpty,
  tPrepend,
  That,
  These,
  These_,
  these,
  This,
  thisify,
  _throw,
  tJoin,
  tLiftA2,
  tMap,
  tOf,
  toFixedFloat,
  Triple,
  trace,
  tryCatch,
  TYPE,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  uncurry6,
  union,
  UnionError,
  Writer,
  writeAp,
  writeCensor,
  writeChain,
  writeListen,
  writeListens,
  writeMap,
  writeOf,
  writePass,
  writeTell,
};

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


const NO_ENC = null; // no encoding specified


const NOT_FOUND = -1;


const TAG = Symbol("tag"); // the tag property of tagged unions


const TYPE = Symbol.toStringTag; // used for debugging


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


const unionGetter = type => (tag, o) => { // explicit getter for the runSomething prop
  o[TAG] = tag;
  o[TYPE] = type;
  return o;
};


const match = ({[TYPE]: type, [TAG]: tag}, o) =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(tag in o) ? _throw(new UnionError("invalid tag"))
    : o[tag];


const matchExp = ({[TYPE]: type, [TAG]: tag, ["run" + type]: x}, o) =>
  o.type !== type ? _throw(new UnionError("invalid type"))
    : !(tag in o) ? _throw(new UnionError("invalid tag"))
    : o[tag] (x);


/******************************************************************************
********************************[ RECORD TYPE ]********************************
******************************************************************************/


const struct = type => x => ({ // single field types
  ["run" + type]: x,
  [TYPE]: type,
});


const structn = type => cons => { // multiple field types
  const f = x => ({
    ["run" + type]: x,
    [TYPE]: type,
  });

  return cons(f);
};


const structGetter = type => cons => { // explicit getter for the runSomething prop
  const f = o => {
    o[TYPE] = type;
    return o;
  }

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

  while (step)
    if (step.type === recur)
      step = f(...step.args);

    else if (step.type === call)
      step = step.f(...step.args);

    else
      break;

  return step;
};


const loop_ = f => {
  let step = f();

  while (step)
    if (step.type === recur){
      switch (step.args.length) {
        case 1: {
          step = f(step.args[0]);
          break;
        }

        case 2: {
          step = f(step.args[0], step.args[1]);
          break;
        }

        case 3: {
          step = f(step.args[0], step.args[1], step.args[2]);
          break;
        }

        case 4: {
          step = f(step.args[0], step.args[1], step.args[2], step.args[3]);
          break;
        }

        case 5: {
          step = f(step.args[0], step.args[1], step.args[2], step.args[3], step.args[4]);
          break;
        }

        default:
          step = f(...step.args);
      }
    }

    else if (step.type === call) {
      switch (step.args.length) {
        case 1: {
          step = step.f(step.args[0]);
          break;
        }

        case 2: {
          step = step.f(step.args[0], step.args[1]);
          break;
        }

        case 3: {
          step = step.f(step.args[0], step.args[1], step.args[2]);
          break;
        }

        case 4: {
          step = step.f(step.args[0], step.args[1], step.args[2], step.args[3]);
          break;
        }

        case 5: {
          step = step.f(step.args[0], step.args[1], step.args[2], step.args[3], step.args[4]);
          break;
        }

        default:
          step = step.f(...step.args);
      }
    }

    else
      break;

  return step;
};


const call = (f, ...args) =>
  ({type: call, f, args});


const call_ = (f, args) =>
  ({type: call, f, args});


const recur = (...args) =>
  ({type: recur, args});


const recur_ = args =>
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


/***[Applicative]*************************************************************/


const varAp = ap => tf =>
  varComp({comp: ap, id: tf});


const varLiftA = ({ap, of}) => f =>
  varComp({comp: ap, id: of(f)});


/***[Category]****************************************************************/


const varComp = ({comp, id}) =>
  variadic(arrFold(comp) (id));


const varPipe = ({pipe, id}) =>
  variadic(arrFold(pipe) (id));


/***[Ix]**********************************************************************/


const range = ({succ, gt}) => (lower, upper) =>
  arrUnfold(x =>
    gt(x) (upper)
      ? None
      : Some([x, succ(x)])) (lower);


const index = ({succ, eq}) => (lower, upper) => x =>
  loop((y = lower, i = 0) =>
    eq(y) (upper) ? None
      : eq(x) (y) ? Some(i)
      : recur(succ(y), i + 1));


const inRange = ({succ, eq, gt}) => (lower, upper) => x =>
  loop((y = lower) =>
    gt(y) (upper) ? false
      : eq(x) (y) ? true
      : recur(succ(y)));


const rangeSize = ({succ, eq, gt}) => (lower, upper) =>
  loop((x = lower, n = 0) =>
    gt(x) (upper)
      ? n
      : recur(succ(x), n + 1));


/***[Foldable]****************************************************************/


const all = ({fold, append, empty}) => p =>
  comp(tx => tx.runAll) (foldMap({fold, append, empty}) (comp(All) (p)));


const any = ({fold, append, empty}) => p =>
  comp(tx => tx.runAny) (foldMap({fold, append, empty}) (comp(Any) (p)));


const foldMap = ({fold, append, empty}) => f =>
  fold(comp2nd(append) (f)) (empty);


/***[Monad]*******************************************************************/


const varChain = ({map, of, chain, join}) => fm => // TODO: derive from varComp
  variadic(args =>
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
  varComp({
    comp: mg => mx => chain(g => map(g) (mx)) (mg),
    id: of(f)
  });


/***[Monoid]******************************************************************/


const concat = ({append, empty}) =>
  arrFold(append) (empty);


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


const ascOrder_ = (x, y, z) =>
  x <= y && y <= z;


const compare = x => y =>
  x < y ? LT
    : x === y ? EQ
    : GT;
      

const descOrder = x => y => z =>
  x >= y && y >= z;


const descOrder_ = (x, y, z) =>
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


/***[Misc. Combinators]*******************************************************/


const and = x => y =>
  x && y;


const imply = x => y =>
  !x || y;


const not = x => !x;


const or = x => y =>
  x || y;


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/***[Alternative]*************************************************************/


// arrAlt @derived


// arrAltx @derived


// arrZero @derived


/***[Applicative]*************************************************************/


const arrAp = tf => tx =>
  arrFold(acc => f =>
    arrAppendx(acc)
      (arrMap(x => f(x)) (tx)))
        ([])
          (tf);


// arrApConstl @derived


const arrApConstr = tf => tx =>
  arrAp(arrMapConst(id) (tf)) (tx);


const arrLiftA2 = f => tx => ty =>
  arrAp(arrMap(f) (tx)) (ty);


const arrLiftA3 = f => tx => ty => tz =>
  arrAp(arrAp(arrMap(f) (tx)) (ty)) (tz);


const arrOf = x => [x];


const arrVarLiftA = varLiftA({ap: arrAp, of: arrOf});


/***[ChainRec]****************************************************************/


const arrChainRec = f => {
  const stack = [],
    acc = [];

  let step = f();

  if (step && step.type === recur)
    arrAppendx(stack) (step.arg);

  else
    arrAppendx(acc) (step.arg);

  while (stack.length > 0) {
    step = f(stack.shift());

    if (step && step.type === recur)
      arrAppendx(stack) (step.arg);

    else
      arrAppendx(acc) (step);
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
  xs.filter((x, i) => p(x, i) ? x : null);


/***[Foldable]****************************************************************/


// arrAll @derived


// arrAny @derived


const arrFold = alg => zero => xs => {
  let acc = zero;

  for (let i = 0; i < xs.length; i++)
    acc = alg(acc) (xs[i], i);

  return acc;
};


const arrFoldM = ({append, empty}) =>
  arrFold(append) (empty);


const arrFoldr = f => acc => xs =>
  loop_((i = 0, k = id) => 
      i === xs.length
        ? call_(k, [acc])
        : recur_([i + 1, acc_ => call_(k, [f(xs[i]) (acc_)])]));


const arrFoldStr = s => ss =>
  ss.join(s);


const arrFoldk = alg => zero => xs =>
  loop((acc = zero, i = 0) =>
    i === xs.length
      ? acc
      : alg(acc) (xs[i], i).runCont(acc_ => recur(acc_, i + 1)));


const arrHisto = alg => zero =>
  comp(headH) (history(alg) (zero));


const arrHylo = alg => zero => coalg =>
  comp(arrFold(alg) (zero)) (arrAna(coalg));


const arrLength = xs => xs.length;


const arrMutu = alg1 => alg2 => zero1 => zero2 =>
  comp(snd)
    (arrFold(([acc1, acc2]) => x =>
      [alg1(acc1) (acc2) (x), alg2(acc1) (acc2) (x)])
        ([zero1, zero2]));


const arrNull = xs => xs.length === 0;


const arrPara = alg => zero => xs => {
  const ys = arrClone(xs);
  
  let acc = zero,
    len = 0,
    x;

  while (x = ys.shift()) 
    acc = alg(acc) (ys) (x, len++);

  return acc;
};


const arrParak = alg => zero => xs => {
  const ys = arrClone(xs);

  return loop((acc = zero, i = 0) =>
    i === xs.length
      ? acc
      : alg(acc) (ys) (ys.shift(), i).runCont(acc_ => recur(acc_, i + 1)));
};


// arrSum @derived


const arrZygo = alg1 => alg2 => zero1 => zero2 =>
  comp(snd)
    (arrFold(([acc1, acc2]) => x =>
      [alg1(acc1) (x), alg2(acc1) (acc2) (x)])
        ([zero1, zero2]));


/***[Functor]*****************************************************************/


const arrMap = f => xs =>
  xs.map((x, i) => f(x, i));


const arrMapConst = x => xs =>
  xs.map(_const(x));


const arrMapx = f => xs =>
  loop(i =>
    i === xs.length
      ? xs
      : recur(arrSetx(f(xs[i]))));


/***[Monad]*******************************************************************/


const arrChain = fm =>
  arrFold(acc => x => arrAppendx(acc) (fm(x))) ([]);


const arrChain2 = fm => mx => my =>
  arrFold(acc => x =>
    arrFold(acc_ => y =>
      arrAppendx(acc_) (fm(x) (y))) (acc) (my)) ([]) (mx);


const arrChain3 = fm => mx => my => mz =>
  arrFold(acc => x =>
    arrFold(acc_ => y =>
      arrFold(acc__ => z =>
        arrAppendx(acc__) (fm(x) (y) (z))) (acc_) (mz)) (acc) (my)) ([]) (mx);


const arrJoin = xss => {
  let xs = [];

  for (let i = 0; i < xss.length; i++)
    for (let j = 0; j < xss[i].length; j++)
      xs.push(xss[i] [j]);

  return xs;
};


const arrLiftM2 = f => mx => my =>
  arrFold(acc => x =>
    arrFold(acc_ => y =>
      arrConsx(f(x) (y)) (acc_)) (acc) (my)) ([]) (mx);


const arrLiftM3 = f => mx => my => mz =>
  arrFold(acc => x =>
    arrFold(acc_ => y =>
      arrFold(acc__ => z =>
        arrConsx(f(x) (y) (z)) (acc__)) (acc_) (mz)) (acc) (my)) ([]) (mx);


/***[Monoid]******************************************************************/


const arrEmpty = [];


/***[Semigroup]***************************************************************/


const arrAppend = xs => ys => { // NOTE: expects arrays in both arguments
  const zs = arrClone(xs);

  if (!ys || ys.length === undefined)
    throw new SemigroupError(`array expected but "${ys}" given`);

  else {
    for (let i = 0; i < ys.length; i++)
      zs.push(ys[i]);
  }

  return zs;
};


const arrAppendx = xs => ys => { // NOTE: expects arrays in both arguments
  if (!ys || ys.length === undefined)
    throw new SemigroupError(`array expected but "${ys}" given`);

  else {
    for (let i = 0; i < ys.length; i++)
      xs.push(ys[i]);
  }

  return xs;
};


const arrConcat =
  concat({append: arrAppend, empty: arrEmpty});


// arrPrepend @derived


// arrPrependx @derived


/***[Transduce]***************************************************************/


const arrTransduce = alg => reduce =>
  arrFold(alg(reduce));


const arrTransducek = alg => reduce =>
  arrFoldk(alg(reduce));


/***[Traversable]*************************************************************/


const arrMapA = ({liftA2, of}) => f =>
  arrFold(acc => x => liftA2(arrConsx) (f(x)) (acc)) (of([]));


const arrSeqA = dict =>
  arrMapA(dict) (id);


/***[Unfoldable]**************************************************************/


const arrUnfold = coalg => x => {
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


const arrApo = coalg => x => {
  const acc = [];

  while (true) {
    let tx = coalg(x);

    switch (tx.tag) {
      case "None": return acc;
      
      case "Some": {
        switch (tx.runOption[1].tag) {
          case "Left": {
            arrAppendx(acc)
              ((tx.runOption[1].runEither.unshift(tx.runOption[0]),
                tx.runOption[1].runEither));
            
            return acc;
          }

          case "Right": {
            acc.push(tx.runOption[0]);
            x = tx.runOption[1].runEither;
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


const arrFutu = coalg => x => {
  const acc = [];

  while (true) {
    let optX = coalg(x);

    switch (optX.tag) {
      case "None": return acc;

      case "Some": {
        let [y, [ys, optX_]] = optX.runOption;

        switch(optX_.tag) {
          case "None": {
            arrAppendx(acc) ((ys.unshift(y), ys));
            return acc;
          }

          case "Some": {
            arrAppendx(acc) ((ys.unshift(y), ys)); 
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


/***[Misc. Combinators]*******************************************************/


const arrConsHead = x => xs => {
  const ys = arrClone(xs);
  ys.unshift(x);
  return ys;
};


const arrConsHeadx = x => xs =>
  (xs.unshift(x), xs);


const arrCons = x => xs => {
  const ys = arrClone(xs);
  ys.push(x);
  return ys;
};


const arrConsx = x => xs =>
  (xs.push(x), xs);


const arrConsNth = (i, x) => xs => {
  const ys = arrClone(xs);
  return (ys.splice(i + 1, 0, x), ys);
};


const arrConsNthx = (i, x) => xs =>
  (xs.splice(i + 1, 0, x), xs);


const arrCreateMatrix = (i, j, x) => xs =>
  Array.isArray(xs[i])
    ? (xs[i] [j] = x, xs)
    : (xs[i] = [], xs[i] [j] = x, xs);


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


const arrDel = i => xs => {
  const ys = arrClone(xs);
  return (ys.splice(i, 1), ys);
};


const arrDelx = i => xs =>
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


const arrInvert =
  arrFold(
    acc => (x, i) =>
      acc.set(x, i))
        (new Map());


const arrLast = xs =>
  xs.length === 0
    ? None
    : Some(xs[xs.length - 1]);


const arrLastOr = def => xs =>
  xs.length === 0
    ? def
    : xs[xs.length - 1];


const arrMapAdjacent = f => n => xs =>
  loop((i = 0, acc = []) =>
    i + n > xs.length
      ? acc
      : recur(i + 1, (acc.push(f(xs.slice(i, i + n))), acc)));


const arrMapChunk = f => n => xs =>
  loop((i = 0, remainder = xs.length % n, acc = []) =>
    i >= xs.length - remainder
      ? acc
      : recur(i + n, remainder, (acc.push(f(xs.slice(i, i + n))), acc)));


const arrModOr = def => (i, f) => xs =>
  arrModOrx(def) (i, f) (arrClone(xs));


const arrModOrx = def => (i, f) => xs =>
  i in xs
    ? (xs[i] = f(xs[i]), xs)
    : xs[i] = def;


const arrPartition = f => xs => // TODO: use fold
  xs.reduce((m, x) =>
    _let((r = f(x), ys = m.get(r) || []) =>
      m.set(r, (ys.push(x), ys))), new Map());


const arrScan = f => x_ => xs => // TODO: use fold
  loop((acc = [], x = x_, i = 0) =>
    i === xs.length
      ? acc
      : recur(
        (acc.push(f(x) (xs[i])), acc),
        acc[acc.length - 1], i + 1));


const arrSet = (i, x) => xs =>
  arrSetx(i, x) (arrClone(xs));


const arrSetx = (i, x) => xs =>
  (xs[i] = x, xs);


const arrSliceAt = (i, len) => xs =>
  xs.slice(i, i + len);


const arrSliceAtx = (i, len) => xs => {
  if (len === undefined)
    if (i < 0)
      return xs.splice(i);

    else
      return (xs.splice(i), xs);

  else if (len < 0)
    return (xs.splice(xs.length + len), xs);

  else if (len === 0)
    return [];
           
  else
    return xs.splice(i, len);
};


const arrSortBy = f => xs =>
  arrClone(xs).sort((x, y) => f(x) (y));


const arrSortByx = f => xs =>
  xs.sort((x, y) => f(x) (y));


const arrSplitAt = i => xs => {
  const ys = arrClone(xs);
  return [ys, ys.splice(i + 1)];
};


const arrSplitAtx = i => xs =>
  [xs, xs.splice(i + 1)];


const arrSplitBy = p => xs => // aka span
  arrFoldk(
    acc => (x, i) =>
      Cont(k =>
        p(x)
          ? arrSplitAt(i) (xs)
          : k(acc)))
              ([xs, []])
                (xs);


const arrSplitByx = p => xs =>
  arrFoldk(
    acc => (x, i) =>
      Cont(k =>
        p(x)
          ? arrSplitAtx(i) (xs)
          : k(acc)))
              ([xs, []])
                (xs);


const arrTail = xs =>
  xs.slice(1);


const arrTranspose = matrix =>
  matrix[0].map((_, i) =>
    matrix.map(xs => xs[i]));


const arrUnconsHead = xs => {
  const ys = arrClone(xs);

  if (xs.length === 0)
    return None;

  else
    return Some([ys.shift(), ys]);
};


const arrUnconsHeadx = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.shift(), xs]);
};


const arrUnconsHeadOr = def => xs => {
  const ys = arrClone(xs);

  if (xs.length === 0)
    return [def, ys];

  else
    return [ys.shift(), ys];
};


const arrUnconsHeadOrx = def => xs => {
  if (xs.length === 0)
    return [def, xs];

  else
    return [xs.shift(), xs];
};


const arrUnconsInit = n => xs => {
  if (xs.length < n)
    return [[], xs];

  else {
    const ys = arrClone(xs),
      zs = ys.splice(n + 1);

    return (ys.push(zs), ys);
  }
};


const arrUnconsInitx = n => xs => {
  if (xs.length < n)
    return [[], xs];

  else {
    const ys = xs.splice(n + 1);
    return (xs.push(ys), xs);
  }
};


const arrUnconsLast = xs => {
  const ys = arrClone(xs);

  if (xs.length === 0)
    return None;

  else
    return Some([ys.pop(), ys]);
};


const arrUnconsLastx = xs => {
  if (xs.length === 0)
    return None;

  else
    return Some([xs.pop(), xs]);
};


const arrUnconsLastOr = def => xs => {
  const ys = arrClone(xs);

  if (xs.length === 0)
    return [def, ys];

  else
    return [ys.pop(), ys];
};


const arrUnconsLastOrx = def => xs => {
  if (xs.length === 0)
    return [def, xs];

  else
    return [xs.pop(), xs];
};


const arrUnconsNth = i => xs => {
  const ys = arrClone(xs);

  if (xs.length < i)
    return None;

  else
    return Some([ys.splice(i, 1), ys]);
};


const arrUnconsNthx = i => xs => {
  if (xs.length < i)
    return None;

  else
    return Some([xs.splice(i, 1), xs]);
};


const arrUnconsNthOr = def => i => xs => {
  const ys = arrClone(xs);
  return [xs.length < i ? def : ys.splice(i, 1), ys];
};


const arrUnconsNthOrx = def => i => xs =>
  [xs.length < i ? def : xs.splice(i, 1), xs];


const arrUnconsTail = n => xs => {
  if (xs.length < n)
    return [[], xs];

  else {
    const ys = arrClone(xs),
      zs = ys.splice(n + 1);

    return (zs.push(ys), zs);
  }
};


const arrUnconsTailx = n => xs => {
  if (xs.length < n)
    return [[], xs];

  else {
    const ys = xs.splice(n + 1);
    return (ys.push(xs), ys);
  }
};


const arrUnzip = xss => // TODO: use fold
  loop((acc = [[], []], i = 0) =>
    i === xss.length
      ? acc
      : recur((
          acc[0].push(xss[i] [0]),
          acc[1].push(xss[i] [1]),
          acc), i + 1));


const arrZip = xs => ys => // TODO: use fold
  loop((acc = [], i = 0) => {
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return acc;

    else
      return recur(
        (acc.push([xs[i], ys[i]]), acc), i + 1);
  });


const arrZipBy = f => xs => ys => // TODO: use fold
  loop((acc = [], i = 0) => {
    const x = xs[i], y = ys[i];

    if (x === undefined || y === undefined)
      return acc;

    else
      return recur(
        (acc.push(f(xs[i]) (ys[i])), acc), i + 1);
  });


/***[Derived]*****************************************************************/


const arrAlt = arrAppend;


const arrAltx = arrAppendx;


const arrZero = arrEmpty;


/******************************************************************************
**********************************[ BOOLEAN ]**********************************
******************************************************************************/


const andp = p => q => x =>
  p(x) && q(x);


const isFalse = x => x === false;


const isTrue = x => x === true;


const notp = p => x => !p(x);


const orp = p => q => x =>
  p(x) || q(x);


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


const dateParse = s => {
  const d = new Date(s);
  
  if (d.getTime === undefined || Number.isNaN(d.getTime()))
    return Left(`malformed date string "${s}"`);

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


// getDay @derived


const getMonthDays = y => m =>
  new Date(new Date(y, m + 1, 1) - 1).getDate();


// getMonth @derived


const getTimezoneOffset = () => 
  new Date().getTimezoneOffset() * 60 * 1000;


// getYear @derived


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


// ceil @derived


// floor @derived


const formatFloat = thdSep => decSep => decDigits => n => {
  const [s, dec] = round(decDigits) (n)
    .toString().concat(".00").split("."),
      hnd = s.slice(-3),
      thd = hnd.length < s
        ? s.slice(0, s.length - hnd.length)
        : "";

  let r = "";

  if (thd)
    r += thd + thdSep;

  return r + hnd + decSep + strPadr(decDigits) ("0") (dec);
};


const isFloatStr = s =>
  s.search(new RegExp("^\\d+\\.\\d+$")) !== NOT_FOUND;


// round @derived


const roundBy = k => digits => fp => {
  let [n, ex] = `${fp < 0 ? Math.abs(fp) : fp}e`.split('e'),
    r = Math[k](`${n}e${Number(ex) + digits}`);

  [n, ex] = `${r}e`.split('e');
  r = Number(`${n}e${Number(ex) - digits}`);

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


/***[Applicative]*************************************************************/


const funAp = f => g => x =>
  f(x) (g(x));


const funLiftA2 = f => g => h => x =>
  f(g(x)) (h(x));


// funOf @derived


// funVarLiftA @derived


/***[Arguments]***************************************************************/


const appVar = f =>
  arrFold(g => x => g(x)) (f);


const infixl = (x, f, y) =>
  f(x) (y);


const infixr = (y, f, x) =>
  f(x) (y);


const variadic = f => {
  const go = args =>
    Object.defineProperties(
      arg => go(args.concat([arg])), {
        "runVariadic": {get: function() {return f(args)}, enumerable: true},
        [TYPE]: {value: "Variadic", enumerable: true}
      });

  return go([]);
};


/***[Choice]******************************************************************/


const funLeft = f =>
  ethCata(x => Left(f(x))) (Right);


const funRight = f =>
  ethCata(Left) (x => Right(f(x)));


/***[Composition]*************************************************************/


const comp = f => g => x =>
  f(g(x));


const comp2nd = f => g => x => y =>
  f(x) (g(y));


const comp3 = f => g => h => x =>
  f(g(h(x)));


const compBin = f => g => x => y =>
  f(g(x) (y));


const compBoth = f => g => x => y =>
  f(g(x)) (g(y));


const pipe = g => f => x =>
  f(g(x));


const pipe2nd = g => f => x => y =>
  f(x) (g(y));


const pipe3 = h => g => f => x =>
  f(g(h(x)));


const pipeBoth = g => f => x => y =>
  f(g(x)) (g(y));


const pipeBin = g => f => x => y =>
  f(g(x) (y));


// funVarComp @derived


// funVarPipe @derived


/***[Conditional Branching]***************************************************/


const guard = p => f => x =>
  p(x) ? f(x) : x;


const select = p => f => g => x =>
  p(x) ? f(x) : g(x);


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


const partial = (f, ...args) => (...args_) =>
  f(...args, ...args_);


const partialCurry = (f, ...args) =>
  variadic(args_ => f(...args, ...args_));


const uncurry = f => (x, y) =>
  f(x) (y);


const uncurry3 = f => (x, y, z) =>
  f(x) (y) (z);


const uncurry4 = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


const uncurry5 = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);

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


const eff = f => x => (f(x), x); // aka tap


const introspect = x =>
  x && x[TYPE] !== undefined
    ? x[TYPE]
    : Object.prototype.toString.call(x).slice(8, -1);


const isUnit = x =>
  x === undefined
    || x === null
    || x === x === false // NaN
    || x.getTime !== undefined && Number.isNaN(x.getTime()); // Invalid Date


const returnHead = (...xs) =>
  xs[0];


const returnLast = (...xs) =>
  xs[xs.length - 1];


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


const funChain = f => g => x =>
  f(g(x)) (x);


const funJoin = f => x =>
  f(x) (x);


/***[Monoid]******************************************************************/


// funEmpty @derived


/***[Primitive]***************************************************************/


const app = f => x => f(x);


const _const = x => y => x;


const fixed = f => x => f(fixed(f)) (x); // fixed point (not stack safe)


const flip = f => y => x => f(x) (y);


const id = x => x;


const _let = f => f(); // simulates let binding as an expression


/***[Profunctor]**************************************************************/


const funDimap = f => g => hx => x =>
  g(hx(f(x)));


const funLmap = f => hx => x =>
  hx(f(x));


const funRmap = g => hx => x =>
  g(hx(x));


/***[Relation]****************************************************************/


const select11 = m => (ks, vs) => k =>
  vs[m.get(ks.indexOf(k))];


const select1N = m => (ks, vs) => k =>
  arrMap(l => vs[l])
    (m.get(ks.indexOf(k)));


/***[Semigroup]***************************************************************/


const funAppend = comp;


const funPrepend = pipe;


/***[Transducer]**************************************************************/


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
      : reduce(acc) (x).runCont(k)};


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
      : reduce(acc) (x).runCont(k)};


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
        : (drop = false, reduce(acc) (x).runCont(k)))};


const filterer = p => reduce => acc => x =>
  p(x)
    ? reduce(acc) (x)
    : acc;


const filtererk = p => reduce => acc => x =>
  Cont(k =>
    p(x)
      ? reduce(acc) (x).runCont(k)
      : k(acc));


const mapper = f => reduce => acc => x =>
  reduce(acc) (f(x));


const mapperk = f => reduce => acc => x =>
  Cont(k =>
    reduce(acc) (f(x)).runCont(k));


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
        ? (m++, reduce(acc) (x).runCont(k))
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
        ? reduce(acc) (x).runCont(k)
        : acc)};


const takerWhile = p => reduce => acc => x =>
  p(x)
    ? reduce(acc) (x)
    : acc;


const takerWhilek = p => reduce => acc => x =>
  Cont(k =>
    p(x)
      ? reduce(acc) (x).runCont(k)
      : acc);


/***[Derived]*****************************************************************/


const funEmpty = id;


const funOf = _const;


const funVarComp = varComp({comp, id});


const funVarLiftA = varLiftA({ap: funAp, of: funOf});


const funVarPipe = varPipe({pipe, id});


/******************************************************************************
*********************************[ GENERATOR ]*********************************
******************************************************************************/


const _enum = function* (n) {
  while (true)
    yield n++;
};


/******************************************************************************
************************************[ MAP ]************************************
******************************************************************************/


const _Map = xss =>
  new Map(xss);


/***[Functor]*****************************************************************/


const mapMap = f => m => {
  let n = new Map();
  
  for (const [k, v] of m)
    n.set(k, f(v));
  
  return n;
};


/***[Misc. Combinators]*******************************************************/


const mapDel = k => m =>
  new Map(m).delete(k);


const mapDelx = k => m =>
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
    ? new Map(m).set(k, f(m.get(k)))
    : new Map(m).set(k, def);


const mapModOrx = def => (k, f) => m =>
  m.has(k)
    ? m.set(k, f(m.get(k)))
    : m.set(k, def);


const mapSet = (k, v) => m =>
  new Map(m).set(k, v);


const mapSetx = (k, v) => m =>
  m.set(k, v);


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


const numCreateRandomBytes_ = crypto => n => {
  if (crypto && crypto.randomBytes)
    return Lazy(() =>
      crypto.randomBytes(n));

  else if (crypto && crypto.getRandomValues)
    return Lazy(() =>
      crypto.getRandomValues(new Uint8Array(n)));

  else
    _throw(new ScriptumError("missing crypto support"));
};


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
  objDelx(k) (objClone(o));


const objDelx = k => o =>
  (delete o[k], o);


const objGetOr = def => k => o =>
  k in o ? o[k] : def;


const objMemo = k => f => o => Object.defineProperty(o, k, {get: function() {
  return x => {
    const r = f(x);
    delete this[k];
    this[k] = () => r;
    return r;
  };
}, configurable: true});


const objModOr = def => (k, f) => o =>
  objModOrx(def) (k, f) (objClone(o));


const objModOrx = def => (k, f) => o =>
  k in o
    ? (o[k] = f(o[k]), o)
    : (o[k] = def, o);


const objPathOr = def =>
  variadic(arrFold(p => k => p[k] || def) (o));


const objSet = (k, v) => o =>
  objSetx(k, v) (objClone(o));


const objSetx = (k, v) => o =>
  (o[k] = v, o);


const objUnion = o => p =>
  objUnionx(objClone(o)) (p);


const objUnionx = o => p => {
  for ([k, v] of objEntries(p))
    o[k] = v;

  return o;
};


const thisify = f => f({}); // mimics this context


/***[Generators]**************************************************************/


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
************************************[ SET ]************************************
******************************************************************************/


const _Set = xs =>
  new Set(xs);


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


const strFold = alg => zero => s => {
  let acc = zero;

  for (let i = 0; i < s.length; i++)
    acc = alg(acc) (s[i], i);

  return acc;
};


const strFoldChunks = alg => zero => s => {
  let acc = zero;

  for (let i = 0; i < s.length; i++)
    [acc, i] = alg(acc) (s, i);

  return acc;
};


const strLength = s => s.length;


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
  loop((acc = [], s = s_, i = 0) => {
    if (s === "")
      return acc;

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.runMatched[TAG]) {
        case "None": return acc;

        case "Some": {
          const xs = tx.runMatched.runOption;
          xs.index += i;
          xs.input = s_;

          return recur(
            (acc.push(tx), acc),
            s_.slice(xs.index + xs[0].length),
            xs.index + xs[0].length);
        }

        default: _throw(new UnionError("unknown tag"));
      }
    }
  });


const strMatchLast = (r, flags) => s_ =>
  loop((acc = Matched(None), s = s_, i = 0) => {
    if (s === "")
      return acc;

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.runMatched[TAG]) {
        case "None": return acc;

        case "Some": {
          const xs = tx.runMatched.runOption;
          xs.index += i;
          xs.input = s_;

          return recur(
            tx,
            s_.slice(xs.index + xs[0].length),
            xs.index + xs[0].length);
        }

        default: _throw(new UnionError("unknown tag"));
      }
    }
  });


const strMatchNth = nth_ => (r, flags) => s_ =>
  loop((acc = Matched(None), s = s_, i = 0, nth = 0) => {
    if (nth_ === nth)
      return acc;

    else if (s === "")
      return Matched(None);

    else {
      const tx = strMatch(r, flags) (s);

      switch (tx.runMatched[TAG]) {
        case "None": return acc;

        case "Some": {
          const xs = tx.runMatched.runOption;
          xs.index += i;
          xs.input = s_;

          return recur(
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


const strNormalize = pairs => s =>
  arrFold(acc => ([from, to]) =>
    strSet(from, to, "gi") (acc)) (s) (pairs);
      
      
const strNormalizeBy = pairs => s =>
  arrFold(acc => ([from, f]) =>
    strMod(from, f, "gi") (acc)) (s) (pairs);


const strSet = (r, t, flags) => s =>
  s.replace(new RegExp(r, flags), t);


/***[Misc. Combinators]*******************************************************/


const strCapWord = s =>
  s[0].toUpperCase() + s.slice(1);


const strChunk = n =>
  strFoldChunks(
    acc => (s, i) =>
      [arrAppendx(acc) ([s.slice(i, i + n)]), i])
        ([]);


const strConsNth = (t, i) => s =>
  s.slice(0, i + 1) + t + s.slice(i + 1);


const strCreateCryptoHash_ = crypto => algo => s => {
  if (crypto && crypto.createHash) // TODO: Change to a monadic action (Task returning)
    return crypto.createHash(algo)
      .update(s)
      .digest("hex");

  else if (crypto && crypto.subtle && crypto.subtle.digest) // TODO: Change to Task
    return crypto
      .subtle
      .digest(algo, (new TextEncoder()).encode(s))
      .then(buffer =>
        Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, "0"))
          .join(""));

  else 
    _throw(new ScriptumError("missing crypto support"));
};


const strCreateHash = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;

  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ h1>>>16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2>>>16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};


const strLocaleCompare = locale => c => d => {
  switch (c.localeCompare(d, locale)) {
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
  strFoldChunks(
    acc => (s, i) =>
      p(s[i])
        ? [strSplitAt(i) (s), s.length]
        : [acc, i])
            (["", ""]);


const strSplitWords = excl => s => {
  const xs = s.split(
    new RegExp(`[^\\p{L}\\p{N}${excl}]+(?=\\p{L}|$)`, "gu"));

  if (xs[xs.length - 1] === "")
    xs.pop();

  return xs;
};


const strToLower = s =>
  s.toLowerCase();


const strToUpper = s =>
  s.toUpperCase();


const strTrim = s =>
  s.trim();


const strUnconsNth = (i, len) => s =>
  i >= s.length
    ? None
    : Some([s.slice(i, i + len), s.slice(0, i) + s.slice(i + len)]);


const strUnconsNthOr = def => (i, len) => s =>
  i >= s.length
    ? [def, s]
    : [s.slice(i, i + len), s.slice(0, i) + s.slice(i + len)];


const toString = x => x.toString();


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const arrApConstl = arrLiftA2(_const);


const arrPrepend = flip(arrAppend);


const arrPrependx = flip(arrAppendx);


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


const All = struct("All");


/***[Monoid]******************************************************************/


const allEmpty = All(true);


/***[Semigroup]***************************************************************/


const allAppend = tx => ty =>
  All(tx.runAll && ty.runAll);


const allPrepend = allAppend;


/******************************************************************************
************************************[ ANY ]************************************
******************************************************************************/


const Any = struct("Any");


/***[Monoid]******************************************************************/


const anyEmpty = Any(false);


/***[Semigroup]***************************************************************/


const anyAppend = tx => ty =>
  Any(tx.runAny || ty.runAny);


const anyPrepend = anyAppend;


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


const Compare = struct("Compare");


/***[Contravariant Functor]***************************************************/


const compContra = f => tf =>
  Compare(compBoth(tf.runCompare) (f));


/***[Monoid]******************************************************************/


const compEmpty = Compare(x => y => EQ);


/***[Semigroup]***************************************************************/


const compAppend = tf => tg =>
  Compare(x => y =>
    ordAppend(tf.runCompare(x) (y)) (tg.runCompare(x) (y)));


const compPrepend = flip(compAppend);


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


const Comp = struct("Comp");


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


const Const = struct("Const");


/***[Applicative]*************************************************************/


const constOf = x => Const(x);


/***[Functor]*****************************************************************/


const constMap = f => tx =>
  Const(tx.runConst);


/******************************************************************************
*******************************[ CONTINUATION ]********************************
******************************************************************************/


const Cont = struct("Cont");


const cont = f => x =>
  Cont(k => k(f(x))); 


const cont2 = f => x => y =>
  Cont(k => k(f(x) (y)));


/***[Applicative]*************************************************************/


const contAp = tf => tx =>
  Cont(k => tf.runCont(f => tx.runCont(x => k(f(x)))));


const contLiftA2 = f => tx => ty =>
  contAp(contMap(f) (tx)) (ty);


const contOf = x => Cont(k => k(x));


/***[ChainRec]****************************************************************/


const contChainRec = f =>
  Cont(k => {
    let acc = f();

    while (acc && acc.type === recur) {
      acc.args[0] = acc.args[0] (id);
      acc = f(...acc.args);
    }

    return k(acc);
  });


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


/***[Misc. Combinators]*******************************************************/


const contReset = tx => // delimited continuations
  contOf(tx.runCont(id));
  

const contShift = f => // delimited continuations
  Cont(k => f(k).runCont(id));


/******************************************************************************
***********************[ DEFER (LAZY EVAL W/O SHARING ]************************
******************************************************************************/


const Defer = structGetter("Defer")
  (Defer => thunk => Defer({get runDefer() {return thunk()}}));


/***[Applicative]*************************************************************/


const defAp = tf => tx =>
  Defer(() => tf.runDefer(tx.runDefer));


const defOf = x => Defer(() => x);


/***[ChainRec]****************************************************************/


const defChainRec = f =>
  Defer(() => {
    let acc = f();

    while(acc && acc.type === recur) {
      acc.args[0] = acc.args[0].runDefer();
      acc = f(...acc.args);
    }

    return acc.runDefer();
  });


/***[Functor]*****************************************************************/


const defMap = f => tx =>
  Defer(() => f(tx.runDefer));


/***[Monad]*******************************************************************/


const defChain = fm => mx =>
  Defer(() => fm(mx.runDefer).runDefer);


const defJoin = mmx =>
  Defer(() => mmx.runDefer.runDefer);


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


const Either = union("Either");


const Left = x =>
  Either("Left", x);


const Right = x =>
  Either("Right", x);


/***[Foldable]****************************************************************/


const ethCata = left => right => tx =>
  match(tx, {
    type: "Either",
    get Left() {return left(tx.runEither)},
    get Right() {return right(tx.runEither)}
  });


/******************************************************************************
*******************************[ ENDOMORPHISM ]********************************
******************************************************************************/


const Endo = struct("Endo");


/***[Monoid]******************************************************************/


const endoEmpty = Endo(id);


/***[Semigroup]***************************************************************/


const endoAppend = tf => tg => x =>
  Endo(tf.runEndo(tg.runEndo(x)));


const endoPrepend = flip(endoAppend);


/******************************************************************************
********************************[ EQUIVALENT ]*********************************
******************************************************************************/


const Equiv = struct("Equiv");


/***[Contravariant Functor]***************************************************/


const equivContra = f => tf =>
  Equiv(compBoth(tf.runEquiv) (f));


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


const First = struct("First");


/***[Semigroup]***************************************************************/


const firstAppend = x => _ => x;


// firstPrepend @derived


/******************************************************************************
******************************[ GETTER (OPTICS) ]******************************
******************************************************************************/


const Lens = struct("Lens");


/***[Instances]***************************************************************/


// Object


const objGetter = k =>
  Lens(_ => ft => o =>
    ft(o[k]));


/***[Category]****************************************************************/


const getComp = tx => ty =>
  Lens(x => tx.runLens() (ty.runLens() (x)));


const getComp3 = tx => ty => tz =>
  Lens(x => tx.runLens() (ty.runLens() (tz.runLens() (x))));


const getId = Lens(id);


const getVarComp = varComp({comp: getComp, id: getId});


/***[Misc. Combinators]*******************************************************/


const getGet = tx => o =>
  tx.runLens(Const) (o)
    .runConst;


/******************************************************************************
**********************************[ HASHED ]***********************************
******************************************************************************/


const Hashed = structGetter("Hashed")
  (Hashed => tx => o => Hashed({
    runHashed: o,
    [Symbol.toPrimitive]: hint =>
      hint === "string" || hint === "default"
        ? tx.runLazy // hash is lazily created
        : o.valueOf()}));


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


const Id = struct("Id");


/***[Applicative]*************************************************************/


const idOf = x => Id(x);


/***[Functor]*****************************************************************/


const idMap = f => tx =>
  Id(f(tx.runId));


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


const Last = struct("Last");


/***[Semigroup]***************************************************************/


const lastAppend = _ => y => y;


const lastPrepend = firstAppend;


/******************************************************************************
***********************[ LAZY (LAZY EVAL WITH SHARING) ]***********************
******************************************************************************/


const Lazy = structGetter("Lazy")
  (Lazy => thunk => Lazy({
    get runLazy() {
      delete this.runLazy;
      return this.runLazy = thunk();
    }}));


/***[Applicative]*************************************************************/


const lazyAp = tf => tx =>
  Lazy(() => tf.runLazy (tx.runLazy));


const lazyOf = x => Lazy(() => x);


/***[ChainRec]****************************************************************/


const lazyChainRec = f =>
  Lazy(() => {
    let acc = f();

    while(acc && acc.type === recur) {
      acc.args[0] = acc.args[0].runLazy();
      acc = f(...acc.args);
    }

    return acc.runLazy();
  });


/***[Functor]*****************************************************************/


const lazyMap = f => tx =>
  Lazy(() => f(tx.runLazy));


/***[Monad]*******************************************************************/


const lazyChain = fm => mx =>
  Lazy(() => fm(mx.runLazy).runLazy);


const lazyJoin = mmx =>
  Lazy(() => mmx.runLazy.runLazy);


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


const arrLensx = arrLens_({set: arrSetx, del: arrDelx});


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


const mapLensx = mapLens_({set: mapSetx, del: mapDelx});


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


const objLensx = objLens_({set: objSetx, del: objDelx});


// String


const strLens = (i, len) => // String is immutable hence no typeclass functions
  Lens(map => ft => s =>
    map(t => {
      const tx = strUnconsNth(i, len) (s);

      switch (tx[TAG]) {
        case "None": return t;

        case "Some":
          return strConsNth(t, i - 1) (tx.runOption[1]);
      }
    })
      (ft(s.slice(i, len + i))));


/***[Category]****************************************************************/


const lensComp = tx => ty =>
  Lens(map => ft =>
    tx.runLens(map) (ty.runLens(map) (ft)));


const lensComp3 = tx => ty => tz =>
  Lens(map => ft =>
    tx.runLens(map) (ty.runLens(map) (tz.runLens(map) (ft))));


const lensId = Lens(id);


const lensVarComp = varComp({comp: lensComp, id: lensId});


/***[Misc. Combinators]*******************************************************/


const lensDel = tx => o =>
  tx.runLens(idMap) (_const(Id(null))) (o);


const lensGet = tx => o =>
  tx.runLens(constMap) (Const) (o)
    .runConst;


const lensMod = tx => f => o =>
  tx.runLens(idMap) (v => Id(f(v))) (o);


const lensSet = tx => v => o =>
  tx.runLens(idMap) (_const(Id(v))) (o);


/******************************************************************************
**************************[ MATCHED (REGEXP RESULT) ]**************************
******************************************************************************/


const Matched = struct("Matched");


/***[Foldable]****************************************************************/


const matCata = x => tx =>
  match(tx.runMatched, {
    type: "Option",
    None: x,
    Some: tx.runMatched.runOption
  });


/******************************************************************************
************************************[ MAX ]************************************
******************************************************************************/


const Max = struct("Max");


/***[Monoid]******************************************************************/


const maxEmpty = minBound => Max(minBound);


/***[Semigroup]***************************************************************/


const maxAppend = max => x => y =>
  max(x) (y);


const maxPrepend = maxAppend;


/******************************************************************************
************************************[ MIN ]************************************
******************************************************************************/


const Min = struct("Min");


/***[Monoid]******************************************************************/


const minEmpty = maxBound => Min(maxBound);


/***[Semigroup]***************************************************************/


const minAppend = min => x => y =>
  min(x) (y);


const minPrepend = minAppend;


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


const Option = unionGetter("Option");


const None = Option("None", {get runOption() {return None}});


const Some = x => Option("Some", {runOption: x});


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


const optLiftA2 = f => tx => ty =>
  optAp(optMap(f) (tx)) (ty);


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


const optChainT = ({chain, of}) => fmm => mmx =>
  chain(mx => {
    switch (mx[TAG]) {
      case "None": return of(None);
      case "Some": return fmm(mx.runOption);
    }
  }) (mmx);


/******************************************************************************
*********************************[ ORDERING ]**********************************
******************************************************************************/


const Ordering = unionGetter("Ordering");


const LT = Ordering("LT",
  {get runOrdering() {return LT}, valueOf: () => -1});


const EQ = Ordering("EQ",
  {get runOrdering() {return EQ}, valueOf: () => 0});


const GT = Ordering("GT",
  {get runOrdering() {return GT}, valueOf: () => 1});


/***[Foldable]****************************************************************/


const ordCata = lt => eq => gt => tx =>
  match(tx, {
    type: "Ordering",
    LT: lt,
    EQ: eq,
    GT: gt
  });


/***[Monoid]******************************************************************/


const ordEmpty = EQ;


/***[Semigroup]***************************************************************/


const ordAppend = tx => ty =>
  ordCata(LT) (ty) (GT) (tx);


const ordPrepend = ordAppend;


/******************************************************************************
***********************[ PARALLEL (ASYNC IN PARALLEL) ]************************
******************************************************************************/


// NOTE: This type is mainly untested and may undergo major changes in the future. 


const Parallel = structGetter("Parallel")
  (Parallel => k => Parallel(thisify(o => {
    o.runParallel = (res, rej) => k(x => {
      o.runParallel = l => l(x);
      return res(x);
    }, rej);
    
    return o;
  })));


/***[Foldable]****************************************************************/


const parCata = alg => tf.runParallel;


/***[Applicative]*************************************************************/


const parAp = tf => tx =>
  Parallel((res, rej) =>
    parAnd(tf) (tx).runParallel(([f, x]) => res(f(x)), rej));


const parOf = x => Parallel((res, rej) => res(x));


/***[Functor]*****************************************************************/


const parMap = f => tx =>
  Parallel((res, rej) => tx.runParallel(x => res(f(x)), rej));


/***[Monoid]******************************************************************/


const parEmpty = Parallel((res, rej) => null);


/***[Semigroup]***************************************************************/


// parAppend @derived


// parPrepend @derived


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


/***[Derived]*****************************************************************/


const parAppend = parOr;


const parPrepend = parOr;


/******************************************************************************
*********************************[ PREDICATE ]*********************************
******************************************************************************/


const Pred = struct("Pred");


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
******************************[ PRISM (OPTICS) ]*******************************
******************************************************************************/


// const Prism = struct("Prism"); Prism don't have its own type for the time beeing


/***[Instances]***************************************************************/


// Either


const leftPrism =
  Lens(({map, of}) => ft => tx =>
    match(tx, {
      type: "Either",
      get Left() {return map(Left) (ft(tx.runEither))},
      get Right() {return of(tx)}
    }));


const rightPrism =
  Lens(({map, of}) => ft => tx =>
    match(tx, {
      type: "Either",
      get Left() {return of(tx)},
      get Right() {return map(Right) (ft(tx.runEither))}
    }));


/***[Misc. Combinators]*******************************************************/


const prismGet = prism => tx => // TODO: falsify
  prism(constMap).runPrism(tx => Const(tx)) (tx);


const prismMod = prism => f => tx => // aka prismOver
  prism(idMap).runPrism(ty =>
    Id(optMap(f) (ty))) (tx);


const prismSet = prism => x => tx =>
  prism(idMap).runPrism(_const(Id(Some(x)))) (tx);


/******************************************************************************
**********************************[ PRODUCT ]**********************************
******************************************************************************/


const Prod = struct("Prod");


/***[Monoid]******************************************************************/


const prodEmpty = Prod(1);


/***[Semigroup]***************************************************************/


const prodAppend = tm => tn =>
  Sum(tm.runProd * tn.runProd);


const prodPrepend = prodAppend;


/******************************************************************************
**********************************[ READER ]***********************************
******************************************************************************/


const Reader = struct("Reader");


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


/***[Misc. Combinators]*******************************************************/


const ask = Reader(id);


const asks = f =>
  readChain(x => readOf(f(x))) (ask);


const local = f => tg =>
  Reader(x => tg.runReader(f(x)));


/******************************************************************************
******************************[ SETTER (OPTICS) ]******************************
******************************************************************************/


//const Setter = struct("Setter");


/***[Instances]***************************************************************/


// Object


const objSetter_ = objDel => k =>
  Lens(_ => ft => o =>
    idMap(v =>
      objUnionx(
        objDel(k) (o))
          (v === null
            ? {}
            : {[k]: v}))
                (ft(o[k])));


const objSetter = objSetter_(objDel);


const objSetterx = objSetter_(objDelx);


/***[Category]****************************************************************/


const setComp = tx => ty =>
  Lens(x => tx.runLens() (ty.runLens() (x)));


const setComp3 = tx => ty => tz =>
  Lens(x => tx.runLens() (ty.runLens() (tz.runLens() (x))));


const setId = Lens(id);


const setVarComp = varComp({comp: setComp, id: setId});


/***[Misc. Combinators]*******************************************************/


const setDel = tx => o =>
  tx.runLens(_const(Id(null))) (o);


const setMod = tx => f => o =>
  tx.runLens(v => Id(f(v))) (o);


const setSet = tx => v => o =>
  tx.runLens(_const(Id(v))) (o);


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


const State = struct("State");


/***[Applicative]*************************************************************/


const stateAp = tf => tx =>
  State(y => {
    const [f, y_] = tf.runState(y),
      [x, y__] = tx.runState(y_);

    return [f(x), y__];
  });


const stateOf = x => State(y => [x, y]);


/***[Functor]*****************************************************************/


const stateMap = f => tx =>
  State(y => {
    const [x, y_] = tx.runState(y);
    return [f(x), y_];
  });


/***[Monad]*******************************************************************/


const stateChain = fm => mx =>
  State(y => {
    const [x, y_] = mx.runState(y);
    return fm(x).runState(y_);
  });


/***[Misc. Combinators]*******************************************************/


const evalState = tf =>
  y => tf.runState(y) [0];


const execState = tf =>
  y => tf.runState(y) [1];


const stateGet = State(y => [y, y]);


const stateGets = f =>
  stateChain(y => stateOf(f(x))) (stateGet);


const stateModify = f =>
  stateChain(y => statePut(f(y))) (stateGet);


const statePut = y => State(_ => [null, y]);


/******************************************************************************
**********************************[ STREAM ]***********************************
******************************************************************************/


const Stream = union("Stream");


const Yield = value => next =>
  Stream("Yield", {value, next});


const Skip = next =>
  Stream("Skip", {next});


const Return = value =>
  Stream("Return", {value});


/******************************************************************************
************************************[ SUM ]************************************
******************************************************************************/


const Sum = struct("Sum");


/***[Monoid]******************************************************************/


const sumEmpty = Sum(0);


/***[Semigroup]***************************************************************/


const sumAppend = tm => tn =>
  Sum(tm.runSum + tn.runSum);


const sumPrepend = sumAppend;


/******************************************************************************
*************************[ TASK (ASYNC IN SEQUENCE) ]**************************
******************************************************************************/


const Task = structGetter("Task")
  (Task => k => Task(thisify(o => {
    o.runTask = (res, rej) => k(x => {
      o.runTask = l => l(x);
      return res(x);
    }, rej);
    
    return o;
  })));


/***[Applicative]*************************************************************/


const tAp = tf => tx =>
  Task((res, rej) => tf.runTask(f => tx.runTask(x => res(f(x)), rej), rej));


const tLiftA2 = f => tx => ty =>
  tAp(tMap(f) (tx)) (ty);


const tLiftA3 = f => tx => ty => tz =>
  tAp(tAp(tMap(f) (tx)) (ty)) (tz);


const tOf = x => Task((res, rej) => res(x));


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


const tChainT = ({chain, of}) => fm => mmx => // NOTE: fm only returns the inner monad hence of is necessary
  chain(mx =>
    of(tChain(fm) (mx))) (mmx);


const tJoin = mmx =>
  Task((res, rej) => mmx.runTask(mx => mx.runTask(res, rej), rej));


const tLiftM2 = f => mx => my =>
  tChain(mx) (x => tChain(my) (y => tOf(f(x) (y))));


/***[Monoid]*******************************************************************/


const tEmpty = x => Task((res, rej) => res(x));


/***[Misc. Combinators]*******************************************************/


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



/***[Derived]*****************************************************************/


const tAppend = tAnd;


const tPrepend = flip(tAnd);


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


/***[Foldable]****************************************************************/


const theseCata = _this => that => these => tx =>
  match(tx, {
    type: "These",
    get This() {return _this(tx.runThese)},
    get That() {return that(tx.runThese)},
    get These() {return these(...tx.runThese)}
  });


/***[Misc. Combinators]*******************************************************/


const fromThese = (x, y) => tx =>
  match(tx) ({
    type: "These",
    get This() {return [tx.runThese, y]},
    get That() {return [x, tx.runThese]},
    get These() {return tx.runThese}
  });


/******************************************************************************
****************************[ TRAVERSAL (OPTICS) ]*****************************
******************************************************************************/


// TODO: add


/******************************************************************************
***********************************[ TUPLE ]***********************************
******************************************************************************/


const Pair = structn("Pair")
  (Pair => (x, y) => Pair([x, y]));


const Pair_ = structn("Pair")
  (Pair_ => x => y => Pair_([x, y]));


const Triple = struct("Triple")
  (Triple => (x, y, z) => Triple([x, y, z]));


const Triple_ = structn("Triple")
  (Triple_ => x => y => z => Triple_([x, y, z]));


/***[Bifunctor]***************************************************************/


const tupBimap = f => g => ([x, y]) =>
  [f(x), g(y)];


/***[Functor]*****************************************************************/


const tupMap = f => ([x, y]) =>
  [f(x), y];


const tupSecond = f => ([x, y]) =>
  [x, f(y)];


const tupThird = f => ([x, y, z]) =>
  [x, y, f(z)];


/***[Trifunctor]**************************************************************/


const tupTrimap = f => g => h => ([x, y, z]) =>
  [f(x), g(y), h(z)];


/***[Misc. Combinators]*******************************************************/


const tup1 = ([x]) => x;


const tup2 = ([x, y]) => y;


const tup3 = ([x, y, z]) => z;


/******************************************************************************
**********************************[ WRITER ]***********************************
******************************************************************************/


const Writer = structn("Writer")
  (Writer => (x, y) => Writer([x, y]));


/***[Applicative]*************************************************************/


const writeAp = append => ({runWriter: [f, y]}) => ({runWriter: [x, y_]}) =>
  Writer(f(x), append(y) (y_));  


const writeOf = empty => x =>
  Writer(x, empty);


/***[Functor]*****************************************************************/


const writeMap = f => ({runWriter: [x, y]}) =>
  Writer(f(x), y);


/***[Monad]*******************************************************************/


const writeChain = append => fm => ({runWriter: [x, y]}) => {
  const [x_, y_] = fm(x).runWriter;
  return Writer(x_, append(y) (y_));
};


/***[Misc. Combinators]*******************************************************/


const evalWriter = tx =>
  tx.runWriter(([x, y]) => x);


const execWriter = tx =>
  tx.runWriter(([x, y]) => y);


const writeCensor = f => mx =>
  pass(mx.runWriter(pair => Writer(pair, f)));


const writeListen = tx =>
  tx.runWriter(([x, y]) => Writer([x, y], y));


const writeListens = f => mx =>
  listen(mx).runWriter(([pair, y]) => Writer(pair, f(y)));


const writePass = tx =>
  tx.runWriter(([[x, f], y]) => Writer([x, f(x)]));


const writeTell = y => Writer(null, y);


/******************************************************************************
**********************************[ DERIVED ]**********************************
******************************************************************************/


const arrAll = all({ // with short circuit semantics
  fold: arrFoldk,
  append: compBin(tx =>
    Cont(k =>
      tx.runAll
        ? k(tx)
        : tx))
            (allAppend),
  empty: allEmpty});


const arrAny = any({ // with short circuit semantics
  fold: arrFoldk,
  append: compBin(tx =>
    Cont(k =>
      tx.runAny
        ? tx
        : k(tx)))
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


/******************************************************************************
*******************************[ CONSTRUCTORS ]********************************
******************************************************************************/


const hamtCreateBranch = (mask = 0, children = []) => {
  return {
    type: HAMT_BRANCH,
    mask,
    children
  };
};


const hamtCreateCollision = (code, children) => {
  return {
    type: HAMT_COLLISION,
    code,
    children: children
  };
};


const hamtCreateLeaf = (code, key, value) => {
  return {
    type: HAMT_LEAF,
    code,
    key,
    value
  };
};


/******************************************************************************
************************************[ API ]************************************
******************************************************************************/


const hamtDel = key => hamt => {
  key = key + ""; // nasty destructive type conversion

  const code = strCreateHash(key),
    res = hamtRemove(hamt, code, key, 0);

  if (res === undefined)
    return hamt;

  else if (res === null)
    return hamtNew;

  else
    return res;
};


const hamtGet = key => hamt => {
  key = key + ""; // nasty destructive type conversion

  const code = strCreateHash(key);

  let node = hamt,
    depth = -1;

  while (true) {
    ++depth;

    switch (node.type) {
      case HAMT_BRANCH: {
        const frag = (code >>> (4 * depth)) & HAMT_MASK,
          mask = 1 << frag;

        if (node.mask & mask) {
          const idx = hamtPopCount(node.mask, frag);
          node = node.children[idx];
          continue;
        }
        
        else
          return undefined;
      }

      case HAMT_COLLISION: {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.key === key)
            return child.value;
        }

        return undefined;
      }

      case HAMT_LEAF: {
        return node.key === key
          ? node.value
          : undefined;
      }
    }
  }
};


const hamtNew = hamtCreateBranch();


const hamtSet = (key, value) => hamt => {
  key = key + ""; // nasty destructive type conversion

  const code = strCreateHash(key);
  return hamtInsert(hamt, code, key, value);
};


/******************************************************************************
******************************[ IMPLEMENTATION ]*******************************
******************************************************************************/


const hamtInsert = (node, code, key, value, depth = 0) => {
  const frag = (code >>> (4 * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      if (node.code === code) {
        if (node.key === key)
          return hamtCreateLeaf(code, key, value);

        return hamtCreateCollision(
          code, [node, hamtCreateLeaf(code, key, value)]);
      } 

      else {
        const prevFrag = (code >>> (4 * depth)) & HAMT_MASK;

        if (prevFrag === frag)
          return hamtCreateBranch(
            mask,
            [hamtInsert(
              hamtInsert(hamtNew, code, key, value, depth + 1),
              node.code,
              node.key,
              node.value,
              depth + 1)]);

        const prevMask = 1 << prevFrag,
          children = prevFrag < frag
            ? [node, hamtCreateLeaf(code, key, value)]
            : [hamtCreateLeaf(code, key, value), node];

        return hamtCreateBranch(mask | prevMask, children);
      }
    }

    case HAMT_BRANCH: {
      const idx = hamtPopCount(node.mask, frag),
        children = node.children;

      if (node.mask & mask) {
        const child = children[idx],
          xs = children.slice();

        xs[idx] = hamtInsert(child, code, key, value, depth + 1);
        return hamtCreateBranch(node.mask, xs);
      }

      else {
        const xs = children.slice();
        xs.splice(idx, 0, hamtCreateLeaf(code, key, value));

        return hamtCreateBranch(node.mask | mask, xs);
      }
    }

    case HAMT_COLLISION: {
      for (let i = 0, len = node.children.length; i < len; ++i) {
        if (node.children[i].key === key) {
          const xs = node.children.slice();
          xs[i] = hamtCreateLeaf(code, key, value);

          return hamtCreateCollision(node.code, xs);
        }
      }

      return hamtCreateCollision(
        node.code,
        node.children.concat(hamtCreateLeaf(code, key, value)));
    }
  }
};


const hamtRemove = (node, code, key, depth) => {
  const frag = (code >>> (4 * depth)) & HAMT_MASK,
    mask = 1 << frag;

  switch (node.type) {
    case HAMT_LEAF: {
      return node.key === key
        ? null // remove
        : undefined; // noop
    }

    case HAMT_BRANCH: {
      if (node.mask & mask) {
        const idx = hamtPopCount(node.mask, frag),
          res = hamtRemove(node.children[idx], code, key, depth + 1);

        if (res === null) {
          const newMask = node.mask & ~mask;

          if (newMask === 0)
            return null;

          else {
            const xs = node.children.slice();
            xs.splice(idx, 1);

            return hamtCreateBranch(newMask, xs);
          }
        }

        else if (res === undefined)
          return undefined;

        else {
          const xs = node.children.slice();
          xs[idx] = res;

          return hamtCreateBranch(node.mask, xs);
        }
      }

      else
        return undefined;
    }

    case HAMT_COLLISION: {
      if (node.code === code) {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          const child = node.children[i];

          if (child.key === key) {
            const xs = node.children.slice();
            xs.splice(i, 1);

            return hamtCreateCollision(node.code, xs);
          }
        }
      }

      return undefined;
    }
  }
};


/******************************************************************************
*********************************[ AUXILIARY ]*********************************
******************************************************************************/


const hamtPopCount = (x, n) => {
  if (n !== undefined)
    x &= (1 << n) - 1

  x -= x >> 1 & 0x55555555
  x = (x & 0x33333333) + (x >> 2 & 0x33333333)
  x = x + (x >> 4) & 0x0f0f0f0f
  x += x >> 8
  x += x >> 16

  return x & 0x7f
};


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
    .runTask(id, e => {
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


const arrSum = arrFoldM({append: sumAppend, empty: sumEmpty});


/******************************************************************************
*******************************************************************************
************************************[ API ]************************************
*******************************************************************************
******************************************************************************/


module.exports = {
  Age,
  All,
  all,
  allAppend,
  allEmpty,
  allPrepend,
  Ancient,
  and,
  andp,
  Any,
  any,
  anyAppend,
  anyEmpty,
  anyPrepend,
  app,
  appVar,
  arrAll,
  arrAlt,
  arrAltx,
  arrAny,
  arrAp,
  arrApConstl,
  arrApConstr,
  arrApo,
  arrAppend,
  arrAppendx,
  arrChain,
  arrChain2,
  arrChain3,
  arrChainRec,
  arrClone,
  arrConcat,
  arrCons,
  arrConsHead,
  arrConsHeadx,
  arrConsNth,
  arrConsNthx,
  arrConsx,
  arrCreateMatrix,
  arrDedupe,
  arrDedupeBy,
  arrDedupeOn,
  arrDel,
  arrDelx,
  arrEmpty,
  arrFilter,
  arrFold,
  arrFoldk,
  arrFoldM,
  arrFoldr,
  arrFoldStr,
  arrFutu,
  arrHead,
  arrHeadOr,
  arrInit,
  arrInvert,
  arrLast,
  arrLastOr,
  arrLens,
  arrLensx,
  arrLiftA2,
  arrLiftA3,
  arrLiftM2,
  arrLiftM3,
  arrHisto,
  arrHylo,
  arrJoin,
  arrLength,
  arrMap,
  arrMapA,
  arrMapAdjacent,
  arrMapChunk,
  arrMapConst,
  arrMapx,
  arrModOr,
  arrModOrx,
  arrMutu,
  arrNull,
  arrOf,
  arrPara,
  arrParak,
  arrPartition,
  arrPrepend,
  arrPrependx,
  arrScan,
  arrSeqA,
  arrSet,
  arrSetx,
  arrSliceAt,
  arrSliceAtx,
  arrSortBy,
  arrSortByx,
  arrSplitAt,
  arrSplitAtx,
  arrSplitBy,
  arrSplitByx,
  arrSum,
  arrTail,
  arrTransduce,
  arrTransducek,
  arrTranspose,
  arrUnconsHead,
  arrUnconsHeadOr,
  arrUnconsHeadOrx,
  arrUnconsHeadx,
  arrUnconsInit,
  arrUnconsInitx,
  arrUnconsLast,
  arrUnconsLastOr,
  arrUnconsLastOrx,
  arrUnconsLastx,
  arrUnconsNth,
  arrUnconsNthx,
  arrUnconsNthOr,
  arrUnconsNthOrx,
  arrUnconsTail,
  arrUnconsTailx,
  arrUnfold,
  arrUnzip,
  arrVarLiftA,
  arrZero,
  arrZip,
  arrZipBy,
  arrZygo,
  ascOrder,
  ascOrder_,
  ask,
  asks,
  call,
  call_,
  ceil,
  Comp,
  comp,
  comp2nd,
  comp3,
  compBin,
  compBoth,
  compAp,
  compAppend,
  compPrepend,
  Compare,
  compare,
  compContra,
  compEmpty,
  compMap,
  compOf,
  concat,
  Const,
  _const,
  constMap,
  constOf,
  Cont,
  cont,
  cont2,
  contAp,
  contChain,
  contChain2,
  contChainRec,
  contJoin,
  contLiftA2,
  contLiftM2,
  contMap,
  contReset,
  contShift,
  contOf,
  curry,
  curry3,
  curry4,
  curry5,
  DateError,
  dateParse,
  debug,
  defAp,
  defChain,
  defChainRec,
  Defer,
  defJoin,
  defMap,
  defOf,
  delay,
  descOrder,
  descOrder_,
  dropper,
  dropperk,
  dropperNth,
  dropperNthk,
  dropperWhile,
  dropperWhilek,
  eff,
  Either,
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
  ethCata,
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
  fixed,
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
  funVarComp,
  funVarLiftA,
  funVarPipe,
  getComp,
  getComp3,
  getDay,
  getGet,
  getId,
  getMonth,
  getMonthDays,
  getTimezoneOffset,
  getVarComp,
  getYear,
  GT,
  guard,
  hamtDel,
  hamtGet,
  hamtNew,
  hamtSet,
  Hashed,
  headH,
  History,
  history,
  Id,
  id,
  idMap,
  idOf,
  imply,
  index,
  infixl,
  infixr,
  inRange,
  invoke,
  introspect,
  isDate,
  isDateStr,
  isFalse,
  isIntStr,
  isTrue,
  isUnit,
  kleisliComp,
  kleisliPipe,
  Last,
  lastAppend,
  lastPrepend,
  Lazy,
  lazyAp,
  lazyChain,
  lazyChainRec,
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
  lensVarComp,
  _let,
  local,
  log,
  loop,
  loop_,
  LT,
  _Map,
  mapMap,
  mapDel,
  mapDelx,
  mapGet,
  mapGetOr,
  mapLens,
  mapLensx,
  mapModOr,
  mapModOrx,
  mapSet,
  mapSetx,
  mapper,
  mapperk,
  match,
  matchExp,
  matCata,
  Matched,
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
  neq,
  _new,
  None,
  not,
  NO_ENC,
  NOT_FOUND,
  notp,
  numCompare,
  numCreateRandomBytes_,
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
  objDelx,
  objEntries,
  objGetOr,
  objGetter,
  objKeys,
  objLens,
  objLensx,
  objMemo,
  objModOr,
  objModOrx,
  objPathOr,
  objSet,
  objSetter,
  objSetx,
  objUnion,
  objUnionx,
  objValues,
  Option,
  optAp,
  optCata,
  optChain,
  optChainT,
  optLiftA2,
  optMap,
  optOf,
  or,
  ordAppend,
  ordCata,
  ordEmpty,
  ordPrepend,
  Ordering,
  orp,
  Pair,
  Pair_,
  Parallel,
  parAll,
  parAnd,
  parAny,
  parAp,
  parAppend,
  parCata,
  parEmpty,
  parMap,
  parOf,
  parOr,
  parPrepend,
  partial,
  partialCurry,
  pipe,
  pipe3,
  pipeBin,
  pipeBoth,
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
  recur,
  recur_,
  RegExpError,
  Return,
  returnHead,
  returnLast,
  Right,
  rightPrism,
  round,
  roundBy,
  ScriptumError,
  select,
  select11,
  select1N,
  SemigroupError,
  _Set,
  setComp,
  setComp3,
  setDel,
  setId,
  setMap,
  setMod,
  setSet,
  setVarComp,
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
  strAppend,
  strCapWord,
  strChunk,
  strConsNth,
  strCreateCryptoHash_,
  strCreateHash,
  strDel,
  strFold,
  strFoldChunks,
  strLength,
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
  strTrim,
  struct,
  structn,
  structGetter,
  strUnconsNth,
  strUnconsNthOr,
  Sum,
  sumAppend,
  sumEmpty,
  sumPrepend,
  TAG,
  taker,
  takerk,
  takerNth,
  takerNthk,
  takerWhile,
  takerWhilek,
  Task,
  taggedLog,
  tAnd,
  tAll,
  tAp,
  tAppend,
  tCata,
  tChain,
  tChainT,
  tChain2,
  tEmpty,
  tPrepend,
  That,
  These,
  These_,
  theseCata,
  This,
  thisify,
  _throw,
  tJoin,
  tLiftA2,
  tLiftA3,
  tLiftM2,
  tMap,
  tOf,
  toFixedFloat,
  Triple,
  Triple_,
  strToLower,
  strToUpper,
  toString,
  trace,
  tramp,
  tryCatch,
  tup1,
  tup2,
  tup3,
  tupBimap,
  tupSecond,
  tupThird,
  tupTrimap,
  TYPE,
  uncurry,
  uncurry3,
  uncurry4,
  uncurry5,
  union,
  UnionError,
  unionGetter,
  varAp,
  varChain,
  varComp,
  variadic,
  varKleisliComp,
  varKleisliPipe,
  varLiftA,
  varLiftM,
  varPipe,
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
  Yield,
};

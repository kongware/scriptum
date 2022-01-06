/*
                                88                                                    
                                ""              ,d                                    
                                                88                                    
,adPPYba,  ,adPPYba, 8b,dPPYba, 88 8b,dPPYba, MM88MMM 88       88 88,dPYba,,adPYba,   
I8[    "" a8"     "" 88P'   "Y8 88 88P'    "8a  88    88       88 88P'   "88"    "8a  
 `"Y8ba,  8b         88         88 88       d8  88    88       88 88      88      88  
aa    ]8I "8a,   ,aa 88         88 88b,   ,a8"  88,   "8a,   ,a88 88      88      88  
`"YbbdP"'  `"Ybbd8"' 88         88 88`YbbdP"'   "Y888  `"YbbdP'Y8 88      88      88  
                                   88                                                 
                                   88                                                 
*/


/* This is the untyped version of scriptum's purely functional standard library.
It has no dependencies and can be used both client- and server-side. */


/******************************************************************************
*******************************************************************************
**************************[ CROSS-CUTTING CONCERNS ]***************************
*******************************************************************************
******************************************************************************/

/******************************************************************************
*********************************[ CONSTANTS ]*********************************
******************************************************************************/


const MICROTASK_TRESHOLD = 0.01; // treshold for next microtask


const NOOP = null;


const PREFIX = "$_"; // avoid property name collisions


/******************************************************************************
****************************[ JAVASCRIPT RELATED ]*****************************
******************************************************************************/


export const comparator = (m, n) =>
  m < n ? LT : m === n ? EQ : GT;


export const NOT_FOUND = -1;


export const TAG = Symbol.toStringTag;


/******************************************************************************
******************************[ LAZY EVALUATION ]******************************
******************************************************************************/


/***[ Constants ]*************************************************************/


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/***[ API ]*******************************************************************/


export const strict = x =>
  x && x[THUNK] ? x[EVAL] : x;


export const lazy = thunk =>
  new Proxy(thunk, new ThunkProxy(true));


export const defer = thunk =>
  new Proxy(thunk, new ThunkProxy(false));


/***[ Implementation ]********************************************************/


class ThunkProxy {
  constructor(share) {
    this.memo = NULL;
    this.share = share;
  }

  apply(g, that, args) {

    // evaluate to WHNF

    if (this.memo === NULL || this.share === false) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return this.memo(...args);
  }

  get(g, k) {

    // prevent evaluation
    
    if (k === THUNK)
      return true;

    // prevent evaluation

    else if (k === Symbol.toStringTag)
      return "Function";

    // evaluate once

    else if (this.memo === NULL || this.share === false) {
  
      // evaluate only one layer

      if (k === EVAL) this.memo = g();

      // evaluate to WHNF

      else {
        this.memo = g();

        while (this.memo[THUNK] === true)
          this.memo = this.memo[EVAL];
      }
    }

    // return the memoized result

    if (k === EVAL)
      return this.memo;

    // enforce array spreading
    
    else if (k === Symbol.isConcatSpreadable
      && Array.isArray(this.memo))
        return true;

    // method binding without triggering evaluation

    else if (typeof this.memo[k] === "function"
      && this.memo[k] [THUNK] !== true)
        return this.memo[k].bind(this.memo);

    else return this.memo[k];
  }

  getOwnPropertyDescriptor(g, k) {

    // evaluate to WHNF

    if (this.memo === NULL || this.share === false) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(g, k) {

    // prevent evaluation

    if (k === THUNK)
      return true;

    // evaluate to WHNF

    else if (this.memo === NULL || this.share === false) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return k in this.memo;
  }

  ownKeys(g) {

    // evaluate to WHNF

    if (this.memo === NULL || this.share === false) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return Object.keys(this.memo);
  }
}


/******************************************************************************
*******************************[ STACK SAFETY ]********************************
******************************************************************************/


/***[ Guarded Recursion ]*****************************************************/


export const strictRec = x => {
  while (x && x[THUNK] === true)
    x = x[EVAL];

  return x;
};


/***[ Monadic Recursion ]*****************************************************/


export const LoopM = {};


LoopM.loop = o => {
  while (o.tag === "LoopMNext")
    o = o.f(o.x);

  return o.tag === "LoopMDone"
    ? o.x
    : _throw(new TypeError("invalid trampoline tag"));
};


// Functor


LoopM.map = f => tx =>
  LoopM.chain(tx) (x => LoopM.of(f(x)));


LoopM.Functor = {map: LoopM.map};


// Functor :: Apply

LoopM.ap = tf => tx =>
  LoopM.chain(tf) (f =>
    LoopM.chain(tx) (x =>
      LoopM.of(f(x))));


LoopM.Apply = {
  ...LoopM.Functor,
  ap: LoopM.ap
};


// Functor :: Apply :: Applicative


LoopM.of = () => LoopM.done;


LoopM.Applicative = {
  ...LoopM.Apply,
  of: LoopM.of
};


// Functor :: Apply :: Chain


LoopM.chain = mx => fm =>
  mx.tag === "LoopMNext" ? LoopM.next(mx.x) (y => LoopM.chain(mx.f(y)) (fm))
    : mx.tag === "LoopMDone" ? fm(mx.x)
    : _throw(new TypeError("invalid trampoline tag"));


LoopM.Chain = {
  ...LoopM.Apply,
  chain: LoopM.chain
};


// Functor :: Apply :: Applicative :: Monad


LoopM.Monad = {
  ...LoopM.Applicative,
  chain: LoopM.chain
};


// Tags


LoopM.next = x => f =>
  ({tag: "LoopMNext", f, x});


LoopM.done = x =>
  ({tag: "LoopMDone", x});


/***[ Tail Recursion ]********************************************************/


export const Loop = f => x => {
  let o = f(x);

  while (o[TAG] === "LoopNext")
    o = f(o.x);

  return o[TAG] === "LoopDone"
    ? o.x
    : _throw(new TypeError("invalid constructor"));
};


export const Loop2 = f => (x, y) => {
  let o = f(x, y);

  while (o[TAG] === "LoopNext")
    o = f(o.x, o.y);

  return o[TAG] === "LoopDone"
    ? o.x
    : _throw(new TypeError("invalid constructor"));
};


export const Loop3 = f => (x, y, z) => {
  let o = f(x, y, z);

  while (o[TAG] === "LoopNext")
    o = f(o.x, o.y, o.z);

  return o[TAG] === "LoopDone"
    ? o.x
    : _throw(new TypeError("invalid constructor"));
};


// Tags


Loop.next = x => ({[TAG]: "LoopNext", x});


Loop.done = x => ({[TAG]: "LoopDone", x});


Loop2.next = (x, y) => ({[TAG]: "LoopNext", x, y});


Loop2.done = x => ({[TAG]: "LoopDone", x});


Loop3.next = (x, y, z) => ({[TAG]: "LoopNext", x, y, z});


Loop3.done = x => ({[TAG]: "LoopDone", x});


/***[ Resolve Dependencies ]**************************************************/


LoopM.of = LoopM.of();


/******************************************************************************
***************************[ SAFE IN-PLACE UPDATES ]***************************
******************************************************************************/


export const Ref = clone => ref => {
  return _let({}, ref).in((o, ref) => {
    let mutated = false;

    o.consume = lazy(() => {
      if (mutated) {
        delete o.update;

        o.update = _ => {
          throw new TypeError(
            "illegal in-place update of consumed data structure");
        };
      }

      return ref;
    });

    o.update = k => {
      if (!mutated) {
        ref = clone(ref); // copy once on first write
        mutated = true;
      }

      k(ref); // use the effect but discard the result
      return o;
    };

    return (o[TAG] = "Ref", o);
  });
};


/******************************************************************************
*********************************[ MICROTASK ]*********************************
******************************************************************************/


// defer continuation until next microtask

export const deferMicro = k => f =>
  Promise.resolve(null)
    .then(_ => k(f));


/******************************************************************************
************************[ PERSISTENT DATA STRUCTURES ]*************************
******************************************************************************/


const RBT = {};


/***[ Constants ]*************************************************************/


RBT.RED = true;
RBT.BLACK = false;


/***[ Constructors ]**********************************************************/


RBT.Leaf = {[Symbol.toStringTag]: "Leaf"};


RBT.Node = (c, h, l, k, v, r) =>
  ({[Symbol.toStringTag]: "Node", c, h, l, k, v, r});


RBT.singleton = (k, v) =>
  RBT.Node(RBT.BLACK, 1, RBT.Leaf, k, v, RBT.Leaf);


/***[ Order (Default) ]*******************************************************/


RBT.cmp = comparator;


/***[ Auxiliary Functions ]***************************************************/


RBT.balanceL = (c, h, l, k, v, r) => {
  if (c === RBT.BLACK
    && l[TAG] === "Node"
    && l.c ===RBT.RED
    && l.l[TAG] === "Node"
    && l.l.c === RBT.RED)
      return RBT.Node(
        RBT.RED, h + 1, RBT.turnB(l.l), l.k, l.v, RBT.Node(RBT.BLACK, h, l.r, k, v, r));

  else return RBT.Node(c, h, l, k, v, r);
};


RBT.balanceR = (c, h, l, k, v, r) => {
  if (c === RBT.BLACK
    && l[TAG] === "Node"
    && r[TAG] === "Node"
    && l.c === RBT.RED
    && r.c === RBT.RED)
      return RBT.Node(
        RBT.RED, h + 1, RBT.turnB(l), k, v, RBT.turnB(r));

  else if (r[TAG] === "Node"
    && r.c === RBT.RED)
      return RBT.Node(
        c, h, RBT.Node(RBT.RED, r.h, l, k, v, r.l), r.k, r.v, r.r);

  else return RBT.Node(c, h, l, k, v, r);
};


RBT.isBLB = t =>
  t[TAG] === "Node"
    && t.c === RBT.BLACK
    && (t.l[TAG] === "Leaf" || t.l.c === RBT.BLACK)
      ? true : false;


RBT.isBLR = t =>
  t[TAG] === "Node"
    && t.c === RBT.BLACK
    && t.l[TAG] === "Node"
    && t.l.c === RBT.RED
      ? true : false;


RBT.rotateR = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === RBT.RED)
      return RBT.balanceR(
        t.c, t.h, t.l.l, t.l.k, t.l.v, RBT.delMax_(RBT.Node(RBT.RED, t.h, t.l.r, t.k, t.v, t.r)));

  else throw new TypeError("unexpected branch");
};


RBT.turnR = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return RBT.Node(
    RBT.RED, h, l, k, v, r);
};


RBT.turnB = ({[TAG]: type, h, l, k, v, r}) => {
  if (type === "Leaf")
    throw new TypeError("leaves cannot turn color");

  else return RBT.Node(
    RBT.BLACK, h, l, k, v, r);
};


RBT.turnB_ = t => {
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;
    case "Node": return RBT.Node(RBT.BLACK, t.h, t.l, t.k, t.v, t.r);
    default: throw new TypeError("invalid value constructor");
  }
}


/***[ Deletion ]**************************************************************/


RBT.del = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;
    
    case "Node": {
      const t2 = RBT.del_(RBT.turnR(t), k, cmp);

      switch (t2[TAG]) {
        case "Leaf": return RBT.Leaf;
        case "Node": return RBT.turnB(t2);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RBT.del_ = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RBT.delLT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case EQ: return RBT.delEQ(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        case GT: return RBT.delGT(k, t.c, t.h, t.l, t.k, t.v, t.r, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RBT.delLT = (k, c, h, l, k2, v2, r, cmp) => {
  if (c === RBT.RED
    && RBT.isBLB(l)
    && RBT.isBLR(r))
      return RBT.Node(
        RBT.RED,
        h,
        RBT.Node(RBT.BLACK, r.h, RBT.del_(RBT.turnR(l), k, cmp), k2, v2, r.l.l),
        r.l.k,
        r.l.v,
        RBT.Node(RBT.BLACK, r.h, r.l.r, r.k, r.v, r.r));

  else if (c === RBT.RED
    && RBT.isBLB(l))
      return RBT.balanceR(
        RBT.BLACK, h - 1, RBT.del_(tunrR(l), k, cmp), k2, v2, RBT.turnR(r));

  else return RBT.Node(c, h, RBT.del_(l, k, cmp), k2, v2, r);
};


RBT.delEQ = (k, c, h, l, k2, v2, r, cmp) => {
  if (c === RBT.RED
    && l[TAG] === "Leaf"
    && r[TAG] === "Leaf")
      return RBT.Leaf;

  else if (l[TAG] === "Node"
    && l.c === RBT.RED)
      return RBT.balanceR(
        c, h, l.l, l.k, l.v, RBT.del_(RBT.Node(RBT.RED, h, l.r, k2, v2, r), k, cmp));

  else if (c === RBT.RED
    && RBT.isBLB(r)
    && RBT.isBLR(l))
      return RBT.balanceR(
        RBT.RED,
        h,
        RBT.turnB(l.l),
        l.k,
        l.v,
        RBT.balanceR(RBT.BLACK, l.h, l.r, ...RBT.min(r), RBT.delMin_(RBT.turnR(r))));

  else if (c === RBT.RED
    && RBT.isBLB(r))
      return RBT.balanceR(RBT.BLACK, h - 1, RBT.turnR(l), ...RBT.min(r), RBT.delMin_(RBT.turnR(r)));

  else if (c === RBT.RED
    && r[TAG] === "Node"
    && r.c === RBT.BLACK)
      return RBT.Node(
        RBT.RED, h, l, ...RBT.min(r), RBT.Node(RBT.BLACK, r.h, RBT.delMin_(r.l), r.k, r.v, r.r));

  else throw new TypeError("unexpected branch");
};


RBT.delGT = (k, c, h, l, k2, v2, r, cmp) => {
  if (l[TAG] === "Node"
    && l.c === RBT.RED)
      return RBT.balanceR(
        c, h, l.l, l.k, l.v, RBT.del_(RBT.Node(RBT.RED, h, l.r, k2, v2, r)), k, cmp);

  else if (c === RBT.RED
    && RBT.isBLB(r)
    && RBT.isBLR(l))
      return RBT.Node(
        RBT.RED,
        h,
        RBT.turnB(l.l),
        l.k,
        l.v,
        RBT.balanceR(RBT.BLACK, l.h, l.r, k2, v2, RBT.del_(RBT.turnR(r), k, cmp)));

  else if (c === RBT.RED
    && RBT.isBLB(r))
      return RBT.balanceR(
        RBT.BLACK, h - 1, RBT.turnR(l), k2, v2, RBT.del_(RBT.turnR(r), k, cmp));

  else if (c === RBT.RED)
    return RBT.Node(RBT.RED, h, l, k2, v2, RBT.del_(r, k, cmp));

  else throw new TypeError("unexpected branch");
};


/***[ Getter ]****************************************************************/


RBT.get = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return undefined;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RBT.get(t.l, k, cmp);
        case EQ: return t.v;
        case GT: return RBT.get(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


RBT.has = (t, k, cmp) => {
  switch (t[TAG]) {
    case "Leaf": return false;

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RBT.has(t.l, k, cmp);
        case EQ: return true;
        case GT: return RBT.has(t.r, k, cmp);
        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/***[ Setter ]****************************************************************/


RBT.set = (t, k, v, cmp) =>
  RBT.turnB(RBT.set_(t, k, v, cmp));


RBT.set_ = (t, k, v, cmp) => {
  switch (t[TAG]) {
    case "Leaf":
      return RBT.Node(RBT.RED, 1, RBT.Leaf, k, v, RBT.Leaf);

    case "Node": {
      switch (cmp(k, t.k)) {
        case LT: return RBT.balanceL(
          t.c, t.h, RBT.set_(t.l, k, v, cmp), t.k, t.v, t.r);

        case EQ: return RBT.Node(t.c, t.h, t.l, k, v, t.r);

        case GT: return RBT.balanceR(
          t.c, t.h, t.l, t.k, t.v, RBT.set_(t.r, k, v, cmp));

        default: throw new TypeError("invalid comparator");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


/***[ Minimum/Maximum ]*******************************************************/


RBT.min = t => {
  if (t[TAG] === "Node"
    && t.l[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return RBT.min(t.l);

  else throw new TypeError("unexpected Leaf");
};


RBT.delMin = t =>{
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;

    case "Node": {
      const t2 = RBT.delMin_(RBT.turnR(t));

      switch (t2[TAG]) {
        case "Leaf": return RBT.Leaf;
        case "Node": return RBT.turnB(t2);
        default: throw new TypeError("invalid value constructor");
      }
    }

    default: throw new TypeError("invalid value constructor");
  }
};


RBT.delMin_ = t => {
  if (t[TAG] === "Node"
    && t.c === RBT.RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return RBT.Leaf;

  else if (t[TAG] === "Node"
    && t.c === RBT.RED)
      return RBT.Node(RBT.RED, t.h, RBT.delMin_(t.l), t.k, t.v, t.r);

  else if (t[TAG] === "Node"
    && RBT.isBLB(t.l)
    && RBT.isBLR(t.r))
      return RBT.delMin__(t);

  else if (t[TAG] === "Node"
    && RBT.isBLB((t.l)))
      return RBT.balanceR(
        RBT.BLACK, t.h - 1, RBT.delMin_(RBT.turnR(t.l)), t.k, t.v, RBT.turnR(t.r));

  else if (t[TAG] === "Node"
    && t.l[TAG] === "Node"
    && t.l.c === RBT.BLACK)
      return RBT.Node(
        RBT.RED, t.h, RBT.Node(RBT.BLACK, t.l.h, RBT.delMin_(t.l.l), t.l.k, t.l.v, t.l.r), t.k, t.v, t.r);

  else throw new TypeError("unexpected branch");
};


RBT.delMin__ = t => {
  if(t[TAG] === "Node"
    && t.c === RBT.RED
    && t.r[TAG] === "Node"
    && t.r.c === RBT.BLACK
    && t.r.l[TAG] === "Node"
    && t.r.l.c === RBT.RED)
      return RBT.Node(
        RBT.RED,
        t.h,
        RBT.Node(RBT.BLACK, t.r.h, RBT.delMin_(RBT.turnR(t.l)), t.k, t.v, t.r.l.l),
        t.r.l.k,
        t.r.l.v,
        RBT.Node( RBT.BLACK, t.r.h, t.r.l.r, t.r.k, t.r.v, t.r.r));

  else throw new TypeError("unexpected branch");
};


RBT.max = t => {
  if (t[TAG] === "Node"
    && t.r[TAG] === "Leaf")
      return [t.k, t.v];

  else if (t[TAG] === "Node")
    return RBT.max(t.r);

  else throw new TypeError("unexpected Leaf");
};


RBT.delMax = t => {
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;

    case "Node": {
      const t2 = RBT.delMax_(RBT.turnR(t));

      switch (t2[TAG]) {
        case "Leaf": return RBT.Leaf;
        case "Node": return RBT.turnB(t2);
        default: TypeError("invalid value constructor");
      }
    }

    default: TypeError("invalid value constructor");
  }
};


RBT.delMax_ = t => {
  if (t[TAG] === "Node"
    && t.c === RBT.RED
    && t.l[TAG] === "Leaf"
    && t.r[TAG] === "Leaf")
      return RBT.Leaf;

  else if (t[TAG] === "Node"
    && t.c === RBT.RED
    && t.l[TAG] === "Node"
    && t.l.c === RBT.RED)
      return RBT.rotateR(t);

  else if (t[TAG] === "Node"
    && t.c === RBT.RED
    && RBT.isBLB(t.r)
    && RBT.isBLR(t.l))
      return RBT.delMax__(t);

  else if (t[TAG] === "Node"
    && t.c === RBT.RED
    && RBT.isBLB(t.r))
      return RBT.balanceR(
        RBT.BLACK, t.h - 1, RBT.turnR(t.l), t.k, t.v, RBT.delMax_(RBT.turnR(t.r)));

  else if (t[TAG] === "Node"
    && t.c === RBT.RED)
      return RBT.Node(RBT.RED, t.h, t.l, t.k, t.v, RBT.rotateR(t.r));

  else throw new TypeError("unexpected branch");
};


RBT.delMax__ = t => {
  if (t[TAG] === "Node"
    && t.c === RBT.RED
    && t.l[TAG] === "Node"
    && t.l.c === RBT.BLACK
    && t.l.l[TAG] === "Node"
    && t.l.l.c === RBT.RED)
      return RBT.Node(
        RBT.RED, t.h, RBT.turnB(t.l.l), t.l.k, t.l.v, RBT.balanceR(RBT.BLACK, t.l.h, t.l.r, t.k, t.v, RBT.delMax_(RBT.turnR(t.r))));

  else throw new TypeError("unexpected branch");
};


/***[ Set Operations ]********************************************************/


RBT.join = (t1, t2, k, v, cmp) => {
  if (t1[TAG] === "Leaf")
    return RBT.set(t2, k, v, cmp);

  else if (t2[TAG] === "Leaf")
    return RBT.set(t1, k, v, cmp);

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return RBT.turnB(RBT.joinLT(t1, t2, k, v, t1.h, cmp));
      case EQ: return RBT.Node(RBT.BLACK, t1.h + 1, t1, k, v, t2);
      case GT: return RBT.turnB(RBT.joinGT(t1, t2, k, v, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


RBT.joinLT = (t1, t2, k, v, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RBT.Node(RBT.RED, t2.h + 1, t1, k, v, t2);

  else if (t2[TAG] === "Node")
    return RBT.balanceL(t2.c, t2.h, RBT.joinLT(t1, t2.l, k, v, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


RBT.joinGT = (t1, t2, k, v, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RBT.Node(RBT.RED, t1.h + 1, t1, k, v, t2);

  else if (t1[TAG] === "Node")
    return RBT.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RBT.joinGT(t1.r, t2, k, v, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


RBT.merge = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return t2;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    switch (cmp(t1.h, t2.h)) {
      case LT: return RBT.turnB(RBT.mergeLT(t1, t2, t1.h, cmp));
      case EQ: return RBT.turnB(RBT.mergeEQ(t1, t2, cmp));
      case GT: return RBT.turnB(RBT.mergeGT(t1, t2, t2.h, cmp));
      default: throw new TypeError("invalid comparator");
    }
  }
};


RBT.mergeLT = (t1, t2, h1, cmp) => {
  if (t2[TAG] === "Node"
    && t2.h === h1)
      return RBT.mergeEQ(t1, t2, cmp);

  else if (t2[TAG] === "Node")
    return RBT.balanceL(t2.c, t2.h, RBT.mergeLT(t1, t2.l, h1, cmp), t2.k, t2.v, t2.r);

  else throw new TypeError("unexpected leaf");
};


RBT.mergeEQ = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf"
    && t2[TAG] === "Leaf")
      return RBT.Leaf;

  else if (t1[TAG] === "Node") {
    const t2_ = RBT.delMin(t2),
      [k, v] = RBT.min(t2);

    if (t1.h === t2_.h)
      return RBT.Node(RBT.RED, t1.h + 1, t1, k, v, t2_);

    else if (t1.l[TAG] === "Node"
      && t1.l.c === RBT.RED)
        return RBT.Node(
          RBT.RED, t1.h + 1, RBT.turnB(t1.l), t1.k, t1.v, RBT.Node(RBT.BLACK, t1.h, t1.r, k, v, t2_));

    else return RBT.Node(
      RBT.BLACK, t1.h, RBT.turnR(t1), k, v, t2_);
  }

  else throw new TypeError("unexpected branch");
};


RBT.mergeGT = (t1, t2, h2, cmp) => {
  if (t1[TAG] === "Node"
    && t1.h === h2)
      return RBT.mergeEQ(t1, t2, cmp);

  else if (t1[TAG] === "Node")
    return RBT.balanceR(t1.c, t1.h, t1.l, t1.k, t1.v, RBT.mergeGT(t1.r, t2, h2, cmp));

  else throw new TypeError("unexpected leaf");
};


RBT.split = (t, k, cmp) => {
  if (t[TAG] === "Leaf")
    return [RBT.Leaf, RBT.Leaf];

  else {
    switch (cmp(k, t.k)) {
      case LT: {
        const [lt, gt] = RBT.split(t.l, k, cmp);
        return [lt, RBT.join(gt, t.r, t.k, t.v, cmp)];
      }

      case EQ: return [RBT.turnB_(t.l), t.r];

      case GT: {
        const [lt, gt] = RBT.split(t.r, k, cmp);
        return [RBT.join(t.l, lt, t.k, t.v, cmp), gt];
      }

      default: throw new TypeError("invalid comparator");
    }
  }
};


RBT.union = (t1, t2, cmp) => {
  if (t2[TAG] === "Leaf")
    return t1;

  else if (t1[TAG] === "Leaf")
    return RBT.turnB_(t2);

  else {
    const [l, r] = RBT.split(t1, t2.k, cmp);
    return RBT.join(RBT.union(l, t2.l, cmp), RBT.union(r, t2.r, cmp), t2.k, t2.v, cmp);
  }
};


RBT.intersect = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return RBT.Leaf;

  else if (t2[TAG] === "Leaf")
    return RBT.Leaf;

  else {
    const [l, r] = RBT.split(t1, t2.k, cmp);

    if (RBT.has(t1, t2.k, cmp))
      return RBT.join(
        RBT.intersect(l, t2.l, cmp), RBT.intersect(r, t2.r, cmp), t2.k, t2.v, cmp);

    else return RBT.merge(
      RBT.intersect(l, t2.l, cmp), RBT.intersect(r, t2.r, cmp), cmp);
  }
};


RBT.diff = (t1, t2, cmp) => {
  if (t1[TAG] === "Leaf")
    return RBT.Leaf;

  else if (t2[TAG] === "Leaf")
    return t1;

  else {
    const [l, r] = RBT.split(t1, t2.k, cmp);
    return RBT.merge(RBT.diff(l, t2.l, cmp), RBT.diff(r, t2.r, cmp));
  }
};


/***[ Foldable ]**************************************************************/


RBT.foldl = f => init => t => function go(acc, u) { // TODO: CPS + trampoline
  switch (u[TAG]) {
    case "Leaf": return acc;
    
    case "Node": {
      const acc2 = go(acc, u.l);
      const acc3 = f(acc2) (u.v);
      return go(acc3, u.r);
    }

    default: throw new TypeError("invalid constructor");
  }
} (init, t);


RBT.foldr = f => init => t => function go(acc, u) {
  switch (u[TAG]) {
    case "Leaf": return acc;
    
    case "Node": {
      const acc2 = lazy(() => go(acc, u.r));
      const acc3 = f(u.v) (acc2);
      return lazy(() => go(acc3, u.l));
    }

    default: throw new TypeError("invalid constructor");
  }
} (init, t);


/***[ Folds ]*****************************************************************/


RBT.cata = node => leaf => function go(t) { // TODO: trampoline
  return k => {
    switch (t[TAG]) {
      case "Leaf": return k(leaf);
      
      case "Node": return go(t.l) (t2 =>
        go(t.r) (t3 =>
          k(node([t.k, t.v]) (t2) (t3))));

      default: throw new TypeError("invalid constructor");
    }
  }
};


RBT.cata_ = node => leaf => function go(t) {
  switch (t[TAG]) {
    case "Leaf": return leaf;
    
    case "Node": return node([t.k, t.v])
      (lazy(() => go(t.l)))
        (lazy(() => go(t.r)));

    default: throw new TypeError("invalid constructor");
  }
};


/***[ Functor ]***************************************************************/


RBT.map = f => function go(t) { // TODO: CPS + trampoline
  switch (t[TAG]) {
    case "Leaf": return RBT.Leaf;
    
    case "Node": {
      return RBT.Node(t.c, t.h, go(t.l), t.k, f(t.v), go(t.r));
    }

    default: throw new TypeError("invalid constructor");
  }
};


RBT.Functor = {map: RBT.map};


/***[ Traversals ]************************************************************/


RBT.preOrder = ({append, empty}) => f => t =>
  RBT.cata(pair => l => r =>
    append(append(f(pair)) (l)) (r)) (empty) (t) (id);


RBT.inOrder = ({append, empty}) => f => t =>
  RBT.cata(pair => l => r =>
    append(append(l) (f(pair))) (r)) (empty) (t) (id);


RBT.postOrder = ({append, empty}) => f => t =>
  RBT.cata(pair => l => r =>
    append(append(l) (r)) (f(pair))) (empty) (t) (id);


RBT.levelOrder = f => init => t => function go(acc, i, ts) { // TODO: trampoline
  if (i >= ts.length) return acc;
  else if (ts[i] [TAG] === "Leaf") return go(acc, i + 1, ts);
  
  else {
    ts.push(ts[i].l, ts[i].r);
    return go(f(acc) ([ts[i].k, ts[i].v]), i + 1, ts);
  }
} (init, 0, [t]);


RBT.preOrder_ = ({append, empty}) => f => t =>
  RBT.cata_(pair => l => r =>
    append(append(f(pair)) (l)) (r)) (empty) (t);


RBT.inOrder_ = ({append, empty}) => f => t =>
  RBT.cata_(pair => l => r =>
    append(append(l) (f(pair))) (r)) (empty) (t);


RBT.postOrder_ = ({append, empty}) => f => t =>
  RBT.cata_(pair => l => r =>
    append(append(l) (r)) (f(pair))) (empty) (t);


RBT.levelOrder_ = f => acc => t => function go(ts, i) {
  if (i >= ts.length) return acc;
  else if (ts[i] [TAG] === "Leaf") return go(ts, i + 1);
  
  else {
    ts.push(ts[i].l, ts[i].r);
    return f([ts[i].k, ts[i].v]) (lazy(() => go(ts, i + 1)));
  }
} ([t], 0);


/******************************************************************************
*******************************************************************************
************************************[ IO ]*************************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*******************************[ CHILD PROCESS ]*******************************
******************************************************************************/


export const Process_ = cp => cons => ({
  exec: opts => cmd =>
    ExceptT(cons(k =>
      cp.exec(cmd, opts, (e, stdout, stderr) =>
        e ? _throw(new TypeError(e))
          : stderr ? k(Except.Left(stderr))
          : k(Except.Right(stdout))))),


  execFile: opts => args => cmdName =>
    ExceptT(cons(k =>
      cp.execFile(cmdName, args, opts, (e, stdout, stderr) =>
        e ? _throw(new TypeError(e))
          : stderr ? k(Except.Left(stderr))
          : k(Except.Right(stdout)))))


  /*spawn: opts => args => cmdName => // TODO: CoroutineT
    ExceptT(cons(k => {
      const cmd = cp.spawn(cmdName, args, opts);
      cmd.stderr.on("data", x => k(Except.Left(x)));
      cmd.stdout.on("data", y => k(Except.Right(y)));
      return cmd;
    }))*/
});


/******************************************************************************
********************************[ FILE SYSTEM ]********************************
******************************************************************************/


export const FS_ = fs => cons => thisify(o => {
  o.copy = src => dest =>
    cons(k =>
      fs.copyFile(src, dest, fs.constants.COPYFILE_EXCL, e =>
        e ? _throw(new TypeError(e)) : k(Pair(src, dest))));


  o.move = src => dest =>
    cons.chain(
      cons.chain(o.copy(src) (dest))
        (([src2]) => o.unlink(src2)))
          (src => Serial.of(Pair(src, dest)));


  o.read = opt => path =>
    cons(k =>
      fs.readFile(path, opt, (e, x) =>
        e ? _throw(new TypeError(e)) : k(x)));


  o.scanDir = path =>
    cons(k =>
      fs.readdir(path, (e, xs) =>
        e ? _throw(new TypeError(e)) : k(xs)));


  o.write = opt => path => s =>
    cons(k =>
      fs.writeFile(path, s, opt, e =>
        e ? _throw(new TypeError(e)) : k(s)));


  o.unlink = path =>
    cons(k =>
      fs.unlink(path, e =>
        e ? _throw(new TypeError(e)) : k(path)));

  return o;
});


/******************************************************************************
*********************************[ OBSERVER ]**********************************
******************************************************************************/


ObserverEmitter = ({controller, init, listener, target, type}) => {
  let state = {run: init};

  return Cont(k => {
    target.on(
      type,

      Object.assign(listener, {handleEvent: next => {
        state.run = listener.handle(next) (state.run) (k);
      }}));
    
    return {
      controller,
      listener,
      target,
      type,
      state: Cont(k2 => k2(state.run))
    };
  })
};


ObserverEmitter.cancel = o => o.target.off(o.type, o.listener);


ObserverTarget = ({controller, init, listener, opts = {}, target, type}) => {
  let state = {run: init};

  return Cont(k => {
    target.addEventListener(
      type,

      Object.assign(listener, {handleEvent: next => {
        state.run = listener.handle(next) (state.run) (k);
      }}),
      
      opts);
    
    return {
      controller,
      listener,
      opts,
      target,
      type,
      state: Cont(k2 => k2(state.run))
    };
  })
};


ObserverTarget.cancel = o => o.target.removeEventListener(o.type, o.listener, o.opts);


// TODO: add rx-like combinators


/******************************************************************************
*******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/***[ Foldable ]**************************************************************/


export const concatArr = ({foldl}) => foldl(A.append) (A.empty);


export const concatList = ({foldr}) => foldr(List.append) (List.empty);


export const fold = ({fold}, {append, empty}) => tx =>
  fold(append) (empty) (tx);


export const foldMapl = ({foldl}, {append, empty}) => f =>
  foldl(comp2nd(append) (f)) (empty);


export const foldMapr = ({foldr}, {append, empty}) => f =>
  foldr(comp(append) (f)) (empty);


/***[ Functor ]***************************************************************/


export const mapEff = ({map}) => x => map(_ => x);


/***[ Functor :: Apply ]******************************************************/


export const apEff1 = ({map, ap}) => tx => ty => ap(map(_const) (tx)) (ty);


export const apEff2 = ({map, ap}) => tx => ty => ap(mapEff({map}) (id) (tx)) (ty);


export const liftA2 = ({map, ap}) => f => tx => ty => ap(map(f) (tx)) (ty);


/***[ Functor :: Apply :: Chain ]*********************************************/


export const join = ({chain}) => ttx => chain(ttx) (id);


export const komp = ({chain}) => fm => gm => x => chain(fm(x)) (gm);


export const kipe = ({chain}) => gm => fm => x => chain(fm(x)) (gm);


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


export const foldM = ({foldr}, {of, chain}) => f => acc => tx =>
  foldr(x => my => acc2 => chain(f(acc2) (x)) (my)) (of) (tx) (acc);


/******************************************************************************
*******************************************************************************
***********************************[ TYPES ]***********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


export const F = {};


/***[ Applicator ]************************************************************/


export const app = f => x => f(x);


export const app_ = x => f => f(x);


export const appr = (f, y) => x => f(x) (y);


export const flip = f => y => x => f(x) (y);


export const infix1 = (x, f, y) =>
  f(x) (y);


export const infix2 = (x, f, y, g, z) =>
  g(f(x) (y)) (z);


export const infix3 = (w, f, x, g, y, h, z) =>
  h(g(f(w) (x)) (y)) (z);


export const infix4 = (v, f, w, g, x, h, y, i, z) =>
  i(h(g(f(v) (w)) (x)) (y)) (z);


export const infix5 = (u, f, v, g, w, h, x, i, y, j, z) =>
  j(i(h(g(f(u) (v)) (w)) (x)) (y)) (z);


export const infix6 = (t, f, u, g, v, h, w, i, x, j, y, k, z) =>
  k(j(i(h(g(f(t) (u)) (v)) (w)) (x)) (y)) (z);


export const infix7 = (s, f, t, g, u, h, v, i, w, j, x, k, y, l, z) =>
  l(k(j(i(h(g(f(s) (t)) (u)) (v)) (w)) (x)) (y)) (z);


export const infix8 = (r, f, s, g, t, h, u, i, v, j, w, k, x, l, y, m, z) =>
  m(l(k(j(i(h(g(f(r) (s)) (t)) (u)) (v)) (w)) (x)) (y)) (z);


export const infix9 = (q, f, r, g, s, h, t, i, u, j, v, k, w, l, x, m, y, n, z) =>
  n(m(l(k(j(i(h(g(f(q) (r)) (s)) (t)) (u)) (v)) (w)) (x)) (y)) (z);


export const infix = (...args) => {
  switch (args.length) {
    case 3: return infix1(...args);
    case 5: return infix2(...args);
    case 7: return infix3(...args);
    case 9: return infix4(...args);
    case 11: return infix5(...args);
    case 13: return infix6(...args);
    case 15: return infix7(...args);
    case 17: return infix8(...args);
    case 19: return infix9(...args);

    default: throw new TypeError(
      "upper argument bound exceeded");
  }
};


/***[ Arithmetic Operators ]**************************************************/


export const add = x => y => x + y;


export const div = x => y => x / y;


export const exp = exp => base => base ** exp;


export const dec = x => x - 1;


export const inc = x => x + 1;


export const mod = x => y => x % y;


export const mul = x => y => x * y;


export const neg = x => -x;


export const sub = x => y => x - y;


/***[ Bitwise Operators ]*****************************************************/


export const bitAnd = x => y => x & y;


export const bitNot = x => ~x;


export const bitOr = x => y => x | y;


export const bitXor = x => y => x ^ y;


/***[ Category ]**************************************************************/


export const comp = f => g => x => f(g(x));


export const id = x => x;


F.comp = comp;


F.id = id;


F.Category = {
  comp: F.comp,
  id: F.id
};


/***[ Composition ]***********************************************************/


export const comp3 = f => g => h => x => f(g(h(x)));


export const comp2nd = f => g => x => y => f(x) (g(y));


export const compBin = f => g => x => y => f(g(x) (y));


export const compBoth = f => g => x => y => f(g(x)) (g(y));


export const pipe = g => f => x => f(g(x));


/***[ Conditional Operator ]**************************************************/


export const cond = x => y => thunk =>
  strict(thunk) ? x : y;


/***[ Contravariant ]*********************************************************/


F.contramap = () => pipe;


F.Contravariant = () => {contramap: F.contramap};


/***[ Currying ]**************************************************************/


export const curry = f => x => y => f(Pair(x, y));


export const curry_ = f => x => y => f(x, y);


export const curry3 = f => x => y => z =>
  f(Triple(x, y, z));


export const curry3_ = f => x => y => z =>
  f(x, y, z);


export const curry4 = f => w => x => y => z =>
  f(Tuple(w, x, y, z));


export const curry4_ = f => w => x => y => z =>
  f(w, x, y, z);


export const curry5 = f => v => w => x => y => z =>
  f(Tuple(v, w, x, y, z));


export const curry5_ = f => v => w => x => y => z =>
  f(v, w, x, y, z);


export const uncurry = f => ([x, y]) => f(x) (y);


export const uncurry_ = f => (x, y) => f(x) (y);


export const uncurry3 = f => ([x, y, z]) =>
  f(x) (y) (z);


export const uncurry3_ = f => (x, y, z) =>
  f(x) (y) (z);


export const uncurry4 = f => ([w, x, y, z]) =>
  f(w) (x) (y) (z);


export const uncurry4_ = f => (w, x, y, z) =>
  f(w) (x) (y) (z);


export const uncurry5 = f => ([v, w, x, y, z]) =>
  f(v) (w) (x) (y) (z);


export const uncurry5_ = f => (v, w, x, y, z) =>
  f(v) (w) (x) (y) (z);


/***[ Debugging ]*************************************************************/


export const debug = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


export const log = (...args) =>
  (console.log(...args), args[0]);


export const taggedLog = tag => (...args) =>
  (console.log(tag, ...args), args[0]);


export const trace = x =>
  (x => console.log(JSON.stringify(x) || x.toString()), x);


/***[ Equality ]**************************************************************/


export const eq = x => y => x === y;


export const neq = x => y => x !== y;


/***[ Fixpoint ]**************************************************************/


export const fix = f => x =>
  f(fix(f)) (x);


export const fix_ = f =>
  f(lazy(() => fix_(f)));


/***[ Functor ]***************************************************************/


F.map = comp;


F.Functor = {map: F.map};


/***[ Functor :: Apply ]******************************************************/


F.ap = f => g => x => f(x) (g(x));


F.Apply = {
  ...F.Functor,
  ap: F.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


F.of = () => _const;


F.Applicative = {
  ...F.Apply,
  of: F.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


F.chain = f => g => x => f(g(x)) (x);


F.join = f => x => f(x) (x);


F.Chain = {
  ...F.Apply,
  chain: F.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


F.Monad = {
  ...F.Applicative,
  chain: F.chain
};


/***[ Functor :: Extend ]*****************************************************/


F.extend = ({append}) => f => g => x => f(y => g(append(x) (y)));


F.Extend = {
  ...F.Functor,
  extend: F.extend
};


/***[ Functor :: Extend :: Comonad ]******************************************/


F.extract = ({empty}) => f => f(empty);


F.Comonad = {
  ...F.Extend,
  extract: F.extract
};


/***[ Functor :: Profunctor ]*************************************************/


F.dimap = f => g => tf => x => g(tf.run(f(x)));


F.lmap = f => tg => x => f(tg.run(x));


F.rmap = g => tf => x => tf.run(g(x));


F.Profunctor = {
  ...F.Functor,
  dimap: F.dimap,
  lmap: F.lmap,
  rmap: F.rmap
};


/***[ Functor :: Profunctor :: Strong ]***************************************/


F.first = f => tx => [f(tx.run[0]), tx.run[1]];


F.second = f => tx => [tx.run[0], f(tx.run[1])];


F.Strong = {
  ...F.Profunctor,
  first: F.first,
  second: F.second
};


/***[ Functor :: Profunctor :: Choice ]***************************************/


F.left = f => tx => tx.run({
  left: x => Except.Left(f(x)),
  right: x => Except.Right(x)
});


F.right = f => tx => tx.run({
  left: x => Except.Left(x),
  right: x => Except.Right(f(x))
});


F.Choice = {
  ...F.Profunctor,
  left: F.left,
  right: F.right
};


/***[ Functor :: Profunctor :: Closed ]***************************************/


F.closed = comp;


F.Closed = {
  ...F.Profunctor,
  closed: F.closed
};


/***[ Impure ]****************************************************************/


export const effect = f => x => (f(x), x);


export const _throw = e => {
  throw strict(e);
};


export const throwOn = p => e => x => {
  if (p(x)) _throw(e);
  else return x;
};


export const throwOnFalse = throwOn(x => x === false);


export const throwOnFalsy = throwOn(x => !!x);


export const throwOnNull = throwOn(x => x === undefined || x === null);


/***[ Logical Operators ]*****************************************************/


export const and = x => y => !!(x && y);


export const andf = f => x => y => !!(f(x) && f(y));


export const imply = x => y => !!(!x || y);


export const not = x => !x;


export const notf = f => x => !f(x);


export const or = x => y => !!(x || y);


export const orf = f => x => y => !!(f(x) || f(y));


export const xor = x => y => !!(!x ^ !y);


/***[ Meta Programming ]******************************************************/


export const introspect = x =>
  Object.prototype.toString.call(x).slice(8, -1);


export const tag = (type, o) =>
  (o[Symbol.toStringTag] = type, o);


/***[ Reader ]****************************************************************/


F.ask = id;


F.local = pipe; // a.k.a. withReader


/***[ Relational Operators ]**************************************************/


export const gt = x => y => x > y;


export const gte = x => y => x >= y;


export const lt = x => y => x < y;


export const lte = x => y => x <= y;


/***[ Semigroup ]*************************************************************/


F.append = ({append}) => f => g => x => append(f(x)) (g(x));


F.Semigroup = {
  append: F.append,
  prepend: F.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


F.empty = ({empty}) => _ => empty;


F.Monoid = {
  ...F.Semigroup,
  empty: F.empty
};


/***[ Short Circuiting ]******************************************************/


export const and_ = x => y => x && y;


export const andf_ = f => x => y => f(x) && f(y);


export const or_ = x => y => x || y;


export const orf_ = f => x => y => f(x) || f(y);


/***[ Transducer ]************************************************************/


export const filter = p => cons => x => p(x) ? cons(x) : id;


export const filterk = p => cons => acc => x =>
  Cont(k => p(x) ? cons(acc) (x).run(k) : k(acc));


export const map = f => cons => x => cons(f(x));


export const mapk = f => cons => acc => x =>
  Cont(k => cons(acc) (f(x)).run(k));


export const take = n => cons => function (n2) {
  return x => n <= n2
    ? id
    : (n2++, cons(x));
} (0);


export const takek = n => cons => function (n2) {
  return acc => x =>
    Cont(k => n <= n2
      ? acc
      : (n2++, cons(acc) (x).run(k)));
} (0);


/***[ Misc. ]*****************************************************************/


export const cat = (...lines) => lines.join("");


export const _const = x => y => x;


export const express = f => f();


export const _let = (...args) => ({in: f => f(...args)});


export const partial = (f, ...args) => (..._args) => f(...args, ..._args);


export const partialProps = (f, o) => p => f({...o, ...p});


export const thisify = f => f({});


export const times = n => f => function go(m, r, done) {
  return x => {
    if (done) return r;

    else {
      r = f(x);
      done = --m <= 0 ? true : false;
      return r;
    }
  }
} (n, null, false);


export const once = times(1);


/***[ Resolve Dependencies ]**************************************************/


F.contramap = F.contramap();


F.Contravariant = F.Contravariant();


F.of = F.of();


/******************************************************************************
****************************[ FUNCTION :: READERT ]****************************
******************************************************************************/


export const ReaderT = mmf => ({
  [TAG]: "ReaderT",
  run: mmf
});


/***[ Contravariant ]*********************************************************/


ReaderT.contramap = ({map, contramap: contramap2}) => f => mmg =>
  x => ReaderT(map(contramap2(f) (mmg.run(x))));


ReaderT.Contravariant = {contramap: ReaderT.contramap};


/***[ Functor ]***************************************************************/


ReaderT.map = ({map}) => f => ReaderT.mapBase(map(f));


ReaderT.Functor = {map: ReaderT.map};


/***[ Functor :: Alt ]********************************************************/


ReaderT.alt = ({alt}) => mmf => mmg =>
  ReaderT(x => alt(mmf.run(x)) (mmg.run(x)));


ReaderT.Alt = {
  ...ReaderT.Functor,
  alt: ReaderT.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


ReaderT.zero = ({zero}) => ReaderT.lift(zero);


ReaderT.Plus = {
  ...ReaderT.Alt,
  chain: ReaderT.chain
};


/***[ Functor :: Apply ]******************************************************/


ReaderT.ap = ({ap}) => mmf => mmg => ReaderT(x => ap(mmf.run(x)) (mmg.run(x)));


ReaderT.Apply = {
  ...ReaderT.Functor,
  ap: ReaderT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


ReaderT.of = ({of}) => x => ReaderT.lift(of(x));


ReaderT.Applicative = {
  ...ReaderT.Apply,
  of: ReaderT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


ReaderT.chain = ({chain}) => mmg => fmm =>
  ReaderT(y => chain(mmg.run(y)) (x => fmm(x).run(y)));


ReaderT.Chain = {
  ...ReaderT.Apply,
  chain: ReaderT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


ReaderT.Alternative = {
  ...ReaderT.Plus,
  ...ReaderT.Applicative,
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


ReaderT.Monad = {
  ...ReaderT.Applicative,
  chain: ReaderT.chain
};


/***[ Natural Transformations ]***********************************************/


ReaderT.mapBase = f => mmf => ReaderT(x => f(mmf.run(x)));


/***[ Reader ]****************************************************************/


ReaderT.ask = ({of}) => ReaderT(of);


ReaderT.reader = ({of}) => f => ReaderT(x => of(f(x)));


ReaderT.withReader = f => mmf => ReaderT(x => mmf.run(f(x)));


/***[ Transformer ]***********************************************************/


ReaderT.lift = mx => ReaderT(_const(mx));


// TODO


/******************************************************************************
********************************[ APPLICATOR ]*********************************
******************************************************************************/


export const App = t => ({
  to: x => App(t(x)),
  flipped: y => App(x => t(x) (y)),
  flat: (...args) => App(args.reduce((f, x) => f(x), t)),
  lazy: x => App_({get run() {return t(x)}}),
  by: f => App(f(t)),
  flippedBy: f => App(x => f(x) (t)),
  lazyBy: f => App_({get run() {return f(t)}}),
  get: t
});


const App_ = o => ({
  to: x => App_({get run() {return o.run(x)}}),
  flipped: y => App_({get run() {return x => o.run(x) (y)}}),
  flat: (...args) => App_({get run() {return args.reduce((f, x) => f(x), o.run)}}),
  strict: x => App(o.run(x)),
  by: f => App_({get run() {return f(o.run)}}),
  flippedBy: f => App_({get run() {return x => f(x) (t)}}),
  strictBy: f => App(f(o.run)),
  get get() {const r = o.run; delete this.get; return this.get = {run: r}}
});


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


export const A = {};


// * scanl/scanr
// * mapAccuml/mapAccumR
// * zip/zipWith
// * unzip
// * elem/notElem
// * splitAt/splitWith (span)
// * reverse
// * transpose
// * subsequences
// * permutations
// * group
// * find
// * partition
// * findIndex
// * dedupe/union/intersect
// * deleteBy
// * insertBy
// * replaceAt/updateAt?
// * sort/sortOn/sortBy
// * min/max
// * and/or
// * all/any
// * prod/sum
// * eq instance
// * ord instance
// * comonad instances


/***[ Clonable ]**************************************************************/


A.clone = xs => xs.concat();


A.Clonable = {clone: A.clone};


/***[ Con-/Deconstruction ]***************************************************/


A.cons = x => xs => [x].concat(xs);


A.cons_ = xs => x => [x].concat(xs);


A.head = xs =>
  xs.length === 0 ? Option.None : Option.Some(xs[0]);


A.index = i => xs => (i in xs)
  ? Option.Some(xs[i])
  : Option.None;


A.init = xs =>
  xs.length === 0 ? Option.None : Option.Some(xs.slice(0, -1));


// TODO: A.inits


A.last = xs =>
  xs.length === 0 ? Option.None : Option.Some(xs[xs.length - 1]);


A.singleton = x => [x];


A.snoc = x => xs => xs.concat([x]);


A.snoc_ = xs => x => xs.concat([x]);


A.tail = xs =>
  xs.length === 0 ? Option.None : Option.Some(xs.slice(1));


A.tails = () => A.apo(xs =>
  xs.length === 0
    ? Option.Some(Pair([], Except.Left([])))
    : Option.Some(Pair(xs, Except.Right(xs.slice(1)))));


A.uncons = xs => [
  xs.length === 0 ? Option.None : Option.Some(xs[0]),
  xs.slice(1)
];


A.unsnoc = xs => [
  xs.length === 0 ? Option.None : Option.Some(xs[xs.length - 1]),
  xs.slice(-1)
];


/***[ Destructive Setters ]***************************************************/


A.push = x => xs => (xs.push(x), xs);


A.push_ = xs => x => (xs.push(x), xs);


A.pop = xs => [
  xs.length === 0 ? Option.None : Option.Some(xs.pop()),
  xs
];


A.shift = xs => [
  xs.length === 0 ? Option.None : Option.Some(xs.shift()),
  xs
];


A.unshift = x => xs => (xs.unshift(x), xs);


A.unshift_ = xs => x => (xs.unshift(x), xs);


/***[ Filterable ]************************************************************/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/***[ Foldable ]**************************************************************/


A.foldl = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


A.foldr = f => init => xs => function go(i) {
  if (i === xs.length) return init;
  else return f(xs[i]) (lazy(() => go(i + 1)));
} (0);


A.Foldable = {
  foldl: A.foldl,
  foldr: A.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


A.mapA = ({map, ap, of}) => ft => xs => {
  const liftA2_ = liftA2({map, ap});

  return A.foldl(ys => y =>
    liftA2_(A.push) (ft(y)) (ys))
      (of([])) (xs);
};


A.seqA = ({map, ap, of}) => xs =>
  A.foldl(liftA2({map, ap}) (A.push_)) (of([])) (xs);


A.Traversable = () => ({
  ...A.Foldable,
  ...A.Functor,
  mapA: A.mapA,
  seqA: A.seqA
});


/***[ Functor ]***************************************************************/


A.map = f => xs => xs.map(x => f(x));


A.Functor = {map: A.map};


/***[ Functor :: Alt ]********************************************************/


A.alt = () => A.append;


A.Alt = {
  ...A.Functor,
  alt: A.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


A.zero = () => A.empty;


A.Plus = {
  ...A.Alt,
  zero: A.zero
};


/***[ Functor :: Apply ]******************************************************/


A.ap = fs => xs =>
  fs.reduce((acc, f) =>
    xs.reduce((acc2, x) =>
      (acc2.push(f(x)), acc2), acc), []);


A.Apply = {
  ...A.Functor,
  ap: A.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


A.of = A.singleton;


A.Applicative = {
  ...A.Apply,
  of: A.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


A.chain = xs => fm =>
  xs.reduce((acc, x) =>
    (acc.push.apply(acc, fm(x)), acc), []);


A.Chain = {
  ...A.Apply,
  chain: A.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


A.Alternative = {
  ...A.Plus,
  ...A.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


A.Monad = {
  ...A.Applicative,
  chain: A.chain
};


/***[ Generator ]*************************************************************/


A.generator = f => function go(x) {
  return f(x).run({
    none: [],

    some: ([y, z]) =>
      Pair(y, lazy(() => go(z)))
  });
};


A.generate = n => gx => {
  const acc = [];

  do {
    if (gx.length === 0)
      break;

    else {
      acc.push(gx[0]);
      gx = gx[1] [EVAL];
    }
  } while ((n-- > 0))

  return acc;
};


/***[ Loop ]******************************************************************/


A.forEach = f => xs =>
  (xs.forEach((x, i) => xs[i] = f(x)), xs);


/***[ Recursion Schemes ]*****************************************************/


A.ana = A.unfold;


A.apo = f => init => {
  let acc = [], x = init, next;

  do {
    next = false;

    acc = f(x).run({
      none: acc,

      some: ([y, tx]) =>
        tx.run({
          left: _ => (acc.push(y), acc),

          right: z => {
            x = z;
            next = true;
            return (acc.push(y), acc);
          }
        })
    });
  } while (next);

  return acc;
};


A.cata = A.foldr;


A.para = f => init => xs => {
  const tail = xs.concat();
  let acc = init;

  for (let i = xs.length - 1; i >= 0; i--)
    acc = f(xs[i]) (A.pop(xs) [1]) (acc);

  return acc;
};


/***[ Semigroup ]*************************************************************/


A.append = xs => ys => xs.concat(ys);


A.prepend = ys => xs => xs.concat(ys);


A.Semigroup = {
  append: A.append,
  prepend: A.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


A.empty = [];


A.Monoid = {
  ...A.Semigroup,
  empty: A.empty
};


/***[ Unfoldable ]************************************************************/


A.unfold = f => init => {
  let acc = [], x = init, next;

  do {
    next = false;

    acc = f(x).run({
      none: acc,

      some: ([y, z]) => {
        x = z;
        next = true;
        return (acc.push(y), acc);
      }
    });
  } while (next);

  return acc;
};


A.Unfoldable = {unfold: A.unfold};


/***[ Resolve Dependencies ]**************************************************/


A.alt = A.alt();


A.tails = A.tails();


A.Traversable = A.Traversable();


A.zero = A.zero();


/******************************************************************************
********************************[ COMPARATOR ]*********************************
******************************************************************************/


export const Ctor = {};


export const LT = ({
  [TAG]: "Comparator",
  run: ({lt}) => lt,
  valueOf: () => -1
});


Ctor.LT = LT;


export const EQ = ({
  [TAG]: "Comparator",
  run: ({eq}) => eq,
  valueOf: () => 0
});


Ctor.EQ = EQ;


export const GT = ({
  [TAG]: "Comparator",
  run: ({gt}) => gt,
  valueOf: () => 1
});


Ctor.GT = GT;


/***[ Semigroup ]*************************************************************/


Ctor.append = tx => ty =>
  tx.run({lt: tx, eq: ty, gt: tx});


Ctor.prepend = ty => tx =>
  tx.run({lt: tx, eq: ty, gt: tx});


Ctor.Semigroup = {
  append: Ctor.append,
  prepend: Ctor.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Ctor.empty = EQ;


Ctor.Monoid = {
  ...Ctor.Semigroup,
  empty: Ctor.empty
};


/******************************************************************************
**********************************[ COMPARE ]**********************************
******************************************************************************/


export const Compare = f => ({
  [TAG]: "Compare",
  run: f
});


/***[ Contravariant ]*********************************************************/


Compare.contramap = f => tx =>
  Compare(compBoth(tx.run) (f));


Compare.Contravariant = {contramap: Compare.contramap};


/***[ Semigroup ]*************************************************************/


Compare.append = tx => ty =>
  Compare(x => y =>
    Ctor.append(tx.run(x) (y)) (ty.run(x) (y)));


Compare.prepend = ty => tx =>
  Compare(x => y =>
    Ctor.append(tx.run(x) (y)) (ty.run(x) (y)));


Compare.Semigroup = {
  append: Compare.append,
  prepend: Compare.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Compare.empty = _ => _ => EQ;


Compare.Monoid = {
  ...Compare.Semigroup,
  empty: Compare.empty
};


/******************************************************************************
**********************************[ COMPOSE ]**********************************
******************************************************************************/


export const Comp = ttx => ({
  [TAG]: "Comp",
  run: ttx
});


/***[ Foldable ]**************************************************************/


/***[ Functor ]***************************************************************/


Comp.map = ({map}, {map: map2}) => f => ttx =>
  Comp(map(map2(f)) (ttx));


Comp.Functor = {map: Comp.map};


/***[ Functor :: Apply ]******************************************************/


Comp.ap = ({map, ap}, {ap: ap2}) => ttf => ttx =>
  Comp(ap(map(ap2) (ttf)) (ttx));


Comp.Apply = {
  ...Comp.Functor,
  ap: Comp.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Comp.of = ({of}, {of: of2}) => x => Comp(of(of2(x)));


Comp.Applicative = {
  ...Comp.Apply,
  of: Comp.of
};


/******************************************************************************
***********************************[ CONST ]***********************************
******************************************************************************/


export const Const = x => ({
  [TAG]: "Const",
  run: x
});


/***[ Functor ]***************************************************************/


Const.map = _ => tx => tx;


Const.Functor = {map: Const.map};


/***[ Functor :: Apply ]******************************************************/


Const.ap = ({append}) => tf => tx =>
  Const(append(tf.run) (tx.run));


Const.Apply = {
  ...Const.Functor,
  ap: Const.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Const.of = ({empty}) => _ => Const(empty);


Const.Applicative = {
  ...Const.Apply,
  of: Const.of
};


/******************************************************************************
***********************************[ CONT ]************************************
******************************************************************************/


export const Cont = k => ({
  [TAG]: "Cont",
  run: k
});


/***[ Delimitation (w/o Regions) ]********************************************/


const reset = mx => Cont(k => k(mx.run(id)));


const shift = fm => Cont(k => fm(k).run(id));


/***[ Functor ]***************************************************************/


Cont.map = f => tx => Cont(k => tx.run(x => k(f(x))));


Cont.Functor = {map: Cont.map};


/***[ Functor :: Apply ]******************************************************/


Cont.ap = tf => tx => Cont(k => tf.run(f => tx.run(x => k(f(x)))));


Cont.Apply = {
  ...Cont.Functor,
  ap: Cont.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Cont.of = x => Cont(k => k(x));


Cont.Applicative = {
  ...Cont.Apply,
  of: Cont.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Cont.chain = mx => fm => Cont(k => mx.run(x => fm(x).run(k)));


Cont.Chain = {
  ...Cont.Apply,
  chain: Cont.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Cont.Monad = {
  ...Cont.Applicative,
  chain: Cont.chain
};


/***[ Semigroup ]*************************************************************/


Cont.append = ({append}) => tx => ty =>
  Cont(k =>
    tx.run(x =>
      ty.run(y =>
        k(append(x) (y)))));


Cont.prepend = ({append}) => ty => tx =>
  Cont(k =>
    tx.run(x =>
      ty.run(y =>
        k(append(x) (y)))));


Cont.Semigroup = {
  append: Cont.append,
  prepend: Cont.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Cont.empty = empty => Cont(k => k(empty));


Cont.Monoid = {
  ...Cont.Semigroup,
  empty: Cont.empty
};


/***[ Misc. ]*****************************************************************/


Cont.abrupt = x => Cont(k => x);


Cont.callcc = f => Cont(k => f(Cont.reify(k)) (k));


Cont.reify = k => x => Cont(k2 => k(x));


/******************************************************************************
*********************************[ COROUTINE ]*********************************
******************************************************************************/


/******************************************************************************
********************************[ COROUTINET ]*********************************
******************************************************************************/


export const CoroutineT = mmx => ({
  [TAG]: "Coroutine",
  run: mmx
});


/***[ Functor ]***************************************************************/


CoroutineT.map = ({map: mapSuspension}, {map: mapBase}) => f => function go(mmx) {
  return CoroutineT(mapBase(mx => mx.run({
    left: tx => Except.Left(mapSuspension(go) (tx)),
    right: x => Except.Right(f(x))
  })) (mmx.run));
};


CoroutineT.Functor = {map: CoroutineT.map};


/***[ Functor :: Apply ]******************************************************/


CoroutineT.ap = ({map: mapSuspension}, {map: mapBase, chain}) => function go(mmf) {
  return mmx =>
    CoroutineT(chain(mmf.run) (mf => mx.run({
      left: tf => Except.Left(mapSuspension(go) (tf)),

      right: f => mapBase(mx => mx.run({
        left: tx => Except.Left(mapSuspension(go) (tx)),
        right: x => Except.Right(f(x))
      })) (mmx.run)
    })));
};


CoroutineT.Apply = {
  ...CoroutineT.Functor,
  ap: CoroutineT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


CoroutineT.of = ({of}) => x => CoroutineT(of(Except.Right(x)));


CoroutineT.Applicative = {
  ...CoroutineT.Apply,
  of: CoroutineT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


CoroutineT.chain = ({map}, {of, chain}) => mmx => fmm => function go(mmx2) {
  return CoroutineT(chain(mmx2.run) (mx => mx.run({
    left: tx => of(Except.Left(map(go) (tx))),
    right: x => fmm(x).run
  })));
} (mmx);


CoroutineT.Chain = {
  ...CoroutineT.Apply,
  chain: CoroutineT.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


CoroutineT.Monad = {
  ...CoroutineT.Applicative,
  chain: CoroutineT.chain
};


/***[ Transformer ]***********************************************************/


// TODO: hoist


CoroutineT.lift = ({map}) => comp(CoroutineT) (map(Except.Right));


CoroutineT.mapT = ({map: mapSuspension}, {map: mapBase}) => f => function go(mmx) {
  return CoroutineT(
    mapBase(mx => mx.run({
      left: tx => Except.Left(mapSuspension(go) (tx)),
      right: x => Except.Right(x)
    })) (f(mmx.run)));
};


// TODO: chainT


CoroutineT.Transformer = {
  lift: CoroutineT.lift,
  mapT: CoroutineT.mapT
};


/***[ Running ]***************************************************************/


CoroutineT.consume = ({of, chain}) => f => mmx =>
  CoroutineT(chain(mmx.run) (mx => mx.run({
    left: tx => f(tx),
    right: x => of(Except.Right(x))
  })));


CoroutineT.exhaust = ({of, chain}) => f => function go(mmx) {
  return chain(mmx.run) (mx => mx.run({
    left: tx => go(f(tx)),
    right: of
  }));
};


CoroutineT.exhaustM = ({of, chain}) => fm => function go(mmx) {
  return chain(mmx.run) (mx => mx.run({
    left: tx => chain(fm(x)) (go),
    right: of
  }))
};


CoroutineT.fold = ({of, chain}) => f => init => mmx => function go([acc, mmx2]) {
  return chain(mmx2.run) (mx => mx.run({
    left: tx => go(f(acc) (tx)),
    right: x => of(Pair(acc, x))
  }));
} (Pair(init, mmx));


/***[ Suspension ]************************************************************/


CoroutineT.mapSuspension = ({map: mapSuspension2}, {map: mapBase}) => f => function go(mmx) {
  return CoroutineT(
    mapBase(mx => mx.run({
      left: tx => Except.Left(f(mapSuspension2(go) (tx))),
      right: x => Except.Right(x)
    })) (mmx.run));
};


CoroutineT.suspend = ({of}) => tx => CoroutineT(of(Except.Left(tx)));


/******************************************************************************
****************************[ COROUTINET :: AWAIT ]****************************
******************************************************************************/


export const Await = f => ({
  [TAG]: "Await",
  run: f
});


Await.map = f => tg => Await(x => f(tg.run(x)));


Await.await = ({of}) => CoroutineT.suspend({of}) (Await(of))


/******************************************************************************
****************************[ COROUTINET :: YIELD ]****************************
******************************************************************************/


export const Yield = x => y => ({
  [TAG]: "Yield",
  run: Pair(x, y)
});


Yield.map = f => tx => Yield(tx[0]) (f(tx[1]));


Yield.yield = ({of}) => x => CoroutineT.suspend({of}) (Yield(x) (of(null)));


/******************************************************************************
***********************************[ DATE ]************************************
******************************************************************************/


export const D = {};


D.format = sep => (...fs) => d =>
  fs.map(f => f(d))
    .join(sep);


D.formatDay = mode => d => {
  switch (mode) {
    case 1: return String(d.getUTCDate());
    case 2: return String(d.getUTCDate()).padStart(2, "0");
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatMonth = arrNames => mode => d => {
  switch (mode) {
    case 1: return String(d.getUTCMonth() + 1);
    case 2: return String(d.getUTCMonth() + 1).padStart(2, "0");
    case 3: return arrNames[String(d.getUTCMonth())];
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatWeekday = arrNames => mode => d => {
  switch (mode) {
    case 1: return String(d.getUTCDay());
    case 2: return String(d.getUTCDay()).padStart(2, "0");
    case 3: return arrNames[String(d.getUTCDay())];
    default: throw new RangeError("invalid formatting mode");
  }
};


D.formatYear = mode => d => {
  switch (mode) {
    case 2: return String(d.getUTCFullYear()).slice(2);
    case 4: return String(d.getUTCFullYear());
    default: throw new RangeError("invalid formatting mode");
  }
};


D.getLastDayOfMonth = ({year, month}) =>
  new Date(new Date(year, month, 1) - 1).getDate();


D.isDayOfMonth = ({year, month}) => day =>
  day > 0 && new Date(new Date(year, month, 1) - 1).getDate() >= day;


/******************************************************************************
***********************************[ DEFER ]***********************************
******************************************************************************/


export const Defer = deferThunk => ({
  [TAG]: "Defer",
  run: deferThunk
});


/***[ Functor ]***************************************************************/


Defer.map = f => tx => Defer(() => f(tx.run));


Defer.Functor = {map: Defer.map};


/***[ Functor :: Apply ]******************************************************/


Defer.ap = ft => tx => Defer(() => ft.run(tx.run));


Defer.Apply = {
  ...Defer.Functor,
  ap: Defer.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Defer.of = x => Defer(() => x);


Defer.Applicative = {
  ...Defer.Apply,
  of: Defer.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Defer.chain = mx => fm => Defer(() => fm(mx.run).run);


Defer.Chain = {
  ...Defer.Apply,
  chain: Defer.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Defer.Monad = {
  ...Defer.Applicative,
  chain: Defer.chain
};


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


export const Either = {};


Either.Left = x => ({
  [TAG]: "Either",
  run: ({left}) => left(x)
});


Either.Right = y => ({
  [TAG]: "Either",
  run: ({right}) => right(y)
});


Either.cata = left => right => tx => tx.run({left, right});


// TODO


/******************************************************************************
**********************************[ EITHERT ]**********************************
******************************************************************************/


export const EitherT = mmx => ({
  [TAG]: "EitherT",
  run: mmx
});


// TODO


/******************************************************************************
***********************************[ ENDO ]************************************
******************************************************************************/


export const Endo = f => ({
  [TAG]: "Endo",
  run: f
});


/***[ Semigroup ]*************************************************************/


Endo.append = tf => tg => Endo(x => tf.run(tg.run(x)));


Endo.prepend = tg => tf => Endo(x => tf.run(tg.run(x)));


Endo.Semigroup = {
  append: Endo.append,
  prepend: Endo.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Endo.empty = Endo(id);


Endo.Monoid = {
  ...Endo.Semigroup,
  empty: Endo.empty
};


/******************************************************************************
***********************************[ ERROR ]***********************************
******************************************************************************/


export class ExtendableError extends Error {
  constructor(s) {
    super(s);
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
    
    else
      this.stack = (new Error(s)).stack;
  }
};


export class ApplicationError extends ExtendableError {};


export class ParseError extends ExtendableError {};


export class DomainError extends ExtendableError {};


/******************************************************************************
***********************************[ EQUIV ]***********************************
******************************************************************************/


export const Equiv = f => ({
  [TAG]: "Equiv",
  run: f
});


/***[ Contravariant ]*********************************************************/


Equiv.contramap = f => tg => Equiv(compBoth(tg.run) (f));


Equiv.Contravariant = {contramap: Equiv.contramap};


/***[ Semigroup ]*************************************************************/


Equiv.append = tx => ty =>
  Equiv(x => y =>
    tx.run(x) (y) && ty.run(x) (y));


Equiv.prepend = Equiv.append;


Equiv.Semigroup = {
  append: Equiv.append,
  prepend: Equiv.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Equiv.empty = Equiv(_ => _ => true);


Equiv.Monoid = {
  ...Equiv.Semigroup,
  empty: Equiv.empty
};


/******************************************************************************
**********************************[ EXCEPT ]***********************************
******************************************************************************/


export const Except = {};


Except.Left = x => ({
  [TAG]: "Except",
  run: ({left}) => left(x)
});


Except.Right = x => ({
  [TAG]: "Except",
  run: ({right}) => right(x)
});


Except.cata = left => right => tx => tx.run({left, right});


/***[ Except ]****************************************************************/


// TODO


/***[ Foldable ]**************************************************************/


Except.foldr = f => acc => tx => tx.run({
  left: _ => acc,
  right: y => f(y) (acc)
});


Except.foldl = f => acc => tx => tx.run({
  left: _ => acc,
  right: y => f(acc) (y)
});


Except.Foldable = {
  left: Except.foldl,
  right: Except.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


Except.mapA = ({map, of}) => ft => tx => tx.run({
  left: x => of(Except.Left(x)),
  right: y => map(Except.Right) (ft(y))
});


Except.seqA = ({of}) => tx => tx.run({
  left: x => of(Except.Left(x)),
  right: y => of(Except.Right(y))
});


Except.Traversable = () => ({
  ...Except.Foldable,
  ...Except.Functor,
  mapA: Except.mapA,
  seqA: Except.seqA
});


/***[ Functor ]***************************************************************/


Except.map = f => tx =>
  tx.run({
    left: x => Except.Left(x),
    right: y => Except.Right(f(y))
  });


Except.Functor = {map: Except.map};


/***[ Functor :: Apply ]******************************************************/


Except.ap = tf => tx =>
  tf.run({
    left: x => Except.Left(x),

    right: f => tx.run({
      left: y => Except.Left(y),
      right: z => Except.Right(f(z))
    })
  });


Except.Apply = {
  ...Except.Functor,
  ap: Except.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Except.of = x => Except.Right(x);


Except.Applicative = {
  ...Except.Apply,
  of: Except.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Except.chain = tx => fm =>
  tx.run({
    left: x => Except.Left(x),
    right: y => fm(y)
  });


Except.Chain = {
  ...Except.Apply,
  chain: Except.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Except.Monad = {
  ...Except.Applicative,
  chain: Except.chain
};


/***[ Resolve Dependencies ]**************************************************/


Except.Traversable = Except.Traversable();


/******************************************************************************
**********************************[ EXCEPTT ]**********************************
******************************************************************************/


export const ExceptT = mmx => ({
  [TAG]: "ExceptT",
  run: mmx
});


/***[ Except ]****************************************************************/


ExceptT.catch = ({of, chain}) => mmx => handle =>
  chain(mmx.run) (mx => mx.run({
    left: x => handle(x).run,
    right: y => of(Except.Right(y))
  }));


ExceptT.finally = ({map, of, chain}) => mmx => thunk =>
  chain(ExceptT.try({map, of, chain}) (mmx)) (mx => {
    strictRec(thunk);
    return Except.cata(ExceptT.throw) (of) (mx);
  });


ExceptT.throw = ({of}) => x => ExceptT(of(Except.Left(x)));


ExceptT.try = ({map, of, chain}) => mmx =>
  ExceptT.catch({of, chain})
    (map(Except.Right) (mmx.run))
      (x => of(Except.Left(x)));


ExceptT.withEither = ({map}) => f => mmx =>
  ExceptT(map(mx => mx.run({
    left: x => Except.Left(f(x)),
    right: Except.Right
  })) (mmx.run));


/***[ Foldable ]**************************************************************/


ExceptT.foldl = ({foldl}) => f => acc => mmx =>
  foldl(Except.foldl(f)) (acc) (mmx.run);


ExceptT.foldr = ({foldr}) => f => acc => mmx =>
  foldr(Except.foldr(f)) (acc) (mmx.run);


ExceptT.Foldable = {
  foldl: ExceptT.foldl,
  foldr: ExceptT.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


ExceptT.mapA = ({map, of}, {mapA}) => ft => mmx =>
  map(ExceptT) (mapA(mx => mx.run({
    left: x => of(Except.Left(x)),
    right: y => map(Except.Right) (f(y))
  })) (mmx.run));


ExceptT.seqA = ({map, of}, {mapA}) => ft => mmx =>
  map(ExceptT) (mapA(mx => mx.run({
    left: x => of(Except.Left(x)),
    right: y => of(Except.Right(y))
  })) (mmx.run));


ExceptT.Traversable = {
  ...ExceptT.Foldable,
  mapA: ExceptT.mapA,
  seqA: ExceptT.seqA
};


/***[ Functor ]***************************************************************/


ExceptT.map = ({map}) => f => mmx =>
  ExceptT(map(mx => mx.run({
    left: e => Except.Left(e),
    right: x => Except.Right(f(x))
  })) (mmx.run));


ExceptT.Functor = {map: ExceptT.map};


/***[ Functor :: Alt ]********************************************************/


ExceptT.alt = ({map, of, chain}, {append}) => mmx => mmy =>
  ExceptT(chain(mmx.run) (mx => mx.run({
    left: x => map(my => my.run({
      left: x2 => Except.Left(append(x) (x2)),
      right: ExceptT.Right
    })) (mmy.run),

    right: y => of(Except.Right(y))
  })));


ExceptT.Alt = {
  ...ExceptT.Functor,
  alt: ExceptT.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


ExceptT.zero = ({of}, {empty}) => ExceptT(of(Except.Left(empty)));


ExceptT.Plus = {
  ...ExceptT.Alt,
  zero: ExceptT.zero
};


/***[ Functor :: Apply ]******************************************************/


ExceptT.ap = ({of, chain}) => mmf => mmx =>
  ExceptT(chain(mmf.run) (mf => mf.run({
    left: e => of(Except.Left(e)),
    right: f => chain(mmx.run) (mx => mx.run({
      left: e => of(Except.Left(e)),
      right: x => of(Except.Right(f(x)))
    }))
  })));


ExceptT.Apply = {
  ...ExceptT.Functor,
  ap: ExceptT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


ExceptT.of = ({of}) => x => ExceptT(of(Except.Right(x)));


ExceptT.Applicaitve = {
  ...ExceptT.Apply,
  of: ExceptT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


ExceptT.chain = ({of, chain}) => mmx => fmm =>
  ExceptT(chain(mmx.run) (mx => mx.run({
    left: e => of(Except.Left(e)),
    right: x => fmm(x).run
  })));


ExceptT.Chain = {
  ...ExceptT.Apply,
  chain: ExceptT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


ExceptT.Alternative = {
  ...ExceptT.Plus,
  ...ExceptT.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


ExceptT.Monad = {
  ...ExceptT.Applicative,
  chain: ExceptT.chain
};


/***[ Natural Transformations ]***********************************************/


ExceptT.mapBase = f => mmx => ExceptT(f(mmx.run));


/***[ Transformer ]***********************************************************/


ExceptT.lift = ({map}) => mx => ExceptT(map(Option.Right) (mx));


ExceptT.hoist = ({of}) => mx => ExceptT(of(mx));


ExceptT.mapT = f => mmx => ExceptT(f(mmx.run));


ExceptT.chainT = ({of, chain}) => fm => mmx =>
  ExceptT(chain(fm(mmx.run).run) (mx => of(mx.run({
    left: Except.Left,
  
    right: mx2 => mx2.run({
      left: Except.Left,
      right: Except.Right
    })
  }))));


ExceptT.Transformer = {
  chainT: ExceptT.chainT,
  hoist: ExceptT.hoist,
  lift: ExceptT.lift,
  mapT: ExceptT.mapT
};


/******************************************************************************
***********************************[ FIRST ]***********************************
******************************************************************************/


export const First = tx => ({
  [TAG]: "First",
  run: tx
});


/***[ Semigroup ]*************************************************************/


First.append = ttx => tty =>
  tx.run.run({
    none: tty,
    some: ttx
  });


First.prepend = Last => Last.append;


First.Semigroup = {
  append: First.append,
  prepend: First.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


First.empty = () => First(Option.None);


First.Monoid = {
  ...First.Semigroup,
  empty: First.empty
};


/******************************************************************************
**********************************[ FORGET ]***********************************
******************************************************************************/


export const Forget = tf => ({ // TODO: add map/Functor
  [TAG]: "Forget",
  run: tf
});


/***[ Functor :: Profunctor ]*************************************************/


Forget.dimap = g => _ => tf => Forget(x => tf.run(g(x)));


Forget.lmap = g => tf => Forget(x => tf.run(g(x)));


Forget.rmap = _ => tf => Forget(tf.run);


Forget.Profunctor = {
  ...Forget.Functor,
  dimap: Forget.dimap,
  lmap: Forget.lmap,
  rmap: Forget.rmap
};


/******************************************************************************
*********************************[ GENERATOR ]*********************************
******************************************************************************/


export function* objEntries(o) {
  for (let prop in o) {
    yield Pair(prop, o[prop]);
  }
}


export function* objKeys(o) {
  for (let prop in o) {
    yield prop;
  }
}


export function* objValues(o) {
  for (let prop in o) {
    yield o[prop];
  }
}


/******************************************************************************
************************************[ ID ]*************************************
******************************************************************************/


export const Id = x => ({
  [TAG]: "Id",
  run: x
});


/***[Functor]*****************************************************************/


Id.map = f => tx => Id(f(tx.run));


Id.Functor = {map: Id.map};


/***[ Functor :: Apply ]******************************************************/


Id.ap = tf => tx => Id(tf.run(tx.run));


Id.Apply = {
  ...Id.Functor,
  ap: Id.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Id.of = x => Id(x);


Id.Applicative = {
  ...Id.Apply,
  of: Id.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


const idChain = ({id: x}) => fm => fm(x);


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Id.Monad = {
  ...Id.Applicative,
  chain: Id.chain
};


/******************************************************************************
***********************************[ IMAP ]************************************
******************************************************************************/


export const IMap_ = cmp => {
  const IMap = (tree, size) => ({
    [TAG]: "IMap",
    tree,
    size
  });


  IMap.empty = IMap(RBT.Leaf, 0);


  /***[ Getters/Setters ]*****************************************************/


  IMap.get = k => m => {
    const r = RBT.get(m.tree, k, cmp);
    
    return r === undefined
      ? Option.None
      : Option.Some(r);
  };


  IMap.has = k => m =>
    RBT.has(m.tree, k, cmp);


  IMap.mod = k => f => m => {
    if (IMap.has(k) (m)) {
      const v = RBT.get(m.tree, k, cmp);

      return IMap(
        RBT.set(m.tree, k, f(v), cmp),
        m.size);
    }

    else return m;
  };


  IMap.rem = k => m => {
    let size = m.size;

    if (IMap.has(k) (m))
      size = m.size - 1;
    
    else return m;

    return IMap(
      RBT.del(m.tree, k, cmp),
      size);
  };


  IMap.set = k => v => m => {
    let size = m.size;

    if (!IMap.has(k) (m))
      size = m.size + 1;

    return IMap(
      RBT.set(m.tree, k, v, cmp),
      size);
  };


  // TODO: IMap.singleton


  /***[ Traversal ]***********************************************************/


  IMap.inOrder = ({append, empty}) => f => m =>
    RBT.inOrder({append, empty}) (f) (m.tree);


  IMap.inOrder_ = ({append, empty}) => f => m =>
    RBT.inOrder_({append, empty}) (f) (m.tree);


  return IMap;
};


/******************************************************************************
***********************************[ IOMAP ]***********************************
******************************************************************************/


export const IOMap_ = cmp => {
  const IOMap = (tree, keys, size, counter) => ({
    [TAG]: "IOMap",
    tree,
    keys,
    size,
    counter
  });


  IOMap.empty = IOMap(RBT.Leaf, RBT.Leaf, 0, 0);


  /***[ Getters/Setters ]*****************************************************/


  IOMap.get = k => m => {
    const r = RBT.get(m.tree, k, cmp);
    
    return r === undefined
      ? Option.None
      : Option.Some(r);
  };


  IOMap.has = k => m =>
    RBT.has(m.tree, k, cmp);


  IOMap.mod = k => f => m => {
    if (IOMap.has(k) (m)) {
      const v = RBT.get(m.tree, k, cmp);

      return IOMap(
        RBT.set(m.tree, k, f(v), cmp),
        m.keys,
        m.size,
        m.counter);
    }

    else return m;
  };


  IOMap.rem = k => m => {
    let size = m.size;

    if (IOMap.has(k) (m))
      size = m.size - 1;
    
    else return m;

    return IOMap(
      RBT.del(m.tree, k, cmp),
      m.keys, // no key removal
      size,
      m.counter);
  };


  IOMap.set = k => v => m => {
    let size = m.size,
      counter = m.counter;

    if (!IOMap.has(k) (m)) {
      size = m.size + 1;
      counter = m.counter + 1;
    }

    return IOMap(
      RBT.set(m.tree, k, v, cmp),
      RBT.set(m.keys, m.counter, k, RBT.cmp),
      size,
      counter);
  };


  // TODO: IOMap.singleton


  /***[ Traversal ]***********************************************************/


  IOMap.inOrder = ({append, empty}) => f => m =>
    RBT.inOrder({append, empty}) (f) (m.tree);


  IOMap.inOrder_ = ({append, empty}) => f => m =>
    RBT.inOrder_({append, empty}) (f) (m.tree);


  IOMap.insertOrder = f => init => m => function go(acc, i) {
    if (i >= m.counter) return acc;

    else {
      const k = RBT.get(m.keys, i, RBT.cmp),
        tv = IOMap.get(k) (m);

      return tv.run({
        get none() {return go(acc, i + 1)},
        some: v => go(f(acc) (Pair(k, v)), i + 1)
      });
    }
  } (init, 0);


  IOMap.insertOrder_ = f => acc => m => function go(i) {
    if (i >= m.counter) return acc;

    else {
      const k = RBT.get(m.keys, i, RBT.cmp),
        tv = IOMap.get(k) (m);

      return tv.run({
        get none() {return go(i + 1)},
        some: v => f(Pair(k, v)) (lazy(() => go(i + 1)))
      });
    }
  } (0);


  return IOMap;
};


/******************************************************************************
***********************************[ ISET ]************************************
******************************************************************************/


export const ISet_ = cmp => {
  const ISet = (tree, size) => ({
    [TAG]: "ISet",
    tree,
    size
  });


  ISet.empty = ISet(RBT.Leaf, 0);


  /***[ Getters/Setters ]*****************************************************/


  ISet.has = k => s =>
    RBT.has(s.tree, k, cmp);


  ISet.mod = k => f => s => {
    if (ISet.has(k) (s)) {
      return ISet(
        RBT.set(s.tree, f(k), null, cmp),
        s.size);
    }

    else return s;
  };


  ISet.rem = k => s => {
    let size = s.size;

    if (ISet.has(k) (s))
      size = s.size - 1;
    
    else return s;

    return ISet(
      RBT.del(s.tree, k, cmp),
      size);
  };


  ISet.set = k => s => {
    let size = s.size;

    if (!ISet.has(k) (s))
      size = s.size + 1;

    return ISet(
      RBT.set(s.tree, k, null, cmp),
      size);
  };


  // TODO: ISet.singleton


  /***[ Traversal ]***********************************************************/


  ISet.inOrder = ({append, empty}) => f => s =>
    RBT.inOrder({append, empty}) (f) (s.tree);


  ISet.inOrder_ = ({append, empty}) => f => s =>
    RBT.inOrder_({append, empty}) (f) (s.tree);


  return ISet;
};


/******************************************************************************
***********************************[ IOSET ]***********************************
******************************************************************************/


export const IOSet_ = cmp => {
  const IOSet = (tree, keys, size, counter) => ({
    [TAG]: "IOSet",
    tree,
    keys,
    size,
    counter
  });


  IOSet.empty = IOSet(RBT.Leaf, RBT.Leaf, 0, 0);


  /***[ Getters/Setters ]*****************************************************/


  IOSet.has = k => s =>
    RBT.has(s.tree, k, cmp);


  IOSet.mod = k => f => s => {
    if (IOSet.has(k) (s)) {
      return IOSet(
        RBT.set(s.tree, f(k), null, cmp),
        s.keys,
        s.size,
        s.counter);
    }

    else return s;
  };


  IOSet.rem = k => s => {
    let size = s.size;

    if (IOSet.has(k) (s))
      size = s.size - 1;
    
    else return s;

    return IOSet(
      RBT.del(s.tree, k, cmp),
      s.keys, // no key removal
      size,
      s.counter);
  };


  IOSet.set = k => s => {
    let size = s.size,
      counter = s.counter;

    if (!IOSet.has(k) (s)) {
      size = s.size + 1;
      counter = s.counter + 1;
    }

    return IOSet(
      RBT.set(s.tree, k, null, cmp),
      RBT.set(s.keys, s.counter, k, RBT.cmp),
      size,
      counter);
  };


  // TODO: IOSet.singleton


  /***[ Traversal ]***********************************************************/


  IOSet.inOrder = ({append, empty}) => f => s =>
    RBT.inOrder({append, empty}) (f) (s.tree);


  IOSet.inOrder_ = ({append, empty}) => f => s =>
    RBT.inOrder_({append, empty}) (f) (s.tree);


  IOSet.insertOrder = f => init => s => function go(acc, i) {
    if (i >= s.counter) return acc;

    else {
      const k = RBT.get(s.keys, i, RBT.cmp),
        tv = IOSet.get(k) (s);

      return tv.run({
        get none() {return go(acc, i + 1)},
        some: v => go(f(acc) (v), i + 1)
      });
    }
  } (init, 0);


  IOSet.insertOrder_ = f => acc => s => function go(i) {
    if (i >= s.counter) return acc;

    else {
      const k = RBT.get(s.keys, i, RBT.cmp),
        tv = IOSet.get(k) (s);

      return tv.run({
        get none() {return go(i + 1)},
        some: v => f(v) (lazy(() => go(i + 1)))
      });
    }
  } (0);


  return IOSet;
};


/******************************************************************************
***********************************[ LAST ]************************************
******************************************************************************/


export const Last = tx => ({
  [TAG]: "Last",
  run: tx
});


/***[ Semigroup ]*************************************************************/


Last.append = ttx => tty =>
  tty.run.run({
    none: ttx,
    some: tty
  });


Last.prepend = First.append;


Last.Semigroup = {
  append: Last.append,
  prepend: Last.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Last.empty = () => Last(Option.None);


Last.Monoid = {
  ...Last.Semigroup,
  empty: Last.empty
};


/******************************************************************************
***********************************[ LAZY ]************************************
******************************************************************************/


export const Lazy = lazyThunk => ({
  [TAG]: "Lazy",
  run: lazyThunk
});


/***[ Functor ]***************************************************************/


Lazy.map = f => tx => Lazy(() => f(tx.run));


Lazy.Functor = {map: Lazy.map};


/***[ Functor :: Apply ]******************************************************/


Lazy.ap = ft => tx => Lazy(() => ft.run(tx.run));


Lazy.Apply = {
  ...Lazy.Functor,
  ap: Lazy.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Lazy.of = x => Lazy(() => x);


Lazy.Applicative = {
  ...Lazy.Apply,
  of: Lazy.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Lazy.chain = mx => fm => Lazy(() => fm(mx.run).run);


Lazy.Chain = {
  ...Lazy.Apply,
  chain: Lazy.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Lazy.Monad = {
  ...Lazy.Applicative,
  chain: Lazy.chain
};


/******************************************************************************
***********************************[ LIST ]************************************
******************************************************************************/


export const List = {};


List.Cons = x => xs => ({
  [TAG]: "List",
  run: ({cons}) => cons(x) (xs)
});


List.Cons_ = xs => x => ({
  [TAG]: "List",
  run: ({cons}) => cons(x) (xs)
});


List.Nil = ({
  [TAG]: "List",
  run: ({nil}) => nil
});


/***[ Functor :: Extend :: Comonad ]******************************************/


// TODO: inits/tails


/***[ Con-/Deconstruction ]***************************************************/


List.cons = List.Cons;


List.cons_ = List.Cons_;


List.head = xs =>
  xs.run({
    nil: Option.None,
    some: x => xs => Option.Some(x)
  });


List.init = xs =>
  xs.run({
    nil: Option.None,

    some: _ => {
      const go = ys =>
        ys.run({
          nil: List.Nil,

          cons: z => zs =>
            ys.run({
              nil: NOOP,
              cons: _ => _ => List.Cons(z) (go(zs))
            })
        });

      return Option.Some(go(xs));
    }
  });


List.last = xs =>
  xs.run({
    nil: Option.None,

    some: _ => {
      const go = ys =>
        ys.run({
          nil: List.Nil,

          cons: z => zs =>
            ys.run({
              nil: z,
              cons: _ => _ => lazy(() => go(zs))
            })
        });

      return Option.Some(go(xs));
    }
  });


List.singleton = x => List.Cons(x) (List.Nil);


List.tail = xs =>
  xs.run({
    nil: List.Nil,
    cons: x => xs => xs
  });


List.uncons = xs =>
  xs.run({
    nil: Option.None,
    cons: y => ys => Option.Some(Pair(y, ys))
  });


/***[ Foldable ]**************************************************************/


List.foldl = f => init => xs => {
  let acc = init, nil = false;

  while (true) {
    acc = xs.run({
      get nil() {nil = true; return acc},
      cons: y => ys => (xs = ys, f(acc) (y))
    });

    if (nil) break;
  }

  return acc;
};


List.foldr = f => acc => function go(xs) {
  return xs.run({
    nil: acc,

    cons: y => ys =>
      f(y) (lazy(() => go(ys)))
  });
};


/***[ Functor ]***************************************************************/


List.map = f =>
  listFoldr(x => acc =>
    List.Cons(f(x)) (acc))
      (List.Nil);


List.Functor = {map: List.map};


/***[ Functor :: Apply ]******************************************************/


List.ap = fs => xs =>
  List.foldr(f => acc =>
    List.append(List.map(f) (xs))
      (acc)) (List.Nil) (fs);


List.Apply = {
  ...List.Functor,
  ap: List.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


List.of = List.singleton;


List.Applicative = {
  ...List.Apply,
  of: List.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


List.chain = xs => fm => function go(ys) {
  return ys.run({
    nil: List.Nil,
    cons: z => zs => List.append(fm(z)) (lazy(() => go(zs)))
  });
} (xs);


List.Chain = {
  ...List.Apply,
  chain: List.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


List.Monad = {
  ...List.Applicative,
  chain: List.chain
};


/***[ Infinite Lists ]********************************************************/


List.iterate = f => function go(x) {
  return List.Cons(x) (lazy(() => go(f(x))));
};

const repeat = x =>
  List.Cons(x) (lazy(() => repeat(x)));


/***[ Natural Transformations ]***********************************************/


List.fromArr = A.foldr(x => xs => List.Cons(x) (xs)) (List.Nil);


List.fromOption = tx => tx.run({
  none: [],
  some: x => [x]
});


List.toArr = () => List.foldl(A.snoc_) ([]);


List.toOption = ({append, empty}) => xs =>
  xs.length === 0
    ? Option.None
    : Option.Some(fold({fold: A.foldl}, {append, empty}) (xs));


/***[ Semigroup ]*************************************************************/


List.append = xs => ys => function go(acc) {
  return acc.run({
    nil: ys,
    cons: z => zs => List.Cons(z) (lazy(() => go(zs)))
  });
} (xs);


List.prepend = ys => xs => function go(acc) {
  return acc.run({
    nil: ys,
    cons: z => zs => List.Cons(z) (lazy(() => go(zs)))
  });
} (xs);


List.Semigroup = {
  append: List.append,
  prepend: List.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


List.empty = List.Nil;


List.Monoid = {
  ...List.Semigroup,
  empty: List.empty
};


/***[ Unfoldable ]************************************************************/


List.unfold = f => function go(y) {
  return f(y).run({
    none: List.Nil,
    some: ([x, y2]) => List.Cons(x) (lazy(() => go(y2)))
  });
};


List.Unfoldable = {unfold: List.unfold};


/***[ Misc. ]*****************************************************************/


List.reverse = List.foldl(List.Cons_) (List.Nil);


/***[ Resolve Dependencies ]**************************************************/


List.toArr = List.toArr();


/******************************************************************************
*******************************[ LIST :: DLIST ]*******************************
******************************************************************************/


export const DList = f => ({
  [TAG]: "DList",
  run: f
});


/***[ Con-/Deconstruction ]***************************************************/


DList.cons = x => xs => app(DList) (comp(List.Cons(x)) (xs.run));


DList.singleton = comp(DList) (List.Cons);


DList.snoc = x => xs => app(DList) (comp(xs.run) (List.Cons(x)));


/***[ Natural Transformations ]***********************************************/


DList.fromList = xs => comp(DList) (List.append);


DList.toList = xs => comp(app_(List.Nil)) (xs.run);


/***[ Semigroup ]*************************************************************/


DList.append = xs => ys => app(DList) (comp(xs.run) (ys.run));


DList.prepend = ys => xs => app(DList) (comp(xs.run) (ys.run));


DList.Semigroup = {
  append: DList.append,
  prepend: DList.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


DList.empty = DList(id);


DList.Monoid = {
  ...DList.Semigroup,
  empty: DList.empty
};


/***[ Unfoldable ]************************************************************/


DList.unfold = f => function go(y) {
  return f(y).run({
    none: DList.empty,
    some: ([x, y2]) => DList.Cons(x) (lazy(() => go(y2)))
  })
};


DList.Unfoldable = {unfold: DList.unfold};


/******************************************************************************
*******************************[ LIST :: LISTZ ]*******************************
******************************************************************************/


export const ListZ = ls => rs => ({
  [TAG]: "ListZ",
  run: {ls, rs}
});


/***[ Cursor ]****************************************************************/


ListZ.isBegin = xs =>
  xs.run.ls.run({
    nil: true,
    cons: _ => _ => false
  });


ListZ.isEnd = xs =>
  xs.run.rs.run({
    nil: true,
    cons: _ => _ => false
  });


ListZ.start = xs =>
  ListZ(List.Nil) (List.append(List.reverse(xs.run.ls)) (xs.run.rs))


ListZ.end = xs =>
  ListZ(List.Nil) (List.append(List.reverse(xs.run.rs)) (xs.run.ls))


ListZ.cursor = xs =>
  xs.run.rs.run({
    nil: Option.None,
    cons: x => _ => Option.Some(x)
  });


ListZ.left = xs =>
  xs.run.ls.run({
    nil: xs,
    cons: y => ys => ListZ(ys) (List.Cons(y) (xs.run.rs))
  });


ListZ.right = xs =>
  xs.run.rs.run({
    nil: xs,
    cons: y => ys => ListZ(List.Cons(y) (xs.run.ls)) (ys)
  });


/***[ Con-/Deconstruction ]***************************************************/


ListZ.singleton = x => ListZ(List.Nil) (List.cons(x) (List.Nil));


/***[ Getters/Setters ]*******************************************************/


ListZ.ins = x => xs =>
  ListZ(xs.run.ls) (List.Cons(x) (xs.run.rs));


ListZ.rem = xs =>
  xs.run.rs.run({
    nil: xs,
    cons: _ => ys => ListZ(xs.run.ls) (ys)
  });


/***[ Foldable ]**************************************************************/


/***[ Functor ]***************************************************************/


/***[ Functor :: Extend :: Comonad ]******************************************/


/***[ Natural Transformations ]***********************************************/


ListZ.fromList = xs => ListZ(List.Nil) (xs);


ListZ.fromListEnd = xs => ListZ(List.reverse(xs)) (List.Nil);


ListZ.toList = xs => List.append(List.reverse(xs.run.ls)) (xs.run.rs)


/***[ Semigroup :: Monoid ]***************************************************/


ListZ.empty = ListZ([], []);


/*ListZ.Monoid = {
  ...ListZ.Semigroup,
  empty: ListZ.empty
};*/


/***[ Misc. ]*****************************************************************/


ListZ.isEmpty = xs =>
  xs.run.ls.run({
    nil: xs.run.rs.run({
      nil: true,
      cons: false
    }),

    cons: false
  });


/******************************************************************************
******************************[ LIST :: NELIST ]*******************************
******************************************************************************/


// TODO: non-empty list

/*

Please note that NEList has two valid comonads: inits/tails

data NonEmpty a = NonEmpty {
  neHead :: a, -- ^ The head of the non-empty list.
  neTail :: [a] -- ^ The tail of the non-empty list.
} deriving (Eq, Ord, Typeable, Data)

data NeverEmptyList a = NEL a [a]

extend : (FullList a -> b) -> FullList a -> FullList b
extend f (Single x) = Single (f (Single x))
extend f (Cons x y) = Cons (f (Cons x y)) (extend f y)


instance Copointed NonEmpty where
  extract = neHead

instance Comonad NonEmpty where
  duplicate x@(NonEmpty _ t) = NonEmpty x (case toNonEmpty t of Nothing -> []
                                        Just u  -> toList (duplicate u))

instance Functor NonEmpty where
  fmap f (NonEmpty h t) = NonEmpty (f h) (fmap f t)

*/


/******************************************************************************
*******************************[ LIST :: ZLIST ]*******************************
******************************************************************************/


// TODO: list with applicative zip instance


/******************************************************************************
***********************************[ LISTT ]***********************************
******************************************************************************/


export const ListT = mmx => ({
  [TAG]: "ListT",
  run: mmx
});


/***[ Con-/Deconstruction ]***************************************************/


ListT.cons = ({of}) => x => mmx => ListT(of(Option.Some(Pair(x, mmx))));


ListT.cons_ = ({of}) => mmx => x => ListT(of(Option.Some(Pair(x, mmx))));


/***[ Foldable ]**************************************************************/


ListT.foldl = ({of, chain}) => f => init => mmx => function go(acc, mmx2) { // TODO: trampoline
  return chain(mmx.run) (mx => mx.run({
    none: of(acc),
    some: ([x, mmy]) => go(f(acc) (x), mmy)
  }));
} (init, mmx);


ListT.foldr = ({of, chain}) => f => acc => function go(mmx) {
  return chain(mmx.run) (mx => mx.run({
    none: of(acc),
    some: ([x, mmy]) => f(x) (lazy(() => go(mmy)))
  }));
};


ListT.Foldable = {
  foldl: ListT.foldl,
  foldr: ListT.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


ListT.mapA = ({map, ap, of}, {of: of2, chain}) => ft => {
  const liftA2_ = liftA2({map, ap});
  
  return ListT.foldr({chain})
    (x => liftA2_(ListT.cons) (ft(x)))
      (of(ListT.empty({of: of2})));
};


ListT.seqA = ({map, ap, of}, {of: of2, chain}) =>
  ListT.foldr({chain}) (liftA2({map, ap}) (LiftT.cons))
    (of(ListT.empty({of: of2})));


ListT.Traversable = () => ({
  ...ListT.Foldable,
  ...ListT.Functor,
  mapA: ListT.mapA,
  seqA: ListT.seqA
});


/***[ Functor ]***************************************************************/


ListT.map = ({map}) => f => function go(mmx) {
  return ListT(map(mx => mx.run({
    none: Option.None,
    some: ([x, mmy]) => Option.Some(Pair(f(x), lazy(() => go(mmy))))})) (mmx.run));
};


ListT.Functor = {map: ListT.map};


/***[ Functor :: Alt ]********************************************************/


ListT.alt = () => ListT.append;


ListT.Alt = {
  ...ListT.Functor,
  alt: ListT.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


ListT.zero = () => ListT.empty;


ListT.Plus = {
  ...ListT.Alt,
  zero: ListT.zero
};


/***[ Functor :: Apply ]******************************************************/


ListT.ap = ({map, of, chain}) => function go(mmf) {
  return mmx =>
    ListT(chain(mmf.run) (mf => mf.run({
      none: of(Option.None),

      some: ([f, mmg]) => map(mx => mx.run({
        none: Option.None,
        some: ([x, mmy]) => Option.Some(Pair(f(x), go(mmg) (mmy)))
      })) (mmx.run)
    })))
};


ListT.Apply = {
  ...ListT.Functor,
  ap: ListT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


ListT.of = ({of}) => x =>
  ListT(of(Option.Some(Pair(x, ListT(of(Option.None))))));


ListT.Applicative = {
  ...ListT.Apply,
  of: ListT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


ListT.chain = ({of, chain}) => mmx => fm => function go(mmx2) {
  return ListT(chain(mmx2.run) (mx => mx.run({
    none: of(Option.None),
    some: ([x, mmy]) => ListT.append(fm(x)) (lazy(() => go(mmy))).run
  })));
} (mmx);


ListT.Chain = {
  ...ListT.Apply,
  chain: ListT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


ListT.Alternative = {
  ...ListT.Plus,
  ...ListT.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


ListT.Monad = {
  ...ListT.Applicative,
  chain: ListT.chain
};


/***[ Natural Transformations ]***********************************************/


ListT.fromFoldable = ({of}, {foldl}) =>
  foldl(f) (ListT.cons_) (ListT.empty({of}));


// mapListT :: (m (List a) -> n (List b)) -> ListT m a -> ListT n b

ListT.mapBase = f => mmx => ListT(f(mmx.run));


ListT.toList = ({map, of, chain}) => function go(mmx) {
  return chain(mmx.run) (mx => {
    const my = mx.run({
      none: List.Nil,
      some: ([x, mmy]) => List.Cons(x) (lazy(() => go(mmy)))
    });

    return of(my);
  });
};


/***[ Semigroup ]*************************************************************/


ListT.append = ({of, chain}) => function go(mmx) {
  return mmy =>
    ListT(chain(mmx.run) (mx =>
      mx.run({
        none: mmy,
        some: ([x, mmz]) => of(Option.Some(Pair(x, lazy(() => go(mmz) (mmy)))))
      })));
};


ListT.prepend = ({of, chain}) => function go(mmy) {
  return mmx =>
    ListT(chain(mmx.run) (mx =>
      mx.run({
        none: mmy,
        some: ([x, mmz]) => of(Option.Some(Pair(x, layz(() => go(mmz) (mmy)))))
      })));
};


ListT.Semigroup = {
  append: ListT.append,
  prepend: ListT.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


ListT.empty = ({of}) => ListT(of(Option.None));


ListT.Monoid = {
  ...ListT.Semigroup,
  empty: ListT.empty
};


/***[ Transformer ]***********************************************************/


// hoistListT :: List<a> => ListT<m, a>

ListT.hoist = ({of}) => function go(xs) {
  return xs.run({
    nil: ListT.empty({of}),
    cons: y => ys => ListT(of(Option.Some(Pair(y, lazy(() => go(ys))))))
  });
};


// lift :: m<a> => ListT<m, a>

ListT.lift = ({map, of}) =>
  comp(ListT) (map(x => Option.Some(Pair(x, ListT.empty({of})))));


// hoist :: (m<a> => n<a>) => ListT<m, a> => ListT<n, a>

ListT.mapT = ({map}) => f => function go(mmx) {
  return ListT(f(map(Option.map(Pair.map(mmy => lazy(() => go(mmy))))) (mmx.run)));
};


// embed :: (m<a> => ListT<n, a>) -> ListT<m, a> => ListT<n, a>

ListT.chainT = ({of}) => fm => function go(mmx) { // TODO: review
  return ListT.chain(fm(mmx.run)) (mx => mx.run({
    none: ListT.empty({of}),
    some: ([x, mmy]) => ListT(of(Option.Some(Pair(x, lazy(() => go(mmy))))))
  }));
};


ListT.Transformer = {
  chainT: ListT.chainT,
  hoist: ListT.hoist,
  lift: ListT.lift,
  mapT: ListT.mapT
};


/***[ Unfoldable ]************************************************************/


ListT.unfold = f => function go(x) {
  return f(x).run({
    none: ListT.empty({of}),
    some: ([y, z]) => ListT.cons(y) (lazy(() => go(z)))
  });
};


ListT.Unfoldable = {unfold: ListT.unfold};


/***[ Resolve Dependencies ]**************************************************/


ListT.alt = ListT.alt();


ListT.Traversable = ListT.Traversable();


ListT.zero = ListT.zero();


/******************************************************************************
**********************************[ NUMBER ]***********************************
******************************************************************************/



export const Num = {};


/***[ Precision ]*************************************************************/


Num.decimalAdjust = (k, n, digits) => {
  const p = Math.pow(10, digits);

  if (Math.round(n * p) / p === n)
    return n;

  const m = (n * p) * (1 + Number.EPSILON);
  return Math[k] (m) / p;
};


Num.ceil = digits => n =>
  Num.decimalAdjust("ceil", n, digits);


Num.floor = digits => n =>
  Num.decimalAdjust("floor", n, digits);


Num.round = digits => n =>
  Num.decimalAdjust("round", n, digits);


Num.trunc = digits => n =>
  Num.decimalAdjust("trunc", n, digits);


/***[ Serialization ]*********************************************************/


Num.format = (...fs) => n =>
  fs.map(f => f(n))
    .join("");


Num.formatFrac = digits => n =>
  String(n)
    .replace(/^[^.]+\.?/, "")
    .padEnd(digits, "0");


Num.formatInt = sep => n =>
  String(Num.trunc(0) (n))
    .replace(/^-/, "")
    .replace(new RegExp("(\\d)(?=(?:\\d{3})+$)", "g"), `$1${sep}`);


Num.formatSign = (pos, neg) => n =>
  n > 0 ? pos : n < 0 ? neg : "";


Num.formatSep = sep => n => sep;


/******************************************************************************
**********************************[ OBJECT ]***********************************
******************************************************************************/


export const Obj = {};


Obj.deferredProp = k => thunk => o =>
  Object.defineProperty(o, k, {
    get: function() {return thunk()},
    configurable: true,
    enumerable: true});


Obj.lazyProp = k => thunk => o =>
  Object.defineProperty(o, k, {
    get: function() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true});


/***[ Clonable ]**************************************************************/


Obj.clone = o => {
  const p = {};

  for (k of objKeys(o))
    Object.defineProperty( // getter/setter safe
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


Obj.Clonable = {clone: Obj.clone};


/******************************************************************************
*****************************[ OPTICS :: GETTER ]******************************
******************************************************************************/


/******************************************************************************
******************************[ OPTICS :: LENS ]*******************************
******************************************************************************/


// type Lens s t a b = forall f. Functor f => (a -> f b) -> s -> f t

export const Lens = ({map}) => f => g => ({
  [TAG]: "Lens",
  run: ht => tx => map(g(tx)) (ht(f(tx)))
});


/******************************************************************************
******************************[ OPTICS :: FOLD ]*******************************
******************************************************************************/


/******************************************************************************
******************************[ OPTICS :: PRISM ]******************************
******************************************************************************/


/******************************************************************************
*****************************[ OPTICS :: SETTER ]******************************
******************************************************************************/


/******************************************************************************
****************************[ OPTICS :: TRAVERSAL ]****************************
******************************************************************************/


/******************************************************************************
**********************************[ OPTION ]***********************************
******************************************************************************/


export const Option = {}


Option.Some = x => ({
  [TAG]: "Option",
  run: ({some}) => some(x)
});


Option.None = {
  [TAG]: "Option",
  run: ({none}) => none
};


Option.cata = none => some => tx => tx.run({none, some});


/***[ Foldable ]**************************************************************/


Option.foldl = f => acc => tx => tx.run({
  none: acc,
  some: x => f(acc) (x)
});


Option.foldr = f => acc => tx => tx.run({
  none: acc,
  some: x => f(x) (acc)
});


Option.Foldable = {
  foldl: Option.foldl,
  foldr: Option.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


// TODO


/***[ Functor ]***************************************************************/


Option.map = f => tx =>
  tx.run({
    none: Option.None,
    some: x => Option.Some(f(x))
  });


Option.Functor = {map: Option.map};


/***[ Functor :: Apply ]******************************************************/


Option.ap = tf => tx =>
  tf.run({
    none: Option.None,

    some: f => tx.run({
      none: Option.None,
      some: x => Option.Some(f(x))
    })
  });


Option.Apply = {
  ...Option.Functor,
  ap: Option.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Option.of = x => Option.Some(x);


Option.Applicative = {
  ...Option.Apply,
  of: Option.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Option.chain = tx => fm =>
  tx.run({
    none: Option.None,
    some: x => fm(x)
  });


Option.chain_ = fm => tx =>
  tx.run({
    none: Option.None,
    some: x => fm(x)
  });


Option.Chain = {
  ...Option.Apply,
  chain: Option.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Option.Monad = {
  ...Option.Applicative,
  chain: Option.chain
};


/***[ Misc. ]*****************************************************************/


Option.isSome = tx =>
  tx.run({
    none: false,
    some: _const(true)
  });


Option.get = tx =>
  tx.run({none: null, some: id});


Option.getOrThrow = e => tx =>
  tx.run({
    get none() {throw strict(e)},
    some: x => x
  });


/******************************************************************************
**********************************[ OPTIONT ]**********************************
******************************************************************************/


export const OptionT = mmx => ({
  [TAG]: "OptionT",
  run: mmx
});


/***[ Foldable ]**************************************************************/


OptionT.foldl = ({foldl}) => f => acc => foldl(Option.foldl(f)) (acc);


OptionT.foldr = ({foldr}) => f => acc => foldr(Option.foldr(f)) (acc);


OptionT.Foldable = {
  foldl: OptionT.foldl,
  foldr: OptionT.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


OptionT.mapA = ({mapA}, {map, ap, of}) => ft => mmx =>
  map(OptionT) (
    mapA({map, ap, of})
      (Option.mapA({map, ap, of}) (ft))
        (mmx.run));


// TODO: seqA


OptionT.Traversable = () => ({
  ...OptionT.Foldable,
  ...OptionT.Functor,
  mapA: OptionT.mapA,
  seqA: OptionT.seqA
});


/***[ Functor ]***************************************************************/


OptionT.map = ({map}) => f => OptionT.mapBase(map(Option.map(f)));


OptionT.Functor = {map: OptionT.map};


/***[ Functor :: Alt ]********************************************************/


OptionT.alt = ({of, chain}) => mmx => mmy =>
  OptionT(chain(mmx.run) (mx => mx.run({
    none: mmy.run,
    some: _ => of(mx)
  })));


OptionT.Alt = {
  ...OptionT.Functor,
  alt: OptionT.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


OptionT.zero = ({of}) => of(Option.None);


OptionT.Plus = {
  ...OptionT.Alt,
  zero: OptionT.zero
};


/***[ Functor :: Apply ]******************************************************/


OptionT.ap = ({map, of, chain}) => mmf => mmx =>
  OptionT(chain(mmf.run) (mf =>
    mf.run({
      none: of(Option.None),

      some: f => chain(mmx.run) (mx =>
        mx.run({
          none: of(Option.None),
          some: x => of(Option.Some(f(x)))
        }))
    })));


OptionT.Apply = {
  ...OptionT.Functor,
  ap: OptionT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


OptionT.of = ({of}) => x => OptionT(of(Option.Some(x)));


OptionT.Applicative = {
  ...OptionT.Apply,
  of: OptionT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


OptionT.chain = ({of, chain}) => mmx => fmm =>
  chain(mmx) (mx => mx.run({
    none: of(Option.None),
    some: x => fmm(x)
  }));


OptionT.Chain = {
  ...OptionT.Apply,
  chain: OptionT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


OptionT.Alternative = {
  ...OptionT.Plus,
  ...OptionT.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


OptionT.Monad = {
  ...OptionT.Applicative,
  chain: OptionT.chain
};


/***[ Natural Transformations ]***********************************************/


OptionT.mapBase = fm => mmx => OptionT(fm(mmx.run));


/***[ Transformer ]***********************************************************/


OptionT.hoist = ({of}) => mx => OptionT(of(mx));


OptionT.lift = ({map}) => mx => OptionT(map(Option.Some) (mx));


OptionT.mapT = f => mmx => OptionT(f(mmx.run));


OptionT.chainT = ({of, chain}) => fm => mmx =>
  OptionT(chain(f(mmx.run).run) (mx => of(mx.run({
    none: Option.None,

    some: mx2 => mx2.run({
      none: Option.None,
      some: Option.Some
    })
  }))));


OptionT.Transformer = {
  chainT: Option.chainT,
  hoist: OptionT.hoist,
  lift: OptionT.lift,
  mapT: OptionT.mapT
};


/***[ Resolve Dependencies ]**************************************************/


OptionT.Traversable = OptionT.Traversable();


/******************************************************************************
*********************************[ PARALLEL ]**********************************
******************************************************************************/


export const Parallel = k => {
  const o = {
    [TAG]: "Parallel",
    run: k
  };
    
  if (Math.random() < MICROTASK_TRESHOLD) // defer until next microtask
    o.run = deferMicro(o.run);

  return o;
};


/***[ Conjunction ]***********************************************************/


Parallel.and = tx => ty => {
  const guard = (k, i) => x => {
    pair[i] = x;

    return settled || !("0" in pair) || !("1" in pair)
      ? false
      : (settled = true, k([pair[0], pair[1]]));
  };

  const pair = [];
  let settled = false;

  return Parallel(k => (
    tx.run(guard(k, 0)),
    ty.run(guard(k, 1))));
};


Parallel.allArr = () =>
  A.seqA({
    map: Parallel.map,
    ap: Parallel.ap,
    of: Parallel.of});


/***[ Disjunction ]***********************************************************/


Parallel.or = tx => ty => {
  const guard = k => x =>
    settled
      ? false
      : (settled = true, k(x));

  let settled = false;

  return Parallel(k => (
    tx.run(guard(k)),
    ty.run(guard(k))));
};


Parallel.any = () =>
  A.foldl(acc => tx =>
    Parallel.race.append(acc) (tx))
      (Parallel.race.empty);


/***[ Functor ]***************************************************************/


Parallel.map = f => tx =>
  Parallel(k => tx.run(x => k(f(x))));


Parallel.Functor = {map: Parallel.map};


/***[ Functor :: Apply ]******************************************************/


Parallel.ap = tf => tx =>
  Parallel(k =>
    Parallel.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


Parallel.Apply = {
  ...Parallel.Functor,
  ap: Parallel.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Parallel.of = x => Parallel(k => k(x));


Parallel.Applicative = {
  ...Parallel.Apply,
  of: Parallel.of
};


/***[ Natural Transformations ]***********************************************/


// TODO: fromSerial/toSerial


/***[ Semigroup ]*************************************************************/


Parallel.append = append => tx => ty =>
  Parallel(k =>
    Parallel.and(tx) (ty)
      .run(([x, y]) =>
        k(append(x) (y))));


Parallel.prepend = Parallel.append;


Parallel.Semigroup = {
  append: Parallel.append,
  prepend: Parallel.prepend
};

  
/***[ Semigroup :: Monoid ]***************************************************/


Parallel.empty = empty =>
  Parallel(k => k(empty));


Parallel.Monoid = {
  ...Parallel.Semigroup,
  empty: Parallel.empty
};


/***[ Semigroup (race) ]******************************************************/


Parallel.race = {}; // TODO: make a newtype


Parallel.race.append = Parallel.or;


Parallel.race.prepend = Parallel.or;


/***[ Semigroup :: Monoid (race) ]********************************************/


Parallel.race.empty = Parallel(k => null);


/***[ Misc. ]*****************************************************************/


Parallel.flatmap = tx => fx =>
  Parallel(k => tx.run(x => fx(x).run(k)));


Parallel.flatten = ttx =>
  Parallel(k => ttx.run(tx => tx.run(k)));


/***[ Resolve Dependencies ]**************************************************/


Parallel.allArr = Parallel.allArr();


Parallel.any = Parallel.any();


/******************************************************************************
***************************[ PARSER (APPLICATIVE) ]****************************
******************************************************************************/


// newtype Parser a = P (String -> (String, Except Error a))

export const Parser = ft => ({
  [TAG]: "Parser",
  run: ft
});


Parser.orElse = ft => gt =>
  Parser((pair) => {
    const [[s, i], tx] = ft.run(pair);

    return tx.run({
      left: e => gt.run(Pair(s, i)),
      right: x => Pair(Pair(s, i), Except.Right(x))
    });
  });


Parser.satisfy = p =>
  Parser(([s, i]) => s.length < i ? Pair(Pair(s, i), Except.Left("end of stream"))
    : p(s[i]) ? Pair(Pair(s, i + 1), Except.Right(s[i]))
    : Pair(Pair(s, i + 1), Except.Left("did not satisfy")));


Parser.try = ft =>
  Parser(pair => {
    const [[s, j], tx] = ft.run(pair);

    return tx.run({
      left: e => Pair(Pair(s, i), Except.Left(e)),
      right: x => Pair(Pair(s, j), Except.Right(x))
    });
  });


/******************************************************************************
*****************************[ PARSER (MONADIC) ]******************************
******************************************************************************/


// newtype Parser m a = P (String -> (String, m a))

export const ParserM = fm => ({
  [TAG]: "ParserM",
  run: fm
});


/******************************************************************************
***********************************[ PRED ]************************************
******************************************************************************/


export const Pred = p => ({
  [TAG]: "Pred",
  run: p
});


/***[ Contravariant ]*********************************************************/


Pred.contramap = f => tq => x => Pred(tp.run(f(x)));


Pred.Contravariant = {contramap: Pred.contramap};


/***[ Semigroup ]*************************************************************/


Pred.append = tp => tq =>
  Pred(x => tp.run(x) && tq.run(x));


Pred.prepend = tq => tp =>
  Pred(x => tp.run(x) && tq.run(x));


Pred.Semigroup = {
  append: Pred.append,
  prepend: Pred.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Pred.empty = Pred(_ => true);


Pred.Monoid = {
  ...Pred.Semigroup,
  empty: Pred.empty
};


/******************************************************************************
**********************************[ REGEXP ]***********************************
******************************************************************************/


export const Rex = {};


Rex.cons = (...xs) =>
  new RegExp(xs.join(""), "");


Rex.consG = (...xs) =>
  new RegExp(xs.join(""), "g");


Rex.consI = (...xs) =>
  new RegExp(xs.join(""), "i");


Rex.consU = (...xs) =>
  new RegExp(xs.join(""), "u");


Rex.consGI = (...xs) =>
  new RegExp(xs.join(""), "gi");


Rex.consGU = (...xs) =>
  new RegExp(xs.join(""), "gu");


Rex.consIU = (...xs) =>
  new RegExp(xs.join(""), "iu");


Rex.consGIU = (...xs) =>
  new RegExp(xs.join(""), "giu");


/***[ Indexing ]**************************************************************/


Rex.searchFirst = getOffset => rx => s => {
  let ref = null;

  for (const o of s.matchAll(rx)) {
    const offset = getOffset(o);

    return [{
      start: o.index,
      end: o.index + offset,
      len: offset
    }];
  }

  return [];
};


Rex.searchFirstBy = getOffset => p => rx => s => {
  let ref = null;

  for (const o of s.matchAll(rx)) {
    if (p(o)) {
      const offset = getOffset(o);

      return [{
        start: o.index,
        end: o.index + offset,
        len: offset
      }];
    }
  }

  return [];
};


Rex.searchNth = getOffset => nth => rx => s => {
  for (const o of s.matchAll(rx)) {
    if (--nth <= 0) {
      const offset = getOffset(o);

      return [{
        start: o.index,
        end: o.index + offset,
        len: offset
      }];
    }
  }

  return [];
};


Rex.searchNthBy = getOffset => nth => p => rx => s => {
  for (const o of s.matchAll(rx)) {
    if (p(o)) {
      if (--nth <= 0) {
        const offset = getOffset(o);

        return [{
          start: o.index,
          end: o.index + offset,
          len: offset
        }];
      }
    }
  }

  return [];
};


Rex.searchLast = getOffset => rx => s => {
  let ref = null;

  for (const o of s.matchAll(rx))
    ref = o;

  if (ref === null) return [];

  else {
    const offset = getOffset(ref);

    return [{
      start: ref.index,
      end: ref.index + offset,
      len: offset
    }];
  }
};


Rex.searchLastBy = getOffset => p => rx => s => {
  let ref = null;

  for (const o of s.matchAll(rx))
    if (p(o)) ref = o;

  if (ref === null) return [];

  else {
    const offset = getOffset(ref);

    return [{
      start: ref.index,
      end: ref.index + offset,
      len: offset
    }];
  }
};


Rex.searchAll = getOffset => rx => s => {
  const os = [];

  for (const o of s.matchAll(rx))
    os.push(o);

  return os.map(o => {
    const offset = getOffset(o);
    
    return {
      start: o.index,
      end: o.index + offset,
      len: offset
    };
  });
};


Rex.searchAllBy = getOffset => p => rx => s => {
  const os = [];

  for (const o of s.matchAll(rx))
    if (p(o)) os.push(o);

  return os.map(o => {
    const offset = getOffset(o);
    
    return {
      start: o.index,
      end: o.index + offset,
      len: offset
    };
  });
};


/***[ Offsetting ]************************************************************/


Rex.discardOffset = o => 0;


Rex.getTotalOffset = o => o[0].length;


Rex.getIndexedOffset = name => o => o[i].length;


Rex.getCapturedOffset = name => o => o.groups.name.length;


/***[ String Operations ]*****************************************************/


Rex.match = os => s =>
  os.map(({start, end}) => s.slice(start, end));


Rex.parse = os => s =>
  os.reduceRight(([s2, acc], {start, end}) => [
    s2.slice(0, start).concat(s2.slice(end)),
    (acc.unshift(s2.slice(start, end)), acc)
  ], Pair(s, []));


Rex.matchSection = os => ps => s => {
  const diff = ps.length - os.length;

  return (diff === 0 || diff > 0 ? os : os.slice(0, diff))
    .map(({end: start}, i) => 
      s.slice(start, ps[i].end));
};


Rex.parseSection = os => ps => s => {
  const diff = ps.length - os.length;

  return (diff === 0 || diff > 0 ? os : os.slice(0, diff))
    .reduceRight(([s2, acc], {end: start}, i) => [
      s2.slice(0, start).concat(s2.slice(ps[i].end)),
      (acc.unshift(s2.slice(start, ps[i].end)), acc)
    ], Pair(s, []));
};


Rex.replace = s2 => os => s =>
  os.reduceRight((acc, {start, end}) =>
    acc.slice(0, start)
      .concat(s2)
      .concat(acc.slice(end)), s);


Rex.modify = f => os => s =>
  os.reduceRight((acc, {start, end}) =>
    acc.slice(0, start)
      .concat(f(acc.slice(start, end)))
      .concat(acc.slice(end)), s);


Rex.remove = os => s =>
  os.reduceRight((acc, {start, end}) =>
    acc.slice(0, start)
      .concat(acc.slice(end)), s);


Rex.insertBefore = s2 => os => s =>
  os.reduceRight((acc, {start, end}) =>
    acc.slice(0, start)
      .concat(s2)
      .concat(acc.slice(start)), s);


Rex.insertAfter = s2 => os => s =>
  os.reduceRight((acc, {start, end}) =>
    acc.slice(0, end)
      .concat(s2)
      .concat(acc.slice(end)), s);


Rex.split = os => s =>
  os.reduceRight((acc, {start, end}) => {
    const rest = acc[0].slice(0, start),
      head = acc[0].slice(end);

    acc[0] = head;
    acc.unshift(rest);
    return acc;
  }, [s]);


Rex.splitBefore = os => s =>
  os.reduceRight((acc, {start, end}) => {
    const rest = acc[0].slice(0, start),
      head = acc[0].slice(start);

    acc[0] = head;
    acc.unshift(rest);
    return acc;
  }, [s]);
    

Rex.splitAfter = os => s =>
  os.reduceRight((acc, {start, end}) => {
    const rest = acc[0].slice(0, end),
      head = acc[0].slice(end);

    acc[0] = head;
    acc.unshift(rest);
    return acc;
  }, [s]);


/***[ Relative Position ]*****************************************************/


Rex.areAdjacent = rx => ({end}) => ({start}) => {
  const padding = s.slice(end, start);

  if (end > start) return false;
  
  else return padding
    .replace(rx, "").length === 0 ? true : false;
};


Rex.areOverlapping = ({end}) => ({start}) => end >= start;


Rex.areNested = ({start, end}) => ({start: start2, end: end2}) =>
  start <= start2 && end >= end2;


/***[ Primitive Patterns ]****************************************************/


Rex._ = " +"; // sequential spaces


Rex.CRLF = "\\r?\\n"; // safe line feeds


Rex.HYPHENS = "(?:—|–|-)"; // OCR safe hyphens


Rex.NWC = "\\p{Z}|\\p{S}|\\p{P}|\\p{C}|\\p{M}"; // non-word character


Rex.WBL = `(?<=^|${Rex.NWC})`; // unicode word boundary left


Rex.WBR = `(?=$|${Rex.NWC})`; // unicode word boundary right


/***[ Specific Patterns ]*****************************************************/


Rex.makeDateDePat = ({sep, century = "", months = new Map()}) => ({
  rex: Rex.consGU(
    Rex.WBL,
    "(?<d>\\d\\d?)",
    sep,
    months.size === 0
      ? "(?<m>\\d\\d?)"
      : `${Rex._}(?<m>\\p{Lu}\\p{Ll}+)(?:\\W)?${Rex._}`,
    months.size === 0 ? sep : "",
    `(?<y>${century}\\d\\d)`,
    Rex.WBR),

  pred: o => {
    let y = Number(century + o.groups.y),
      m = months.size === 0 ? Number(o.groups.m) : months.get(m) + 1,
      d = Number(o.groups.d);

    if (m === undefined || m < 1 || m > 12)
      return false;

    else if (!isDayOfMonth({year: y, month: m - 1}) (d))
      return false;

    else return true;
  }
});


Rex.makeDateIsoPat = ({century = ""}) => ({
  rex: Rex.consGU(
    Rex.WBL,
    `(?<y>${century}\\d\\d)\\.`,
    "(?<m>\\d\\d).",
    "(?<d>\\d\\d)",
    Rex.WBR),

  pred: o => {
    let y = Number(century + o.groups.y),
      m = Number(o.groups.m),
      d = Number(o.groups.d);

    if (m < 1 || m > 12)
      return false;

    else if (!isDayOfMonth({year: y, month: m - 1}) (d))
      return false;

    else return true;
  }
});


Rex.makeDecimalPat = ({groupSep, decSep}) => ({
  rex: Rex.consGU(
    Rex.WBL,
    `(?<int>[0-9${groupSep}]+)`,
    decSep,
    `(?<frac>\\d+)`,
    Rex.WBR),

  pred: o => {
    if (o.groups.int.length > 1
      && o.groups.int[0] === "0")
        return false;

    else if (o.groups.int.includes(groupSep)) {
      const fst = o.groups.int.split(groupSep, 1) [0];
      const snd = o.groups.int.split(groupSep).slice(1);

      if (fst.length > 3) return false;
      else return snd.every(s => s.length === 3);
    }

    else return true;
  }
});


/***[ Misc. ]*****************************************************************/


Rex.escape = s =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


/******************************************************************************
**********************************[ SERIAL ]***********************************
******************************************************************************/


export const Serial = k => {
  const o = {
    [TAG]: "Serial",
    run: k
  };

  if (Math.random() < MICROTASK_TRESHOLD) // defer until next microtask
    o.run = deferMicro(o.run);

  return o;
};


/***[ Conjunction ]***********************************************************/


Serial.and = tx => ty =>
  Serial(k =>
    tx.run(x =>
      ty.run(y =>
        k(Pair(x, y)))));


Serial.allArr = () =>
  A.seqA({
    map: Serial.map,
    ap: Serial.ap,
    of: Serial.of});


/***[ Functor ]***************************************************************/


Serial.map = f => tx =>
  Serial(k => tx.run(x => k(f(x))));


Serial.Functor = {map: Serial.map};


/***[ Functor :: Apply ]******************************************************/


Serial.ap = tf => tx =>
  Serial(k =>
    Serial.and(tf) (tx)
      .run(([f, x]) =>
         k(f(x))));


Serial.Apply = {
  ...Serial.Functor,
  ap: Serial.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Serial.of = x => Serial(k => k(x));


Serial.Applicative = {
  ...Serial.Apply,
  of: Serial.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Serial.chain = mx => fm =>
  Serial(k => mx.run(x => fm(x).run(k)));


Serial.Chain = {
  ...Serial.Apply,
  chain: Serial.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Serial.Monad = {
  ...Serial.Applicative,
  chain: Serial.chain
};


/***[ Natural Transformations ]***********************************************/


// TODO: fromParallel/toParallel


/***[ Semigroup ]*************************************************************/


Serial.append = append => tx => ty =>
  Serial(k => Serial.and(tx) (ty)
    .run(([x, y]) => k(append(x) (y))));


Serial.prepend = Serial.append;


Serial.Semigroup = {
  append: Serial.append,
  prepend: Serial.prepend
};


/***[ Semigroup :: Monoid ]***************************************************/


Serial.empty = empty => Serial(k => k(empty));


Serial.Monoid = {
  ...Serial.Semigroup,
  empty: Serial.empty
};


/***[ Misc. ]*****************************************************************/


Serial.once = tx => {
  let x = lazy(() => {
    throw new TypeError("race condition detected");
  });

  let done = false;

  const k = f => {
    if (done) {
      f(x);
      return k;
    }

    else {
      tx.run(y => {
        x = y; f(y);
        return k;
      });

      done = true; // sync
      return k;
    }
  };

  return Serial(k);
};


/***[ Resolve Dependencies ]**************************************************/


Serial.allArr = Serial.allArr();


/******************************************************************************
***********************************[ STAR ]************************************
******************************************************************************/


export const Star = tf => ({ // TODO: add map/Functor
  [TAG]: "Star",
  run: tf
});


/***[ Functor :: Profunctor ]*************************************************/


Star.dimap = ({map}) => h => f => tg =>
  Star(x => map(f) (tg.run(h(x))));


Star.lmap = g => tf =>
  Star(x => tf.run(g(x)));


Star.rmap = ({map}) => f => tg =>
  Star(x => map(f) (tg.run(x)));


Star.Profunctor = {
  ...Star.Functor,
  dimap: Star.dimap,
  lmap: Star.lmap,
  rmap: Star.rmap
};


/******************************************************************************
***********************************[ STATE ]***********************************
******************************************************************************/


export const State = f => ({
  [TAG]: "State",
  run: f
});


/***[ Functor ]***************************************************************/


State.map = f => tg =>
  State(y => {
    const [x, y2] = tg.run(y);
    return Pair(f(x), y2);
  });


State.Functor = {map: State.map};


/***[ Functor :: Apply ]******************************************************/


State.ap = tf => tg =>
  State(y => {
    const [f, y2] = tf.run(y),
      [x, y3] = tg.run(y2);

    return Pair(f(x), y3);
  });


State.Apply = {
  ...State.Functor,
  ap: State.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


State.of = x => State(y => Pair(x, y));


State.Applicative = {
  ...State.Apply,
  of: State.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


State.chain = mg => fm =>
  State(y => {
    const [x, y2] = mg.run(y);
    return fm(x).run(y2);
  });


State.Chain = {
  ...State.Apply,
  chain: State.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


State.Monad = {
  ...State.Applicative,
  chain: State.chain
};


/***[ State ]*****************************************************************/


State.eval = tf => x => tf.run(x) [0];


State.exec = tf => x => tf.run(x) [1];


State.get = State(x => Pair(x, x));


State.gets = f => State(x => Pair(f(x), x));


State.mod = f => State(x => Pair(null, f(x)));


State.put = x => State(_ => Pair(null, x));


State.withState = f => tg => State(x => tg.run(f(x)));


/******************************************************************************
**********************************[ STATET ]***********************************
******************************************************************************/


export const StateT = mmf => ({
  [TAG]: "StateT",
  run: mmf
});


/***[ Functor ]***************************************************************/


StateT.map = ({map}) => f => mmg =>
  StateT(y => map(mx => Pair(f(mx[0]), mx[1])) (mmg.run(y)));


StateT.Functor = {map: StateT.map};


/***[ Functor :: Alt ]********************************************************/


StateT.alt = ({alt}) => mmf => mmg => StateT(y => alt(mmf.run(y)) (mmg.run(y)));


StateT.Alt = {
  ...StateT.Functor,
  map: StateT.map
};


/***[ Functor :: Plus ]*******************************************************/


StateT.zero = ({zero}) => StateT(_ => zero);


/***[ Functor :: Apply ]******************************************************/


StateT.ap = ({of, chain}) => mmf => mmg =>
  StateT(y => chain(mmf.run(y)) (mx =>
    chain(mmg.run(mx[1])) (my =>
      of(Pair(mx[0] (my[0]), my[1])))));


StateT.Apply = {
  ...StateT.Functor,
  ap: StateT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


StateT.of = x => StateT(y => of(Pair(x, y)));


StateT.Applicative = {
  ...StateT.Apply,
  of: StateT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


StateT.chain = ({of, chain}) => mmg => fmm =>
  StateT(y => chain(mmg.run(y)) (mx =>
    fmm(mx[0]).run(mx[1])));


StateT.Chain = {
  ...StateT.Apply,
  chain: StateT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


StateT.Alternative = {
  ...StateT.Plus,
  ...StateT.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


StateT.Monad = {
  ...StateT.Applicative,
  chain: StateT.chain
};


/***[ State ]*****************************************************************/


StateT.eval = ({of, chain}) => mmf => x => of(mmf.run(x) [0]);


StateT.exec = ({of, chain}) => mmf => x => of(mmf.run(x) [1]);


StateT.get = () => StateT.state(x => Pair(x, x));


StateT.gets = f => StateT.state(x => Pair(f(x), x));


StateT.mod = f => StateT.state(x => Pair(null, f(x)));


StateT.put = x => StateT.state(_ => Pair(null, x));


StateT.state = ({of}) => f => StateT(x => of(f(x)));


StateT.withState = f => mmg => StateT(x => mmg.run(f(x)));


/***[ Natural Transformation ]************************************************/


StateT.mapBase = f => mmg => StateT(x => f(mmg.run(x)));


/***[ Transformer ]***********************************************************/


StateT.lift = ({of, chain}) => mx =>
  StateT(y => chain(mx) (x => of(Pair(x, y))));


// TODO


/***[ Resolve Dependencies ]**************************************************/


StateT.get = StateT.get();


/******************************************************************************
**********************************[ STREAMT ]**********************************
******************************************************************************/


// data Stream f m r = Step !(f (Stream f m r)) | Eff (m (Stream f m r)) | Done r

export const StreamT = {};


StreamT.Step = mmx => ({
  [TAG]: "StreamT",
  run: ({step}) => step(mmx)
});


StreamT.Eff = mmx => ({
  [TAG]: "StreamT",
  run: ({eff}) => eff(mmx)
});


StreamT.Done = mmx => ({
  [TAG]: "StreamT",
  run: ({done}) => done(mmx)
});


StreamT.cata = ({map}, {of, chain}) => step => eff => done => mmx => 
  eff(function go(mmx2) {
    return mmx2.run({
      step: tx => of(step(map(x => eff(go(x)) (tx)))),
      eff: mx => chain(mx) (go),
      done: x => of(done(x))
    });
  } (mmx));


/***[ Functor ]***************************************************************/


StreamT.map = ({map}, {of, chain}) => f => function go(mmx) {
  return mmx.run({
    step: tx => Step(map(go) (tx)),
    eff: mx => Eff(chain(mx) (x => of(go(x)))),
    done: x => Done(f(x))
  });
};


StreamT.Functor = {map: StreamT.map};


/***[ Functor :: Apply ]******************************************************/


StreamT.ap = mmf => mmx =>
  StreamT.chain(mmf) (f =>
    StreamT.chain(mmx) (x =>
      StreamT.of(f(x))));


StreamT.Apply = {
  ...StreamT.Functor,
  ap: StreamT.ap
};


/***[ Functor :: Applicative ]************************************************/


StreamT.of = Done;


StreamT.Applicative = {
  ...StreamT.Functor,
  ...StreamT.Apply,
  of: StreamT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


StreamT.chain = ({map}, {map2}) => mmx => fmm => function go(mmx2) {
  return mmx2.run({
    step: tx => Step(map(go) (tx)),
    eff: mx => Eff(map2(go) (mx)),
    done: x => fmm(x)
  });
} (mmx);


StreamT.Chain = {
  ...StreamT.Apply,
  chain: StreamT.chain
};


/***[ Functor :: Applicative :: Monad ]***************************************/


StreamT.Monad = {
  ...StreamT.Applicative,
  chain: StreamT.chain
};


/***[ Functor :: Extend :: Comonad ]******************************************/


// TODO


/******************************************************************************
*******************************[ STREAMT :: OF ]*******************************
******************************************************************************/


// TODO: functor of StreamT.Step


/******************************************************************************
**********************************[ STRING ]***********************************
******************************************************************************/


export const Str = {};


Str.derivedLetters = new Map([
  ["Æ", "AE"], ["æ", "ae"], ["Œ", "OE"], ["œ", "oe"], ["ẞ", "ss"], ["Ⱥ", "A"], ["ⱥ", "a"], ["Ɑ", "A"], ["ɑ", "a"], ["ɐ", "a"],
  ["ɒ", "a"], ["Ƀ", "B"], ["ƀ", "b"], ["Ɓ", "B"], ["ɓ", "b"], ["Ƃ", "b"], ["ƃ", "b"], ["ᵬ", "b"], ["ᶀ", "b"], ["Ƈ", "C"],
  ["ƈ", "c"], ["Ȼ", "C"], ["ȼ", "c"], ["Ɗ", "D"], ["ɗ", "d"], ["Ƌ", "D"], ["ƌ", "d"], ["ƍ", "d"], ["Đ", "D"], ["đ", "d"],
  ["ɖ", "d"], ["ð", "d"], ["Ɇ", "E"], ["ɇ", "e"], ["ɛ", "e"], ["ɜ", "e"], ["ə", "e"], ["Ɠ", "G"], ["ɠ", "g"], ["Ǥ", "G"],
  ["ǥ", "g"], ["ᵹ", "g"], ["Ħ", "H"], ["ħ", "h"], ["Ƕ", "H"], ["ƕ", "h"], ["Ⱨ", "H"], ["ⱨ", "h"], ["ɥ", "h"], ["ɦ", "h"],
  ["ı", "i"], ["Ɩ", "I"], ["ɩ", "i"], ["Ɨ", "I"], ["ɨ", "i"], ["Ɉ", "J"], ["ɉ", "j"], ["ĸ", "k"], ["Ƙ", "K"], ["ƙ", "k"],
  ["Ⱪ", "K"], ["ⱪ", "k"], ["Ł", "L"], ["ł", "l"], ["Ƚ", "L"], ["ƚ", "l"], ["ƛ", "l"], ["ȴ", "l"], ["Ⱡ", "L"], ["ⱡ", "l"],
  ["Ɫ", "L"], ["ɫ", "l"], ["Ľ", "L"], ["ľ", "l"], ["Ɯ", "M"], ["ɯ", "m"], ["ɱ", "m"], ["Ŋ", "N"], ["ŋ", "n"], ["Ɲ", "N"],
  ["ɲ", "n"], ["Ƞ", "N"], ["ƞ", "n"], ["Ø", "O"], ["ø", "o"], ["Ɔ", "O"], ["ɔ", "o"], ["Ɵ", "O"], ["ɵ", "o"], ["Ƥ", "P"],
  ["ƥ", "p"], ["Ᵽ", "P"], ["ᵽ", "p"], ["ĸ", "q"], ["Ɋ", "Q"], ["ɋ", "q"], ["Ƣ", "Q"], ["ƣ", "q"], ["Ʀ", "R"], ["ʀ", "r"],
  ["Ɍ", "R"], ["ɍ", "r"], ["Ɽ", "R"], ["ɽ", "r"], ["Ƨ", "S"], ["ƨ", "s"], ["ȿ", "s"], ["ʂ", "s"], ["ᵴ", "s"], ["ᶊ", "s"],
  ["Ŧ", "T"], ["ŧ", "t"], ["ƫ", "t"], ["Ƭ", "T"], ["ƭ", "t"], ["Ʈ", "T"], ["ʈ", "t"], ["Ʉ", "U"], ["ʉ", "u"], ["Ʋ", "V"],
  ["ʋ", "v"], ["Ʌ", "V"], ["ʌ", "v"], ["ⱴ", "v"], ["ⱱ", "v"], ["Ⱳ", "W"], ["ⱳ", "w"], ["Ƴ", "Y"], ["ƴ", "y"], ["Ɏ", "Y"],
  ["ɏ", "y"], ["ɤ", "Y"], ["Ƶ", "Z"], ["ƶ", "z"], ["Ȥ", "Z"], ["ȥ", "z"], ["ɀ", "z"], ["Ⱬ", "Z"], ["ⱬ", "z"], ["Ʒ", "Z"],
  ["ʒ", "z"], ["Ƹ", "Z"], ["ƹ", "z"], ["Ʒ", "Z"], ["ʒ", "z"]]);


Str.foldl = f => init => s => {
  let acc = init;
  
  for (let i = 0; i < s.length; i++)
    acc = f(acc) (s[i]);

  return acc;
};


Str.normalize = s => {
  const composedChars = /[\u0300-\u036F]/g,
    normalForm = s.normalize('NFKD').replace(composedChars, "")
  
  return Str.foldl(acc => c =>
    acc.concat(
      Str.derivedLetters.has(c)
        ? Str.derivedLetters.get(c) : c))
          ("") (normalForm);
};


Str.foldRex = rx => f => acc => s => {
  let r, acc2 = acc;

  while (r = rx.exec(s)) {
    acc2 = f(acc2) (r[0]);
  }

  return acc2;
};


/******************************************************************************
***********************************[ TUPLE ]***********************************
******************************************************************************/


export const Tuple = (r, s, t, u, v, w, x, y, z, _) => {
  if (_ !== undefined)
    throw new TypeError("upper bound exceeded");

  const o = {[TAG]: "Tuple"};
  let len = 0;

  if (r !== undefined) {o[0] = r; len = 1}
  if (s !== undefined) {o[1] = s; len = 2}
  if (t !== undefined) {o[2] = t; len = 3}
  if (u !== undefined) {o[3] = u; len = 4}
  if (v !== undefined) {o[4] = v; len = 5}
  if (w !== undefined) {o[5] = w; len = 6}
  if (x !== undefined) {o[6] = x; len = 7}
  if (y !== undefined) {o[7] = y; len = 8}
  if (z !== undefined) {o[8] = z; len = 9}

  o.length = len;

  o[Symbol.iterator] = function*() {
    if (r !== undefined) yield r;
    if (s !== undefined) yield s;
    if (t !== undefined) yield t;
    if (u !== undefined) yield u;
    if (v !== undefined) yield v;
    if (w !== undefined) yield w;
    if (x !== undefined) yield x;
    if (y !== undefined) yield y;
    if (z !== undefined) yield z;
  }  

  return o;
};


/******************************************************************************
*******************************[ TUPLE :: PAIR ]*******************************
******************************************************************************/


export const Pair = (x, y) => ({
  [TAG]: "Pair",
  0: x,
  1: y,
  length: 2,

 [Symbol.iterator]: function*() {
    yield x;
    yield y;
  }  
});


Pair.curried = curry_(Pair);


/***[ Bifunctor ]*************************************************************/


Pair.bimap = f => g => tx => Pair(f(tx[0]), g(tx[1]));


/***[ Extracting ]************************************************************/


Pair.fst = tx => tx[0];


Pair.snd = tx => tx[1];


/***[ Foldable ]**************************************************************/


Pair.foldl = f => acc => tx => f(acc) (tx[1]);


Pair.foldr = f => acc => tx => f(tx[1]) (acc);


Pair.Foldable = {
  foldl: Pair.foldl,
  foldr: Pair.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


// TODO


/***[ Functor ]***************************************************************/


Pair.map = f => tx => Pair(tx[0], f(tx[1]));


Pair.Functor = {map: Pair.map};


/***[ Functor :: Apply ]******************************************************/


Pair.ap = ({append, empty}) => tf => tx =>
  Pair(append(tf[0]) (tx[0]), tf[1] (tx[1]));


Pair.Apply = {
  ...Pair.Functor,
  ap: Pair.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


Pair.of = ({empty}) => x => Pair(empty, x);


Pair.Applicative = {
  ...Pair.Apply,
  of: Pair.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


Pair.chain = ({append}) => fm => mx => {
  const my = fm(mx[1]);
  return Pair(append(mx[0]) (my[0]), my[1]);
};


Pair.Chain = {
  ...Pair.Apply,
  chain: Pair.chain
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


Pair.Monad = {
  ...Pair.Applicative,
  chain: Pair.chain
};


/***[ Functor :: Extend ]*****************************************************/


Pair.extend = fw => wx => Pair(wx[0], fw(wx));


Pair.Extend = {
  ...Pair.Functor,
  extend: Pair.extend
};


/***[ Functor :: Extend :: Comonad ]******************************************/


Pair.extract = Pair.snd;


Pair.Comonad = {
  ...Pair.Extend,
  extract: Pair.extract
};


/***[ Writer ]****************************************************************/


Pair.censor = f => tx => Pair(tx[0], f(tx[1]));


Pair.listen = tx => Pair(Pair(tx[0], tx[1]), tx[1]);


Pair.listens = f => tx => Pair(Pair(tx[0], f(tx[1])), tx[1]);


Pair.pass = f => tx => Pair(tx[0] [0], tx[0] [1] (tx[1]));


Pair.tell = x => Pair(null, x);


/***[ Misc. ]*****************************************************************/


Pair.mapFst = f => tx => Pair(f(tx[0]), tx[1]);


Pair.mapSnd = Pair.map;


Pair.swap = tx => Pair(tx[1], tx[0]);


/******************************************************************************
*****************************[ TUPLE :: WRITERT ]******************************
******************************************************************************/


export const WriterT = mmx => ({
  [TAG]: "WriterT",
  run: mmx
});


/***[ Contravariant ]*********************************************************/


WriterT.contramap = ({contramap}) => f => mmx =>
  WriterT(contramap(mx => Pair(f(mx[0]), mx[1])) (mmx.run));


WriterT.Contravariant = {contramap: WriterT.contramap};


/***[ Foldable ]**************************************************************/


WriterT.foldl = ({foldl}) => f => acc => foldl(Option.foldl(f)) (acc);


WriterT.foldr = ({foldr}) => f => acc => foldr(Option.foldr(f)) (acc);


WriterT.Foldable = {
  foldl: WriterT.foldl,
  foldr: WriterT.foldr
};


/***[ Foldable :: Traversable ]***********************************************/


// TODO


/***[ Functor ]***************************************************************/


WriterT.map = ({map}) => f => mmx =>
  WriterT(map(mx => Pair(f(mx[0]), mx[1])) (mmx.run));


WriterT.Functor = {map: WriterT.map};


/***[ Functor :: Alt ]********************************************************/


WriterT.alt = ({alt}) => mmx => mmy => WriterT(alt(mmx.run) (mmy.run));


WriterT.Alt = {
  ...WriterT.Functor,
  alt: WriterT.alt
};


/***[ Functor :: Alt :: Plus ]************************************************/


WriterT.zero = ({zero}) => WriterT(zero);


WriterT.Plus = {
  ...WriterT.Alt,
  zero: WriterT.zero
};


/***[ Functor :: Apply ]******************************************************/


WriterT.ap = ({append}, {map, ap}) => mmf => mmx =>
  WriterT(ap(map(
    ([f, y]) => ([x, y2]) => Pair(f(x), append(y) (y2))) (mmf.run)) (mmx.run));


WriterT.Apply = {
  ...WriterT.Functor,
  ap: WriterT.ap
};


/***[ Functor :: Apply :: Applicative ]***************************************/


WriterT.of = ({empty}) => x => WriterT(Pair(x, empty));


WriterT.Applicative = {
  ...WriterT.Apply,
  of: WriterT.of
};


/***[ Functor :: Apply :: Chain ]*********************************************/


WriterT.chain = ({append}, {of, chain}) => mmx => fmm =>
  WriterT(chain(mmx.run) ((x, y) =>
    chain(fmm(x)) (([x2, y2]) =>
      of(Pair(x2, append(y) (y2))))));


WriterT.Chain = {
  ...WriterT.Apply,
  chain: WriterT.chain
};


/***[ Functor :: Apply :: Applicative :: Alternative ]************************/


WriterT.Alternative = {
  ...WriterT.Plus,
  ...WriterT.Applicative
};


/***[ Functor :: Apply :: Applicative :: Monad ]******************************/


WriterT.Monad = {
  ...WriterT.Applicative,
  chain: WriterT.chain
};


/***[ Natural Transformations ]***********************************************/


WriterT.mapBase = f => mmx => WriterT(f(mmx.run));


/***[ Transformer ]***********************************************************/


WriterT.lift = ({empty}, {of, chain}) => mx =>
  WriterT(chain(mx) (x => of(Pair(x, empty))));


// TODO


/***[ Writer ]****************************************************************/


WriterT.censor = f => tx => WriterT(of(Pair(tx[0], f(tx[1]))));


WriterT.listen = tx => WriterT(of(Pair(Pair(tx[0], tx[1]), tx[1])));


WriterT.listens = f => tx => WriterT(of(Pair(Pair(tx[0], f(tx[1])), tx[1])));


WriterT.pass = f => tx => WriterT(of(Pair(tx[0] [0], tx[0] [1] (tx[1]))));


WriterT.tell = x => WriterT(of(Pair(null, x)));


/******************************************************************************
******************************[ TUPLE :: TRIPLE ]******************************
******************************************************************************/


export const Triple = (x, y, z) => ({
  [TAG]: "Triple",
  0: x,
  1: y,
  2: z,
  length: 3,

 [Symbol.iterator]: function*() {
    yield x;
    yield y;
    yield z;
  }  
});


Triple.curried = curry3_(Triple);


/***[ Bifunctor ]*************************************************************/


Triple.bimap = f => g => tx => Triple(tx[0], f(tx[1]), g(tx[2]));


/***[ Extracting ]************************************************************/


Triple.fst = tx => tx[0];


Triple.snd = tx => tx[1];


Triple.thd = tx => tx[2];


/***[ Functor ]***************************************************************/


Triple.map = f => tx => Triple(tx[0], tx[1], f(tx[2]));


Triple.Functor = {map: Triple.map};


/***[ Trifunctor ]************************************************************/


Pair.trimap = f => g => h => tx => Pair(f(tx[0]), g(tx[1]), h(tx[2]));


/***[ Misc. ]*****************************************************************/


Triple.mapFst = f => tx => Pair(f(tx[0]), tx[1], tx[2]);


Triple.mapSnd = f => tx => Pair(tx[0], f(tx[1]), tx[2]);


Triple.mapThd = Triple.map


Triple.rotatel = tx => Pair(tx[1], tx[2], tx[0]);


Triple.rotater = tx => Pair(tx[2], tx[0], tx[1]);


/******************************************************************************
**********************************[ VECTOR ]***********************************
******************************************************************************/


export const Vector = (tree, length, offset) => ({
  [TAG]: "Vector",
  tree,
  length,
  offset
})


Vector.empty = Vector(RBT.Leaf, 0, 0);


/***[ Con-/Deconstruction ]***************************************************/


Vector.cons = x => xs => {
  const offset = xs.length === 0 ? 0 : xs.offset - 1,
    tree = RBT.set(xs.tree, offset, x, RBT.cmp);

  return Vector(tree, xs.length + 1, offset);
};


Vector.snoc = x => xs => {
  const tree = RBT.set(xs.tree, xs.length + xs.offset, x, RBT.cmp);
  return Vector(tree, xs.length + 1, xs.offset);
};


/***[ Getters/Setters ]*******************************************************/


Vector.get = i => xs => {
  const r = RBT.get(xs.tree, i + xs.offset, RBT.cmp);
  
  return r === null
    ? Option.None
    : Option.Some(r);
};


Vector.has = i => xs =>
  RBT.has(xs.tree, i + xs.offset, RBT.cmp);


// TODO: Vector.ins


Vector.mod = i => f => xs => {
  if (i < 0 || i % 1 !== 0)
    throw new RangeError("invalid index");

  else if (i - xs.length >= 0) return xs;

  else {
    const x = RBT.get(xs.tree, i + xs.offset, RBT.cmp);

    return Vector(
      RBT.set(xs.tree, i + xs.offset, f(x), RBT.cmp),
      xs.length,
      xs.offset);
  }
};


Vector.rem = i => xs => {
  if (i < 0 || i % 1 !== 0)
    throw new RangeError("invalid index");

  else if (i - xs.length >= 0) return xs;

  // TODO: reassign indexes using an in-order traversal

  else return Vector(
    RBT.del(xs.tree, i + xs.offset, RBT.cmp),
    xs.length - 1,
    xs.offset);
};


Vector.set = i => x => xs => {
  if (i < 0 || i % 1 !== 0)
    throw new RangeError("invalid index");

  else if (i - xs.length > 0)
    throw new RangeError("index is out of range");

  else return Vector(
    RBT.set(xs.tree, i + xs.offset, x, RBT.cmp),
    i === xs.length ? xs.length + 1 : xs.length,
    xs.offset);
};


// TODO: Vector.singleton


/***[ Foldable ]**************************************************************/


Vector.foldl = f => acc => xs =>
  RBT.foldl(f) (acc) (xs.tree);


Vector.foldr = f => acc => xs =>
  RBT.foldr(f) (acc) (xs.tree);


/***[ Functor ]***************************************************************/


Vector.map = f => xs =>
  Vector(
    RBT.map(f) (xs.tree),
    xs.length,
    xs.offset);


Vector.Functor = {map: Vector.map};


/******************************************************************************
*******************************************************************************
***************************[ RESOLVE DEPENDENCIES ]****************************
*******************************************************************************
******************************************************************************/


First.empty = First.empty();


Last.empty = Last.empty();

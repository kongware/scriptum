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


/******************************************************************************
*******************************************************************************
******************************[ LAZY EVALUATION ]******************************
*******************************************************************************
******************************************************************************/


/* Thunks are expressions that will only be evaluated if needed. As opposed to
Javascript thunks like `() => expression` scriptum relies on implicit thunks,
i.e. thunks are transparent to their consumers, which can treat the wrapped
expressions as any normal expresison. */


/* Unfortunately there is a single case where thunks are not transparent: If
you compare two thunks their references are actually compared rather than the
wrapped expressions. scriptum considers this by supplying an adapted equality
operator function. */


/***[ Constants ]*************************************************************/


const PREFIX = "$_";


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


export const THUNK = PREFIX + "thunk";


/***[ API ]*******************************************************************/


// strictly evaluate a thunk non-recursively

export const strict = x =>
  x && x[THUNK] ? x[EVAL] : x;


// iteratively evaluates arbitrarily deeply nested thunks

export const strictRec = x => {
  while (x && x[THUNK] === true)
    x = x[EVAL];

  return x;
};


// creates an annotated thunk

export const thunk = (thunk, anno) => {
  if (CHECK) {
    if (anno) return new Proxy(thunk, new ThunkProxy(anno));
    else throw new TypeError("missing type annotation");
  }

  else return new Proxy(thunk, new ThunkProxy());
};


/***[ Implementation ]********************************************************/


class ThunkProxy {
  constructor(anno) {
    this.memo = NULL

    if (CHECK) {

      // thunks are opaque values

      if (anno.search(/\(\) => /) === 0)
        this[ANNO] = anno.replace(/\(\) => /, "");

      else throw new TypeError(cat(
        "thunk expected\n",
        `but "${anno}" received`));
    }
  }

  apply(g, that, args) {

    // evaluate to WHNF

    if (this.memo === NULL) {
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

    else if (k === ANNO)
      return this[ANNO];

    // prevent evaluation

    else if (k === Symbol.toStringTag)
      return "Function";

    // evaluate once

    else if (this.memo === NULL) {
  
      // shallowly evaluate

      if (k === EVAL
        && this.memo === NULL)
          this.memo = g();

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

    if (this.memo === NULL) {
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

    // prevent evaluation

    else if (CHECK && k === ANNO)
      return true;

    // evaluate to WHNF

    else if (this.memo === NULL) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return k in this.memo;
  }

  ownKeys(g) {

    // evaluate to WHNF

    if (this.memo === NULL) {
      this.memo = g();

      while (this.memo[THUNK] === true)
        this.memo = this.memo[EVAL];
    }

    return Object.keys(this.memo);
  }
}

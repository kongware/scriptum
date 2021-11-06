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
*******************************[ STACK SAFETY ]********************************
*******************************************************************************
******************************************************************************/


/* Please note that this module only covers synchronous computations. Both
asynchronous types `Serial` and `Parallel` in scriptum are stack safe by design
and therefor don't require an external trampoline. */


/* While trampolines themselves are not typed to provide additional flexibility
they impose that the provided function is a typed one. */


/******************************************************************************
*****************************[ STRICT RECURSION ]******************************
******************************************************************************/


// iteratively evaluates arbitrarily deeply nested thunks

export const strictRec = x => {
  while (x && x[THUNK] === true)
    x = x[EVAL];

  return x;
};


/******************************************************************************
*****************************[ MONADIC RECURSION ]*****************************
******************************************************************************/


/* The trampoline monad allows stack safe monadic recusion. Unfortunately there
is no suitbale monad transformers, that is the trampoline type must always be
the innermost monad of a transformer stack. */

export const MonadRec = {};


MonadRec.loop = o => {
  while (o.tag === "Iterate")
    o = o.f(o.x);

  return o.tag === "Break"
    ? o.x
    : _throw(new TypeError("invalid trampoline tag"));
};


/***[ Applicative ]***********************************************************/


MonadRec.ap = tf => tx =>
  MonadRec.chain(tf) (f =>
    MonadRec.chain(tx) (x =>
      MonadRec.of(f(x))));


MonadRec.of = MonadRec => MonadRec.break;


/***[ Functor ]***************************************************************/


MonadRec.map = f => tx =>
  MonadRec.chain(tx) (x => MonadRed.of(f(x)));


/***[ Monad ]*****************************************************************/


MonadRec.chain = mx => fm =>
  mx.tag === "Iterate" ? Iterate(mx.x) (y => MonadRec.chain(mx.f(y)) (fm))
    : mx.tag === "Break" ? fm(mx.x)
    : _throw(new TypeError("invalid trampoline tag"));


/***[ Tags ]******************************************************************/


MonadRec.iterate = x => f => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else return {tag: "Iterate", f, x};
}


MonadRec.break = x =>
  ({tag: "Break", x});


/***[ Resolve Dependencies ]**************************************************/


MonadRec.of = MonadRec.of(MonadRec);


/******************************************************************************
******************************[ TAIL RECURSION ]*******************************
******************************************************************************/


// tail call elimination

export const TailRec = {};


TailRec.loop = f => {
  if (CHECK && !(ANNO in f))
    throw new TypeError(cat(
      "typed lambda expected\n",
      `but "${f.toString()}" received\n`));

  else return x => {
    let o = f(x);

    while (o.tag === "Iterate")
      o = f(o.x);

    return o.tag === "Break"
      ? o.x
      : _throw(new TypeError("invalid trampoline tag"));
  };
};


/***[ Tags ]******************************************************************/


TailRec.iterate = x => ({tag: "Iterate", x});


TailRec.break = x => ({tag: "Break", x});

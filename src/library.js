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
*******************************[ DEPENDENCIES ]********************************
*******************************************************************************
******************************************************************************/


import {thunk} from "./lazyness.js";


import {
  ANNO,
  CHECK,
  introspectDeep,
  fun,
  TAG, type, type1, typeClass} from "./validator.js";


/******************************************************************************
*******************************************************************************
*******************************[ TYPE CLASSES ]********************************
*******************************************************************************
******************************************************************************/


/***[ Functor ]***************************************************************/


export const Functor = typeClass(`(^a, b. {
  map: ((a => b) => f<a> => f<b>)
}) => Functor<f>`);


/***[ Functor :: Apply ]******************************************************/


export const Apply = typeClass(`Functor<f> => (^a, b. {
  ap: (f<(a => b)> => f<a> => f<b>)
}) => Apply<f>`);


/***[ Functor :: Apply :: Applicative ]***************************************/


export const Applicative = typeClass(`Apply<f> => (^a. {
  of: (a => f<a>)
}) => Applicative<f>`);


/******************************************************************************
*******************************************************************************
***********************[ AD-HOC POLYMORPHIC FUNCTIONS ]************************
*******************************************************************************
******************************************************************************/


/***[ Functor :: Apply ]******************************************************/


export const apFst = fun(
  ({map, ap}) => tx => ty => ap(map(_const) (tx)) (ty),
  "Apply<f> => f<a> => f<b> => f<a>");


export const apSnd = fun(
  ({map, ap}) => tx => ty => ap(mapEff(map) (id) (tx)) (ty),
  "Apply<f> => f<a> => f<b> => f<b>");


export const lift2 = fun(
  ({map, ap}) => f => tx => ty => ap(map(f) (tx)) (ty),
  "Apply<f> => (a => b => c) => f<a> => f<b> => f<c>");


/******************************************************************************
*******************************************************************************
***********************************[ TYPES ]***********************************
*******************************************************************************
******************************************************************************/


/******************************************************************************
*********************************[ FUNCTION ]**********************************
******************************************************************************/


/***[ Category ]**************************************************************/


export const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");


export const id = fun(x => x, "a => a");


/***[ Impure ]****************************************************************/


export const _throw = e => {
  throw e;
};


/***[ Local Bindings ]********************************************************/


/* `_let` itself is not typed, because it expectes a heterogeneous list of
arguments. It ensures that the passed function is typed though. */

export const _let = (...args) => {
  return {in: f => {
    if (CHECK && !(ANNO in f))
      throw new TypeError(cat(
        "typed lambda expected\n",
        `but "${f.toString()}" received\n`));

    else return f(...args);
  }};
};


/***[ Misc. ]*****************************************************************/


export const cat = fun(
  (...lines) => lines.join(""),
  "..[String] => String");


export const _const = fun(
  x => y => x,
  "a => discard => a");


/******************************************************************************
**********************************[ Mutable ]**********************************
******************************************************************************/


/* `Mutable` is an imperative data type that takes a mutable type and provides
an API for safe in-place updates by avoiding to share the effect. */


export const Mutable = fun(
  clone => ref => {
    const anno = CHECK ? introspectDeep({charCode: 97}) (ref) : "";

    return _let({}, ref).in(fun((o, ref) => {
      let mutated = false;

      o.consume = thunk(() => {
        if (mutated) {
          delete o.update;

          o.update = _ => {
            throw new TypeError(
              "illegal in-place update of consumed data structure");
          };
        }

        return ref;
      }, `() => ${anno}`);

      o.update = fun(k => {
        if (!mutated) {
          ref = clone(ref); // copy once on first write
          mutated = true;
        }

        k(ref); // use the effect but discard the result
        return o;
      }, `(${anno} => ${anno}) => Mutable {consume: ${anno}, update: ((${anno} => ${anno}) => this*)}`);

      return (o[TAG] = "Mutable", o);
    }, `{}, ${anno} => Mutable {consume: ${anno}, update: ((${anno} => ${anno}) => this*)}`));
  },
  "(t<a> => t<a>) => t<a> => Mutable {consume: t<a>, update: ((t<a> => t<a>) => this*)}");


/******************************************************************************
**********************************[ YONEDA ]***********************************
******************************************************************************/


/* Enables dynamic loop fusion based on a functor that is known right from the
start, i.e. before you lift its type into `Yoneda`. Loop fusion is accomplished
by function composition. */


export const Yoneda = type1("(^b. (a => b) => f<b>) => Yoneda<f, a>");


/***[ Con-/Destruction ]******************************************************/


Yoneda.lift = fun(
  ({map}) => tx => Yoneda(fun(
    f => map(f) (tx),
    "(a => b) => f<b>")),
  "Functor<f> => f<a> => Yoneda<f, a>");


Yoneda.lower = fun(
  tx => tx.run(id),
  "Yoneda<f, a> => f<a>");


/***[ Functor ]***************************************************************/


Yoneda.map = fun( // TODO: test
  f => tx => Yoneda(fun(
    g => tx.run(fun(
      x => g(f(x)),
      "a => b")),
    "(a => b) => f<b>")),
  "(a => b) => Yoneda<f, a> => Yoneda<f, b>");


Yoneda.Functor = Functor({map: Yoneda.map});


/***[ Functor :: Apply ]******************************************************/


Yoneda.ap = fun( // TODO: test
  tf => th => Yoneda(fun(
    g => tf.run(fun(
      f => th.run(fun(
        h => lift(id) (f(comp(g))) (h(id)),
        "a => b")),
      "(a => b) => f<b>")),
    "f<(a => b)> => f<b>")),
  "Yoneda<f, (a => b)> => Yoneda<f, a> => Yoneda<f, b>");


Yoneda.Apply = Apply(Yoneda.Functor) ({ap: Yoneda.ap});

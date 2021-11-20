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


/***[ Modules ]***************************************************************/


import {thunk} from "./lazyness.js";


import {
  ANNO,
  CHECK,
  introspectDeep,
  fun,
  TAG, type, type1, typeClass} from "./validator.js";


/***[ Constants ]*************************************************************/


/* In order to render asynchronous computations stack safe the stack must be
reset periodically. In Javascript this is possible by awaiting the next micro
task using the `Promise.resolve` method. Deferring the computation to the next
micro task is by design a rather slow operation, hence it should only be
carried out when a certain treshold is exceeded. */

const MICROTASK_TRESHOLD = 0.01;


// native Javascript comparator protocoll

export const LT = -1;
export const EQ = 0;
export const GT = 1;


/******************************************************************************
*******************************************************************************
*******************************[ TYPE CLASSES ]********************************
*******************************************************************************
******************************************************************************/


/***[ Functor ]***************************************************************/


export const Functor = typeClass("Fucntor", `(^a, b. {
  map: ((a => b) => f<a> => f<b>)
}) => Functor<f>`);


/***[ Functor :: Apply ]******************************************************/


export const Apply = typeClass("Apply", `Functor<f> => (^a, b. {
  ap: (f<(a => b)> => f<a> => f<b>)
}) => Apply<f>`);


/***[ Functor :: Apply :: Applicative ]***************************************/


export const Applicative = typeClass("Applicative", `Apply<f> => (^a. {
  of: (a => f<a>)
}) => Applicative<f>`);


/***[ Semigroup ]*************************************************************/


export const Semigroup = typeClass("Semigroup", `({
  append: (a => a => a)
}) => Semigroup<a>`);


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


export const F = {};


/***[ Category ]**************************************************************/


export const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");


export const id = fun(x => x, "a => a");


/***[ Functor ]***************************************************************/


F.map = comp;


F.Functor = Functor({map: F.map});


/***[ Impure ]****************************************************************/


/* Dynamically debug within function compositions. Passe `id` as first argument
to hook the debugger at the return type of a function. */

export const debug = f => (...args) => {
  debugger;
  return f(...args);
};


// throwing statement as an expression

export const _throw = fun(
  e => {throw e},
  "e => exception");


/***[ Misc. ]*****************************************************************/


/* Useful to structure error messages or regular expressions in lines and thus
render them more readable. */

export const cat = fun(
  (...lines) => lines.join(""),
  "..[String] => String");


export const _const = fun(
  x => y => x,
  "a => discard => a");


/* Supply local bindings. Combinator itself is not typed, because it allows a
heterogeneous list of arguments. It ensures that the passed function is typed
though. */

export const _let = (...args) => {
  return {in: f => {
    if (CHECK && !(ANNO in f))
      throw new TypeError(cat(
        "typed lambda expected\n",
        `but "${f.toString()}" received\n`));

    else return f(...args);
  }};
};


/******************************************************************************
***********************************[ ARRAY ]***********************************
******************************************************************************/


/* scriptum treats `Array` as a mutable data type, because it is designed as
such. You should only use it if you want to perform a lot of element lookups
and don't need to alter a once created array. */


export const A = {}; // namespace


/***[ Foldable ]**************************************************************/


A.foldl = fun(
  f => init => xs => {
    let acc = init;

    for (let i = 0; i < xs.length; i++)
      acc = f(acc) (xs[i]);

    return acc;
  },
  "(b => a => b) => b => [a] => b");


/***[ Functor ]***************************************************************/


A.map = fun(
  f => xs => xs.map(x => f(x)),
  "(a => b) => [a] => [b]");


A.Functor = Functor({map: A.map});


/***[ Functor :: Apply ]******************************************************/


A.ap = fun(
  fs => xs => A.foldl(fun(
    acc => f => A.append(acc) (A.map(f) (xs)),
    "[b] => (a => b) => [b]")) ([]) (fs),
  "[(a => b)] => [a] => [b]");


A.Apply = Apply(A.Functor) ({ap: A.ap});


/***[ Semigroup ]*************************************************************/


A.append = fun(
  xs => ys => (xs.push.apply(xs, ys), xs),
  "[a] => [a] => [a]");


A.prepend = fun(
  ys => xs => (xs.push.apply(xs, ys), xs),
  "[a] => [a] => [a]");


A.Semigroup = Semigroup({append: A.append});


/******************************************************************************
*********************************[ COYONEDA ]**********************************
******************************************************************************/


/* Enables dynamic loop fusion based on a functor that have to be known only
when you need to get its value out of `Coyoneda`. Loop fusion is accomplished
by function composition. */


export const Coyoneda = type1(
  "(^r. (^b. (b => a) => f<b> => r) => r) => Coyoneda<f, a>");


/* Auxiliary function to allow constructing values of type `Coyoneda` in a
curried form. */

export const coyoneda = fun(
  f => tx => Coyoneda(k => k(f) (tx)),
  "(b => a) => f<b> => Coyoneda<f, a>");


/***[ Con-/Destruction ]******************************************************/


// f<a> => Coyoneda<f, a>

Coyoneda.lift = coyoneda(id);


Coyoneda.lower = fun(
  ({map}) => tx => tx.run(fun(
    f => ty => map(f) (ty),
    "(b => a) => f<b> => f<a>")),
  "Functor<f> => Coyoneda<f, a> => f<a>");


/***[ Functor ]***************************************************************/


Coyoneda.map = fun(
  f => tx => tx.run(fun(
    g => ty => coyoneda(comp(f) (g)) (ty), // TODO: replace comp for more speed
    "(a => b) => f<a> => Coyoneda<f, b>")),
  "(a => b) => Coyoneda<f, a> => Coyoneda<f, b>");


Coyoneda.Functor = Functor({map: Coyoneda.map});


/***[ Functor :: Apply ]******************************************************/


Coyoneda.ap = fun(
  ({map, ap}) => tf => tg =>
    tf.run(fun(
      f => tx =>
        tg.run(fun(
          g => ty =>
            Coyoneda.lift(ap(map(fun(
              x => y => f(x) (g(y)),
              "a => a => b")) (tx)) (ty)), // TODO: make more general
          "(a => b) => f<a> => Coyoneda<f, b>")),
      "(a => b) => f<a> => Coyoneda<f, b>")),
  "Apply<f> => Coyoneda<f, (a => b)> => Coyoneda<f, a> => Coyoneda<f, b>");


Coyoneda.Apply = apply =>
  Apply(Coyoneda.Functor) ({ap: Coyoneda.ap(apply)});


/***[ Functor :: Apply :: Applicative ]***************************************/


Coyoneda.of = fun(
  ({of}) => comp(Coyoneda.lift) (of),
  "a => Coyoneda<f, a>");


Coyoneda.Applicative = applicative =>
  Applicative(Coyoneda.Apply) ({of: Coyoneda.of(applicative)});


/******************************************************************************
**********************************[ EITHER ]***********************************
******************************************************************************/


export const Either = type(
  "(^r. {left: (a => r), right: (b => r)} => r) => Either<a, b>");


Either.Left = fun(
  x => Either(({left, right}) => left(x)),
  "a => Either<a, b>");


Either.Right = fun(
  x => Either(({left, right}) => right(x)),
  "b => Either<a, b>");


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


/* Enables dynamic loop fusion based on a functor that have to be known before
you put its value into `Yoneda`. Loop fusion is accomplished by function
composition. */


export const Yoneda = type1("(^b. (a => b) => f<b>) => Yoneda<f, a>");


/***[ Con-/Destruction ]******************************************************/


Yoneda.lift = fun(
  ({map}) => tx => Yoneda(
    f => map(f) (tx)),
  "Functor<f> => f<a> => Yoneda<f, a>");


Yoneda.lower = fun(
  tx => tx.run(id),
  "Yoneda<f, a> => f<a>");


/***[ Functor ]***************************************************************/


Yoneda.map = fun(
  f => tx => Yoneda(
    g => tx.run(fun(x => g(f(x)), "a => b"))),
  "(a => b) => Yoneda<f, a> => Yoneda<f, b>");


Yoneda.Functor = Functor({map: Yoneda.map});


/***[ Functor :: Apply ]******************************************************/


Yoneda.ap = fun(
  ({ap}) => ({run: f}) => ({run: g}) =>
    Yoneda(h => ap(f(comp(h))) (g(id))), // TODO: replace comp for more speed
  "Apply<f> => Yoneda<f, (a => b)> => Yoneda<f, a> => Yoneda<f, b>");


Yoneda.Apply = apply =>
  Apply(Yoneda.Functor) ({ap: Yoneda.ap(apply)});


/***[ Functor :: Apply :: Applicative ]***************************************/


Yoneda.of = fun(
  ({of}) => x => Yoneda(f => of(f(x))),
  "Applicative<f> => a => Yoneda<f, a>");


Yoneda.Applicative = applicative =>
  Applicative(Yoneda.Apply) ({of: Yoneda.of(applicative)});

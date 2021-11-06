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
***************************[ SAFE IN-PLACE UPDATES ]***************************
*******************************************************************************
******************************************************************************/


/* `Mutable` is an imperative data type that takes a mutable type and provides
an API for safe in-place updates by avoiding sharing the effect. */


/***[ Dependencies ]**********************************************************/


import {thunk} from "./lazyness.js";
import {_let} from "./library.js";
import {CHECK, introspectDeep, fun, TAG} from "./validator.js";


/***[ Type ]******************************************************************/


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

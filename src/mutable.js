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
safe in-place updates for it by avoiding sharing. */


import {_let, thunk} from "./scriptum/index.js";


export const Mutable = clone => ref => {
  return _let({}, ref).in((o, ref) => {
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
    });

    o.update = k => {
      if (!mutated) {
        ref = clone(ref); // copy once on first write
        mutated = true;
      }

      k(ref); // use the effect but discard the result
      return o;
    };

    return (o[TAG] = "Mutable", o);
  });
};

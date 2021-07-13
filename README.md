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
                                   
# Gradual Typed Functional Programming with Javascript

scriptum consists of two parts:

* [a runtime type validator](https://github.com/kongware/scriptum/blob/master/type-validator.md)
* [a typed standard library](https://github.com/kongware/scriptum/blob/master/library.md)

Just like Typescript scriptum enables gradual typing in Javascript but with a radically different approach. While Typescript targets the object oriented aspects of Javascript, scriptum embraces its functional capabilities.

## Status

Unstable (v0.2.0)

**NOTE: Type classes were missing unification in the presence of superclasses. For the same reason type classes without members but with superclass relations couldn't be declared. Both issues are fixed now but there are still some follow-up bugs. I reckon to fix them in the next 24h. **

The type validator has grown organically over the last month. Its implementation is therefore neither bug free nor DRY nor performant.

If you come across a bug, please don't hesitate to file an issue. Thank you!

For the next couple of months the type validator will gradually become more stable and the functional library more extensive. Bear with me!

## Goals

In order to reconcile the functional paradigm with Javascript the following main aspects need to be addressed:

- [x] type safety
- [x] algebraic data types
- [x] value level type classes
- [x] lazy evaluation with thunks
- [x] persistent data structures
- [x] safe in-place updates
- [x] stack-safe sync/async recursion
- [ ] effect handling and composition
- [ ] concurrency (STM)
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] strong eventual consistency (CRDTs)

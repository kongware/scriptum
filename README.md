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

Runtime type checking is expensive and only useful within the development stage. For this reason the type validator can be turned off in production to minimize a performance penalty. However, it is planned for version 2.0.0 to introduce a build step that completely erases the type validator syntax from the code base and thus avoids a performance penalty altogether.

## Status

Unstable (v0.3.0)

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

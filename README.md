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

* runtime type validator ([docs](https://github.com/kongware/scriptum/blob/master/validator.md))
* typed standard library ([docs](https://github.com/kongware/scriptum/blob/master/library.md))

Just like Typescript scriptum enables gradual typing in Javascript but with a radically different approach. While Typescript targets the object oriented aspects of Javascript, scriptum embraces its functional Lisp roots.

Runtime type checking is expensive and only useful within the development stage. For this reason the type validator can be turned off in production to minimize a performance penalty. Beyond that it is planned to implement a parser that erases the type validator from any codebase altogether.

## Status

Unstable (v0.9.1)

## Goals

In order to reconcile the functional paradigm with Javascript the following main aspects need to be addressed:

- [x] type safety
- [x] algebraic data types
- [x] value level type classes
- [x] lazy evaluation with thunks
- [x] persistent data structures
- [x] safe in-place updates
- [x] stack-safe sync/async recursion
- [x] effect handling and composition
- [ ] concurrency (STM)
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] strong eventual consistency (CRDTs)

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

scriptum consists of two parts

* a [typed standard functional library](https://github.com/kongware/scriptum/blob/master/src/library.js) based upon a [higher-rank/kinded runtime type validator](https://github.com/kongware/scriptum/blob/master/src/validator.js)
* and an [untyped standard functional library](https://github.com/kongware/scriptum/blob/master/src/untyped.js)

The untyped library serves as a playground to explore Haskell idioms and translate them to Javascript. In a second step these translations are type annotated and incorporated into the typed library. Please note that scriptum supports a wide range of Haskell idioms, because it ships with

* lazy evaluation with implicit thunks (and thus guarded recursion)
* tail recursion through trampolines
* persistent data structures based on R/B trees
* safe mutations without sharing
* Scott encoded sum types (augmented with record syntax)
* type classes through dictionary passing (with lots of pre-defined dictionaries)
* effect system based on monad transformers
* pure concurrency through async operations (parallel/serial)
* loop fusion with transducers
* functorial fusion with yoneda/coyoneda
* flat syntax through special applicator type and infix operators

## Status

Unstable (v0.9.2)

## Goals

In order to create an ecosystem for the functional paradigm in Javascript the following main aspects need to be supplied:

- [x] type safety
- [x] algebraic data types
- [x] value level type classes
- [x] lazy evaluation with thunks
- [x] persistent data structures
- [x] safe in-place updates
- [x] stack-safe sync/async recursion
- [x] effect handling and composition
- [ ] probabilistic data structures
- [ ] software transaction memory (STM)
- [ ] distributed programs based on STMs
- [ ] separation of command and query model + event sourcing (CQRS/ES)
- [ ] strong eventual consistency (CRDTs)

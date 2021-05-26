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

Unstable (v0.1.0)

This type validator is way out of my league, that is to say I barely managed to implement it. The implementation is therefore neither bug free nor DRY or performant.

If you find a bug, please don't hesitate to file an issue. Thank you!

For the next couple of months the type validator will gradually become more stable and the functional library more extensive.

## Goals

In order to reconcile the functional paradigm with Javascript the following aspects need to be addressed:

- [x] type safety
- [x] algebraic data types
- [x] value level type classes
- [x] safe mutations without sharing
- [ ] persistent data structures
- [ ] stack-safe sync/async recursion
- [ ] expressions in weak head normal form
- [ ] effect handling and composition

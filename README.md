```
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
```
**[Status: work in progress]**

# Gradual Typed Functional Programming with Javascript

scriptum consists of two components:

* a type validator
* a typed standard library

Like Typescript scriptum enables a gradual typing experience in Javascript but with a radical different approach. While Typescript aims for the object oriented aspects of Javascript, scriptum embraces its functional capabilities.

## Type Validator

Usually the type system is designed first and afterwards the rest of the language. Doing it the other way around is a Sisyphean task as you can observe with Typescript. scriptum bypasses this problem by implementing only a part of a traditional type checker: It checks applications but not definitions, i.e. there is no automatic inference from terms to types but terms have to be explicitly annotated. Fortunately this does not mean that the developer has to annotate every single term. After all, the type validator operates at runtime and Javasscript allows the introspection of all sorts of values, except for functions. The latter have to be manually type annotated.

The type validator is based on the Hindley-Milner type systems extended by higher-kinded and higher-rank types and row polymorphism. Do not be scared by this type theory lingo. This introduction will explain each one of them in Layman's terms and with practical examples.

## Standard Standard Library

The standard library ships with a great variety of typed functional combinators every functional programmer is accustomed to. Additionally it covers crucial aspects to render the functional paradigm practical in Javascript like...

* stack-safe sync/async recursion
* persistent data structures
* local mutation without sharing
* effect handling and composition
* expressions in weak head normal form

If you wonder what the latter could be possibly good for, it enables proper lazy evaluation.

## To be continued...

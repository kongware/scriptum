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
                                   
**[Status: work in progress]**

# Gradual Typed Functional Programming with Javascript

scriptum consists of two components:

* a runtime type validator
* a typed standard library

Like Typescript scriptum enables a gradual typing experience in Javascript but with a radical different approach. While Typescript aims for the object oriented aspects of Javascript, scriptum embraces its functional capabilities.

## Runtime Type Validator

Usually the type system is designed first and afterwards the rest of the language. Doing it the other way around is a Sisyphean task as you can observe with Typescript.

scriptum bypasses this problem by implementing only a part of a traditional type checker: It checks applications but not definitions, i.e. there is no automatic inference from terms to types but terms have to be explicitly annotated. If type checking takes place at compile time this means that the developer would have to annotate every single term. For this reason scriptum validates types at runtime, where the validator can rely on introspection. Javascript is able to introspect all sorts of values except for functions, so only the latter have to be manually type annotated.

The type validator is based on the Hindley-Milner type system extended by higher-kinded/rank types and row polymorphism. Do not be scared by the type theory lingo. This introduction will explain each one of the concepts in Layman's terms and with practical examples.

## Standard Standard Library

The standard library ships with a great variety of typed functional combinators every functional programmer is accustomed to. Additionally it covers crucial aspects to render the functional paradigm practical in Javascript like...

* stack-safe sync/async recursion
* persistent data structures
* local mutation without sharing
* effect handling and composition
* expressions in weak head normal form

If you wonder what the latter could possibly be good for, it enables proper lazy evaluation.

## Representation of Types

The type validator operates at runtime and thus can represent types as first class `String`s, which allow some useful operations as we will see later on. Here is our first simple type:

```javascript
"String => Number"
```
This is just a string, that is to say we can assign it to a variable, pass it around or manipulate it with Javascript's string operations.

## Associate Types with Functions

We need the `fun` operator to associate a function with a given type:

```javascript
const length = fun(s => s.length, "String => Number");

length("Dijkstra"); // 8
length([1, 2, 3]); // type error
```
`fun` takes the function and a type in string form and returns a typed version of the supplied function.

## Downside of the Validator Approach

The attentive reader has probably already anticipated the downside of the validator approach, which is caused by the lack of type inference. There is no guarantee that an associated type matches its function:

```javascript
const length = fun(s => s.length, "Number => String"); // accepted
length("Dijkstra"); // type error
```
This is the reason why I headlined this introduction with _gradual typing_ as opposed to sound typing. However, the following sections are going to prove that the type validator concept is able to assist developers in tracking types even in quite complex scenarios. Do not forget that we have the expressivness of the extended Hindley-Milner type system at our disposal. Let us use it!

In most cases you can tell from the type error message that there is a mismatch between type annotation and function. We will cover some cases in this introducation to get a better intuition.

## Brief Performance Considerations

The type validator proceeds in an on-demand mode. In a common setting it is active during development stage and deactivated as soon as the code is operational. Performance penalties and memory footprint of the deactivated validator are negligible.

## To be continued...

## Type Tracking and Type Directed Programming

## Curried Functions

## Javascript specific functions

### Multi-argument functions

### Variadic functions

### Thunks

## Structural Typing

### Row Types

## Generics

### Parametricity

## Recursive Types

### Mutual recursice types

## Higher-order Generics

## Higher-rank Generics

### Explicit type equalaties

### Value-level type classes

### Algebraic Data types

## Algebraic Data Types

### Product types

### Sum types

### Constructing nullary constructors

## Phantom Types

## Polymorphic Recursion

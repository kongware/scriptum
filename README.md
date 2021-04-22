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
This is the reason why I headlined this introduction with _gradual_ as opposed to sound typing. However, the following sections are going to demonstrate that the presented type validator is suitable for assisting developers in tracking types even in quite complex scenarios. Do not forget that we have the expressivness of the extended Hindley-Milner type system at our disposal. Let us try to use it in this rather unusual manner.

By the way, in most cases you can tell from the type error message if there is a mismatch between type annotation and function term. We will cover some cases in this introducation to get a better intuition for this class of type errors.

## Brief Performance Considerations

The type validator proceeds in an on-demand mode. In a common setting it is active during development stage and deactivated as soon as the code is operational. Performance penalty and memory footprint of the deactivated validator are negligible.

## Curried Functions

Curried functions are the first choice of the functional programmer, because they greatly simplify the function interface. Typing them is easy:

```javascript
const add = fun(m => n => m + n, "Number => Number => Number");

add(2) (3); // 5
add("2"); // type error
```
## Imperative Functions

Javascript supports multi-argument and variadic functions as well as thunks and so does scriptum.

### Multi-argument functions

```javascript
const add = fun((m, n) => m + n, "Number, Number => Number");

add(2, 3); // 5
add(2, "3"); // type error
```

### Variadic functions

Variadic functions can be in single- or multi-argument form:

```javascript
const sum = fun((...ns) => ns.reduce(n + acc, 0), "..[Number] => Number");

const showSum = fun(
  caption, (...ns) => `${caption}: ${ns.reduce(n + acc, 0)}`,
  "String, ..[Number] => String");

sum(1, 2, 3); // 6
sum(); // 0
sum(1, "2", 3); // type error
showSum("total", 1, 2, 3); // "total: 6"
```
### Thunks

Thunks, or nullary functions are important in an eagerly evaluated language like Javascript, because it gives us a means to prevent evaluation until it is needed:

```javascript
const lazyAdd = fun(x => y => () => x + y, "Number => Number => _ => Number");

const thunk = lazyAdd(2) (3);
thunk(); // 5
thunk(4); // type error
```
It is permitted to pass a redundant argument to a thunk, except `undefined`, but you should not use the latter in your code anyway.

## Structural Typing

scriptum's type validator supports structural typing along with the native `Object` type. Javascript objects are treated as an unordered map of key/value pairs. Here is a first, rather contrived example:

```javascript
const prop = fun(o => k => o[k], "{foo: Number, bar: Number} => String => Number");

const o = {foo: 2, bar: 3},
  p = {bar: 2, foo: 3}
  q = {a: 2, b: 3};

prop(o) ("foo"); // 2
prop(p) ("foo"); // 3
prop(o) ("xyz"); // type error
prop(q); // type error
```
### Combined structural/nominal typing

### Row Types

## To be continued...

## Generics

### Parametricity

## Type Tracking Assistance

## `undefined`

Although `undefined` denotes a type error, Javascript silently accepts it. scriptum addresses this questionable design choice by throwing an error when a function returns it. `undefined` arguments are legitimate though, because they allow for the necessary flexibility to process thunks, for instance:

```javascript
const prop = fun(o => k => o[k], "{foo: Number, bar: Number} => String => a");
const lazyExp = fun(() => 2 * 3, "_ => Number");

prop(o) ("xyz"); // type error
lazyExp(undefined); // 6
```
This approach is a tradeoff between soundness and practicality.

## Higher-order Generics

## Higher-rank Generics

### Explicit type equalaties

### Value-level type classes

### Algebraic Data types

## Algebraic Data Types

### Product types

### Sum types

### Creating nullary constructors

## Recursive Types

### Mutual recursice types

## Phantom Types

## Polymorphic Recursion

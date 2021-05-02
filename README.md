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

scriptum consists of two parts:

* a runtime type validator
* a typed standard library

Just like Typescript scriptum enables gradual typing in Javascript but with a radically different approach. While Typescript targets the object oriented aspects of Javascript, scriptum embraces its functional capabilities.

## Runtime Type Validator

Usually the type system is designed first and the rest of the language around it. However, with Javascript we are stuck with an untyped language. Adding a type system with hindsight is a Sisyphean task as you can observe with Typescript.

scriptum partially bypasses this problem by implementing only a part of a traditional type checker: It checks applications but no definitions, i.e. there is no automated inference from terms to types but terms have to be annotated explicitly.

But how can we reduce the amount of necessary user-defined annotations? If we validate types at runtime we can fall back to Javascript's introspection abilities. Every term can be introspected except for functions, that is to say with a runtime approach only the latter requires explicit annotations.

The type validator is based on the Hindley-Milner type system extended by higher-kinded/rank types and row polymorphism. Do not be scared by the type theory lingo. This introduction explains these concepts in Layman's terms and with practical examples.

## Standard Standard Library

The standard library ships with a great variety of typed functional combinators every functional programmer is accustomed to. Additionally it covers crucial aspects to render the functional paradigm practical in Javascript like...

* stack-safe sync/async recursion
* persistent data structures
* local mutation without sharing
* effect handling and composition
* expressions in weak head normal form

These terms are in turn described comprehensively in the respective sections of this introduction.

## Representation of Types

The type validator operates at runtime and thus can represent types as first class `String`s. Here is our first simple type:

```javascript
"String => Number"
```

This is just a string, i.e. we can assign it to a variable, pass it around or manipulate it with Javascript's string operations.

## Associate Types with Functions

We need the `fun` operator to associate a type with a function:

```javascript
const length = fun(s => s.length, "String => Number");

length("Dijkstra"); // 8
length([1, 2, 3]); // type error
```

`fun` takes the function and a type and returns a typed version of the supplied function.

There are no corresponding operators for native data types like `Array` or `Object`. You can create or request data from an external source as usual, but you might have to prepare it before it passes the type validator (see line `B`):

```javascript
const append = fun(xs => ys => xs.concat(ys), "[Number] => [Number] => [Number]");

const xs = [1, 2],
  ys = ["1", 2],
  zs = [3, 4];

append(xs) (zs); // [1, 2, 3, 4]
append(ys); // type error (A)
append(ys.map(Number)) (zs); // [1, 2, 3, 4] (B)
```
As opposed to static type checking some type errors are only thrown after functions are applied, but often partial application is sufficient to actuall throw it (see line `A`).

## Downside of the Type Validator Approach

The attentive reader has probably already anticipated the downside of the validator approach, which is caused by the lack of type inference. There is no guarantee that an associated type matches its function term:

```javascript
const length = fun(s => s.length, "Number => String"); // accepted
length("Dijkstra"); // type error
```

This is a severe downside and I do not even try to sugarcoat it. Please keep in mind that scriptum promises _gradual_ not entirely sound typing. Other approaches come along with  other tradeoffs. What scriptum excels in is assisting the programmer with tracking types. This opens up the world of type directed programming in Javascript.

By the way, in most cases you can tell from the type error message if there is a mismatch between type annotation and function term. We will cover some cases in this introducation to get a better intuition for this class of type errors.

## Performance Impact and Memory Footprint

The type validator proceeds in an on-demand mode. All you need to do is to switch the `CHECK` flag:

```javascript
const CHECK = true;
```

In a common setting it is active during development stage and deactivated as soon as the code is operational. Performance penalty and memory footprint of the deactivated validator are negligible.

## Function Type

### Curried Functions

Curried functions are the first choice of the functional programmer, because they greatly simplify the function interface. Typing them with scriptum is easy:

```javascript
const add = fun(m => n => m + n, "Number => Number => Number");

add(2) (3); // 5
add("2"); // type error
```

### Imperative Functions

Javascript supports multi-argument and variadic functions as well as thunks and so does scriptum.

#### Multi-argument

While the type validator allows multi-argument functions, it is strict in the number supplied arguments:

```javascript
const add = fun((m, n) => m + n, "Number, Number => Number");

add(2, 3); // 5
add(2, "3"); // type error
add(2, 3, 4); // type error
```

#### Variadic

Variadic functions can be defined in two forms, either with a single variadic parameter or with several parameters with a closing variadic one:

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

#### Thunks

Thunks, or nullary functions are important in an eagerly evaluated language like Javascript, because it provides a means to prevent evaluation until needed:

```javascript
const lazyAdd = fun(x => y => () => x + y, "Number => Number => _ => Number");

const thunk = lazyAdd(2) (3);
thunk(); // 5
thunk(undefined); // 5 (A)
thunk(4); // type error (A)
```

Please note that it is not permitted to pass a redundant argument to a thunk, except `undefined` (see line `A`).

## Generics

scriptum excels in handling generics also known as polymorphic types:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

const length = fun(s => s.length, "String => Number");
const sqr = fun(n => n * n, "Number => Number");

comp(sqr) (length) ("Curie"); // 25
comp(length) (sqr); // type error
```

Let us have a closer look at what happens here. During the application of the first function argument the type variables `b` and `c` are instantiated with and substituted by the types of the supplied function, namely `Number`. The same happens when passing the second argument:

```javascript
comp(sqr) (length) ("Curie");

(b => c) => (a => b) => a => c // apply "Number => Number"
b ~ Number
c ~ Number

(a => Number) => a => Number // apply "String => Number"
a ~ String

String => Number // apply a String

Number
```

`comp` is a polymorphic type, that is it treats every value uniformly no matter of what type it is. This technique is not limited to specific types, that is the provided function can be polymorphic as well. Here is a somewhat contrived example:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

const id = fun(x => x, "d => d");

comp(id);

(b => c) => (a => b) => a => c // apply "d => d"
d ~ b
d ~ c
b ~ c // transitive property

(a => b) => a => b
```

scriptum goes beyond normal genrics by supporting higher-kinded and higher-rank generics. You will learn about these techniques in subsequent sections of this introduction.

## Type Tracking through type hints

Beside checking whether types and terms match an important task of the type validator is to assist programmers in tracking types:

```javascript
const comp = fun(
  f => g => x => f(g(x)),
  "(b => c) => (a => b) => a => c");

const compx = comp(comp) (comp), // ?
  compy = comp(comp(comp)) (comp); // ??
```
Without manually unifiying the types it is impossible to infer them for `compx` and `compy`. Fortunately the type validator has already done all the hard work:

```javascript
compx[ANNO] // (b => c) => (d => a => b) => d => a => c
compy[ANNO] // (b => c) => (a => b) => (e => a) => e => c
```
You can retrieve the current type using the `ANNO` property. From the type annotations you can read that the resulting functions both expect a binary function as their first argument, which can have a different argument and result type. Let us apply a function to see the types in motion:

```javascript
const len = fun(s => s.length, "String => Number");
const shout = fun(s => s.toUpperCase() + "!", "String => String");

compx(len) [ANNO] // (d => a => String) => d => a => Number
compy(shout) [ANNO] // (a => String) => (e => a) => e => Number
```

From here on we can easily see which functions to pass next:

```javascript
const repeat = fun(s => n => s.repeat(n), "String => Number => String");

compx(len) [ANNO] // (d => a => String) => d => a => Number
compy(len) (repeat) [ANNO] // (e => Number) => e => Number
```

```javascript
const snd = fun(pair => pair[1], "[a, b] => b");

compx(len) [ANNO] // (d => a => String) => d => a => Number
compy(len) (repeat) (snd) [ANNO] // (a => String) => (e => a) => e => Number
compy(e => Number) => e => Number
```

This feature is also incredible helpful if you are in the middle of a deeply nested composite data structure.

## Structural Typing

scriptum's type validator supports structural typing along with the native `Object` type. Javascript objects are treated as an unordered map of key/value pairs. Here is a rather limited property accessor:

```javascript
const prop = fun(k => o => o[k], "{name: String, age: Number} => a");

const o1 = {name: "Fassbender", age: 43},
  o2 = {age: 43, name: "Fassbender"},
  o3 = {name: "Mulligan", age: 35, profession: "actress"};
  o4 = {name: "Tawny Port", age: 20};

prop("name") (o1); // "Fassbender"
prop("age") (o2); // 43
prop("gender") (o1); // type error
prop("name") (o3); // type error
prop("name") (o4); // "Tawny Port"
```
`prop` is not that useful, because on the one hand it only works with objects with the exact defined type (`o3`). On the other hand it does not prevent you from invoking it with an object of completely different semantics (`o4`). The type validator comes with two extensions to address both these shortcomings.

### Combined structural/nominal typing

If we combine both typing strategies, a more rigid strucural type can be obtained, which rules out the different-semantics issue:

```javascript
const Actor = fun(
  function Actor(name, age) {
    this.name = name;
    this.age = age;
  },
  "String, Number => Foo {name: String, age: Number}");

const props = fun(k => o => o[k], "Actor {name: String, age: Number} => a");

const o1 = new Actor("Fassbender", 43),
  o2 = {name: "Tawny Port", age: 20};

prop("name") (o1); // Fassbender
prop("name") (o2); // type error
```

### Row Types

If we introduce a row variable that is instantiated with the non-matching properties, a more flexible structural type can be obtained, which allows the processing of partial objects:

```javascript
const props = fun(k => o => o[k], "String => {name: String | r} => a");

const compareName = fun(
  o => p => o.name === p.name,
  "{name: String} => {name: String} => Boolean");

const o1 = {name: "Fassbender", age: 43},
  o2 = {name: "Mulligan", age: 35, profession: "actress"},
  o3 = {name: "Ernie", age: 52, pronouns: "they/them"};

prop("name") (o1); // Fassbender
prop("name") (o2); // Mulligan
compareName(o2) (o3); // type error
```

In order to understand why the third invocation is rejected by the validator, we must realize which row type `r` is instantiated with. The first argument `o1` calls for `r` to be `age: Number, profession: String`. Thre second argument `o2`, however, requires `r` to be `age: Number, pronouns: String`, which evidently does not hold. Row types relax the sturcutal typing without giving up much type safety.

Please note that `r` and `a` are nothing alike. The former is a row variable and the latter a universally quantified type variable.

### Object type concatenation

Types are represented as first class `String`s in scriptum, i.e. you can just concatenate them with Javascript's `String` and `Array` methods. This helps to keep your type definitions DRY.

### Subtyping

scriptum is designed to avoid subtyping whenever possible, because it is a functional language extension of Javascript. If you feel the need to rely on it, then Typescript is probably a more suitable alternative.

## `Array` Type

## Non-empty `Array` Type

## `Tuple` Type

## Built-in Primitives

### BigInt, Boolean, Number, Null and String

### `undefined`

Although `undefined` denotes a type error, Javascript silently accepts it. scriptum addresses this questionable design choice by throwing an error when a function returns a value of this type. `undefined` arguments are legitimate though, because they allow for the necessary flexibility:

```javascript
const prop = fun(o => k => o[k], "{name: String, age: Number} => String => a"),
  o = {name: "Binoche", age: 57};

const lazyExp = fun(() => 2 * 3, "_ => Number");

prop(o) ("name"); // "Binoche"
prop(o) ("foo"); // type error

lazyExp(); // 6
lazyExp(undefined); // 6
```
The last two lines are equivalent, because with `lazyExp()` `undefined` is implicitly passed. This approach is a tradeoff between soundness and practicality.

## Built-in Exotic Object Types

### `Map` type

### `Set` type

### `WeakMap` type

### `WeakSet` type

## Higher-order Generics

Higher-order generics better known as higher-kinded types allow the type constructor itself to be polymorphic. They are useful to define more general types like monoids, functors et al. Unfortunately we are not quite ready to discuss them at this point, hence we will stick with a rather contrieved example merely to demonstrate the idea:

```javascript
const appendAnno = "t<a> => t<a> => t<a>";

const appendArr = fun(xs => ys => xs.concat(ys), appendAnno); // accpeted
const appendFun = fun(f => g => x => f(g(x)), appendAnno); // accpeted
const appendMap = fun(m => n => new Map(...m, ...n), appendAnno); // accpeted
const appendNum = fun(m => n => m + n, appendAnno); // rejected
```

`appendAnno` defines a type that is polymorphic both in the type parameter `a` and in the type constructor `t`. It is general enough to be applied to different value constructors, provided that their corresponding type constructors expect at least as many type parameters as `t`, namely one in the example. For this reason the last application is rejected, because Javascript's native `String` type has a nullary type constructor.

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
